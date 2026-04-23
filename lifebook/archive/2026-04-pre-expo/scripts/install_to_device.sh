#!/bin/bash
# Install MemoirGuide to iOS Device
# Usage: ./install_to_device.sh [device_id]

set -e

APP_PATH="/Users/mattwright/Library/Developer/Xcode/DerivedData/MemoirGuide-epqfraejcnnkljdjvzfnshzddiae/Build/Products/Debug-iphoneos/MemoirGuide.app"
BUNDLE_ID="com.tenshimatt.MemoirGuide"

# Device IDs (uncomment the one you want to use or pass as argument)
MATT_16_PRO="22BA81A1-AAED-58FC-A140-8F22A655D668"
LORIEN_IPHONE="7EEA1BEC-EDC7-5CCE-8D04-9A5A2A9F29E0"

# Use provided device ID or default to Matt's iPhone 16 Pro
DEVICE_ID="${1:-$MATT_16_PRO}"

echo "📱 Installing MemoirGuide to device..."
echo "Device ID: $DEVICE_ID"
echo "App Path: $APP_PATH"
echo ""

# Check if app exists
if [ ! -d "$APP_PATH" ]; then
    echo "❌ Error: App not found at $APP_PATH"
    echo "Please build the app first:"
    echo "  xcodebuild -project MemoirGuide.xcodeproj -scheme MemoirGuide -configuration Debug -sdk iphoneos build"
    exit 1
fi

# Install app
echo "📦 Installing app..."
xcrun devicectl device install app --device "$DEVICE_ID" "$APP_PATH"

if [ $? -eq 0 ]; then
    echo "✅ App installed successfully!"
    echo ""
    echo "🚀 Launching app..."
    xcrun devicectl device process launch --device "$DEVICE_ID" "$BUNDLE_ID" || true

    echo ""
    echo "✅ Installation complete!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Grant microphone permission when prompted"
    echo "2. Grant speech recognition permission when prompted"
    echo "3. Hugh will greet you automatically"
    echo "4. Start speaking naturally - continuous recording is active!"
    echo ""
    echo "📖 Full testing checklist: see CONTINUOUS_RECORDING_INTEGRATION_REPORT.md"
else
    echo "❌ Installation failed!"
    echo ""
    echo "💡 Troubleshooting:"
    echo "1. Ensure device is connected and unlocked"
    echo "2. Trust this computer on the device if prompted"
    echo "3. Check device list: xcrun devicectl list devices"
    exit 1
fi
