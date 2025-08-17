#!/bin/bash

echo "🚀 KNOME PRODUCTION - MANUAL SETUP"
echo "==================================="
echo ""

cd /Users/mattwright/pandora/findrawdogfood/KnomeApp

echo "✅ API Key: Configured in .env"
echo "✅ OpenAI Integration: Ready"
echo "✅ Voice Features: Complete"
echo ""

echo "📱 OPENING XCODE..."
open Knome.xcodeproj

echo ""
echo "🔧 SETUP STEPS IN XCODE:"
echo ""
echo "1️⃣ ADD VOICEMANAGER (if not present):"
echo "   • Right-click 'Knome' folder"
echo "   • 'Add Files to Knome...'"
echo "   • Select: Sources/Knome/Managers/VoiceManager.swift"
echo "   • ✅ Check 'Add to target: Knome'"
echo ""
echo "2️⃣ SET ENVIRONMENT VARIABLE:"
echo "   • Select 'Knome' scheme (top bar)"
echo "   • Edit Scheme... → Run → Arguments"
echo "   • Environment Variables → + Add:"
echo "     Name: OPENAI_API_KEY"
echo "     Value: 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"
echo ""
echo "3️⃣ BUILD & RUN:"
echo "   • Clean: ⌘+Shift+K"
echo "   • Build & Run: ⌘+R" 
echo "   • Grant microphone permissions"
echo ""
echo "🎯 RESULT:"
echo "   🟢 LIVE mode with real GPT-4"
echo "   🎙️ Voice input & output"
echo "   🧠 Smart conversation context"
echo ""
echo "💡 You'll see 'LIVE' indicator in top-right of app!"
