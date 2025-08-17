#!/bin/bash

echo "🔧 Fixing Knome build errors..."
echo "================================"

cd /Users/mattwright/pandora/findrawdogfood/KnomeApp

echo "1️⃣ Regenerating Xcode project without OpenAI dependency..."

# Check if xcodegen is installed
if command -v xcodegen >/dev/null 2>&1; then
    echo "✅ XcodeGen found, regenerating project..."
    xcodegen generate
    
    if [ $? -eq 0 ]; then
        echo "✅ Project regenerated successfully!"
        echo ""
        echo "2️⃣ Opening updated Xcode project..."
        open Knome.xcodeproj
        echo ""
        echo "🎯 FIXES APPLIED:"
        echo "   ❌ Removed OpenAI dependency"
        echo "   ✅ VoiceManager now in scope"
        echo "   ✅ All voice features ready"
        echo ""
        echo "📱 Next steps in Xcode:"
        echo "   1. Select iPhone simulator"
        echo "   2. Build & Run (⌘+R)"
        echo "   3. Test voice chat with mic button!"
        echo ""
        echo "🎙️ Voice features ready to test! 🎉"
    else
        echo "❌ XcodeGen failed. Manual fix needed."
    fi
else
    echo "❌ XcodeGen not found. Installing..."
    
    # Try to install xcodegen via brew
    if command -v brew >/dev/null 2>&1; then
        echo "📦 Installing XcodeGen via Homebrew..."
        brew install xcodegen
        
        if [ $? -eq 0 ]; then
            echo "✅ XcodeGen installed! Regenerating project..."
            xcodegen generate
            open Knome.xcodeproj
        else
            echo "❌ Failed to install XcodeGen via brew"
        fi
    else
        echo "❌ Homebrew not found. Manual project fix needed."
        echo ""
        echo "🔧 MANUAL FIX INSTRUCTIONS:"
        echo "1. Open Knome.xcodeproj in Xcode"
        echo "2. Right-click on Knome folder in navigator"
        echo "3. Add Files to Knome..."
        echo "4. Select Sources/Knome/Managers/VoiceManager.swift"
        echo "5. Make sure 'Add to target: Knome' is checked"
        echo "6. Click Add"
        echo "7. Build & Run!"
        echo ""
        echo "Alternatively install XcodeGen:"
        echo "brew install xcodegen"
        echo "Then run: xcodegen generate"
    fi
fi
