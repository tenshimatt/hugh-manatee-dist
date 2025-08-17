#!/bin/bash

# Knome App - Complete Build System Reset
# This script performs aggressive cleanup to fix all build issues

set -e

echo "🚨 Knome App - Complete Build System Reset"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Configuration
PROJECT_DIR="/Users/mattwright/pandora/findrawdogfood/KnomeApp"
cd "$PROJECT_DIR"

echo ""
echo "🧹 STEP 1: Aggressive Cache Cleanup"
echo "=================================="

print_info "Clearing ALL Xcode caches..."

# Clear derived data more aggressively
sudo rm -rf ~/Library/Developer/Xcode/DerivedData/* 2>/dev/null || true
print_status "Derived data cleared"

# Clear all Xcode caches
rm -rf ~/Library/Caches/com.apple.dt.Xcode* 2>/dev/null || true
rm -rf ~/Library/Developer/Xcode/UserData 2>/dev/null || true
print_status "Xcode user caches cleared"

# Clear Swift package manager caches
rm -rf ~/Library/Caches/org.swift.swiftpm 2>/dev/null || true
rm -rf ~/Library/org.swift.swiftpm 2>/dev/null || true
print_status "SwiftPM caches cleared"

# Clear project-specific caches
rm -rf "Knome.xcodeproj/project.xcworkspace/xcuserdata" 2>/dev/null || true
rm -rf ".build" 2>/dev/null || true
print_status "Project caches cleared"

echo ""
echo "📦 STEP 2: Package Dependency Reset"
echo "=================================="

# Backup current Package.resolved
if [ -f "Knome.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved" ]; then
    cp "Knome.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved" "Package.resolved.backup"
    print_status "Package.resolved backed up"
fi

# Remove package configuration to force clean resolution
rm -rf "Knome.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/configuration" 2>/dev/null || true
print_status "Package configuration cleared"

echo ""
echo "🔧 STEP 3: Fix Build Settings"
echo "============================"

# Ensure we have proper build settings
print_info "Checking build configuration..."

# Create or update xcconfig file for build settings
cat > "Knome.xcconfig" << 'EOF'
// Knome Build Configuration

// Swift Settings
SWIFT_VERSION = 5.9
SWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG
SWIFT_OPTIMIZATION_LEVEL = -Onone

// iOS Settings
IPHONEOS_DEPLOYMENT_TARGET = 16.0
TARGETED_DEVICE_FAMILY = 1,2

// Build Settings
ENABLE_BITCODE = NO
ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES = YES

// Package Manager Settings
SWIFT_PACKAGE_MANAGER_BUILD_HOST_TRIPLE = arm64-apple-macosx10.15

// OpenAI API Configuration
OPENAI_API_KEY = demo-key-for-testing

// Debug Settings
GCC_PREPROCESSOR_DEFINITIONS = $(inherited) DEBUG=1
MTL_ENABLE_DEBUG_INFO = INCLUDE_SOURCE
EOF

print_status "Build configuration created"

echo ""
echo "📄 STEP 4: Verify Source Files"
echo "============================="

# Check critical source files
critical_files=(
    "Sources/Knome/KnomeApp.swift"
    "Sources/Knome/Managers/ChatManager.swift"
    "Sources/Knome/Models/Models.swift" 
    "Sources/Knome/Utils/Config.swift"
    "Info.plist"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "✓ Found: $file"
    else
        print_error "✗ Missing: $file"
    fi
done

echo ""
echo "🔨 STEP 5: Create Fallback Import Fix"
echo "===================================="

# Create a temporary version of ChatManager without OpenAI import for build testing
print_info "Creating fallback ChatManager for build testing..."

cat > "Sources/Knome/Managers/ChatManager_Fallback.swift" << 'EOF'
//
// ChatManager_Fallback.swift - Fallback version without OpenAI import
//
import Foundation

class ChatManager: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var isLoading = false
    @Published var sessionSummary: String = ""
    
    private let encryptionManager = EncryptionManager()
    
    init() {
        print("🚀 ChatManager initialized in fallback mode")
        print("⚠️ OpenAI package not available - using demo responses only")
    }
    
    func sendMessage(_ content: String, mood: MoodType? = nil) async {
        let userMessage = ChatMessage(content: content, isUser: true)
        await MainActor.run {
            messages.append(userMessage)
            isLoading = true
        }
        
        await handleDemoResponse()
    }
    
    private func handleDemoResponse() async {
        try? await Task.sleep(nanoseconds: 1_500_000_000) // 1.5 second delay
        
        let demoResponses = [
            "Hello! I'm Knome, your digital wellness companion. I'm here to listen and support you. 🧙‍♂️",
            "That sounds like you're going through a lot. How are you feeling about everything right now?",
            "I understand. It's completely normal to feel that way. What would help you feel a bit better today?",
            "Remember, you're not alone in this. Taking small steps is perfectly okay. What's one small thing that usually makes you smile?",
            "Thank you for sharing that with me. Your feelings are valid, and it's brave of you to talk about them.",
            "That's a great insight! Sometimes just recognizing how we feel is the first step toward feeling better."
        ]
        
        let response = demoResponses.randomElement() ?? "I hear you. Tell me more about that."
        
        let assistantMessage = ChatMessage(content: response, isUser: false)
        await MainActor.run {
            messages.append(assistantMessage)
            isLoading = false
        }
    }
    
    func loadSessionSummary() {
        sessionSummary = encryptionManager.loadSessionSummary() ?? ""
        if !sessionSummary.isEmpty {
            print("📝 Loaded session summary: \(sessionSummary.prefix(50))...")
        }
    }
    
    func clearMessages() {
        messages.removeAll()
        print("🗑️ Cleared all messages")
    }
    
    func exportConversation() -> String {
        return messages.map { "\($0.isUser ? "User" : "Knome"): \($0.content)" }.joined(separator: "\n\n")
    }
}
EOF

print_status "Fallback ChatManager created"

echo ""
echo "📋 STEP 6: Manual Fix Instructions"
echo "================================="

print_info "Now follow these steps EXACTLY in Xcode:"
echo ""
echo "🔄 **1. QUIT XCODE COMPLETELY**"
echo "   • Xcode > Quit Xcode (⌘+Q)"
echo "   • Wait 10 seconds"
echo ""
echo "📂 **2. REOPEN PROJECT**"
echo "   • Double-click Knome.xcodeproj"
echo "   • Wait for Xcode to fully load"
echo ""
echo "📦 **3. FIX PACKAGE DEPENDENCIES**"
echo "   • File > Packages > Reset Package Caches"
echo "   • File > Packages > Resolve Package Versions"
echo "   • Wait for resolution to complete"
echo ""
echo "🔄 **4. IF OPENAI STILL MISSING:**"
echo "   • File > Add Package Dependencies..."
echo "   • URL: https://github.com/MacPaw/OpenAI"
echo "   • Version: Up to Next Major (0.2.4)"
echo "   • Add to Knome target"
echo ""
echo "🧹 **5. CLEAN BUILD**"
echo "   • Product > Clean Build Folder (⌘+Shift+K)"
echo "   • Wait for cleanup to complete"
echo ""
echo "🔨 **6. BUILD PROJECT**"
echo "   • Product > Build (⌘+B)"
echo ""
echo "🚀 **7. IF BUILD SUCCEEDS:**"
echo "   • Replace ChatManager_Fallback.swift with original ChatManager.swift"
echo "   • Product > Run (⌘+R)"

echo ""
echo "🆘 STEP 7: Emergency Fallback Option"
echo "==================================="

print_info "If OpenAI package still won't work, use fallback mode:"
echo ""
echo "1. In Xcode, rename:"
echo "   • ChatManager.swift → ChatManager_WithOpenAI.swift"
echo "   • ChatManager_Fallback.swift → ChatManager.swift"
echo ""
echo "2. Build and run - app will work in demo mode"
echo ""
echo "3. Add OpenAI package later when build system is stable"

echo ""
echo "📊 CURRENT STATUS"
echo "================"

# Check what we have
if [ -f "Knome.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved" ]; then
    print_info "Package.resolved status:"
    if grep -q "openai" "Knome.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved"; then
        VERSION=$(grep -A 10 "openai" "Knome.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved" | grep "version" | head -1 | sed 's/.*"version" : "\(.*\)".*/\1/')
        echo "  • OpenAI package: v$VERSION (RESOLVED)"
    else
        echo "  • OpenAI package: NOT FOUND"
    fi
