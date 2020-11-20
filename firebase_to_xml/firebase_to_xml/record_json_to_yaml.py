#!/usr/bin/env python3

"""
Pulls metadata records from Firebase and translate them into XML via
the metadata-xml module.
"""


from firebase_to_xml.scrubbers import scrub_dict, scrub_keys


def strip_keywords(keywords):
    'Strips whitespace from each keyword in either language'
    stripped = {"en": [x.strip() for x in keywords.get('en', [])],
                "fr": [x.strip() for x in keywords.get('fr', [])]}

    return scrub_keys(stripped)


def date_from_datetime_str(datetime_str):
    'Returns date part of ISO datetime stored as string'
    if not datetime_str:
        return None
    return (datetime_str or '')[:10]


def get_license_by_code(license_code):
    'Given a license code, returns an object with the mandatory fields'
    codes = {
        "CC-BY-4.0": {
            "title": "Creative Commons Attribution 4.0",
            "code": "CC-BY-4.0",
            "url": "https://creativecommons.org/licenses/by/4.0"
        },
        "CC0": {
            "title": "Creative Commons 0",
            "code": "CC0",
            "url":
                "https://creativecommons.org/share-your-work/public-domain/cc0"
        },
        "government-open-license-canada": {
            "title": "",
            "code": "government-open-license-canada",
            "url": ""
        },
        "Apache-2.0": {
            "title": "Apache License, Version 2.0",
            "code": "Apache-2.0",
            "url": "https://www.apache.org/licenses/LICENSE-2.0"
        }
    }
    return codes.get(license_code)


def record_json_to_yaml(record):
    "Generate dictinary expected by metadata-xml"
    polygon = record.get('map', {}).get('polygon', '')
    record_yaml = {
        'metadata': {
            'naming_authority': 'ca.coos',
            'identifier': record.get('identifier'),
            'language': record.get('language'),
            'maintenance_note':
                'Generated from ' +
                'https://cioos-siooc.github.io/metadata-entry-form',
            'use_constraints': {
                'limitations': record.get('limitations', 'None'),
                'licence': get_license_by_code(record.get('license',))
            },
            'comment': record.get('comment'),
            'history': record.get('history'),  # {'en':'','fr':''}
        },
        'spatial': {
            'bbox': [float(record['map'].get('west')),
                     float(record['map'].get('south')),
                     float(record['map'].get('east')),
                     float(record['map'].get('north'))] if not polygon else '',
            'polygon': polygon,
            'vertical': [float(record.get('verticalExtentMin')),
                         float(record.get('verticalExtentMax'))],
        },
        'identification': {
            'title': record.get('title'),  # {'en':'','fr':''}
            'abstract': record.get('abstract'),  # {'en':'','fr':''}
            'dates': {},  # filled out later
            'keywords': {
                'default': strip_keywords(record.get('keywords',
                                                     {'en': [], 'fr': []})),
                'eov': record.get('eov')
            },
            'temporal_begin': record.get('dateStart'),
            'temporal_end': record.get('dateEnd'),
            'status': record.get('status'),
        },
        'contact': [
            {
                'roles': x.get('role'),
                'organization': {
                    'name': x.get('orgName'),
                    'url': x.get('orgURL'),
                    'address': x.get('orgAdress'),
                    'city': x.get('orgCity'),
                    'country': x.get('orgCountry'),
                    'email': x.get('orgEmail')
                },
                'individual': {
                    'name': x.get('indName'),
                    'position': x.get('indPosition'),
                    'email': x.get('indEmail'),
                }
            } for x in record.get('contacts', [])
        ],

        'distribution': [
            {
                'url': x.get('url'),
                'name': x.get('name'),
                'description': x.get('description'),
            } for x in record.get('distribution', [])
        ],
        'platform': {
            'name': record.get('platformName'),
            'role': record.get('platformRole'),
            'authority': record.get('platformAuthority'),
            'id': record.get('platformID'),
            'description': record.get('platformDescription'),
            'instruments': record.get('instruments', []),

        }
    }

    record_yaml['identification']['dates'] = {
        "creation":  date_from_datetime_str(
            record.get('dateStart') or record.get('created')),
        "publication": date_from_datetime_str(
            record.get('datePublished')),
        "dateRevised": date_from_datetime_str(
            record.get('dateRevised'))
    }

    return scrub_dict(record_yaml)
