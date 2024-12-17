#!/usr/bin/env python3

"""
Command line interface to part of firebase_to_xml
"""

import argparse
import os
import traceback
from pathlib import Path

import yaml
from dotenv import load_dotenv
from firebase_to_xml.get_records_from_firebase import get_records_from_firebase
from loguru import logger
from metadata_xml.template_functions import metadata_to_xml
from firebase_to_xml.record_json_to_yaml import record_json_to_yaml
from tqdm import tqdm

load_dotenv()


def get_filename(record):
    """Creates a filename by combinig the title and UUID"""
    name = record["title"][record["language"]][0:30] + "_" + record["identifier"][0:5]
    char_list = [
        character if character.isalnum() else "_" for character in name.strip().lower()
    ]
    name = "".join(char_list)
    return name


@logger.catch
def main(
    record_url,
    also_save_yaml,
    encoding,
    xml_directory,
    region,
    status,
    database_url,
    key,
):
    "Get arguments from command line and run script"

    # get list of records from Firebase
    record_list = get_records_from_firebase(
        region=region,
        firebase_auth_key_file=key,
        record_url=record_url,
        record_status=status.split(","),
        database_url=database_url,
    )

    # translate each record to YAML and then to XML
    for record in tqdm(record_list, desc=f"Processing {region} records"):
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
            print(traceback.format_exc())


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Convert firebase metadata form to xml and optionaly yaml"
    )

    parser.add_argument("--key", required=True, help="Path to firebase OAuth2 key file")
    parser.add_argument(
        "--xml-directory", "--out", default=".", help="Folder to save xml"
    )
    parser.add_argument(
        "--also-save-yaml",
        "--yaml",
        action="store_true",
        help="Whether to output yaml file as well as xml",
    )
    parser.add_argument("--region", required=True, help="Eg pacific/stlaurent/atlantic")
    parser.add_argument(
        "--status",
        default="published",
        required=False,
        choices=[
            "published",
            "submitted",
            "submitted,published",
            "published,submitted",
        ],
    )
    parser.add_argument("--record_url", required=False)
    parser.add_argument(
        "--database_url",
        default=os.getenv("DATABASE_URL"),
        required=False,
        help="Firebase database URL (default: %(default)s)",
    )
    parser.add_argument(
        "--encoding",
        default="utf-8",
        required=False,
        help="Encoding of the output files",
    )
    args = vars(parser.parse_args())

    main(**args)
