#!/usr/bin/env python3

"""
Pulls metadata records from Firebase and translate them into XML via
the metadata-xml module.
"""

import json

from firebase_to_xml.scrubbers import scrub_dict, scrub_keys, remove_nones
import os
dir = os.path.dirname(os.path.realpath(__file__))

def get_licenses():
    with open(dir + '/resources/licenses.json') as f:
        return json.load(f)

def get_eov_translations():
    with open(dir + '/resources/eov.json') as f:
        eovs= json.load(f)
        translation={}
        for eov in eovs:
            translation[eov['value']]=eov['label FR']
        return translation

licenses=get_licenses()
eov_translations=get_eov_translations()

def eovs_to_fr(eovs_en):
    """ Translate a list of EOVs in english to a list in french"""
    return [eov_translations.get(eov,"") for eov in eovs_en if eov]


def strip_keywords(keywords):
    """Strips whitespace from each keyword in either language"""
    stripped = {
        "en": [keyword.strip() for keyword in keywords.get("en", [])],
        "fr": [keyword.strip() for keyword in keywords.get("fr", [])],
    }

    return scrub_keys(stripped)


def date_from_datetime_str(datetime_str):
    "Returns date part of ISO datetime stored as string"
    if not datetime_str:
        return None
    return (datetime_str or "")[:10]

def fix_lat_long_polygon(polygon):
    """Change lat,long to long, lat, which is what is expected in the XML"""
    if not polygon:
        return ""
    fixed = []
    coords = polygon.split(" ")
    for coord in coords:
        [lat, long] = coord.split(",")
        fixed.append(",".join([long, lat]))
    return " ".join(fixed)


def record_json_to_yaml(record):
    "Generate dictinary expected by metadata-xml"

    user_id = record.get("userID")
    record_id = record.get("recordID")
    language = record.get("language")
    region = record.get("region")
    
    base_url = "https://cioos-siooc.github.io/metadata-entry-form#"
    full_url = f"{base_url}/{language}/{region}/{user_id}/{record_id}"


    polygon = record.get("map", {}).get("polygon", "")

    record_yaml = {
        "metadata": {
            "naming_authority": "ca.cioos",
            "identifier": record.get("identifier"),
            "language": record.get("language"),
            "maintenance_note": "Generated from "
            + full_url,
            "use_constraints": {
                "limitations": record.get("limitations", "None"),
                "licence": licenses.get(
                    record.get(
                        "license",
                    )
                ),
            },
            "comment": record.get("comment"),
            "history": record.get("history"),
            "dates": {
                "revision": record.get("created"),
                "publication": date_from_datetime_str(record.get("timeFirstPublished")),
            },
        },
        "spatial": {
            "bbox": [
                float(record["map"].get("west")),
                float(record["map"].get("south")),
                float(record["map"].get("east")),
                float(record["map"].get("north")),
            ]
            if not polygon
            else "",
            "polygon": fix_lat_long_polygon(polygon),
            "vertical": [
                float(record.get("verticalExtentMin")),
                float(record.get("verticalExtentMax")),
            ],
        },
        "identification": {
            "title": record.get("title"),
            "identifier": record.get("datasetIdentifier"),
            "abstract": record.get("abstract"),
            "dates": {
                "creation": date_from_datetime_str(record.get("dateStart")),
                "publication": date_from_datetime_str(record.get("datePublished")),
                "revision": date_from_datetime_str(record.get("dateRevised")),
            },
            "keywords": {
                "default": strip_keywords(record.get("keywords", {"en": [], "fr": []})),
                "eov": {"en": record.get("eov"), "fr": eovs_to_fr(record.get("eov"))},
            },
            "temporal_begin": record.get("dateStart"),
            "temporal_end": record.get("dateEnd"),
            "status": record.get("status"),
            "project": record.get("projects"),
            "progress_code": record.get("progress"),
            "edition": record.get("edition"),
        },
        "contact": [
            {
                "roles": contact.get("role"),
                "organization": {
                    "name": contact.get("orgName"),
                    "url": contact.get("orgURL"),
                    "address": contact.get("orgAdress"),
                    "city": contact.get("orgCity"),
                    "country": contact.get("orgCountry"),
                    "email": contact.get("orgEmail"),
                    "ror": contact.get("orgRor"),
                },
                "individual": {
                    "name": ", ".join(remove_nones([contact.get("lastName") or None, contact.get("givenNames") or None])),
                    "position": contact.get("indPosition"),
                    "email": contact.get("indEmail"),
                    "orcid": contact.get("indOrcid"),
                },
                "inCitation": contact.get("inCitation"),
            }
            for contact in record.get("contacts", [])
        ],
        "distribution": [
            {
                "url": distribution.get("url"),
                "name": distribution.get("name"),
                "description": distribution.get("description"),
            }
            for distribution in record.get("distribution", [])
        ],
    }
    if record.get("noPlatform"):
        record_yaml["instruments"] = record.get("instruments")
    else:
        record_yaml["platform"] = {
            "id": record.get("platformID"),
            "description": record.get("platformDescription"),
            "type": record.get("platform"),
        }

        if record.get("instruments"):
            record_yaml["platform"]["instruments"] = record.get("instruments")

    # If there's no distributor set, set it to the data contact (owner)
    all_roles = [contact["role"] for contact in record["contacts"]]
    all_roles_flat = [j for sub in all_roles for j in sub]

    if "distributor" not in all_roles_flat:
        for contact in record["contacts"]:
            if "owner" in contact["role"]:
                contact["role"] += ["distributor"]

    organization = record.get("organization")

    if organization:
        organization = {
            "roles": ["owner"],
            "organization": {"name": record.get("organization")},
        }

        record_yaml["contact"] = [organization] + record_yaml["contact"]

    return scrub_dict(record_yaml)
