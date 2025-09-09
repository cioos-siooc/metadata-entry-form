#!/bin/bash

# Emulator script for both JavaScript and Python Firebase Functions

echo "🔧 Starting Firebase Emulators for both JS and Python functions..."
echo ""
echo "JavaScript Functions: /functions"
echo "Python Functions: /python-functions"
echo ""
echo "Emulator will start on:"
echo "  - Functions: http://localhost:5002"
echo "  - UI: http://localhost:4000"
echo ""

# Start emulators
firebase emulators:start