#!/bin/bash

echo "📱 OPENING XCODE WITH FIX INSTRUCTIONS"
echo "====================================="

# Open Xcode project
open /Users/mattwright/pandora/findrawdogfood/KnomeApp/Knome.xcodeproj

echo ""
echo "🎯 Xcode is opening! Follow these steps:"
echo ""
echo "1️⃣ ADD VOICEMANAGER:"
echo "   • Right-click 'Knome' folder in left panel"
echo "   • 'Add Files to Knome...'"
echo "   • Select: Sources/Knome/Managers/VoiceManager.swift"
echo "   • ✅ Check 'Add to target: Knome'"
echo "   • Click 'Add'"
echo ""
echo "2️⃣ REMOVE OPENAI (if present):"
echo "   • Select 'Knome' project (top level)"
echo "   • Go to 'Package Dependencies' tab"
echo "   • Remove any 'OpenAI' packages"
echo ""
echo "3️⃣ CLEAN & BUILD:"
echo "   • Clean: ⌘+Shift+K"
echo "   • Build & Run: ⌘+R"
echo ""
echo "🎙️ RESULT: Voice chat with mic button ready!"
echo ""
echo "📄 Full instructions: MANUAL_FIX_INSTRUCTIONS.txt"

# Also show the file in Finder for easy access
echo ""
echo "📁 Opening VoiceManager file location..."
open -R /Users/mattwright/pandora/findrawdogfood/KnomeApp/Sources/Knome/Managers/VoiceManager.swift
