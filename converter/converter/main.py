"""Metadata conversion service.

Consolidates the two existing Python converters:
- firebase-functions/python-functions/main.py  (convert_metadata cloud function)
- cioos-records-update/app.py                  (WAF XML generator)

Contract change from cioos-records-update: records are PUSHED as JSON by the
API server instead of pulled from Firebase RTDB by path.

Endpoints:
- GET  /health        liveness
- POST /convert       stateless record -> xml/json/yaml/erddap conversion
- POST /record        write submitted/published record XML+YAML into the WAF
                      volume (WAF_DIR/{region}/{filename}.{xml,yaml});
                      drafts get their files deleted instead
- POST /recordDelete  remove a record's files from the WAF volume
- POST /record-from-source  build a new record from a DOI, OBIS dataset or PDC CCIN
"""

import logging
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# The conversion library is heavy (git dependency); degrade gracefully if it
# is missing so /health and the file-deletion paths still work.
try:  # pragma: no cover - exercised only with the real library installed
    from cioos_metadata_conversion.record import Record

    CONVERSION_IMPORT_ERROR = None
except Exception as err:  # pragma: no cover
    Record = None
    CONVERSION_IMPORT_ERROR = err

# Ported from firebase-functions/python-functions/main.py create_record_from_source.
# Only these three sources may be loaded. Dispatching on an explicit source_type
# rather than Record(source).load() is deliberate: load() falls through to
# load_from_file/load_from_url for anything it doesn't recognise, which would let
# a caller-supplied string turn into a local file read or an arbitrary outbound
# request.
try:  # pragma: no cover - exercised only with the real library installed
    import requests
    from cioos_metadata_conversion.load_from.datacite import (
        DOIRetrievalError,
        retrieve_doi_as_firebase_record,
    )
    from cioos_metadata_conversion.load_from.obis import retrieve_obis_metadata
    from cioos_metadata_conversion.load_from.pdc import (
        PDCRetrievalError,
        retrieve_pdc_as_firebase_record,
    )

    SOURCE_LOADERS = {
        "doi": retrieve_doi_as_firebase_record,
        "obis": retrieve_obis_metadata,
        "pdc": retrieve_pdc_as_firebase_record,
    }
    # "We looked, it isn't there / isn't valid" as opposed to "something broke".
    NOT_FOUND_ERRORS = (DOIRetrievalError, PDCRetrievalError, requests.HTTPError, ValueError)
except Exception:  # pragma: no cover
    SOURCE_LOADERS = {}
    NOT_FOUND_ERRORS = ()

SOURCE_TYPES = ("doi", "obis", "pdc")

logger = logging.getLogger("converter")

app = FastAPI(title="CIOOS metadata converter")

WAF_DIR = os.environ.get("WAF_DIR", "/data/waf")

WRITE_STATUSES = ("submitted", "published")
FILE_SUFFIXES = (".xml", ".yaml")


def convert_record(record_data: dict, output_format: str):
    """Convert a firebase-shaped record dict to the requested format.

    Ported from firebase-functions/python-functions/main.py convert_metadata.
    """
    if Record is None:
        raise HTTPException(
            status_code=503,
            detail=f"cioos-metadata-conversion is not installed: {CONVERSION_IMPORT_ERROR}",
        )
    return (
        Record(record_data, schema="firebase")
        .load()
        .convert_to_cioos_schema()
        .convert_to(output_format)
    )


def sanitize_basename(basename: str) -> str:
    """Match the form's getRecordFilename sanitization (and the old
    delete_record in cioos-records-update/app.py): lowercase, non-alphanumeric
    characters become underscores."""
    return "".join(
        character if character.isalnum() else "_"
        for character in (basename or "").strip().lower()
    )


def derive_basename(record: dict) -> str:
    """Fallback when no filename was stored, mirroring
    firebase_to_xml.get_filename / the form's getRecordFilename."""
    language = record.get("language") or "en"
    title = (record.get("title") or {}).get(language) or ""
    identifier = record.get("identifier") or ""
    return sanitize_basename(f"{title[:30]}_{identifier[:5]}")


