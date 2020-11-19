#!/usr/bin/env python3

'''
Pulls metadata records from Firebase and translate them into XML via
the metadata-xml module.
'''


import json
import sys
import pprint
import argparse
import traceback

import yaml
from dotenv import load_dotenv
from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession

from metadata_xml.template_functions import metadata_to_xml
from scrubbers import scrub_dict, scrub_keys


def main():
    "Get arguments from command line and run script"

    load_dotenv()

    parser = argparse.ArgumentParser(
        description='Convert firebase metadata form to xml and optionaly yaml')

    parser.add_argument('--key',
                        required=True,
                        help='Path to firebase OAuth2 key file')
    parser.add_argument('--out',
                        default='.',
                        help='Folder to save xml')
    parser.add_argument('--yaml', action='store_true',
                        help='Whether to output yaml file as well as xml')
    parser.add_argument('--region',
                        required=True,
                        choices=['pacific', 'stlaurent', 'atlantic'])

    args = vars(parser.parse_args())

    region = args["region"]
    firebase_auth_key_file = args["key"]
    also_save_yaml = args["yaml"]
    xml_directory = args["out"]

    print("Region: ", region)

    # get list of records from Firebase
    record_list = get_records_from_firebase(region, firebase_auth_key_file)

    # translate each record to YAML and then to XML
    for record in record_list:

        print('Processing',
              f"'{record['title']['en']}'",
              f"'{record['title']['fr']}'",
              record['identifier'],
              record['recordID'], "\n")

        try:
            record_yaml = record_json_to_yaml(record)
            name = record['title'][record['language']][0:30] + \
                '_' + record['identifier'][0:5]

            char_list = [character if character.isalnum(
            ) else '_' for character in name.strip().lower()]
            name = "".join(char_list)

            # output yaml
            if also_save_yaml:
                filename = f'{xml_directory}/{name}.yaml'
                file = open(filename, "w")
                file.write(
                    yaml.dump(record_yaml,
                              allow_unicode=True,
                              sort_keys=False)
                )

            # render xml template and write to file
            xml = metadata_to_xml(record_yaml)
            filename = f'{xml_directory}/{name}.xml'
            file = open(filename, "w")
            file.write(xml)
            print("Wrote " + file.name)

        except KeyError:
            print(traceback.format_exc())


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


def float_or_none(val):
    'return either a float represenatation of the string val, or None'
    if val:
        return float(val)
    return None


def record_json_to_yaml(record):
    "Generate dictinary expected by metadata-xml"

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
            'bbox': [float_or_none(record['map'].get('west')),
                     float_or_none(record['map'].get('south')),
                     float_or_none(record['map'].get('east')),
                     float_or_none(record['map'].get('north'))],
            'polygon': record.get('map', {}).get('polygon', ''),
            'vertical': [float_or_none(record.get('verticalExtentMin')),
                         float_or_none(record.get('verticalExtentMax'))],
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


def get_records_from_firebase(region, firebase_auth_key_file):
    """
    Returns list of records from firebase for this region,
    using keyfile to authenticate
    """

    # Define the required scopes
    scopes = [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/firebase.database"
    ]

    # Authenticate a credential with the service account
    credentials = service_account.Credentials.from_service_account_file(
        firebase_auth_key_file, scopes=scopes)

    # Use the credentials object to authenticate a Requests session.
    authed_session = AuthorizedSession(credentials)
    # request data
    response = authed_session.get(
        f'https://cioos-metadata-form.firebaseio.com/{region}/users.json')

    # Parse response
    body = json.loads(response.text)

    if body is None:
        pprint.pprint(json.loads(response))
        print('response body not found. Exiting...')
        sys.exit()

    records = []

    num_unpublished_records = 0

    for users_tree in body.values():
        if 'records' in users_tree:
            records_tree = users_tree['records']

            for record in records_tree.values():

                if record['status'] == 'published':
                    records.append(record)
                else:
                    num_unpublished_records = num_unpublished_records + 1

    print(f"Found {len(records)} published records")
    print(f"Found {num_unpublished_records} unpublished records")
    return records


if __name__ == "__main__":
    main()
