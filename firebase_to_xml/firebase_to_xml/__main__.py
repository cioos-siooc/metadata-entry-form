#!/usr/bin/env python3

"""
Command line interface to part of firebase_to_xml
"""

import argparse
import traceback
from dotenv import load_dotenv
import yaml

from metadata_xml.template_functions import metadata_to_xml
from firebase_to_xml.record_json_to_yaml import record_json_to_yaml
from firebase_to_xml.get_records_from_firebase import get_records_from_firebase


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


if __name__ == "__main__":
    main()
