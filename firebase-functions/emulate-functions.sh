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

# Start emulators
firebase emulators:start