"""
Python Firebase Functions for CIOOS Metadata Entry Form
"""

import os
import re
import json
import logging

import requests
from firebase_functions import https_fn, options
from firebase_functions.params import BoolParam
from firebase_admin import initialize_app

from cioos_metadata_conversion.record import Record
from cioos_metadata_conversion.load_from.datacite import (
    DOIRetrievalError,
    retrieve_doi_as_firebase_record,
)
from cioos_metadata_conversion.load_from.obis import retrieve_obis_metadata
from cioos_metadata_conversion.load_from.pdc import (
    PDCRetrievalError,
    retrieve_pdc_as_firebase_record,
)

# Determine if this is the dev project
is_dev_project = BoolParam("VITE_DEV_DEPLOYMENT", default=True)

# Origins we allow explicitly (strings)
STATIC_ALLOWED_ORIGINS = {
    "https://cioos-siooc.github.io",
}
ALLOWED_ORIGIN_PATTERNS = []

# Allow localhost and preview channels for dev project
if is_dev_project:
    ALLOWED_ORIGIN_PATTERNS += [
        # Regex patterns for preview channel domains for the dev project
        re.compile(r"^https://cioos-metadata-form-dev-258dc--[A-Za-z0-9-]+\.web\.app"),
    ]
    STATIC_ALLOWED_ORIGINS.update(
        {
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        }
    )

initialize_app()


def _origin_allowed(origin: str | None) -> bool:
    """Check if the given origin is allowed."""
    if not origin:
        logging.info("CORS: no origin header")
        return False
    if origin in STATIC_ALLOWED_ORIGINS:
        logging.info("CORS: origin matched static list: %s", origin)
        return True
    for pat in ALLOWED_ORIGIN_PATTERNS:
        if pat.match(origin):
            logging.info("CORS: origin matched regex %s: %s", pat.pattern, origin)
            return True
    logging.info("CORS: origin NOT allowed: %s", origin)
    return False


def _cors_headers(origin: str | None, allowed: bool):
    base = {
        "Vary": "Origin",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "3600",
        # Debug headers (safe, informational)
        "X-Debug-Cors-Origin": origin or "<none>",
        "X-Debug-Cors-Allowed": str(allowed).lower(),
    }
    if not origin or not allowed:
        base["Access-Control-Allow-Origin"] = "null"
    else:
        base["Access-Control-Allow-Origin"] = origin
    return base


@https_fn.on_request()
def convert_metadata(req: https_fn.Request):  # type: ignore
    """HTTP function performing metadata conversion with explicit CORS.

    POST JSON body:
      { "record_data": {...}, "output_format": "xml"|"json"|"yaml"|"erddap" }
    Returns JSON.
    """
    origin = req.headers.get("origin")
    allowed = _origin_allowed(origin)
    headers = _cors_headers(origin, allowed)

    # Preflight
    if req.method == "OPTIONS":
        status = 204 if allowed else 403
        logging.info(
            "CORS preflight for origin %s allowed=%s status=%s", origin, allowed, status
        )
        return https_fn.Response("", status=status, headers=headers)

    if not allowed:
        return https_fn.Response(
            json.dumps({"error": "Origin not allowed"}),
            status=403,
            headers=headers,
            content_type="application/json",
        )

    if req.method != "POST":
        return https_fn.Response(
            json.dumps({"error": "Method not allowed"}),
            status=405,
            headers=headers,
            content_type="application/json",
        )

    try:
        payload = req.get_json(silent=True) or {}
    except Exception:  # pragma: no cover
        payload = {}

    record_data = payload.get("data", {}).get("record_data")
    output_format = payload.get("data", {}).get("output_format")

    if not record_data or not output_format:
        return https_fn.Response(
            json.dumps({"error": "record_data and output_format required"}),
            status=400,
            headers=headers,
            content_type="application/json",
        )

    try:
        converted = (
            Record(record_data, schema="firebase")
            .load()
            .convert_to_cioos_schema()
            .convert_to(output_format)
        )
    except Exception as e:  # pylint: disable=broad-except
        logging.exception("Conversion failed")
        return https_fn.Response(
            json.dumps({"error": f"Conversion failed: {e}"}),
            status=500,
            headers=headers,
            content_type="application/json",
        )

    return https_fn.Response(
        json.dumps({"data": converted}),
        status=200,
        headers=headers,
        content_type="application/json",
    )


