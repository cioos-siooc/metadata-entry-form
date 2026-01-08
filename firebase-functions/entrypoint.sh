#!/bin/sh

echo "Launching emulator with following firebase.json config file"
cat firebase.json

npm --prefix ./functions install

# Persist emulator data across restarts
EMULATOR_DATA_DIR=${EMULATOR_DATA_DIR:-.emulator-data}
mkdir -p "$EMULATOR_DATA_DIR"
echo "Using emulator data dir: $EMULATOR_DATA_DIR"

# Choose which Firebase project namespace the emulator uses (defaults to dev)
EMULATOR_PROJECT=${EMULATOR_PROJECT:-cioos-metadata-form-dev-258dc}
echo "Using emulator project: $EMULATOR_PROJECT"

firebase emulators:start \
	--project="$EMULATOR_PROJECT" \
	--only=firestore,database,functions,auth \
	--import="$EMULATOR_DATA_DIR" \
	--export-on-exit="$EMULATOR_DATA_DIR"