def record_paths(region: str, basename: str) -> list[Path]:
    if not region or "/" in region or "\\" in region or ".." in region:
        raise HTTPException(status_code=400, detail="invalid region")
    base = Path(WAF_DIR) / region
    return [base / f"{basename}{suffix}" for suffix in FILE_SUFFIXES]


def delete_record_files(region: str, basename: str) -> list[str]:
    deleted = []
    for path in record_paths(region, basename):
        if path.is_file():
            logger.info("Deleting %s", path)
            path.unlink()
            deleted.append(str(path))
    return deleted


class ConvertRequest(BaseModel):
    record_data: dict
    output_format: str


class RecordRequest(BaseModel):
    record: dict
    filename: str | None = ""
    status: str | None = ""
    region: str


class RecordFromSourceRequest(BaseModel):
    source_type: str
    identifier: str


class RecordDeleteRequest(BaseModel):
    filename: str
    region: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/convert")
def convert(body: ConvertRequest):
    """Stateless conversion; returns {"data": <converted>} like the old
    convert_metadata cloud function."""
    try:
        converted = convert_record(body.record_data, body.output_format)
    except HTTPException:
        raise
    except Exception as err:  # pylint: disable=broad-except
        logger.exception("Conversion failed")
        raise HTTPException(status_code=500, detail=f"Conversion failed: {err}") from err
    return {"data": converted}


@app.post("/record")
def record_update(body: RecordRequest):
    """Create/refresh (or remove, for drafts) a record's WAF files."""
    basename = sanitize_basename(body.filename) or derive_basename(body.record)
    if not basename or basename.strip("_") == "":
        raise HTTPException(status_code=400, detail="filename required")

    # Delete existing files first so a status change never leaves stale copies
    # (mirrors cioos-records-update recordUpdate).
    deleted = delete_record_files(body.region, basename)

    if body.status not in WRITE_STATUSES:
        return {"message": "", "deleted": deleted}

    try:
        xml = convert_record(body.record, "xml")
        record_yaml = convert_record(body.record, "yaml")
    except HTTPException:
        raise
    except Exception as err:  # pylint: disable=broad-except
        logger.exception("Error creating xml")
        raise HTTPException(status_code=500, detail=f"Error creating xml: {err}") from err

    xml_path, yaml_path = record_paths(body.region, basename)
    xml_path.parent.mkdir(parents=True, exist_ok=True)
    xml_path.write_text(xml, encoding="utf-8")
    logger.info("wrote %s", xml_path)
    yaml_path.write_text(record_yaml, encoding="utf-8")
    logger.info("wrote %s", yaml_path)

    return {"message": f"{body.region}/{basename}.xml"}


@app.post("/recordDelete")
def record_delete(body: RecordDeleteRequest):
    basename = sanitize_basename(body.filename)
    if not basename:
        raise HTTPException(status_code=400, detail="filename required")
    deleted = delete_record_files(body.region, basename)
    return {"message": "record deleted", "deleted": deleted}


@app.post("/record-from-source")
def record_from_source(body: RecordFromSourceRequest):
    """Returns {"data": <record>} built from an external catalogue entry."""
    identifier = body.identifier.strip()
    if body.source_type not in SOURCE_TYPES:
        raise HTTPException(status_code=400, detail=f"source_type must be one of {list(SOURCE_TYPES)}")
    if not identifier:
        raise HTTPException(status_code=400, detail="identifier is required")
    loader = SOURCE_LOADERS.get(body.source_type)
    if loader is None:
        raise HTTPException(status_code=503, detail="cioos-metadata-conversion loaders are not installed")

    try:
        record = loader(identifier)
    except NOT_FOUND_ERRORS as err:
        logger.warning("No %s record for '%s': %s", body.source_type, identifier, err)
        raise HTTPException(
            status_code=404,
            detail=f"Could not retrieve {body.source_type} record '{identifier}': {err}",
        ) from err
    except Exception as err:  # pylint: disable=broad-except
        logger.exception("Record retrieval failed")
        raise HTTPException(status_code=500, detail=f"Record retrieval failed: {err}") from err
    return {"data": record}
