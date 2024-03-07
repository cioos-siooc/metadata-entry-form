#!/bin/sh

echo "Launching emulator with following firebase.json config file"
cat firebase.json

npm --prefix ./functions install
firebase emulators:start --project=cioos-metadata-form --only=firestore,database,functions,auth