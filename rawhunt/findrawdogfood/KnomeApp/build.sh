#!/bin/bash

set -e

echo "🏗️ Building Knome iOS App"

# Check if required environment variables are set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY not set"
    exit 1
fi

if [ -z "$TEAM_ID" ]; then
    echo "❌ TEAM_ID not set" 
    exit 1
fi

# Create Xcode project
echo "📱 Creating Xcode project..."
xcodegen generate

# Build for device
echo "🔨 Building for device..."
xcodebuild \
    -project Knome.xcodeproj \
    -scheme Knome \
    -configuration Release \
    -destination generic/platform=iOS \
    -archivePath ./build/Knome.xcarchive \
    archive

echo "✅ Build complete!"
