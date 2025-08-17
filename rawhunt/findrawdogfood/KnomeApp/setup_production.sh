#!/bin/bash

echo "🚀 KNOME PRODUCTION SETUP - OpenAI + Voice"
echo "=========================================="
echo ""

if [ -z "$1" ]; then
    echo "❌ OpenAI API key required!"
    echo ""
    echo "Usage: ./setup_production.sh YOUR_OPENAI_API_KEY"
    echo ""
    echo "Example:"
    echo "  ./setup_production.sh sk-1234567890abcdef..."
    echo ""
    echo "Get your API key from: https://platform.openai.com/api-keys"
    exit 1
fi

OPENAI_KEY="$1"
PROJECT_DIR="/Users/mattwright/pandora/findrawdogfood/KnomeApp"

cd "$PROJECT_DIR"

echo "1️⃣ Setting up OpenAI API key..."

# Create .env file with production key
cat > .env << EOF
# Knome Production Configuration
OPENAI_API_KEY=${OPENAI_KEY}

# App Configuration
APP_NAME=Knome
BUNDLE_ID=com.knome.app
TEAM_ID=DEMO123456

# Development
DEBUG_MODE=false
EOF

echo "✅ .env file created with OpenAI key"

echo ""
echo "2️⃣ Generating production Xcode project..."

# Check for xcodegen
if command -v xcodegen >/dev/null 2>&1; then
    echo "✅ XcodeGen found, generating project..."
    xcodegen generate
    
    if [ $? -eq 0 ]; then
        echo "✅ Production Xcode project generated!"
    else
        echo "❌ XcodeGen failed"
        exit 1
    fi
else
    echo "❌ XcodeGen not found. Installing via Homebrew..."
    
    if command -v brew >/dev/null 2>&1; then
        brew install xcodegen
        xcodegen generate
    else
        echo "❌ Homebrew not found. Please install XcodeGen manually:"
        echo "   https://github.com/yonaskolb/XcodeGen"
        exit 1
    fi
fi

echo ""
echo "3️⃣ Opening production Xcode project..."
open Knome.xcodeproj

echo ""
echo "🎯 PRODUCTION FEATURES READY:"
echo "   ✅ Real OpenAI GPT-4 integration"
echo "   ✅ Voice input (speech-to-text)"
echo "   ✅ Voice output (text-to-speech)" 
echo "   ✅ Smart conversation context"
echo "   ✅ Session memory & summaries"
echo "   ✅ Encrypted local storage"
echo "   ✅ Fallback to demo on API errors"
echo ""

echo "📱 NEXT STEPS IN XCODE:"
echo "   1. Select iPhone simulator"
echo "   2. Build & Run (⌘+R)"
echo "   3. Grant microphone permissions"
echo "   4. Chat with real Knome AI + voice!"
echo ""

echo "💰 USAGE MONITORING:"
echo "   • GPT-4 API costs ~$0.03 per 1K tokens"
echo "   • Voice processing is free (on-device)"
echo "   • Monitor usage at: https://platform.openai.com/usage"
echo ""

echo "🔍 TROUBLESHOOTING:"
echo "   • API errors → Check key validity"
echo "   • Voice issues → Check microphone permissions"
echo "   • Build errors → Clean Build Folder (⌘+Shift+K)"
echo ""

echo "🚀 Knome is now LIVE with OpenAI + Voice! 🎙️✨"
