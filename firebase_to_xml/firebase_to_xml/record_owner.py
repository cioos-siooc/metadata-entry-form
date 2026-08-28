import re
import unicodedata

from loguru import logger


def standardize_string(input_string: str) -> str:
    """
    Standardize a string by:
    - Removing accents
    - Keeping only digits and letters
    - Replacing spaces and non-alphanumeric characters with '-'
    - Replacing multiple '-' with a single '-'
    """
    # Remove accents
    normalized = unicodedata.normalize("NFKD", input_string)
    without_accents = "".join(c for c in normalized if not unicodedata.combining(c))

    # Replace non-alphanumeric characters with '-'
    alphanumeric = re.sub(r"[^a-zA-Z0-9\s]", "-", without_accents)

    # Replace spaces with '-'
    with_hyphens = re.sub(r"\s+", "-", alphanumeric)

    # Replace multiple '-' with a single '-'
    standardized = re.sub(r"-+", "-", with_hyphens)

    # Remove leading or trailing '-'
    return standardized.strip("-").lower()


def get_record_owner(record) -> str:
    """Slug of the orgName of the first contact flagged as owner of the record.

    Returns an empty string when no owner contact carries an organization name,
    in which case the record is not filed under an owner subdirectory.
    """
    for contact in record.get("contacts", []):
        if "owner" in contact.get("role", []) and contact.get("orgName"):
            return standardize_string(contact["orgName"])

    logger.warning(
        "No owner organization found in record {}", record.get("identifier")
    )
    return ""
