#!/usr/bin/env python3

"""
Command line interface to part of firebase_to_xml
"""
import argparse
import traceback
from pathlib import Path

import yaml
from dotenv import load_dotenv
from metadata_xml.template_functions import metadata_to_xml

from firebase_to_xml.get_records_from_firebase import get_records_from_firebase
from firebase_to_xml.record_json_to_yaml import record_json_to_yaml


def parse_status(status: str):
    """Return a list version fo their status selection"""

    if "," in status:
        return status.split(",")

    return [status]


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

    args = vars(parser.parse_args())

    region = args["region"]
    record_status = parse_status(args["status"])

    record_url = args["record_url"]

    firebase_auth_key_file = args["key"]
    also_save_yaml = args["yaml"]

    # get list of records from Firebase
    record_list = get_records_from_firebase(
        region, firebase_auth_key_file, record_url, record_status
    )

    # translate each record to YAML and then to XML
    for record in record_list:
        # if single record it uses std out, hide info
        if not record_url:
            print(
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

            xml_directory = args["out"]

            xml_directory = "/".join([args["out"], organization])

            Path(xml_directory).mkdir(parents=True, exist_ok=True)

            # output yaml
            if also_save_yaml:
                filename = f"{xml_directory}/{name}.yaml"
                file = open(filename, "w")
                file.write(yaml.dump(record_yaml, allow_unicode=True, sort_keys=False))

            # render xml template and write to file
            xml = metadata_to_xml(record_yaml)
            if record_url:
                print(xml)
            else:
                filename = f"{xml_directory}/{name}.xml"
                file = open(filename, "w")
                file.write(xml)
                print("Wrote " + file.name)

        except Exception:
            print(traceback.format_exc())


if __name__ == "__main__":
    main()
