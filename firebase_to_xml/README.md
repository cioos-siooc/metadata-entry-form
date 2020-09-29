firebase_to_xml

Create and activate virtual enviroment
```bash
virtualenv venv
source venv/bin/activate
```

Install
```bash
pip install ./modules/metadata-xml
pip install .
```

Generate firebase private key
if you have not already done so, you will need a access token to authenticate with firebase
go to https://console.firebase.google.com/u/0/project/cioos-metadata-form/settings/serviceaccounts/adminsdk
and generate a new private key. Save the key into the keys folder and update the path in firebase_to_xml.py

Run
```bash
python firebase_to_xml.py
```

exit vertual enviroment
```bash
deactivate
```


TODO add commandline arguments to:
- define where key files are located
- set which RA to request data from
- limit to specific users?
- define output location