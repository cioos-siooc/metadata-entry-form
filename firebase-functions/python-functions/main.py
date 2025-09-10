"""
Python Firebase Functions for CIOOS Metadata Entry Form
"""

import json
from firebase_functions import https_fn, options
from firebase_admin import initialize_app

from cioos_metadata_conversion.converter import OUTPUT_FORMATS
from cioos_metadata_conversion.cioos import cioos_firebase_to_cioos_schema
# Initialize Firebase Admin SDK
initialize_app()


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
            code="invalid-argument", message="record_data and output_format required"
        )
    try:
        if schema == "firebase":
            record_data = cioos_firebase_to_cioos_schema(record_data)
        if output_format not in OUTPUT_FORMATS:
            raise https_fn.HttpsError(
                code="invalid-argument",
                message=f"Unsupported output_format: {output_format}",
            )
        convert_func = OUTPUT_FORMATS[output_format]
        converted = convert_func(record_data)
    except Exception as e:  # pylint: disable=broad-except
        raise https_fn.HttpsError(
            code="internal", message=f"Conversion failed: {e}"
        ) from e

    if output_format == "json":
        return converted
    return {"result": converted}
