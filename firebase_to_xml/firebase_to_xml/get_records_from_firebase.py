#!/usr/bin/env python3

"""
Query firebase to get all the records
"""

from google.auth.transport.requests import AuthorizedSession
from google.oauth2 import service_account
from loguru import logger


@logger.catch(reraise=True)
def get_records_from_firebase(
    region: str,
    firebase_auth_key_file: str,
    record_url: str,
    record_status: list,
    database_url: str,
    firebase_auth_key_json: str = None,
) -> list:
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
    authed_session = AuthorizedSession(credentials)

    # Generate the URL to query
    if record_url:
        logger.info(f"Processing record {record_url}")
        url = f"{database_url}{record_url}.json"
    else:
        logger.info(f"Processing records for {region}")
        url = f"{database_url}{region}/users.json"

    response = authed_session.get(url)
    response.raise_for_status()

    if record_url:
        # Return single url
        return [response.json()]

    # Return all records for this region and status
    return [
        record
        for user in response.json().values()
        for record in user.get("records", {}).values()
        if record.get("status") in record_status
    ]
