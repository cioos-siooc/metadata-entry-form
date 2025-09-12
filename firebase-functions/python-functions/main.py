"""
Python Firebase Functions for CIOOS Metadata Entry Form
"""
import os
import re
import json
import logging

from firebase_functions import https_fn
from firebase_admin import initialize_app

from cioos_metadata_conversion.record import Record

# Config flags (environment variables are set at deploy time, all values public)
REACT_APP_DEV_DEPLOYMENT = os.getenv(
    "REACT_APP_DEV_DEPLOYMENT", "false").lower() == "true"

# Origins we allow explicitly (strings)
STATIC_ALLOWED_ORIGINS = {
    "https://cioos-siooc.github.io/metadata-entry-form",
}

# Regex patterns for preview channel domains for the dev project
ALLOWED_ORIGIN_PATTERNS = [
    re.compile(
        r"^https://cioos-metadata-form-dev-258dc--[A-Za-z0-9-]+\.web\.app$"),
]

if REACT_APP_DEV_DEPLOYMENT:
    STATIC_ALLOWED_ORIGINS.update({
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    })

initialize_app()


# Note: Preview channel domains follow pattern {projectId}--{channelId}-{hash}.web.app (double hyphen)
# Adjust regex accordingly so they are accepted.
def _origin_allowed(origin: str | None) -> bool:
    if not origin:
        return False
    if origin in STATIC_ALLOWED_ORIGINS:
        return True
    return any(pat.match(origin) for pat in ALLOWED_ORIGIN_PATTERNS)


def _cors_headers(origin: str | None, allowed: bool):
    if not origin or not allowed:
        # Intentionally do not echo disallowed origin; browser will block.
        return {
            "Access-Control-Allow-Origin": "null",
            "Vary": "Origin",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "3600",
        }
    return {
        "Access-Control-Allow-Origin": origin,
        "Vary": "Origin",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "3600",
    }


@https_fn.on_request()
def convert_metadata_http(req: https_fn.Request):  # type: ignore
    """HTTP function performing metadata conversion with explicit CORS.

    POST JSON body:
      { "record_data": {...}, "output_format": "xml"|"json"|"yaml"|"erddap", "schema": "firebase" }
    Returns JSON.
    """
    origin = req.headers.get("origin")
    allowed = _origin_allowed(origin)
    headers = _cors_headers(origin, allowed)

    # Preflight
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

    record_data = payload.get("record_data")
    output_format = payload.get("output_format")

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

    if output_format == "json":
        body_out = json.dumps(converted)
    else:
        body_out = json.dumps({"result": converted})

    return https_fn.Response(
        body_out,
        status=200,
        headers=headers,
        content_type="application/json",
    )


@https_fn.on_call()
def convert_metadata(call_req: https_fn.CallableRequest):  # type: ignore
    """Callable wrapper retained for existing clients; forwards to HTTP logic internally.

    Note: Callable framework handles its own origin checks; for preview channel support,
    clients should migrate to the HTTP endpoint /convert_metadata_http.
    """
    data = call_req.data or {}
    record_data = data.get("record_data")
    output_format = data.get("output_format")
    if not record_data or not output_format:
        raise https_fn.HttpsError(
            code="invalid-argument", message="record_data and output_format required"
        )
    try:
        converted = (
            Record(record_data, schema="firebase")
            .load()
            .convert_to_cioos_schema()
            .convert_to(output_format)
        )
    except Exception as e:  # pylint: disable=broad-except
        raise https_fn.HttpsError(
            code="internal", message=f"Conversion failed: {e}"
        ) from e
    if output_format == "json":
        return converted
    return {"result": converted}
