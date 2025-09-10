"""
Python Firebase Functions for CIOOS Metadata Entry Form
"""
import json
import requests
from firebase_functions import https_fn, options
from firebase_admin import initialize_app, firestore

from cioos_metadata_conversion.__main__ import converter, output_formats

# Initialize Firebase Admin SDK
initialize_app()


@https_fn.on_request(cors=options.CorsOptions(
    cors_origins=["*"],
    cors_methods=["POST", "OPTIONS"]
))
def convert_metadata(req: https_fn.Request) -> https_fn.Response:
    """
    Convert Firebase record JSON to different metadata formats
    using the cioos-metadata-conversion API
    """
    if req.method == "OPTIONS":
        return https_fn.Response("", status=200)

    if req.method != "POST":
        return https_fn.Response(
            json.dumps({"error": "Only POST method allowed"}),
            content_type="application/json",
            status=405
        )

    try:
        # Parse request body
        request_data = req.get_json()
        if not request_data:
            return https_fn.Response(
                json.dumps({"error": "Request body is required"}),
                content_type="application/json",
                status=400
            )

        # Extract parameters
        record_data = request_data.get("record_data")
        output_format = request_data.get("output_format")
        schema = request_data.get("schema", "firebase")

        # Log

        if not record_data:
            return https_fn.Response(
                json.dumps({"error": "record_data is required"}),
                content_type="application/json",
                status=400
            )
        if not output_format:
            return https_fn.Response(
                json.dumps({"error": "output_format is required"}),
                content_type="application/json",
                status=400
            )

        # Call cioos-metadata-conversion API
        try:
            converted_data = converter(
                record=record_data, format=output_format, schema=schema
            )
        except Exception as e:
            return https_fn.Response(
                json.dumps({
                    "error": "Conversion failed",
                    "details": str(e)
                }),
                content_type="application/json",
                status=500
            )

        if output_format == "json":
            return https_fn.Response(
                json.dumps(converted_data, indent=2),
                content_type="application/json",
                status=200
            )
        elif output_format in ["xml", "iso19115", "erddap"]:
            return https_fn.Response(
                converted_data,
                content_type="application/xml",
                status=200
            )
        elif output_format in ["yaml", "cff"]:
            return https_fn.Response(
                converted_data,
                content_type="application/x-yaml",
                status=200
            )
        else:
            return https_fn.Response(
                converted_data,
                content_type="application/text",
                status=200
            )
    except Exception as e:
        return https_fn.Response(
            json.dumps({
                "error": "Internal server error",
                "details": str(e)
            }),
            content_type="application/json",
            status=500
        )


@https_fn.on_request(cors=options.CorsOptions(
    cors_origins=["*"],
    cors_methods=["GET", "OPTIONS"]
))
def get_available_formats(req: https_fn.CallableRequest) -> list:
    """
    Get available conversion formats from the cioos-metadata-conversion API
    """
    try:

        return list(output_formats.keys())

    except Exception as e:
        return {
            "error": "Internal server error",
            "details": str(e)
        }


@https_fn.on_call()
def convert_metadata_call(req: https_fn.CallableRequest):
    """Callable wrapper for metadata conversion used by the React frontend.

    Request data example:
      {
        "record_data": { ... },
        "output_format": "xml" | "json" | "yaml" | "erddap" | ...,
        "schema": "firebase"
      }
    Response:
      For output_format == json -> converted object is returned directly.
      Otherwise -> { "result": <string representation> }
    """
    data = req.data or {}
    record_data = data.get("record_data")
    output_format = data.get("output_format")
    schema = data.get("schema", "firebase")

    if not record_data or not output_format:
        raise https_fn.HttpsError(
            code="invalid-argument",
            message="record_data and output_format required"
        )
    try:
        converted = converter(record=record_data,
                              format=output_format, schema=schema)
    except Exception as e:  # pylint: disable=broad-except
        raise https_fn.HttpsError(
            code="internal",
            message=f"Conversion failed: {e}"
        ) from e

    if output_format == "json":
        return converted
    return {"result": converted}
