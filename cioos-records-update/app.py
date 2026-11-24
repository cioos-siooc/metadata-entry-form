import glob
import os
import time
import traceback
from pathlib import Path
import json

import yaml
from firebase_to_xml.__main__ import get_filename
from firebase_to_xml.get_records_from_firebase import get_records_from_firebase
from firebase_to_xml.record_json_to_yaml import record_json_to_yaml
from flask import Flask, jsonify, make_response, request
from metadata_xml.template_functions import metadata_to_xml
from hakai_metadata_conversion.citation_cff import citation_cff
from hakai_metadata_conversion.erddap import global_attributes

import sentry_sdk

from git import Repo
# make sure .git folder is properly configured
PATH_OF_GIT_REPO = r'xml/.git'
COMMIT_MESSAGE = 'comment from python script'
_repo = Repo(PATH_OF_GIT_REPO)

GIT_LOCK_MAX_RETRIES = 10
GIT_LOCK_RETRY_DELAY_SECONDS = 1


def _run_with_lock_retry(operation, description):
    # GitPython (and the underlying git binary) refuse to run when a stale
    # .lock file is left behind by a previous/concurrent operation. Back off
    # and retry instead of failing the whole request outright.
    for attempt in range(1, GIT_LOCK_MAX_RETRIES + 1):
        try:
            return operation()
        except Exception as err:
            if attempt == GIT_LOCK_MAX_RETRIES or "lock" not in str(err).lower():
                raise
            delay = GIT_LOCK_RETRY_DELAY_SECONDS * attempt
            print(
                f"{description} failed due to a git lock file (attempt {attempt}/{GIT_LOCK_MAX_RETRIES}),"
                f" retrying in {delay}s: {err}"
            )
            time.sleep(delay)


def git_pull():
    _run_with_lock_retry(lambda: _repo.remote(name='origin').pull(), "git pull")


def to_repo_relative(path):
    # The paths built here and returned by glob.glob() are relative to the app's
    # working directory, but the git repo's root is xml_folder, and GitPython runs
    # the git binary from there. Passing "xml/hakai/rec.xml" through unchanged makes
    # git look for "xml/xml/hakai/rec.xml" and fail the pathspec.
    return str(Path(path).relative_to(xml_folder))


def git_push(files=None):
    if files:
        _run_with_lock_retry(
            lambda: _repo.git.add([to_repo_relative(f) for f in files]),
            "git add",
        )
    _run_with_lock_retry(lambda: _repo.index.commit(COMMIT_MESSAGE), "git commit")
    origin = _repo.remote(name='origin')
    _run_with_lock_retry(lambda: origin.pull(rebase=True), "git pull (rebase)")
    _run_with_lock_retry(lambda: origin.push(), "git push")

sentry_sdk.init(
    dsn="https://e0623f41d68caf57dc1563203f482daf@o4505071053766656.ingest.us.sentry.io/4508490893426688",
    traces_sample_rate=1.0,
    profiles_sample_rate=1.0,
)

# on the server its run inside docker, the values of xml, key.json work for the server
firebase_auth_key_file = "key.json"
firebase_auth_key_json = json.loads(os.environ.get('FIREBASE_SERVICE_ACCOUNT_KEY','{}'))
# this is bind mounted to /var/www/html/dev/metadata
xml_folder = "xml"

waf_url = "https://pac-dev1.cioos.org/dev/metadata/"

# RECORD_DELETE_TOKEN is the former name, kept as a fallback so the rename can land
# before the deployment environment is updated.
RECORD_API_TOKEN = os.environ.get("RECORD_API_TOKEN") or os.environ.get(
    "RECORD_DELETE_TOKEN", ""
)

app = Flask(__name__)


def sanitize_basename(value):
    # basename reaches glob.glob() below and is used to build output paths. It comes from
    # record data, so without this a value like "*" would match - and delete - every
    # record in the region.
    return "".join(c if c.isalnum() else "_" for c in (value or "").strip().lower())


def token_is_valid():
    return bool(RECORD_API_TOKEN) and request.args.get("token") == RECORD_API_TOKEN


def delete_record(basename, region=None):
    # before writing/update a file, delete the old one
    # this way if the status changes (and so the folder changes), we dont end up with multiple copies
    types = ('.xml', '.yaml', '.cff', '.erddap')

    existing_record_path = []

    for ext in types:
        if region:
            # recursive ** also matches zero directories, so this covers both
            # xml/<region>/ and xml/unpublished/<region>/
            existing_record_path.extend(glob.glob(f"{xml_folder}/**/{region}/{basename}{ext}", recursive=True))
        else:
            existing_record_path.extend(glob.glob(f"{xml_folder}/**/{basename}{ext}", recursive=True))

    if existing_record_path:
        _repo.index.remove(
            [to_repo_relative(p) for p in existing_record_path], working_tree=True
        )
        print("Deleted", existing_record_path)

    return existing_record_path

def get_complete_path(status, region, basename, file_suffix):
    parts = [xml_folder, region, basename + file_suffix]
    if status == "submitted":
        parts.insert(1, "unpublished")
    return "/".join(parts)

