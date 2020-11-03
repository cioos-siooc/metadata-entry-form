#!/usr/bin/env python3

'''
Pulls metadata records from Firebase and translate them into XML via
the metadata-xml module.
'''


import json
import sys
import pprint
import argparse

import yaml
from dotenv import load_dotenv
from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession

from metadata_xml.template_functions import metadata_to_xml


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

            name = record['title'][record['language']]

            char_list = [character if character.isalnum(
            ) else '_' for character in name.strip().lower()]
            name = "".join(char_list)

            # output yaml
            if also_save_yaml:
                filename = f'{xml_directory}/{name}.yaml'
                file = open(filename, "w")
                file.write(yaml.dump(record_yaml, allow_unicode=True))

            # render xml template and write to file
            xml = metadata_to_xml(record_yaml)
            filename = f'{xml_directory}/{name}.xml'
            file = open(filename, "w")
            file.write(xml)
            print("Wrote " + file.name)

        except KeyError as key_error:
            print(key_error)


def record_json_to_yaml(record):
    "Generate dictinary expected by metadata-xml"

    record_yaml = {
        'metadata': {
            'naming_authority': 'ca.coos',
            'identifier': record.get('identifier'),
            'language': record.get('language'),
            'maintenance_note': record.get('maintenance'),
            'use_constraints': {
                'limitations': record.get('limitations'),
                'license': record.get('license',)
            },
            'comment': record.get('comment'),
            'history': record.get('history'),  # {'en':'','fr':''}
        },
        'spatial': {
            'bbox': [record.get('map', {}).get('west'),
                     record.get('map', {}).get('south'),
                     record.get('map', {}).get('east'),
                     record.get('map', {}).get('north')],
            'polygon': record.get('map', {}).get('polygon', ''),
            'vertical': [record.get('verticalExtentMin'),
                         record.get('verticalExtentMax')],
        },
        'identification': {
            'title': record.get('title'),  # {'en':'','fr':''}
            'abstract': record.get('abstract'),  # {'en':'','fr':''}
            'dates': {},  # filled out later
            'keywords': {
                'default': record.get('keywords', {'en': [], 'fr': []}),
                'eov': record.get('eov')
            },
            'temporal_begin': record.get('dateStart'),
            'temporal_end': record.get('dateEnd', 'now'),
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
                'url': [x.get('url')],
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

    if record.get('dateStart') is not None:
        record_yaml['identification']['dates']['creation'] = record.get(
            'dateStart') or record.get('created')
    if record.get('datePublished') is not None:
        record_yaml['identification']['dates']['publication'] = record.get(
            'datePublished')
    if record.get('dateRevised') is not None:
        record_yaml['identification']['dates']['revision'] = record.get(
            'dateRevised')
    return record_yaml


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
