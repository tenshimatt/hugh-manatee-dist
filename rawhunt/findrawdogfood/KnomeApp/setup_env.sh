#!/bin/bash

echo "🔧 Knome - Quick Environment Setup"
echo "=================================="

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    exit 1
fi

echo "📝 Current .env contents:"
cat .env
echo ""

# Prompt for OpenAI API Key
echo "🔑 OpenAI API Key Setup:"
echo "1. Go to: https://platform.openai.com/api-keys"
echo "2. Create a new API key"
echo "3. Copy the key that starts with 'sk-proj-' or 'sk-'"
echo ""
read -p "Enter your OpenAI API Key: " openai_key

if [ ! -z "$openai_key" ]; then
    # Update the .env file
    sed -i '' "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$openai_key/" .env
    echo "✅ OpenAI API key updated"
fi

echo ""
echo "🍎 Apple Team ID Setup:"
echo "1. Go to: https://developer.apple.com/account/#!/membership/"
echo "2. Sign in with your Apple ID"
echo "3. Copy your Team ID (10-character string)"
echo ""
read -p "Enter your Apple Team ID: " team_id

if [ ! -z "$team_id" ]; then
    # Update the .env file
    sed -i '' "s/TEAM_ID=.*/TEAM_ID=$team_id/" .env
    echo "✅ Apple Team ID updated"
fi

echo ""
echo "📝 Updated .env contents:"
cat .env
echo ""

# Source the .env file
echo "🔄 Loading environment variables..."
export $(cat .env | xargs)

echo "🏗️ Generating Xcode project..."
xcodegen generate

if [ $? -eq 0 ]; then
    echo "✅ SUCCESS! Xcode project generated!"
    echo ""
    echo "🚀 Next steps:"
    echo "1. Open Knome.xcodeproj in Xcode"
    echo "2. Select your development team in project settings"
    echo "3. Build and run on device or simulator"
    echo ""
    echo "📱 To open Xcode now:"
    echo "   open Knome.xcodeproj"
else
    echo "❌ Failed to generate project. Check the errors above."
fi
