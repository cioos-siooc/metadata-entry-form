#!/usr/bin/env python3

"""
Query firebase to get all the records
"""

import json
import pprint
import sys

from google.auth.transport.requests import AuthorizedSession
from google.oauth2 import service_account


def get_records_from_firebase(
    region, firebase_auth_key_file, record_url, record_status, firebase_auth_key_json=None
):
    """
    Returns list of records from firebase for this region,
    using keyfile to authenticate
    """

    # Define the required scopes
    scopes = [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/firebase.database",
    ]

    # Authenticate a credential with the service account
    if firebase_auth_key_json:
        credentials = service_account.Credentials.from_service_account_info(
            firebase_auth_key_json, scopes=scopes
        )
    else:
        credentials = service_account.Credentials.from_service_account_file(
            firebase_auth_key_file, scopes=scopes
        )

    # Use the credentials object to authenticate a Requests session.
    authed_session = AuthorizedSession(credentials)
    # request data

    records = []

    if record_url:
        response = authed_session.get(
            f"https://cioos-metadata-form.firebaseio.com/{record_url}.json"
        )
        body = json.loads(response.text)
        records.append(body)
        return records

    else:
        response = authed_session.get(
            f"https://cioos-metadata-form.firebaseio.com/{region}/users.json"
        )
        body = json.loads(response.text)

        # Parse response
        if not body or type(body) != dict :
            print("Region",region,"not found?")
            # print(response.content)
            sys.exit()

        for users_tree in body.values():
            if "records" in users_tree:
                records_tree = users_tree["records"]

                for record in records_tree.values():
                    if "status" in record and record["status"] in record_status:
                        records.append(record)
        return records
