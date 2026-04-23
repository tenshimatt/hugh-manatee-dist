#!/bin/bash

echo "🔧 MemoirGuide Build Fix Script"
echo "==============================="

# Check for common issues
echo "1. Checking for undefined AppError cases..."
grep -r "AppError\." . --include="*.swift" | grep -v "case " | head -10

echo ""
echo "2. Checking for missing 'try' keywords..."
grep -r "throw AppError" . --include="*.swift" -A2 -B2 | head -15

echo ""
echo "3. Checking for delegate references..."
grep -r "delegate\?" . --include="*.swift" | head -5

echo ""
echo "4. Checking for Codable initialization issues..."
grep -r "= UUID()" . --include="*.swift" | head -5

echo ""
echo "✅ Common issues check complete!"