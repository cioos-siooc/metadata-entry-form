firebase_to_xml

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

Generate firebase private key
if you have not already done so, you will need a access token to authenticate with firebase
go to https://console.firebase.google.com/u/0/project/cioos-metadata-form/settings/serviceaccounts/adminsdk
and generate a new private key. Save the key into the keys folder and update the path in firebase_to_xml.py

Run
```bash
python firebase_to_xml.py
```

To see help
```bash
python firebase_to_xml.py -h
```
```
usage: firebase_to_xml.py [-h] [-k [KEY]] [-o [OUT]] [-y] [-ra [RA]]

Convert firebase metadata form to xml and optionaly yaml

optional arguments:
  -h, --help            show this help message and exit
  -k [KEY], --key [KEY]
                        name and path of json google OAuth2 key file generated
                        by a service account
  -o [OUT], --out [OUT]
                        folder to output the created xml files to
  -y, --yaml            output yaml file as well as xml
  -ra [RA], --RA [RA]   Set the RA forms will be converted for (atlantic,
```

To set enviroment variables to be used by the script edit the .env file. Any
command passed on the command line can also be set in the enviroment variable
```bash
nano .env
```

exit vertual enviroment
```bash
deactivate
```


TODO add commandline arguments or enviroment varibles to:
- set which RA to request data from
- limit to specific users?
