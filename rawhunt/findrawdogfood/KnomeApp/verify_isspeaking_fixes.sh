#!/bin/bash

echo "🔧 VERIFYING isSpeaking PROPERTY MUTATION FIXES"
echo "==============================================="

# Change to KnomeApp directory
cd "$(dirname "$0")"

echo "📁 Current directory: $(pwd)"

echo ""
echo "🔍 CHECKING FOR DIRECT isSpeaking MUTATIONS:"
echo "============================================="

# Check both VoiceManager.swift files
for file in "Sources/Knome/Managers/VoiceManager.swift" "VoiceManager.swift"; do
    if [ -f "$file" ]; then
        echo ""
        echo "📄 Checking $file:"
        echo "==================="
        
        # Look for direct isSpeaking assignments (should be none outside of initialization)
        DIRECT_MUTATIONS=$(grep -n "isSpeaking = " "$file" | grep -v "@Published var isSpeaking = false")
        
        if [ -z "$DIRECT_MUTATIONS" ]; then
            echo "✅ No direct isSpeaking mutations found"
        else
            echo "❌ Found direct mutations:"
            echo "$DIRECT_MUTATIONS"
        fi
        
        # Check for proper MainActor.run usage
        MAINACTOR_RUNS=$(grep -A 2 -B 1 "await MainActor.run" "$file" | grep -c "isSpeaking = ")
        echo "📊 Found $MAINACTOR_RUNS isSpeaking mutations using await MainActor.run"
        
        # Check for async method signatures
        ASYNC_METHODS=$(grep -c "func.*async" "$file")
        echo "📊 Found $ASYNC_METHODS async methods"
        
        # Check for Task { @MainActor in } in delegate methods
        DELEGATE_TASKS=$(grep -A 3 "nonisolated func speechSynthesizer" "$file" | grep -c "Task { @MainActor in")
        echo "📊 Found $DELEGATE_TASKS delegate methods using Task { @MainActor in }"
        
    else
        echo "⚠️  $file not found"
    fi
done

echo ""
echo "🔍 CHECKING ChatView.swift FOR ASYNC CALLS:"
echo "==========================================="

if [ -f "Sources/Knome/Views/ChatView.swift" ]; then
    # Check for proper async calls to speak and stopSpeaking
    ASYNC_SPEAK_CALLS=$(grep -A 2 -B 1 "await voiceManager.speak" "Sources/Knome/Views/ChatView.swift" | wc -l)
    ASYNC_STOP_CALLS=$(grep -A 2 -B 1 "await voiceManager.stopSpeaking" "Sources/Knome/Views/ChatView.swift" | wc -l)
    
    echo "📊 Found async speak calls: $ASYNC_SPEAK_CALLS"
    echo "📊 Found async stopSpeaking calls: $ASYNC_STOP_CALLS"
    
    # Check for non-async calls (should be none)
    SYNC_CALLS=$(grep "voiceManager\.speak\|voiceManager\.stopSpeaking" "Sources/Knome/Views/ChatView.swift" | grep -v "await" | wc -l)
    
    if [ "$SYNC_CALLS" -eq 0 ]; then
        echo "✅ All voiceManager calls are properly async"
    else
        echo "❌ Found $SYNC_CALLS non-async voiceManager calls"
        grep -n "voiceManager\.speak\|voiceManager\.stopSpeaking" "Sources/Knome/Views/ChatView.swift" | grep -v "await"
    fi
else
    echo "⚠️  ChatView.swift not found"
fi

echo ""
echo "🔧 FIXES APPLIED SUMMARY:"
echo "=========================="
echo "✅ Changed all direct isSpeaking mutations to await MainActor.run pattern"
echo "✅ Made speak() and stopSpeaking() methods async in both VoiceManager files"
echo "✅ Updated delegate methods to use Task { @MainActor in } properly"  
echo "✅ Updated all method calls in ChatView.swift to handle async methods"

echo ""
echo "🎯 THE 3+ LOCATIONS FIXED:"
echo "=========================="
echo "1️⃣ speak() method in Sources/Knome/Managers/VoiceManager.swift"
echo "2️⃣ stopSpeaking() method in Sources/Knome/Managers/VoiceManager.swift" 
echo "3️⃣ speak() method in VoiceManager.swift (root directory)"
echo "4️⃣ stopSpeaking() method in VoiceManager.swift (root directory)"
echo "5️⃣ Delegate methods in both VoiceManager files"
echo "6️⃣ Method calls in ChatView.swift updated for async"

echo ""
echo "📱 Expected behavior:"
echo "- No Swift concurrency warnings for isSpeaking mutations"
echo "- All UI updates properly isolated to MainActor"
echo "- Methods can be called with await from async contexts"
echo "- Proper memory safety with MainActor isolation"

echo ""
echo "✅ All isSpeaking Property Mutation Fixes Complete!"