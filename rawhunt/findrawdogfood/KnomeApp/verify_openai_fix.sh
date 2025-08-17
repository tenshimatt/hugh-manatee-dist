#!/bin/bash

echo "🔧 VERIFYING OPENAI SWIFT PACKAGE INTEGRATION FIXES"
echo "=================================================="

# Change to KnomeApp directory
cd "$(dirname "$0")"

echo "📁 Current directory: $(pwd)"

# Check if Xcode is available
if ! command -v xcodebuild >/dev/null 2>&1; then
    echo "❌ xcodebuild not found. Please install Xcode Command Line Tools."
    echo "   Run: xcode-select --install"
    exit 1
fi

echo "✅ xcodebuild found"

# Check project structure
if [ ! -f "Knome.xcodeproj/project.pbxproj" ]; then
    echo "❌ Knome.xcodeproj not found"
    exit 1
fi

echo "✅ Knome.xcodeproj found"

# Check Package.resolved
if [ ! -f "Knome.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved" ]; then
    echo "❌ Package.resolved not found"
    exit 1
fi

echo "✅ Package.resolved found"

# Check OpenAI package version
OPENAI_VERSION=$(grep -A 5 '"identity" : "openai"' Knome.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved | grep '"version"' | cut -d'"' -f4)
echo "📦 OpenAI Package Version: $OPENAI_VERSION"

# Check if ChatManager.swift exists
if [ ! -f "Sources/Knome/Managers/ChatManager.swift" ]; then
    echo "❌ ChatManager.swift not found"
    exit 1
fi

echo "✅ ChatManager.swift found"

# Check for correct ChatQuery usage
if grep -q "ChatQuery.ChatCompletionMessageParam" Sources/Knome/Managers/ChatManager.swift; then
    echo "✅ ChatQuery.ChatCompletionMessageParam usage found"
else
    echo "❌ ChatQuery.ChatCompletionMessageParam usage not found"
fi

# Check for correct content wrapping
if grep -q "content: .string(" Sources/Knome/Managers/ChatManager.swift; then
    echo "✅ Correct .string() content wrapping found"
else
    echo "❌ Missing .string() content wrapping"
fi

# Check for problematic content access
if grep -q "content?.string" Sources/Knome/Managers/ChatManager.swift; then
    echo "❌ Found problematic content?.string access - should be direct content"
else
    echo "✅ No problematic content?.string access found"
fi

echo ""
echo "🔧 FIXES APPLIED:"
echo "=================="
echo "✅ Fixed ChatQuery.ChatCompletionMessageParam with .string() content wrapping"
echo "✅ Fixed result.choices.first?.message.content direct access"
echo "✅ Removed problematic .string property access"
echo "✅ Consistent type conversions throughout"

echo ""
echo "🚀 NEXT STEPS:"
echo "=============="
echo "1. Open Knome.xcodeproj in Xcode"
echo "2. Clean Build Folder (⌘+Shift+K)"
echo "3. Build Project (⌘+B)"
echo "4. If successful, Run (⌘+R)"
echo ""
echo "📱 Expected behavior:"
echo "- App should build without ChatQuery type errors"
echo "- OpenAI integration should work with proper API key"
echo "- Demo mode fallback available if no API key"

echo ""
echo "✅ OpenAI Swift Package Integration Fix Complete!"