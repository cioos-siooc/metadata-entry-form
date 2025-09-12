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
    # Regex patterns for preview channel domains for the dev project
    re.compile(
        r"^https://cioos-metadata-form-dev-258dc--[A-Za-z0-9-]+\.web\.app"),
]

# Development deployment allowed origins (preview channels, localhost)
if REACT_APP_DEV_DEPLOYMENT:
    STATIC_ALLOWED_ORIGINS.update({
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    })

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
            logging.info("CORS: origin matched regex %s: %s",
                         pat.pattern, origin)
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
      { "record_data": {...}, "output_format": "xml"|"json"|"yaml"|"erddap", "schema": "firebase" }
    Returns JSON.
    """
    origin = req.headers.get("origin")
    allowed = _origin_allowed(origin)
    headers = _cors_headers(origin, allowed)

    # Preflight
    if req.method == "OPTIONS":
        status = 204 if allowed else 403
        logging.info(
            "CORS preflight for origin %s allowed=%s status=%s", origin, allowed, status)
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
