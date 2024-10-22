#!/usr/bin/env python3

"""
Query firebase to get all the records
"""

import json
import sys

from google.auth.transport.requests import AuthorizedSession
from google.oauth2 import service_account
from loguru import logger


def get_records_from_firebase(
    region: str,
    firebase_auth_key_file: str,
    record_url: str,
    record_status: list,
    database_url: str,
    firebase_auth_key_json: str = None,
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
        response = authed_session.get(f"{database_url}{record_url}.json")
        body = json.loads(response.text)
        records.append(body)
        return records

    else:
        response = authed_session.get(f"{database_url}{region}/users.json")
        body = json.loads(response.text)

        # Parse response
        if not body or not isinstance(body, dict):
            logger.warning("Region", region, "not found?")
            sys.exit()

        for users_tree in body.values():
            if "records" in users_tree:
                records_tree = users_tree["records"]

                for record in records_tree.values():
                    if "status" in record and record["status"] in record_status:
                        records.append(record)
        return records
