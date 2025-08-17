#!/bin/bash

echo "🧙‍♂️ Knome iOS App - Quick Setup"
echo "================================"

# Check if we're in the right directory
if [ ! -f "project.yml" ]; then
    echo "❌ Error: project.yml not found. Are you in the KnomeApp directory?"
    exit 1
fi

echo "✅ Found project configuration"

# Check if xcodegen is installed
if ! command -v xcodegen &> /dev/null; then
    echo "📦 Installing xcodegen..."
    brew install xcodegen
fi

echo "✅ xcodegen is ready"

# Check environment variables
echo "🔍 Checking environment setup..."

if [ -f ".env" ]; then
    source .env
    echo "✅ Found .env file"
else
    echo "❌ .env file not found"
fi

if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "sk-your-openai-key-here" ]; then
    echo "⚠️  Please edit .env file with your OpenAI API key"
    echo "   Get one at: https://platform.openai.com/api-keys"
fi

if [ -z "$TEAM_ID" ] || [ "$TEAM_ID" = "YOUR_APPLE_TEAM_ID" ]; then
    echo "⚠️  Please edit .env file with your Apple Team ID"
    echo "   Find it at: https://developer.apple.com/account/#!/membership/"
fi

# Create Xcode project
echo "🏗️ Generating Xcode project..."
xcodegen generate

if [ $? -eq 0 ]; then
    echo "✅ Xcode project generated successfully!"
    echo ""
    echo "📱 Next steps:"
    echo "1. Edit .env with your actual API keys"
    echo "2. Open Knome.xcodeproj in Xcode"
    echo "3. Set up your development team in project settings"
    echo "4. Build and run on device/simulator"
    echo ""
    echo "🚀 For TestFlight deployment:"
    echo "   fastlane beta"
    echo ""
    echo "💡 For help: Run ./troubleshoot.sh"
else
    echo "❌ Failed to generate Xcode project"
    echo "💡 Run: brew install xcodegen"
fi