@app.route("/recordDelete")
def recordDelete():
    if not token_is_valid():
        return make_response(jsonify(error="Unauthorized"), 401)
    filenameToDelete = sanitize_basename(request.args.get("filename", ""))
    region = request.args.get("region", "").strip() or None
    git_pull()
    delete_record(filenameToDelete, region)
    git_push()
    return jsonify(message="record deleted")


# this would make us need to connect AWS Lambda to Firebase, doable, but I cant think how this would help anything
# create XML,YAML snippet, and write them to the WAF
@app.route("/record")
def recordUpdate():
    # This route deletes the record's existing files and reads from Firebase with the
    # service account, so it must not be callable by anything that can reach the host.
    if not token_is_valid():
        return make_response(jsonify(error="Unauthorized"), 401)

    path = request.args.get("path")
    if not path:
         return make_response(jsonify(error="Missing path"), 500)

    parts = path.split("/")
    if len(parts) != 3 or not all(parts):
        return make_response(jsonify(error="Invalid path"), 400)
    [region, userID, recordID] = parts
    pathComplete = region + "/users/" + userID + "/records/" + recordID

    recordFromFB = get_records_from_firebase(
        "", firebase_auth_key_file, pathComplete, [], firebase_auth_key_json
    )[0]
    if not recordFromFB or not "title" in recordFromFB:
        return jsonify(message="not found")

    status = recordFromFB.get("status", "")
    basename = sanitize_basename(recordFromFB.get('filename') or get_filename(recordFromFB))

    xml_filename = get_complete_path(status, region, basename,'.xml')
    yaml_filename = get_complete_path(status, region, basename,'.yaml')
    cff_filename = get_complete_path(status, region, basename, '.cff')
    erddap_filename = get_complete_path(status, region, basename, '.erddap')

    git_pull()

    # delete file if exists already
    print(basename)
    deleted = delete_record(basename, region)

    # ah just let it run, if its a complete file it should work
    if status not in ["submitted", "published"]:
        # the record went back to draft, so its files stay deleted - but the removal is
        # only staged at this point, and leaving it staged would get swept into whatever
        # the next request happens to commit
        if deleted:
            git_push()
        return jsonify(message="")

    # this might fail for incomplete files. It should only be used if record is complete
    try:
        record = record_json_to_yaml(recordFromFB)
        xml = metadata_to_xml(record)
        record_yaml =  yaml.safe_dump(record, allow_unicode=True)
        cff_yaml = citation_cff(
            record, 
            record_type=recordFromFB.get('metadataScope')
            )
        erddap_xml = global_attributes(
            record,
            output='xml'
        )

        # create path if doesn't exist
        print(xml_filename)
        Path(xml_filename).parent.mkdir(parents=True, exist_ok=True)

        with open(xml_filename, "w") as f:
            f.write(xml)
            print("wrote", xml_filename)
        
        with open(yaml_filename, "w") as g:
            g.write(record_yaml)
            print("wrote", yaml_filename)
        
        with open(cff_filename, "w") as g:
            g.write(cff_yaml)
            print("wrote", cff_filename)


        with open(erddap_filename, "w") as g:
            g.write(erddap_xml)
            print("wrote", erddap_filename)

        git_push([xml_filename, yaml_filename, cff_filename, erddap_filename])

        url = waf_url + basename
        
        # returned value doesn't do anything
        return jsonify(message=url)
    except Exception as err:
        print(traceback.format_exc())
        sentry_sdk.capture_exception(err)
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


@app.route("/recordToCFF", methods=["POST"])
def recordToCFF():
    recordFromFB = request.get_json()

    record = record_json_to_yaml(recordFromFB)

    # basename = get_filename(recordFromFB)
    try:
        cff = citation_cff(
            record,
            record_type=recordFromFB.get('metadataScope')
        )
        return jsonify(message={"record": cff})
    except Exception as err:
        print(traceback.format_exc())
        sentry_sdk.capture_exception(err)
        return make_response(jsonify(error="Error creating cff"), 500)


@app.route("/recordToERDDAP", methods=["POST"])
def recordToERDDAP():
    recordFromFB = request.get_json()

    record = record_json_to_yaml(recordFromFB)

    # basename = get_filename(recordFromFB)
    try:
        erddap_xml = global_attributes(
            record,
            output='xml'
        )
        return jsonify(message={"xml": erddap_xml})
    except Exception as err:
        print(traceback.format_exc())
        sentry_sdk.capture_exception(err)
        return make_response(jsonify(error="Error creating erddap snippet"), 500)

@app.errorhandler(404)
def resource_not_found(e):
    return make_response(jsonify(error="Not found!"), 404)

# Setup Git Credentials
GH_USERNAME = os.environ.get("GH_USERNAME", None)
GH_PAT = os.environ.get("GH_PAT", None)
if GH_USERNAME and GH_PAT:
    print("Running Git configuration")
    repo = Repo(PATH_OF_GIT_REPO)
    origin = repo.remote(name='origin')
    repoURL = origin.url
    repoURL = repoURL.replace("https://github", "https://%s:%s@github" % (GH_USERNAME,GH_PAT))
    cw = origin.config_writer
    cw.set_value('url', repoURL)
    cw.release()
    print("Completed Git configuration")

if __name__ == "__main__":
    app.run()
