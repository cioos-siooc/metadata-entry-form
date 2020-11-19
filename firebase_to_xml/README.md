# firebase_to_xml

Python3 module to convert records in Firebase to XML/YAML files

## Firebase auth key

To generate a new key:

- Go to <https://console.firebase.google.com/u/0/project/cioos-metadata-form/settings/serviceaccounts/adminsdk>
- Click 'Generate new privey key'. Save the file to the 'keys' folder

- Keys can be managed at <https://console.cloud.google.com/iam-admin/serviceaccounts/details/108735728189650899572?authuser=0&project=cioos-metadata-form>

## Installation

Create and activate virtual enviroment

```bash
virtualenv venv
source venv/bin/activate
```

Install

```bash
pip install .
```

## Running

To see help

```bash
python -m firebase_to_xml -h
```
