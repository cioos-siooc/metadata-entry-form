import traceback
from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession
import json
import os
import pathlib
import pprint
import metadata_xml.__main__ as metadata_xml
from jinja2 import Environment, FileSystemLoader


# Define the required scopes
scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/firebase.database"
    ]

# Authenticate a credential with the service account
# to generate Oauth2 access token go to se https://firebase.google.com/docs/database/rest/auth
# specificly go to 'https://console.firebase.google.com/u/0/project/cioos-metadata-form/settings/serviceaccounts/adminsdk'
# and click 'Generate new privey key'. then save the file to the keys folder and update path below
# keys can be managed at https://console.cloud.google.com/iam-admin/serviceaccounts/details/108735728189650899572?authuser=0&project=cioos-metadata-form
credentials = service_account.Credentials.from_service_account_file(
    "keys/cioos-metadata-form-firebase-adminsdk-44g1h-e423cf75cb.json", scopes=scopes)

# Use the credentials object to authenticate a Requests session.
authed_session = AuthorizedSession(credentials)
response = authed_session.get(
    "https://cioos-metadata-form.firebaseio.com/test/users.json")

body = json.loads(response.text)
record_list = []
for k, v in body.items():
    records = v.get('records')
    if not records:
        continue

    for k2, v2 in records.items():
        record_list.append(v2)

dir_path = os.path.dirname(os.path.realpath(__file__))
this_directory = pathlib.Path(__file__).parent.absolute()
schema_path = str(this_directory) + \
    '/modules/metadata-xml/metadata_xml/iso19115-cioos-template'

template_loader = FileSystemLoader(searchpath=schema_path)
template_env = Environment(loader=template_loader,
                           trim_blocks=True, lstrip_blocks=True)

template_env.globals.update(
    list_all_languages_in_record=metadata_xml.list_all_languages_in_record)
template_env.filters['normalize_datestring'] = metadata_xml.normalize_datestring
template = template_env.get_template('main.j2')

for r in record_list:
    try:
        yDict = {
            'metadata': {
                'naming_authority': r.get('namingAuthority'), # {'en':'','fr':''}
                'identifier': r.get('recordID'),
                'language': r.get('language'),
                'maintenance_note': r.get('maintenance'),
                'use_constraints': {
                    'limitations': r.get('limitations'),
                    'license': r.get('license',)
                    # {title: Creative Commons Attribution 4.0
                    # code: CC-BY-4.0
                    # url: https://creativecommons.org/licenses/by/4.0/}
                },
                'comment': r.get('comment'),
                'history': r.get('history'), # {'en':'','fr':''}
            },
            'spatial': {
                'bbox': [r.get('map', {}).get('west'),
                         r.get('map', {}).get('south'),
                         r.get('map', {}).get('east'),
                         r.get('map', {}).get('north')],
                # 'polygon': '',
                # vertical: [0, 10]
            },
            'identification': {
                'title': r.get('title'), # {'en':'','fr':''}
                'abstract': r.get('abstract'), # {'en':'','fr':''}
                'dates': {}, # filled out later
                'keywords': {
                    'default':{
                        'en': [],
                        'fr': []},
                    'eov': r.get('eov')
                },
                'temporal_begin': r.get('dateStart'),
                'temporal_end': r.get('dateEnd', 'now'),
                # temporal_duration: P1D
                # time_coverage_resolution: P1D
                # acknowledgement: acknowledgement
                'status': r.get('status'),
                # project: # {'en':[''],'fr':['']}
            },
            'contact': [
                {
                    'roles': [x.get('role')],
                    'organization':{
                        'name': x.get('orgName'),
                        'url': x.get('orgURL'),
                        'address': x.get('orgAdress'),
                        'city': x.get('orgCity'),
                        'country': x.get('orgCountry'),
                        'email': x.get('orgEmail')
                    },
                    'individual': {
                        'name': x.get('indName'),
                        'position': x.get('indPosition'),
                        'email': x.get('indEmail'),
                        # country:
                    }
                } for x in r.get('contacts', [])
            ],

            'distribution':[
              {
                'url': [x.get('url')],
                'name': x.get('name'),
                'description': x.get('description'),
                #   en: pdf description in English
                #   fr: pdf description in French
              } for x in r.get('distribution', [])
            ],
            'platform': {
                'name': r.get('platformName'),
                'role': r.get('platformRole'),
                # authority: platform_authority
                'id': r.get('platformID'),
                'description': r.get('platformDescription'),
                'instruments': r.get('instruments')
                # - id: 123
                #   manufacturer: manufacturer en 1
                #   version: A1.53
                #   type:
                #     en: type en 1
                #     fr: type fr 1
                #   description:
                #     en: instrument description en 1
                #     fr: instrument description fr 1
            }
        }

        if r.get('created') is not None:
            yDict['identification']['dates']['creation'] = r.get('created')
        if r.get('published') is not None:
            yDict['identification']['dates']['publication'] = r.get('published')
        if r.get('revised') is not None:
            yDict['identification']['dates']['revision'] = r.get('revised')

        if not yDict.get('identification') or not yDict.get('identification').get('dates'):
            raise Exception('at least one entry in identification.dates is required')

        xml = template.render({"record": yDict})
        id = r.get('recordID')
        name = r.get('title', {}).get(r.get('language'))
        if name:
            name = name.strip().lower().replace(' ', '_')
        filename = f'{name or id}.xml'
        file = open(filename, "w")
        file.write(xml)
        print("Wrote " + file.name)

    except Exception as e:
        # print(e)
        print(traceback.format_exc())
