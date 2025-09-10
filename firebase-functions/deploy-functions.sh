#!/bin/bash

# Deploy script for both JavaScript and Python Firebase Functions

echo "🚀 Deploying Firebase Functions..."

# Deploy JavaScript functions
echo "📦 Deploying JavaScript functions..."
firebase deploy --only functions:js-functions

# Deploy Python functions  
echo "🐍 Deploying Python functions..."
firebase deploy --only functions:py-functions

echo "✅ All functions deployed successfully!"
echo ""
echo "JavaScript Functions:"
echo "  - Available in /functions directory"
echo ""
echo "Python Functions:" 
echo "  - Available in /python-functions directory"
echo "  - convert_metadata: GET endpoint for metadata conversion"