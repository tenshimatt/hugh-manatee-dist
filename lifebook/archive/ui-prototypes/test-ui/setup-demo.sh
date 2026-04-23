#!/bin/bash
# Setup script for Lifebook Demo

echo "🚀 Setting up Lifebook Demo..."

cd /Users/mattwright/pandora/lifebook/test-ui

# Create temporary project directory
TEMP_DIR="LifebookDemo"
mkdir -p "$TEMP_DIR"

# Copy all Swift files
echo "📁 Copying Swift files..."
cp LifebookApp/*.swift "$TEMP_DIR/"

# Create basic project structure
mkdir -p "$TEMP_DIR/Assets.xcassets/AppIcon.appiconset"

# Create Info.plist
cat > "$TEMP_DIR/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>UILaunchScreen</key>
    <dict/>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
    </array>
</dict>
</plist>
EOF

echo "✅ Project files ready!"
echo ""
echo "📱 To open in Xcode:"
echo "   1. Open Xcode"
echo "   2. File → New → Project"
echo "   3. Choose 'App' template"
echo "   4. Name: LifebookDemo"
echo "   5. Interface: SwiftUI"
echo "   6. Delete the default ContentView.swift and LifebookDemoApp.swift"
echo "   7. Drag all .swift files from $TEMP_DIR into your project"
echo "   8. Run (⌘R) on iPhone simulator"
echo ""
echo "🎯 Demo features:"
echo "   - Simple onboarding (just enter your name)"
echo "   - Large 200pt record button"
echo "   - Word-by-word highlighting"
echo "   - Senior-friendly UI (18-32pt fonts)"
echo ""
