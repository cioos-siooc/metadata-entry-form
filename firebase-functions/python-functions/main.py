"""
Python Firebase Functions for CIOOS Metadata Entry Form
"""

from firebase_functions import https_fn
from firebase_admin import initialize_app

from cioos_metadata_conversion.record import Record


initialize_app()


@https_fn.on_call()
def convert_metadata(req: https_fn.CallableRequest):
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
