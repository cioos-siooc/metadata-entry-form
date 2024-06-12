# CIOOS Records Update

This is a basic Flask app to create XML from the metadata form

Requires `key.json` which contains a service account key json
specifically one from [here](https://console.cloud.google.com/iam-admin/serviceaccounts/details/108735728189650899572/keys?authuser=0&hl=en&project=cioos-metadata-form) you can also generate one [here](https://console.firebase.google.com/u/0/project/cioos-metadata-form/settings/serviceaccounts/adminsdk)

Alternatively the same service account key json string can be specified in the FIREBASE_SERVICE_ACCOUNT_KEY environment variable. The app will look for the environment variable first and fall back to the key.json file if ot found.