# Only these three sources may be loaded. Dispatching on an explicit source_type
# rather than Record(source).load() is deliberate: load() falls through to
# load_from_file/load_from_url for anything it doesn't recognise, which would let
# a caller-supplied string turn into a local file read or an arbitrary outbound
# request from inside the function.
SOURCE_LOADERS = {
    "doi": retrieve_doi_as_firebase_record,
    "obis": retrieve_obis_metadata,
    "pdc": retrieve_pdc_as_firebase_record,
}

# Errors meaning "we looked, it isn't there / it isn't valid" as opposed to
# "something broke on our side". Kept apart so a typo'd identifier reads as a 404
# with a usable message instead of an opaque 500.
NOT_FOUND_ERRORS = (
    DOIRetrievalError,
    PDCRetrievalError,
    requests.HTTPError,
    ValueError,  # obis raises this for an unknown dataset id
)


# OBIS makes up to three follow-up API calls (taxonomy facets, plus occurrence
# samples for eMoF EOVs and platform inference) and PDC probes doi.org to resolve
# a CCIN's DOI, so the 60s default timeout is not comfortably enough.
@https_fn.on_request(timeout_sec=180, memory=options.MemoryOption.MB_512)
def create_record_from_source(req: https_fn.Request):  # type: ignore
    """HTTP function building a new Firebase record from an external source.

    POST JSON body:
      { "data": { "source_type": "doi"|"obis"|"pdc", "identifier": "..." } }
    Returns { "data": {<firebase record>} }.
    """
    origin = req.headers.get("origin")
    allowed = _origin_allowed(origin)
    headers = _cors_headers(origin, allowed)

    if req.method == "OPTIONS":
        status = 204 if allowed else 403
        return https_fn.Response("", status=status, headers=headers)

    if not allowed:
        return https_fn.Response(
            json.dumps({"error": "Origin not allowed"}),
            status=403,
            headers=headers,
            content_type="application/json",
        )

    if req.method != "POST":
        return https_fn.Response(
            json.dumps({"error": "Method not allowed"}),
            status=405,
            headers=headers,
            content_type="application/json",
        )

    try:
        payload = req.get_json(silent=True) or {}
    except Exception:  # pragma: no cover
        payload = {}

    data = payload.get("data", {})
    source_type = data.get("source_type")
    identifier = (data.get("identifier") or "").strip()

    if source_type not in SOURCE_LOADERS:
        return https_fn.Response(
            json.dumps(
                {
                    "error": f"source_type must be one of {sorted(SOURCE_LOADERS)}",
                }
            ),
            status=400,
            headers=headers,
            content_type="application/json",
        )

    if not identifier:
        return https_fn.Response(
            json.dumps({"error": "identifier is required"}),
            status=400,
            headers=headers,
            content_type="application/json",
        )

    try:
        record = SOURCE_LOADERS[source_type](identifier)
    except NOT_FOUND_ERRORS as e:
        logging.warning("No %s record for '%s': %s", source_type, identifier, e)
        return https_fn.Response(
            json.dumps({"error": f"Could not retrieve {source_type} record '{identifier}': {e}"}),
            status=404,
            headers=headers,
            content_type="application/json",
        )
    except Exception as e:  # pylint: disable=broad-except
        logging.exception("Record retrieval failed")
        return https_fn.Response(
            json.dumps({"error": f"Record retrieval failed: {e}"}),
            status=500,
            headers=headers,
            content_type="application/json",
        )

    return https_fn.Response(
        json.dumps({"data": record}),
        status=200,
        headers=headers,
        content_type="application/json",
    )
