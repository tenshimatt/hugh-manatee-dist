#!/bin/bash

echo "🔧 Knome Troubleshooting Guide"
echo "================================"

echo "1. Check OpenAI API Key:"
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY not set"
else
    echo "✅ OPENAI_API_KEY is configured"
fi

echo ""
echo "2. Check Project Structure:"
find Sources -name "*.swift" | wc -l | xargs echo "Swift files found:"

echo ""
echo "3. Check Dependencies:"
if command -v xcodegen &> /dev/null; then
    echo "✅ xcodegen installed"
else
    echo "❌ xcodegen not installed - run: brew install xcodegen"
fi

if command -v fastlane &> /dev/null; then
    echo "✅ fastlane installed"
else
    echo "❌ fastlane not installed - run: brew install fastlane"
fi

echo ""
echo "4. Validate Project Configuration:"
if [ -f "project.yml" ]; then
    echo "✅ project.yml found"
else
    echo "❌ project.yml missing"
fi

if [ -f "Info.plist" ]; then
    echo "✅ Info.plist found"
else
    echo "❌ Info.plist missing"
fi

echo ""
echo "5. Test Project Generation:"
xcodegen generate --spec project.yml > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Project generation test passed"
else
    echo "❌ Project generation failed"
fi

echo ""
echo "6. Check File Permissions:"
ls -la *.sh | grep -E "(setup|build|troubleshoot)"

echo ""
echo "📋 File Structure:"
tree -I 'build|.git' -L 3 2>/dev/null || find . -type d -not -path '*/.*' | head -20

echo ""
echo "Done! Check output above for any issues."
