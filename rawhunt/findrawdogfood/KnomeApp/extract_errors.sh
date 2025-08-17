#!/bin/bash

echo "🔧 XCODE BUILD ERROR EXTRACTOR"
echo "==============================="
echo ""

cd /Users/mattwright/pandora/findrawdogfood/KnomeApp

echo "Building Knome project to capture all errors..."
echo ""

# Try to build using xcodebuild to get text output
if [ -f "Knome.xcodeproj/project.pbxproj" ]; then
    echo "Using xcodebuild to capture error text..."
    xcodebuild -project Knome.xcodeproj -scheme Knome -destination 'platform=iOS Simulator,name=iPhone 15' build 2>&1 | tee build_errors.txt
    
    echo ""
    echo "✅ Build output saved to: build_errors.txt"
    echo "📋 Copy and paste the errors from this file!"
    
    # Try to open the file
    open -a TextEdit build_errors.txt
    
else
    echo "❌ Knome.xcodeproj not found"
    echo "💡 Use the manual Xcode copy method instead"
fi

echo ""
echo "🎯 ALTERNATIVE: Manual Copy from Xcode"
echo "1. Issues Navigator (⚠️ triangle in left panel)"
echo "2. Right-click errors → Copy"
echo "3. Paste in chat for quick fixes!"
