import glob
import os
import traceback
from pathlib import Path
import json

import yaml
from firebase_to_xml.__main__ import get_filename
from firebase_to_xml.get_records_from_firebase import get_records_from_firebase
from firebase_to_xml.record_json_to_yaml import record_json_to_yaml
from flask import Flask, jsonify, make_response, request
from metadata_xml.template_functions import metadata_to_xml

import sentry_sdk

sentry_sdk.init(
    dsn="https://b21f672d78630938fcc78d26097dfece@o4505071053766656.ingest.us.sentry.io/4507704416796672",

    # Set traces_sample_rate to 1.0 to capture 100%
    # of transactions for performance monitoring.
    # We recommend adjusting this value in production.
    traces_sample_rate=1.0,
)

# on the server its run inside docker, the values of xml, key.json work for the server
firebase_auth_key_file = "key.json"
firebase_auth_key_json = json.loads(os.environ.get('FIREBASE_SERVICE_ACCOUNT_KEY','{}'))
# this is bind mounted to /var/www/html/dev/metadata
xml_folder = "xml"

waf_url = "https://pac-dev1.cioos.org/dev/metadata/"
app = Flask(__name__)

def delete_record(basename):
    # before writing/update a file, delete the old one
    # this way if the status changes (and so the folder changes), we dont end up with multiple copies
    # sanitize filename. just for security, the names should already be safe
    basename = "".join(
        [
            character if character.isalnum() else "_"
            for character in basename.strip().lower()
        ]
    )
    types = ('.xml','.yaml') # the tuple of file types
    
    existing_record_path = []
    
    for files in types:
        existing_record_path.extend(glob.glob(f"{xml_folder}/**/{basename}{files}", recursive=True))


    for file_path in existing_record_path:
        print("Deleting", file_path)
        os.remove(file_path)


def get_complete_path(status, region, basename,file_suffix):
    submitted_dir_addon = ""
    if status == "submitted":
        submitted_dir_addon = "unpublished"

    filename = "/".join([xml_folder, submitted_dir_addon, region, basename + file_suffix])
    return filename


@app.route("/status", methods=["GET"])
def status():
    return jsonify(message="OK")


@app.route("/recordDelete")
def recordDelete():
    filenameToDelete = request.args.get("filename")
    # so anyone can delete any xml file hmm
    delete_record(filenameToDelete)
    return jsonify(message="record deleted")


# this would make us need to connect AWS Lambda to Firebase, doable, but I cant think how this would help anything
# create XML,YAML snippet, and write them to the WAF
@app.route("/record")
def recordUpdate():
    path = request.args.get("path")
    if not path:
         return make_response(jsonify(error="Missing path"), 500)
 
    [region, userID, recordID] = path.split("/")
    pathComplete = region + "/users/" + userID + "/records/" + recordID

    recordFromFB = get_records_from_firebase(
        "", firebase_auth_key_file, pathComplete, [], firebase_auth_key_json
    )[0]
    if not recordFromFB or not "title" in recordFromFB:
        return jsonify(message="not found")

    status = recordFromFB.get("status", "")
    basename = recordFromFB.get('filename') or get_filename(recordFromFB)
    
    xml_filename = get_complete_path(status, region, basename,'.xml')
    yaml_filename = get_complete_path(status, region, basename,'.yaml')

    # delete file if exists already
    print(basename)
    delete_record(basename)

    # ah just let it run, if its a complete file it should work
    if status not in ["submitted", "published"]:
        return jsonify(message="")

    # this might fail for incomplete files. It should only be used if record is complete
    try:
        record = record_json_to_yaml(recordFromFB)
        xml = metadata_to_xml(record)
        record_yaml =  yaml.safe_dump(record, allow_unicode=True)

        # create path if doesnt exist
        print(xml_filename)
        Path(xml_filename).parent.mkdir(parents=True, exist_ok=True)

        with open(xml_filename, "w") as f:
            f.write(xml)
            print("wrote", xml_filename)
        
        with open(yaml_filename, "w") as g:
            g.write(record_yaml)
            print("wrote", yaml_filename)

        url = waf_url + basename
        
        # returned value doesnt do anything
        return jsonify(message=url)
    except Exception:
        print(traceback.format_exc())
        return make_response(jsonify(error="Error creating xml"), 500)


# skip firebase and just create the XML directly
@app.route("/recordToXML", methods=["POST"])
def recordToXML():
    recordFromFB = request.get_json()

    record = record_json_to_yaml(recordFromFB)
    # basename = get_filename(recordFromFB)
    try:
        xml = metadata_to_xml(record)
        return jsonify(message={"xml": xml})
    except Exception:
        print(traceback.format_exc())
        return make_response(jsonify(error="Error creating xml"), 500)


@app.route("/recordToYAML", methods=["POST"])
def recordToYAML():
    recordFromFB = request.get_json()

    # basename = get_filename(recordFromFB)
    record = record_json_to_yaml(recordFromFB)
    print(record)

    return jsonify(message={"record": yaml.safe_dump(record, allow_unicode=True)})



@app.errorhandler(404)
def resource_not_found(e):
    return make_response(jsonify(error="Not found!"), 404)


if __name__ == "__main__":
    app.run()
