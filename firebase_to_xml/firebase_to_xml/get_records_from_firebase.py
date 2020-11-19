#!/usr/bin/env python3

"""
Query firebase to get all the records
"""

import json
import sys
import pprint

from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession


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
