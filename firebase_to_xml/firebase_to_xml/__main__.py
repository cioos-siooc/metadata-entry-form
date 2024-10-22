#!/usr/bin/env python3

"""
Command line interface to part of firebase_to_xml
"""
import argparse
import traceback
from pathlib import Path
import os

import yaml
from dotenv import load_dotenv
from metadata_xml.template_functions import metadata_to_xml
from loguru import logger
from tqdm import tqdm

from get_records_from_firebase import get_records_from_firebase
from record_json_to_yaml import record_json_to_yaml



def get_filename(record):
    """Creates a filename by combinig the title and UUID """
    name = record["title"][record["language"]][0:30] + "_" + record["identifier"][0:5]
    char_list = [
        character if character.isalnum() else "_" for character in name.strip().lower()
    ]
    name = "".join(char_list)
    return name


def main():
    "Get arguments from command line and run script"

    load_dotenv()

    parser = argparse.ArgumentParser(
        description="Convert firebase metadata form to xml and optionaly yaml"
    )

    parser.add_argument("--key", required=True, help="Path to firebase OAuth2 key file")
    parser.add_argument("--out", default=".", help="Folder to save xml")
    parser.add_argument(
        "--yaml", action="store_true", help="Whether to output yaml file as well as xml"
    )
    parser.add_argument(
        "--region", required=True, help="Eg pacific/stlaurent/atlantic"
    )
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
    parser.add_argument("--database_url", default=os.getenv("DATABASE_URL"), required=False, help="Firebase database URL (default: %(default)s)")
    args = vars(parser.parse_args())

    record_url = args["record_url"]
    also_save_yaml = args["yaml"]

    # get list of records from Firebase
    record_list = get_records_from_firebase(
        args["region"], args["key"], record_url, args["status"].split(','), args["database_url"]
    )

    # translate each record to YAML and then to XML
    for record in tqdm(record_list, desc="Convert records", unit="record"):
        # if single record it uses std out, hide info
        try:
            record_yaml = record_json_to_yaml(record)

            organization = record.get("organization", "")

            filename = record.get("filename") or get_filename(record)

            output_directory = Path(args["out"]) / organization
            output_directory.mkdir(parents=True, exist_ok=True)

            # output yaml
            if also_save_yaml:
                yaml_file = output_directory / f"{filename}.yaml"
                yaml_file.write_text(yaml.dump(record_yaml, allow_unicode=True, sort_keys=False), encoding="utf-8")

            # render xml template and write to file
            xml = metadata_to_xml(record_yaml)
            if record_url:
                logger.info(xml)
                continue

            xml_file = output_directory / f"{filename}.xml"
            xml_file.write_text(xml, encoding="utf-8") 

        except Exception:
            logger.error(traceback.format_exc())


if __name__ == "__main__":
    main()
