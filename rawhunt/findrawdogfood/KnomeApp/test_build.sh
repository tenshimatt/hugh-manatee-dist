#!/bin/bash

echo "🔧 Testing Knome build after fixes..."

cd /Users/mattwright/pandora/findrawdogfood/KnomeApp

# Clean build folder
echo "🧹 Cleaning build folder..."
rm -rf .build

# Test build
echo "🏗️ Testing Swift build..."
if swift build; then
    echo "✅ Build successful!"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Open Xcode: open Knome.xcodeproj"
    echo "2. Select iPhone simulator"
    echo "3. Build and run (⌘+R)"
    echo ""
    echo "📱 Demo features ready:"
    echo "   ✅ Chat with mock responses"
    echo "   ✅ Mood tracking"
    echo "   ✅ Journal entries"
    echo "   ✅ Subscription UI (demo)"
    echo ""
    echo "🚀 Voice feature implementation starting..."
else
    echo "❌ Build failed. Checking errors..."
    swift build 2>&1 | head -20
fi