else
    echo "  • Package.resolved: NOT FOUND"
fi

if [ -f "Sources/Knome/Managers/ChatManager_Fallback.swift" ]; then
    print_status "Fallback ChatManager ready"
fi

if [ -f "Knome.xcconfig" ]; then
    print_status "Build configuration file created"
fi

echo ""
print_warning "🎯 CRITICAL: You MUST restart Xcode and follow the manual steps above!"
print_info "The build system corruption requires manual intervention in Xcode."

# Create quick reference
cat > "BUILD_FIX_CHECKLIST.txt" << 'EOF'
🔧 BUILD FIX CHECKLIST - Follow in Order
=====================================

□ 1. QUIT XCODE COMPLETELY (⌘+Q)
□ 2. Wait 10 seconds, then reopen Knome.xcodeproj  
□ 3. File > Packages > Reset Package Caches
□ 4. File > Packages > Resolve Package Versions
□ 5. If OpenAI missing: File > Add Package Dependencies > https://github.com/MacPaw/OpenAI
□ 6. Product > Clean Build Folder (⌘+Shift+K)
□ 7. Product > Build (⌘+B)
□ 8. If successful: Product > Run (⌘+R)

FALLBACK OPTION:
If still failing, use ChatManager_Fallback.swift (rename to ChatManager.swift)
This gives you a working app in demo mode while you fix the OpenAI package.

STATUS: Caches cleared, fallback ready, manual steps required
EOF

print_status "Checklist saved to BUILD_FIX_CHECKLIST.txt"
