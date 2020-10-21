# firebase_to_xml

## Firebase auth key

To generate a new key:

- Go to <https://console.firebase.google.com/u/0/project/cioos-metadata-form/settings/serviceaccounts/adminsdk>
- Click 'Generate new privey key'. Save the file to the 'keys' folder

- Keys can be managed at <https://console.cloud.google.com/iam-admin/serviceaccounts/details/108735728189650899572?authuser=0&project=cioos-metadata-form>

- (optional) update .env with the path to your key. Otherwise you will have to supply this path at command line

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

Update

```bash
pip install --upgrade .
```

- To set enviroment variables to be used by the script edit the .env file.
  Any command passed on the command line can also be set in the enviroment variable

## Running

To see help

```bash
python firebase_to_xml.py -h
```

```bash
python firebase_to_xml.py
```

exit virtual environment

```bash
deactivate
```
