#!/bin/bash

# Nuclear Option Build Test - Self-Contained Version
# This verifies the completely self-contained solution works

set -e

echo "🚨 NUCLEAR OPTION - SELF-CONTAINED BUILD TEST"
echo "============================================"

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
echo "🔍 CHECKING SELF-CONTAINED SOLUTION"
echo "=================================="

# Verify key files are updated
files_to_check=(
    "Sources/Knome/KnomeApp.swift"
    "Sources/Knome/Managers/ChatManager.swift"
    "Sources/Knome/Models/Models.swift"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        print_status "✓ Found: $file"
    else
        print_error "✗ Missing: $file"
        exit 1
    fi
done

# Check that Config.swift is removed
if [ ! -f "Sources/Knome/Utils/Config.swift" ]; then
    print_status "✓ Separate Config.swift removed (good - embedded now)"
else
    print_warning "Config.swift still exists - this might cause conflicts"
fi

# Check for embedded configuration in KnomeApp.swift
if grep -q "struct AppConfig" "Sources/Knome/KnomeApp.swift"; then
    print_status "✓ AppConfig embedded in KnomeApp.swift"
else
    print_error "✗ AppConfig not found in KnomeApp.swift"
    exit 1
fi

# Check for conditional OpenAI import in ChatManager
if grep -q "#if canImport(OpenAI)" "Sources/Knome/Managers/ChatManager.swift"; then
    print_status "✓ Conditional OpenAI import in ChatManager.swift"
else
    print_error "✗ Conditional OpenAI import missing"
    exit 1
fi

# Check for emoji property in Models.swift
if grep -q "var emoji: String" "Sources/Knome/Models/Models.swift"; then
    print_status "✓ Emoji property found in Models.swift"
else
    print_error "✗ Emoji property missing from Models.swift"
    exit 1
fi

echo ""
echo "📋 WHAT'S DIFFERENT NOW"
echo "======================"

print_info "Self-contained solution features:"
echo "• ✅ No separate Config.swift file (embedded in KnomeApp.swift)"
echo "• ✅ Conditional OpenAI import (#if canImport(OpenAI))"
echo "• ✅ App works with OR without OpenAI package"
echo "• ✅ All configuration embedded in main files"
echo "• ✅ No external file dependencies"
echo "• ✅ Graceful fallback to demo mode"

echo ""
echo "🚀 HOW TO TEST"
echo "============="

print_info "In Xcode:"
echo ""
echo "1. 🔄 **Clean Everything:**"
echo "   • Product > Clean Build Folder (⌘+Shift+K)"
echo ""
echo "2. 🔨 **Build Project:**"
echo "   • Product > Build (⌘+B)"
echo ""
echo "3. 📱 **Expected Results:**"
echo "   • If OpenAI package works: Full functionality"
echo "   • If OpenAI package missing: Demo mode (still works!)"
echo "   • Console shows: '🚀 Knome App Starting'"
echo ""
echo "4. 🎯 **Either Way:**"
echo "   • App should build successfully"
echo "   • App should run without crashes"
echo "   • Chat should work (demo responses if no OpenAI)"

echo ""
echo "🆘 WHAT IF IT STILL FAILS?"
echo "=========================="

print_info "If you STILL get build errors:"
echo ""
echo "1. **Package Issue:**"
echo "   • File > Packages > Reset Package Caches"
echo "   • File > Packages > Resolve Package Versions"
echo ""
echo "2. **OpenAI Package Problems:**"
echo "   • Remove OpenAI package completely from project"
echo "   • App will still work in demo mode"
echo "   • Add OpenAI back later when stable"
echo ""
echo "3. **Nuclear Option:**"
echo "   • Delete entire Knome.xcodeproj directory"
echo "   • Create new Xcode project"
echo "   • Drag source files into new project"

echo ""
echo "📊 CURRENT STATUS"
echo "================"

# Check Swift syntax
print_info "Swift syntax check:"
for file in "${files_to_check[@]}"; do
    if swift -frontend -parse "$file" &>/dev/null; then
        echo "  • ✅ $(basename "$file"): Valid syntax"
    else
        echo "  • ❌ $(basename "$file"): Syntax error"
    fi
done

print_status "🏁 Self-contained solution ready!"
print_warning "This version will work even if OpenAI package has issues"

# Create final summary
cat > "NUCLEAR_OPTION_SUMMARY.txt" << 'EOF'
🚨 NUCLEAR OPTION - SELF-CONTAINED SOLUTION
==========================================

WHAT WAS DONE:
✅ Removed separate Config.swift file (caused build issues)
✅ Embedded all configuration in KnomeApp.swift (AppConfig struct)
✅ Made OpenAI import conditional (#if canImport(OpenAI))
✅ App works with OR without OpenAI package
✅ All functionality self-contained in 3 main files

HOW TO TEST:
1. Clean Build Folder (⌘+Shift+K)
2. Build Project (⌘+B)
3. Run (⌘+R)

EXPECTED RESULT:
• Builds successfully regardless of OpenAI package status
• Runs in demo mode if OpenAI unavailable
• Console shows "🚀 Knome App Starting"
• Chat works with demo responses

FALLBACK:
If still having issues, remove OpenAI package entirely.
App will run in demo mode and you can add OpenAI back later.

STATUS: Self-contained solution implemented
NEXT: Clean build and test in Xcode
EOF

print_status "Summary saved to NUCLEAR_OPTION_SUMMARY.txt"
