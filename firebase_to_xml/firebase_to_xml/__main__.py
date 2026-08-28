#!/usr/bin/env python3

"""
Command line interface to part of firebase_to_xml
"""

import base64
import binascii
import json
import traceback
from pathlib import Path

import yaml
from dotenv import load_dotenv
from firebase_to_xml.get_records_from_firebase import get_records_from_firebase
from loguru import logger
from metadata_xml.template_functions import metadata_to_xml
from firebase_to_xml.record_json_to_yaml import record_json_to_yaml
from tqdm import tqdm
import click
from loguru import logger

from firebase_to_xml.record_owner import get_record_owner

load_dotenv()


def get_filename(record):
    """Creates a filename by combinig the title and UUID"""
    name = record["title"][record["language"]][0:30] + "_" + record["identifier"][0:5]
    char_list = [
        character if character.isalnum() else "_" for character in name.strip().lower()
    ]
    name = "".join(char_list)
    return name


@logger.catch(reraise=True)
def _resolve_key(key: str):
    """Resolve --key into a (key_file, key_json) pair for get_records_from_firebase.

    `key` may be a path to a service account JSON key file, the raw JSON
    string, or a base64 encoding of it (so it can be injected as a
    single-line secret).
    """
    key_path = Path(key)
    try:
        is_file = key_path.exists()
    except OSError:
        # key is inline content (e.g. base64), too long to be a valid path
        is_file = False
    if is_file:
        if not key_path.read_text():
            raise ValueError(f"Key file {key_path} is empty")
        return str(key_path), None

    raw = key.strip()
    if not raw.startswith("{"):
        try:
            raw = base64.b64decode("".join(raw.split()), validate=True).decode("utf-8")
        except (binascii.Error, UnicodeDecodeError) as error:
            raise FileNotFoundError(f"Key file {key} not found") from error

    return None, json.loads(raw)


@logger.catch(reraise=True)
@click.command()
@click.option(
    "--record_url",
    help="URL to a single record to process",
)
@click.option(
    "--also-save-yaml",
    "--yaml",
    is_flag=True,
    help="Whether to output yaml file as well as xml",
)
@click.option(
    "--encoding",
    default="utf-8",
    help="Encoding of the output files",
)
@click.option(
    "--xml_directory",
    "--out",
    "-o",
    default=".",
    help="Folder to save xml",
)
@click.option(
    "--region",
    required=True,
    help="Regions to include pacific/stlaurent/atlantic",
    envvar="REGION",
)
@click.option(
    "--status",
    default="published",
    required=False,
    type=click.Choice(
        ["published", "submitted", "submitted,published", "published,submitted"]
    ),
    help="Status of records to process",
)
@click.option(
    "--database_url",
    required=True,
    envvar="DATABASE_URL",
    help="Firebase database URL",
)
@click.option(
    "--key",
    required=True,
    type=click.Path(exists=True),
    help="Path to firebase OAuth2 key file",
    envvar="FIREBASE_KEY",
)
@click.option(
    "--split-by-owner",
    is_flag=True,
    help="Create a subdirectory for each owner",
    envvar="SPLIT_BY_OWNER"
)
def main_cli(**kwargs):
    main(**kwargs)


def main(
    also_save_yaml,
    encoding,
    xml_directory,
    region,
    status,
    database_url,
    key,
    record_url=None,
    split_by_owner: bool = False,
):
    """Main function to convert records from Firebase to XML.

    Args:
        also_save_yaml (bool): Whether to output yaml file as well as xml
        encoding (str): Encoding of the output files
        xml_directory (str): Folder to save xml
        region (str): Regions to include pacific/stlaurent/atlantic
        status (str): Status of records to process
        database_url (str): Firebase database URL
        key (str): Path to firebase OAuth2 key file
        record_url (str): URL to a single record to process
        split_by_owner (bool): Create a subdirectory for each owner
    """

    # key may be a path to a key file, or the json string/base64 itself
    key_file, key_json = _resolve_key(key)

    # get list of records from Firebase
    record_list = get_records_from_firebase(
        region=region,
        firebase_auth_key_file=key_file,
        firebase_auth_key_json=key_json,
        record_url=record_url,
        record_status=status.split(","),
        database_url=database_url,
    )
    if not record_list:
        raise ValueError("No records found")

    # translate each record to YAML and then to XML
    for record in tqdm(record_list, desc=f"Processing {region} {status} records"):
        # if single record it uses std out, hide info
        if not record_url:
            logger.info(
                "Processing",
                f"'{record['title']['en']}'",
                f"'{record['title']['fr']}'",
                record["identifier"],
                record["recordID"],
                "\n",
            )

        try:
            record_yaml = record_json_to_yaml(record)

            organization = record.get("organization", "")
            name = record.get("filename") or get_filename(record)

            output_directory = Path(xml_directory) / organization

            if split_by_owner:
                output_directory = output_directory / get_record_owner(record)

            output_directory.mkdir(parents=True, exist_ok=True)

            # output yaml
            if also_save_yaml:
                yaml_file = output_directory / f"{name}.yaml"
                yaml_file.write_text(
                    yaml.dump(record_yaml, allow_unicode=True, sort_keys=False),
                    encoding=encoding,
                )

            # render xml template and write to file
            xml = metadata_to_xml(record_yaml)
            if record_url:
                logger.info(xml)
            else:
                xml_file = output_directory / f"{name}.xml"
                xml_file.write_text(xml, encoding=encoding)
                logger.info("Wrote " + xml_file.name)

        except Exception:
            logger.error(traceback.format_exc())


if __name__ == "__main__":
    main_cli()
