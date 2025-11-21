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


def get_record_owner(record, organizations: dict) -> str:
    for contact in record.get("contacts", []):
        if "owner" in contact["role"]:
            orginal_owner = contact.get("orgName")
            owner = standardize_string(orginal_owner)

            if owner in organizations:
                return owner
            for organization in organizations:
                if owner in organization["aliases"] or orginal_owner in organization["aliases"]:
                    return organization['name']
            logger.warning(
                f"Owner {orginal_owner} not found in organizations.json, using {owner}"
            )
            return owner
    logger.warning(f"No owner found in record {record['title']['en']}")
