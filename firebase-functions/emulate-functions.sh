#!/bin/bash

# Emulator script for both JavaScript and Python Firebase Functions


# Install dependencies for JavaScript functions
echo "📦 Installing dependencies for JavaScript functions..."
cd functions
npm install
cd ..
# Install dependencies for Python functions 
echo "🐍 Installing dependencies for Python functions..."
cd python-functions
uv venv venv --clear
uv export --format requirements-txt --no-dev --no-hashes --output-file requirements.txt
source venv/bin/activate
uv pip install -r requirements.txt
cd ..

echo "🔧 Starting Firebase Emulators for both JS and Python functions..."
echo ""
echo "JavaScript Functions: /functions"
echo "Python Functions: /python-functions"
echo ""
echo "Emulator will start on:"
echo "  - Functions: http://localhost:5002"
echo "  - UI: http://localhost:4000"
echo ""
echo "To test UI, start a new terminal, from the base directory, and run:"
echo "  npm run start"
echo ""

# Persist emulator data across restarts
# Override with EMULATOR_DATA_DIR env var if desired
EMULATOR_DATA_DIR=${EMULATOR_DATA_DIR:-.emulator-data}
mkdir -p "$EMULATOR_DATA_DIR"

echo "📁 Using emulator data dir: $EMULATOR_DATA_DIR"
echo "💾 Data will be imported on start and exported on exit"

# Choose which Firebase project namespace the emulator uses
# Defaults to the dev project to match the frontend dev config
EMULATOR_PROJECT=${EMULATOR_PROJECT:-cioos-metadata-form-dev-258dc}
echo "🧭 Using emulator project: $EMULATOR_PROJECT"

# Start emulators with import/export to keep local database state
firebase emulators:start \
	--project="$EMULATOR_PROJECT" \
	--import="$EMULATOR_DATA_DIR" \
	--export-on-exit="$EMULATOR_DATA_DIR"