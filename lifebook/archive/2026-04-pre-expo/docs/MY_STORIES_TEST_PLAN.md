# My Stories Feature Test Plan

**Date:** 2025-09-30
**Build Status:** ✅ BUILD SUCCEEDED
**Branch:** 003-create-a-comprehensive
**Deprecated APIs:** ✅ All fixed (0 warnings)

## Overview

This document outlines the test plan for the new My Stories page functionality implemented in Phase 3. All features have been built and compiled successfully.

---

## Components Built

### 1. Theme Color System
**Files:** `MemoirGuide/Utilities/Extensions.swift`

**Implementation:**
- Persian Green (#2a9d8f) - Primary theme
- Saffron (#e9c46a) - Secondary theme
- Sandy Brown (#f4a261) - Interactive accent (play buttons)
- Charcoal (#264653) - Text
- Burnt Sienna (#e76f51) - Accents

### 2. AudioPlaybackManager
**File:** `MemoirGuide/Managers/AudioPlaybackManager.swift` (5.9KB)

**Features:**
- Singleton pattern with @MainActor thread safety
- AVAudioPlayer integration
- Auto-play next segment
- Playback controls (play, pause, seek, skip ±10s)
- Playback rate adjustment (0.5x - 2.0x)
- Volume control
- Timer-based progress tracking (0.1s interval)
- Error handling and loading states

### 3. StoryCard Component
**File:** `MemoirGuide/Views/StoryCard.swift` (5.3KB)

**Features:**
- 160pt height card
- 60pt diameter play button (bottom-right overlay)
- Sandy Brown (#f4a261) play button color
- Currently playing indicator (Persian Green 3pt border)
- Haptic feedback on button press
- Loading spinner during audio load
- Tap card to open detail view
- Tap play button for immediate playback

### 4. StoryDetailView
**File:** `MemoirGuide/Views/StoryDetailView.swift` (11KB)

**Features:**
- Full-screen modal presentation
- Large 100pt centered play button (Persian Green)
- Progress slider with time indicators
- Skip forward/backward buttons (10 seconds)
- Playback speed controls (0.5x, 1.0x, 1.5x, 2.0x)
- Metadata display (recordings, duration, word count, reading time)
- AI summary section (if available)
- Expandable recordings list

### 5. LibraryView Updates
**File:** `MemoirGuide/Views/LibraryView.swift` (modified)

**Features:**
- Persian Green header for Vault section
- Saffron header for My Stories section
- Integration of StoryCard components
- Themed backgrounds (5% opacity)
- Create New Story button (prominent when stories exist)

---

## Test Cases

### TC-001: Theme Colors Verification
**Priority:** High
**Prerequisites:** App launched, My Stories page visible

**Steps:**
1. Open app and navigate to Library view
2. Switch to "My Stories" tab
3. Verify header background is Saffron (#e9c46a)
4. Switch to "Vault" tab
5. Verify header background is Persian Green (#2a9d8f)
6. Check story card play buttons are Sandy Brown (#f4a261)

**Expected Results:**
- ✅ My Stories header: Saffron background with charcoal text
- ✅ Vault header: Persian Green background with white text
- ✅ Play buttons: Sandy Brown color
- ✅ Backgrounds: Light tinted (5% opacity)

---

### TC-002: Story Card Display
**Priority:** High
**Prerequisites:** At least one story exists with recordings

**Steps:**
1. Navigate to My Stories tab
2. Observe story card layout
3. Measure card height (should be 160pt)
4. Verify play button position (bottom-right)
5. Verify play button size (60pt diameter)
6. Check story title (max 2 lines)
7. Check metadata display (recording count, duration)

**Expected Results:**
- ✅ Card height: 160pt
- ✅ Play button: 60pt diameter, bottom-right corner with 12pt padding
- ✅ Title: Max 2 lines, truncates with ellipsis
- ✅ Metadata: Shows "X recording(s)" and duration
- ✅ Shadow: Subtle black shadow (0.1 opacity, 8pt radius)

---

### TC-003: Story Card Play Button - Basic Playback
**Priority:** Critical
**Prerequisites:** Story with audio recordings exists

**Steps:**
1. Navigate to My Stories tab
2. Locate a story card
3. Tap the play button (bottom-right)
4. Observe button state change
5. Verify audio starts playing
6. Check card border appears (Persian Green, 3pt)
7. Tap play button again to pause
8. Verify audio stops and icon changes back

**Expected Results:**
- ✅ Haptic feedback on button press
- ✅ Loading spinner appears briefly during audio load
- ✅ Play icon changes to pause icon
- ✅ Card border turns Persian Green (3pt) when playing
- ✅ Audio starts playing from beginning
- ✅ Pause icon changes back to play icon when paused
- ✅ Border disappears when paused

---

### TC-004: Story Card - Open Detail View
**Priority:** High
**Prerequisites:** Story exists

**Steps:**
1. Navigate to My Stories tab
2. Tap anywhere on story card (NOT the play button)
3. Verify StoryDetailView modal opens
4. Check all detail view elements are present
5. Dismiss modal with swipe down or back button

**Expected Results:**
- ✅ Modal opens with smooth animation
- ✅ Story title displayed at top
- ✅ Large 100pt play button centered
- ✅ Metadata section visible
- ✅ Recordings list present (if any)
- ✅ Close button or swipe-to-dismiss works

---

### TC-005: Story Detail View - Large Play Button
**Priority:** Critical
**Prerequisites:** Story with audio exists

**Steps:**
1. Open story detail view
2. Observe large centered play button (100pt diameter)
3. Verify button color is Persian Green
4. Tap play button
5. Observe button state changes to pause
6. Check progress controls appear below button
7. Tap pause button
8. Verify audio stops

**Expected Results:**
- ✅ Play button: 100pt diameter, Persian Green
- ✅ Shadow effect: Persian Green glow (0.3 opacity, 12pt radius)
- ✅ Icon changes from play to pause
- ✅ Loading spinner during audio load
- ✅ Progress bar appears when playing
- ✅ Skip buttons appear when playing
- ✅ Playback speed controls appear when playing

---

### TC-006: Progress Bar and Seeking
**Priority:** High
**Prerequisites:** Story is playing in detail view

**Steps:**
1. Start playing a story in detail view
2. Observe progress bar updates in real-time
3. Check current time updates (left side)
4. Check total duration displayed (right side)
5. Drag slider to middle of audio
6. Verify audio seeks to that position
7. Check time indicators update

**Expected Results:**
- ✅ Progress bar updates every 0.1 seconds
- ✅ Current time format: "MM:SS"
- ✅ Total duration format: "MM:SS"
- ✅ Slider dragging seeks audio smoothly
- ✅ Time indicators update during seek
- ✅ Slider accent color: Persian Green

---

### TC-007: Skip Forward/Backward
**Priority:** High
**Prerequisites:** Story is playing with >20 seconds duration

**Steps:**
1. Start playing a story in detail view
2. Note current playback position
3. Tap "Skip Forward 10s" button
4. Verify audio jumps ahead 10 seconds
5. Tap "Skip Backward 10s" button
6. Verify audio jumps back 10 seconds
7. Try skipping near end of audio
8. Try skipping near beginning of audio

**Expected Results:**
- ✅ Forward skip: Advances exactly 10 seconds
- ✅ Backward skip: Rewinds exactly 10 seconds
- ✅ Icons: "goforward.10" and "gobackward.10"
- ✅ Skip at end: Stops at maximum duration
- ✅ Skip at start: Stops at 0:00
- ✅ Progress bar reflects skip immediately

---

### TC-008: Playback Speed Controls
**Priority:** Medium
**Prerequisites:** Story is playing in detail view

**Steps:**
1. Start playing a story
2. Observe default speed (1.0x should be bold)
3. Tap "0.5x" button
4. Verify audio slows to half speed
5. Tap "1.5x" button
6. Verify audio speeds up
7. Tap "2.0x" button
8. Verify audio doubles speed
9. Return to "1.0x"

**Expected Results:**
- ✅ Default: 1.0x is bold, others are gray
- ✅ Selected speed is bold and Persian Green
- ✅ Audio playback rate changes immediately
- ✅ 0.5x: Half speed (slower)
- ✅ 1.5x: 1.5x speed
- ✅ 2.0x: Double speed (fastest)
- ✅ Progress bar continues updating correctly

---

### TC-009: Auto-Play Next Segment
**Priority:** High
**Prerequisites:** Story has multiple recordings/segments

**Steps:**
1. Start playing a story with multiple segments
2. Let first segment play to completion
3. Observe if next segment automatically starts
4. Verify playback continues seamlessly
5. Check progress bar resets for new segment
6. Let all segments complete

**Expected Results:**
- ✅ First segment completes
- ✅ Next segment loads automatically
- ✅ No gap between segments (smooth transition)
- ✅ Progress bar resets for new segment
- ✅ Duration updates to new segment length
- ✅ After last segment, playback stops

---

### TC-010: Currently Playing Indicator
**Priority:** Medium
**Prerequisites:** Multiple stories exist

**Steps:**
1. Start playing Story A from card view
2. Verify Story A card has Persian Green border (3pt)
3. Navigate to detail view of Story B (don't play)
4. Verify Story A still shows as playing in card list
5. Start playing Story B in detail view
6. Go back to card list
7. Verify Story B now has green border, Story A doesn't

**Expected Results:**
- ✅ Playing story: Persian Green border (3pt width)
- ✅ Not playing: No border
- ✅ Only one story shows green border at a time
- ✅ Border persists when navigating away
- ✅ Border switches when different story plays

---

### TC-011: Haptic Feedback
**Priority:** Low
**Prerequisites:** Device with haptic feedback support

**Steps:**
1. Navigate to My Stories tab
2. Tap play button on story card
3. Feel for haptic feedback (vibration)
4. Open story detail view
5. Tap large play button
6. Feel for haptic feedback

**Expected Results:**
- ✅ Card play button: Medium impact haptic
- ✅ Detail play button: Medium impact haptic
- ✅ Haptic occurs before audio starts
- ✅ Haptic occurs on pause as well

---

### TC-012: Loading States
**Priority:** Medium
**Prerequisites:** Story with large audio file

**Steps:**
1. Tap play button on story card
2. Observe loading state immediately
3. Wait for audio to load
4. Verify play icon replaces spinner
5. Open story detail view of different story
6. Tap play button
7. Observe large loading spinner

**Expected Results:**
- ✅ Card play button: Circular progress spinner (white)
- ✅ Detail play button: Large circular spinner (white)
- ✅ Spinner animates during load
- ✅ Spinner replaced by play/pause icon when loaded
- ✅ `isLoading` state in AudioPlaybackManager updates
- ✅ No interaction possible while loading

---

### TC-013: Error Handling
**Priority:** High
**Prerequisites:** Story with missing/corrupted audio file

**Steps:**
1. Tap play button on story with missing audio
2. Observe error handling
3. Check if error message displayed
4. Verify app doesn't crash
5. Try playing a working story afterward

**Expected Results:**
- ✅ Error message displayed (e.g., "Audio file not found")
- ✅ Play button remains in play state (not paused)
- ✅ No crash or hang
- ✅ Loading state clears
- ✅ Other stories still playable
- ✅ Error property in AudioPlaybackManager set

---

### TC-014: Empty States
**Priority:** Medium
**Prerequisites:** Fresh install with no stories

**Steps:**
1. Launch app
2. Navigate to My Stories tab
3. Verify empty state display
4. Check for "Create Your First Story" button
5. Tap create button
6. Fill in story title
7. Create story
8. Verify story appears in list

**Expected Results:**
- ✅ Empty state: "No Stories Yet" message
- ✅ Large centered create button (80pt icon)
- ✅ Saffron-themed empty state
- ✅ Create button opens modal
- ✅ New story appears after creation
- ✅ Empty state replaced by story list

---

### TC-015: Story List with Stories
**Priority:** Medium
**Prerequisites:** At least 3 stories exist

**Steps:**
1. Navigate to My Stories tab
2. Verify "Create New Story" button at top
3. Check button styling (lighter, bordered)
4. Scroll through story list
5. Verify all stories visible
6. Check scrolling is smooth

**Expected Results:**
- ✅ Create button at top of list
- ✅ Button: Persian Green text, light background, bordered
- ✅ Story cards stack vertically with 16pt spacing
- ✅ 12pt horizontal padding on cards
- ✅ Smooth scrolling
- ✅ All stories visible

---

### TC-016: Metadata Display (Detail View)
**Priority:** Low
**Prerequisites:** Story with recordings

**Steps:**
1. Open story detail view
2. Verify metadata section exists
3. Check recording count display
4. Check total duration display
5. Check word count display (if available)
6. Check estimated reading time (if available)

**Expected Results:**
- ✅ Metadata section below play controls
- ✅ "X recordings" displayed correctly
- ✅ Total duration formatted as "Xh Xm" or "Xm Xs"
- ✅ Word count shown if > 0
- ✅ Reading time calculated (~150 words/min)
- ✅ Icons for each metadata type

---

### TC-017: Recordings List (Detail View)
**Priority:** Low
**Prerequisites:** Story with multiple recordings

**Steps:**
1. Open story detail view
2. Scroll to recordings section
3. Verify list of recordings
4. Check each recording shows date/time
5. Check each recording shows duration
6. Try tapping a recording

**Expected Results:**
- ✅ Recordings section expandable/collapsible
- ✅ Each recording: Date, time, duration
- ✅ Recordings sorted chronologically
- ✅ Tapping recording starts playback from that segment
- ✅ Current recording highlighted

---

### TC-018: Share Functionality (Fixed)
**Priority:** Medium
**Prerequisites:** Story exists (ReaderView)

**Steps:**
1. Open a story in ReaderView (if implemented)
2. Tap share button
3. Verify modern SwiftUI sheet opens
4. Check UIActivityViewController appears
5. Try sharing to Notes app
6. Verify no deprecated API warnings

**Expected Results:**
- ✅ Share sheet opens via .sheet() modifier
- ✅ UIViewControllerRepresentable wrapper used
- ✅ Story title and content included
- ✅ No crash or deprecation warnings
- ✅ Share completes successfully

---

### TC-019: Audio Session Configuration (Fixed)
**Priority:** Critical
**Prerequisites:** App launch

**Steps:**
1. Launch app
2. Check audio session configuration
3. Connect Bluetooth headphones
4. Verify audio routes to headphones
5. Start recording or playback
6. Verify audio works correctly

**Expected Results:**
- ✅ Audio session uses `.playAndRecord` category
- ✅ Mode set to `.spokenAudio`
- ✅ Options: `.defaultToSpeaker`, `.allowBluetoothA2DP`
- ✅ No deprecated `.allowBluetooth` warning
- ✅ Bluetooth audio works (high quality A2DP)
- ✅ Recording and playback both functional

---

### TC-020: Vault Section Verification
**Priority:** Medium
**Prerequisites:** Recordings exist in vault

**Steps:**
1. Navigate to Library view
2. Switch to "Vault" tab
3. Verify Persian Green header
4. Check vault recordings display
5. Verify segmented control works
6. Switch back to My Stories tab

**Expected Results:**
- ✅ Vault header: Persian Green background, white text
- ✅ "Your Memory Vault" title visible
- ✅ Archive icon present
- ✅ Segmented control switches tabs smoothly
- ✅ Vault recordings shown as SegmentCard components
- ✅ Light Persian Green background (5% opacity)

---

## Performance Tests

### PT-001: Audio Load Time
**Metric:** Audio file should load in < 1 second for typical recording
**Method:** Measure time from play button tap to audio start

### PT-002: UI Responsiveness
**Metric:** Play button should respond within 100ms
**Method:** Tap play button, measure haptic to state change

### PT-003: Progress Bar Updates
**Metric:** Progress bar should update smoothly (60fps)
**Method:** Visual inspection during playback

### PT-004: Memory Usage
**Metric:** Memory should not increase unbounded during playback
**Method:** Monitor memory in Xcode Instruments during extended playback

---

## Regression Tests

### RT-001: Recording Still Works
**Verify:** Recording functionality unchanged after My Stories updates

**Steps:**
1. Go to recording view
2. Tap to start recording
3. Speak for 10 seconds
4. Tap to stop
5. Verify segment saved

**Expected:** ✅ Recording works as before

### RT-002: Vault Still Works
**Verify:** Vault view unchanged except header styling

**Steps:**
1. Navigate to Vault tab
2. Verify segments display
3. Check segment details shown correctly

**Expected:** ✅ Vault functionality intact

### RT-003: App Doesn't Crash
**Verify:** No crashes during normal use

**Steps:**
1. Navigate through all views
2. Create story
3. Record audio
4. Play audio
5. Stop playback mid-recording
6. Delete story (if possible)

**Expected:** ✅ No crashes, freezes, or hangs

---

## Known Limitations

1. **Audio Format:** Currently only supports files recorded by the app
2. **Background Playback:** Not implemented yet (audio stops when app backgrounds)
3. **AirPlay:** Not tested with external speakers
4. **Accessibility:** VoiceOver not fully tested on new components
5. **iPad Layout:** Components designed for iPhone, may need iPad optimization

---

## Build Information

**Xcode Version:** 17A400
**iOS Deployment Target:** 15.0+
**Build Configuration:** Debug-iphonesimulator
**Build Time:** ~45 seconds (clean build)
**Warnings:** 6 Swift 6 concurrency warnings (non-blocking)
**Errors:** 0

**App Location:**
```
/Users/mattwright/Library/Developer/Xcode/DerivedData/MemoirGuide-epqfraejcnnkljdjvzfnshzddiae/Build/Products/Debug-iphonesimulator/MemoirGuide.app
```

---

## Testing Instructions

### Option 1: Xcode Simulator

1. Open `MemoirGuide.xcodeproj` in Xcode
2. Select iPhone simulator (iPhone 14 or newer recommended)
3. Press Cmd+R or click Run button
4. Follow test cases above

### Option 2: Physical Device

1. Connect iPhone via USB
2. Select device in Xcode
3. Trust development certificate if prompted
4. Press Cmd+R to build and run
5. Test with real audio for best results

---

## Reporting Issues

If any test case fails, document:

1. **Test Case ID:** (e.g., TC-003)
2. **Device:** (e.g., iPhone 14 Pro, iOS 17.0 simulator)
3. **Actual Result:** What happened
4. **Steps to Reproduce:** Exact steps taken
5. **Screenshots/Video:** If applicable
6. **Console Output:** Any errors from Xcode console

---

## Sign-Off

- [ ] All critical tests passed (TC-003, TC-005, TC-019)
- [ ] No crashes or freezes encountered
- [ ] Performance meets expectations
- [ ] No regression in existing features
- [ ] Ready for user acceptance testing

**Tested By:** _________________
**Date:** _________________
**Build Version:** _________________

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->

