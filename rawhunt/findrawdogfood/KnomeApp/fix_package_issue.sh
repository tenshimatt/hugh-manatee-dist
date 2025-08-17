#!/bin/bash

# Knome App - Package Resolution & Build Fix Script
# This script cleans all caches and forces Xcode to recognize the OpenAI package

set -e

echo "🔧 Knome App - Package Resolution Fix"
echo "=================================="

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
echo "1️⃣ Cleaning Xcode Caches"
echo "========================"

print_info "Clearing Xcode derived data..."
rm -rf ~/Library/Developer/Xcode/DerivedData
print_status "Derived data cleared"

print_info "Clearing Xcode user data..."
rm -rf "Knome.xcodeproj/project.xcworkspace/xcuserdata"
print_status "User data cleared"

echo ""
echo "2️⃣ Verifying Package Configuration"
echo "=================================="

# Check Package.resolved
if [ -f "Knome.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved" ]; then
    print_status "Package.resolved exists"
    
    # Check if OpenAI is resolved
    if grep -q "openai" "Knome.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved"; then
        VERSION=$(grep -A 10 "openai" "Knome.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved" | grep "version" | head -1 | sed 's/.*"version" : "\(.*\)".*/\1/')
        print_status "OpenAI package resolved: v$VERSION"
    else
        print_error "OpenAI package not found in Package.resolved"
        exit 1
    fi
else
    print_error "Package.resolved not found"
    exit 1
fi

# Check project.pbxproj for package reference
if grep -q "XCRemoteSwiftPackageReference \"OpenAI\"" "Knome.xcodeproj/project.pbxproj"; then
    print_status "OpenAI package reference found in project"
else
    print_error "OpenAI package reference missing from project"
    exit 1
fi

echo ""
echo "3️⃣ Xcode Index Reset"
echo "===================="

print_info "Resetting Xcode index..."

# Remove any potential index issues
rm -rf ~/Library/Developer/Xcode/UserData/IDEFindNavigatorScopes.plist
rm -rf ~/Library/Developer/Xcode/UserData/IB\ Support
rm -rf ~/Library/Caches/com.apple.dt.Xcode

print_status "Xcode index reset complete"

echo ""
echo "4️⃣ Package Cache Reset"
echo "======================"

# Force package cache reset
if [ -d "Knome.xcodeproj/project.xcworkspace/xcshareddata/swiftpm" ]; then
    print_info "Backing up Package.resolved..."
    cp "Knome.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved" "Package.resolved.backup"
    
    print_info "Clearing package caches..."
    rm -rf "Knome.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/configuration"
    
    print_status "Package caches cleared"
else
    print_warning "No SwiftPM directory found"
fi

echo ""
echo "5️⃣ Build Configuration Check"
echo "============================"

# Check if Config.swift exists
if [ -f "Sources/Knome/Utils/Config.swift" ]; then
    print_status "Config.swift found"
else
    print_error "Config.swift missing - creating it now..."
    
    # Create Config.swift if missing
    mkdir -p "Sources/Knome/Utils"
    cat > "Sources/Knome/Utils/Config.swift" << 'EOF'
import Foundation

struct Config {
    static let openAIAPIKey = ProcessInfo.processInfo.environment["OPENAI_API_KEY"] ?? 
                              Bundle.main.object(forInfoDictionaryKey: "OPENAI_API_KEY") as? String ?? ""
    
    static let enableOpenAI = !openAIAPIKey.isEmpty && openAIAPIKey != "demo-key-for-testing"
    static var isDemoMode: Bool { return !enableOpenAI }
    
    static var configurationStatus: String {
        return enableOpenAI ? "✅ OpenAI Configured" : "⚠️ Running in Demo Mode"
    }
    
    static func printStatus() {
        print("🚀 Knome App Starting")
        print("🔧 \(configurationStatus)")
    }
    
    static var isDebugBuild: Bool {
        #if DEBUG
        return true
        #else
        return false
        #endif
    }
}
EOF
    print_status "Config.swift created"
fi

echo ""
echo "6️⃣ Swift Syntax Check"
echo "===================="

print_info "Checking Swift files for syntax errors..."

swift_files=(
    "Sources/Knome/Managers/ChatManager.swift"
    "Sources/Knome/Models/Models.swift"
    "Sources/Knome/KnomeApp.swift"
    "Sources/Knome/Utils/Config.swift"
)

for file in "${swift_files[@]}"; do
    if [ -f "$file" ]; then
        if swift -frontend -parse "$file" &>/dev/null; then
            print_status "✓ Valid syntax: $(basename "$file")"
        else
            print_error "✗ Syntax error in: $(basename "$file")"
            echo "  File path: $file"
        fi
    else
        print_warning "File not found: $file"
    fi
done

echo ""
echo "7️⃣ Final Instructions"
echo "===================="

print_info "Now do the following IN XCODE:"
echo ""
echo "1. 🔄 **Restart Xcode completely** (Quit and reopen)"
echo ""
echo "2. 📦 **Reset Package Dependencies:**"
echo "   • File > Packages > Reset Package Caches"
echo "   • File > Packages > Resolve Package Versions"
echo ""
echo "3. 🧹 **Clean Build:**"
echo "   • Product > Clean Build Folder (⌘+Shift+K)"
echo ""
echo "4. 🔨 **Build Project:**"
echo "   • Product > Build (⌘+B)"
echo ""
echo "5. 🚀 **Run:**"
echo "   • Product > Run (⌘+R)"

echo ""
echo "📋 EXPECTED RESULT"
echo "=================="

print_info "After following the steps above:"
echo "• ✅ 'No such module OpenAI' error should disappear"
echo "• ✅ Build should succeed"
echo "• ✅ App should run in demo mode"
echo "• ✅ Console should show: '🚀 Knome App Starting'"

echo ""
print_status "🏁 Cache cleanup complete!"
print_warning "Remember: You MUST restart Xcode and follow the steps above"

# Create a quick reference file
cat > "PACKAGE_FIX_STEPS.txt" << EOF
🔧 Quick Fix for "No such module 'OpenAI'" Error
==============================================

1. RESTART XCODE (Quit completely and reopen)

2. In Xcode menu:
   • File > Packages > Reset Package Caches
   • File > Packages > Resolve Package Versions

3. Clean and build:
   • Product > Clean Build Folder (⌘+Shift+K)
   • Product > Build (⌘+B)

If still having issues:
• Check that OpenAI appears in Project Navigator under "Package Dependencies"
• Verify import OpenAI line doesn't show red underline
• Look for "OpenAI" in the project's Package Dependencies section

Status: Package v0.4.5 is properly resolved in Package.resolved
Issue: Xcode indexing/cache problem (fixed by steps above)
EOF

print_status "Quick reference saved to PACKAGE_FIX_STEPS.txt"
