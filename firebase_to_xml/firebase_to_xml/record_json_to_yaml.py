#!/usr/bin/env python3

"""
Pulls metadata records from Firebase and translate them into XML via
the metadata-xml module.
"""


from firebase_to_xml.scrubbers import scrub_dict, scrub_keys


def eovs_to_fr(eovs_en):
    """ Translate a list of EOVs in english to a list in french"""
    translation = {
        "oxygen": "Oxygène",
        "nutrients": "Nutriments",
        "nitrate": "Nitrate",
        "phosphate": "Phosphate",
        "silicate": "Silicate",
        "inorganicCarbon": "Carbone inoganique",
        "dissolvedOrganicCarbon": "carbone inorganique dissous",
        "seaSurfaceHeight": "Hauteur de la surface de la mer",
        "seawaterDensity": "Densité d'eau de mer",
        "potentialTemperature": "Température potentielle",
        "potentialDensity": "Densité potentielle",
        "speedOfSound": "Vitesse du son",
        "seaIce": "Glace de mer",
        "seaState": "État de la mer",
        "seaSurfaceSalinity": "Salinité de surface",
        "seaSurfaceTemperature": "Température de surface",
        "subSurfaceCurrents": "Courants sous-marins",
        "subSurfaceSalinity": "Salinité sous la surface",
        "subSurfaceTemperature": "Température sous la surface",
        "surfaceCurrents": "Courants de surface",
        "pressure": "Pression",
        "other": "Autre",
    }

    return list(filter(None, [translation.get(eov) for eov in eovs_en]))


def strip_keywords(keywords):
    """Strips whitespace from each keyword in either language"""
    stripped = {
        "en": [x.strip() for x in keywords.get("en", [])],
        "fr": [x.strip() for x in keywords.get("fr", [])],
    }

    return scrub_keys(stripped)


def date_from_datetime_str(datetime_str):
    "Returns date part of ISO datetime stored as string"
    if not datetime_str:
        return None
    return (datetime_str or "")[:10]


def get_license_by_code(license_code):
    "Given a license code, returns an object with the mandatory fields"
    codes = {
        "CC-BY-4.0": {
            "title": "Creative Commons Attribution 4.0",
            "code": "CC-BY-4.0",
            "url": "https://creativecommons.org/licenses/by/4.0",
        },
        "CC0": {
            "title": "Creative Commons 0",
            "code": "CC0",
            "url": "https://creativecommons.org/share-your-work/public-domain/cc0",
        },
        "government-open-license-canada": {
            "title": "",
            "code": "government-open-license-canada",
            "url": "",
        },
        "Apache-2.0": {
            "title": "Apache License, Version 2.0",
            "code": "Apache-2.0",
            "url": "https://www.apache.org/licenses/LICENSE-2.0",
        },
    }
    return codes.get(license_code)


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

    polygon = record.get("map", {}).get("polygon", "")

    record_yaml = {
        "metadata": {
            "naming_authority": "ca.coos",
            "identifier": record.get("identifier"),
            "language": record.get("language"),
            "maintenance_note": "Generated from "
            + "https://cioos-siooc.github.io/metadata-entry-form",
            "use_constraints": {
                "limitations": record.get("limitations", "None"),
                "licence": get_license_by_code(
                    record.get(
                        "license",
                    )
                ),
            },
            "comment": record.get("comment"),
            "history": record.get("history"),  # {'en':'','fr':''}
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
            "title": record.get("title"),  # {'en':'','fr':''}
            "identifier": record.get("datasetIdentifier"),  # {'en':'','fr':''}
            "abstract": record.get("abstract"),  # {'en':'','fr':''}
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
        },
        "contact": [
            {
                "roles": x.get("role"),
                "organization": {
                    "name": x.get("orgName"),
                    "url": x.get("orgURL"),
                    "address": x.get("orgAdress"),
                    "city": x.get("orgCity"),
                    "country": x.get("orgCountry"),
                    "email": x.get("orgEmail"),
                },
                "individual": {
                    "name": x.get("indName"),
                    "position": x.get("indPosition"),
                    "email": x.get("indEmail"),
                },
            }
            for x in record.get("contacts", [])
        ],
        "distribution": [
            {
                "url": x.get("url"),
                "name": x.get("name"),
                "description": x.get("description"),
            }
            for x in record.get("distribution", [])
        ],
    }
    if record.get("noPlatform"):
        record_yaml["instruments"] = record.get("instruments")
    else:
        record_yaml["platform"] = {
            "id": record.get("platformID"),
            "description": record.get("platformDescription"),
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
    print("organization", organization)
    if organization:
        organization = {
            "roles": ["owner"],
            "organization": {"name": record.get("organization")},
        }

        record_yaml["contact"] = [organization] + record_yaml["contact"]

    return scrub_dict(record_yaml)
