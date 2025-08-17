#!/bin/bash

echo "🧙‍♂️ Knome Demo Mode - Generate Project"
echo "====================================="

echo "✅ Using demo credentials for UI testing"
echo "🔑 OpenAI: demo-key-for-testing (will use mock responses)"
echo "🍎 Team ID: DEMO123456 (for project generation only)"
echo ""

echo "🏗️ Generating Xcode project..."
xcodegen generate

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Xcode project generated in demo mode!"
    echo ""
    echo "🎯 What works in demo mode:"
    echo "   ✅ Complete UI navigation"
    echo "   ✅ Chat with mock Knome responses"
    echo "   ✅ Mood selection interface"
    echo "   ✅ Journal functionality (local storage)"
    echo "   ✅ Onboarding flow"
    echo "   ✅ Settings and more screens"
    echo ""
    echo "🚧 What needs real credentials:"
    echo "   ⚠️  OpenAI API calls (currently using mock responses)"
    echo "   ⚠️  StoreKit subscriptions (needs real App Store Connect)"
    echo "   ⚠️  Device deployment (needs real Apple Developer account)"
    echo ""
    echo "🚀 Next steps:"
    echo "1. Open Knome.xcodeproj in Xcode"
    echo "2. Select iPhone simulator"
    echo "3. Build and run (⌘+R)"
    echo "4. Test the complete UI!"
    echo ""
    echo "📱 To open Xcode now:"
    echo "   open Knome.xcodeproj"
    echo ""
    echo "💡 When ready for real deployment:"
    echo "   - Get OpenAI API key: https://platform.openai.com/api-keys"
    echo "   - Get Apple Developer account: https://developer.apple.com"
    echo "   - Run ./setup_env.sh to configure real credentials"
else
    echo "❌ Failed to generate project"
    echo "💡 Make sure xcodegen is installed: brew install xcodegen"
fi
