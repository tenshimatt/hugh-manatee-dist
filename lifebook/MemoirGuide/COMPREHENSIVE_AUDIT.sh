#!/bin/bash

echo "🔍 COMPREHENSIVE BUILD AUDIT"
echo "============================"

# 1. Check all Swift files exist and have basic syntax
echo "1. CHECKING SWIFT FILE SYNTAX..."
for file in $(find . -name "*.swift" -type f); do
    echo "   Checking: $file"
    
    # Basic syntax checks
    if ! grep -q "import" "$file"; then
        echo "   ❌ No imports found in $file"
    fi
    
    # Check balanced braces
    open_braces=$(grep -o "{" "$file" | wc -l)
    close_braces=$(grep -o "}" "$file" | wc -l)
    if [ "$open_braces" -ne "$close_braces" ]; then
        echo "   ❌ Unbalanced braces in $file ($open_braces open, $close_braces close)"
    fi
done

echo ""
echo "2. CHECKING TYPE DEFINITIONS VS USAGE..."

# Extract all type definitions
echo "   📋 Types defined:"
grep -r "^struct\|^class\|^enum\|^protocol" . --include="*.swift" | sed 's/.*:/   /' | head -20

echo ""
echo "   🔍 Types used but potentially undefined:"
grep -r ": [A-Z][A-Za-z]*" . --include="*.swift" | grep -v "String\|Int\|Bool\|Date\|URL\|UUID\|Data\|Float\|Double" | sed 's/.*:/   /' | head -10

echo ""
echo "3. CHECKING APPERROR USAGE..."
echo "   📋 AppError cases defined:"
grep -r "case " Models/AppError.swift | sed 's/.*case /   /'

echo ""
echo "   🔍 AppError cases used:"
grep -r "AppError\." . --include="*.swift" | grep -v "case\|enum\|Models/AppError.swift" | sed 's/.*AppError\./   /' | cut -d' ' -f1 | sort -u

echo ""
echo "4. CHECKING IMPORTS CONSISTENCY..."
echo "   📋 Import patterns by file:"
for file in $(find . -name "*.swift" -type f | head -10); do
    echo "   $(basename $file): $(grep import "$file" | wc -l | xargs) imports"
done

echo ""
echo "5. CHECKING PROTOCOL CONFORMANCE..."
grep -r ": .*Codable\|: .*ObservableObject\|: .*Identifiable" . --include="*.swift" | head -5

echo ""
echo "✅ AUDIT COMPLETE"