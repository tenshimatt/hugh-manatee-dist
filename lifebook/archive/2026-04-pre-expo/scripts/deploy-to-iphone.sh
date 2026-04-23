#!/bin/bash
set -e

echo "📱 Life Book - Quick Deploy to iPhone 15 Pro"
echo "=========================================="

# Check for iOS App Installer (minimal requirement)
if command -v ios-deploy &> /dev/null; then
    echo "✅ ios-deploy found"
elif command -v ideviceinstaller &> /dev/null; then
    echo "✅ ideviceinstaller found"
else
    echo "📦 Installing deployment tools..."
    # Install ios-deploy without Xcode
    brew install ios-deploy 2>/dev/null || npm install -g ios-deploy 2>/dev/null || {
        echo "Installing libimobiledevice tools..."
        brew install libimobiledevice ideviceinstaller
    }
fi

# Deploy pre-built IPA
echo "🚀 Deploying Life Book to iPhone..."

if [ -f "LifeBook.ipa" ]; then
    # Use ios-deploy or ideviceinstaller
    if command -v ios-deploy &> /dev/null; then
        ios-deploy --bundle LifeBook.ipa --debug --noninteractive
    elif command -v ideviceinstaller &> /dev/null; then
        ideviceinstaller -i LifeBook.ipa
    fi
    echo "✅ Life Book installed on iPhone!"
else
    echo "⚠️  IPA not found. Running build first..."
    ./build-ipa.sh
fi
