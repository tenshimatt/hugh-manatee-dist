# Regression Test Documentation: Bugs 18-24

**Date:** 2025-10-02
**Build ID:** epqfraejcnnkljdjvzfnshzddiae
**Branch:** 003-create-a-comprehensive
**iOS Version:** 15.0+
**Target Device:** iPhone 16 Pro

## Summary of Changes

This regression test document covers Bugs 18-24, which include UI improvements, theme system implementation, and story editing interface updates.

---

## Bug 18: Reduce Home Screen Top Space

**File Modified:** `MemoirGuide/Views/AccessibleRecordingView.swift`

**Change:**
- Line 66-67: Changed top spacing from 15% to 10%
- From: `UIScreen.main.bounds.height * 0.15`
- To: `UIScreen.main.bounds.height * 0.10`

**Test Case 18.1 - Visual Spacing**
1. Launch app on iPhone 16 Pro
2. Navigate to recording screen
3. Verify: Space above AI prompt section is visually smaller than before
4. Expected: ~10% of screen height above main content area

**Test Case 18.2 - Large Text Accessibility**
1. Enable iOS Large Text (Settings > Display & Brightness > Text Size)
2. Launch app
3. Verify: Spacing still appropriate with larger text
4. Expected: Content remains readable, no overlap

---

## Bug 19: Modern Next.js-Style Interface

**Files Modified:**
- `MemoirGuide/AppState.swift` (lines 20-224)
- `MemoirGuide/Views/AccessibleRecordingView.swift` (extensive styling updates)
- `MemoirGuide/MemoirGuideApp.swift` (theme integration)

**Changes:**
- Added 5-theme color palette system
- Implemented gradient backgrounds
- Added shadow effects with theme colors
- Gradient button styling
- Themed card components

**Test Case 19.1 - Theme Colors Display**
1. Launch app
2. Verify: Default theme (Forest Green) displays with:
   - Gradient background (light warm tones)
   - Green primary buttons
   - Subtle shadow effects on cards
3. Expected: Modern, colorful interface with clean lines

**Test Case 19.2 - Button Styling**
1. Navigate to recording screen
2. Tap microphone button
3. Verify: Button has gradient fill, shadow effect, spring animation
4. Expected: Smooth animation, clear visual feedback

**Test Case 19.3 - Card Styling**
1. View AI prompt section
2. Verify: White background card with gradient stroke, rounded corners
3. Expected: Clean, modern card appearance with subtle depth

**Test Case 19.4 - Help Popup**
1. Tap Help button (question mark icon)
2. Verify: Popup uses theme colors, gradient background
3. Expected: Themed popup matching current color scheme

---

## Bug 20: Circular Theme Switcher

**Files Modified:**
- `MemoirGuide/AppState.swift` (ThemeManager implementation)
- `MemoirGuide/Views/AccessibleRecordingView.swift` (ThemeSwitcherButton)

**Changes:**
- Added ThemeManager with 5 color palettes:
  1. Forest Green (warm, earthy)
  2. Ocean Blue (cool, professional)
  3. Sunset Purple (creative, modern)
  4. Slate Gray (minimal, elegant)
  5. Autumn Warmth (cozy, inviting)
- Circular button in top-right corner
- Infinite cycling (tap 6 times to return to start)

**Test Case 20.1 - Theme Switcher Visibility**
1. Launch app on recording screen
2. Verify: Circular button visible in top-right corner
3. Expected: 60x60pt circular button with current theme color

**Test Case 20.2 - Theme Cycling**
1. Tap theme switcher button
2. Verify: Interface changes to Ocean Blue theme
3. Tap again → Sunset Purple
4. Tap again → Slate Gray
5. Tap again → Autumn Warmth
6. Tap again → Forest Green (back to start)
7. Expected: Smooth color transitions, all UI elements update

**Test Case 20.3 - Haptic Feedback**
1. Tap theme switcher with volume down
2. Verify: Tactile feedback on each tap
3. Expected: Medium impact haptic

**Test Case 20.4 - VoiceOver Accessibility**
1. Enable VoiceOver (triple-click side button)
2. Focus on theme switcher
3. Tap to activate
4. Verify: VoiceOver announces "Theme changed to [Theme Name]"
5. Expected: Clear audio feedback for each theme

**Test Case 20.5 - Theme Persistence**
1. Change to Ocean Blue theme
2. Force quit app (swipe up from app switcher)
3. Relaunch app
4. Verify: Ocean Blue theme still active
5. Expected: Theme persists via UserDefaults

---

## Bug 21: "Something's Missing, Fix It" Button

**Files Modified:**
- `MemoirGuide/Views/StoryAssignmentView.swift` (lines 159-222)
- `MemoirGuide/Managers/AIStoryGenerator.swift` (lines 42-125)

**Changes:**
- Added new button with detail preservation AI prompt
- Emphasis on maintaining ALL detail, no summarization
- Fix spelling/grammar only
- Add bracketed historical/factual references

**Test Case 21.1 - Button Display**
1. Complete a recording
2. Navigate to story assignment screen
3. Verify: Orange "Something's missing, Fix it" button visible
4. Expected: Button width 85% of screen, 80pt height, icon on right (48pt)

**Test Case 21.2 - Detail Preservation**
1. Record: "I lived in Rhodesia in 1975. We had a small farm with chickens and goats."
2. Wait for AI story generation
3. Tap "Something's missing, Fix it"
4. Verify AI response:
   - Maintains "Rhodesia" reference
   - May add: "Rhodesia [historically known as Zimbabwe]"
   - Keeps all details about farm, chickens, goats
   - Fixes spelling/grammar only
5. Expected: NO summarization, ALL details preserved

**Test Case 21.3 - Bracketed References**
1. Record: "It was 1985 when we moved to Berlin"
2. Generate story
3. Tap detail preservation button
4. Verify: AI may add historical context in brackets if factually relevant
5. Expected: "[historical context]" appears where appropriate

**Test Case 21.4 - Haptic Feedback**
1. Tap "Something's missing, Fix it"
2. Verify: Medium haptic feedback
3. Expected: Tactile response on tap

**Test Case 21.5 - Loading State**
1. Tap "Something's missing, Fix it"
2. Verify: Button disabled during generation
3. Verify: Progress indicator shown
4. Expected: Clear loading state, button re-enables when complete

---

## Bug 22: "Forget This and Start Fresh" Button

**Files Modified:**
- `MemoirGuide/Views/StoryAssignmentView.swift` (lines 192-221)

**Changes:**
- Changed "Redo" text to "Forget this and Start Fresh"
- Regenerates story completely from original transcription

**Test Case 22.1 - Button Text**
1. Navigate to story assignment screen
2. Verify: Blue button reads "Forget this and Start Fresh"
3. Expected: Multi-line text, left-aligned, icon on right

**Test Case 22.2 - Fresh Regeneration**
1. Generate initial story
2. Tap "Something's missing, Fix it" (creates version 2)
3. Tap "Forget this and Start Fresh"
4. Verify: New story generated (version 3)
5. Verify: Story may differ from versions 1 and 2
6. Expected: Fresh AI generation, not a redo of previous version

**Test Case 22.3 - Icon Display**
1. View "Forget this and Start Fresh" button
2. Verify: Circular arrow icon on right side, 48pt size
3. Expected: Icon aligned right, consistent with other buttons

---

## Bug 23: Delete Undo Button

**Files Modified:**
- `MemoirGuide/Views/StoryAssignmentView.swift`

**Changes:**
- Removed undo button completely (was lines 163-183)
- Removed undo functionality from StoryVersionHistory

**Test Case 23.1 - Undo Button Removed**
1. Navigate to story assignment screen
2. Verify: Only 2 buttons visible:
   - "Something's missing, Fix it"
   - "Forget this and Start Fresh"
3. Verify: NO undo button present
4. Expected: Clean 2-button interface

**Test Case 23.2 - No Undo Functionality**
1. Generate initial story
2. Tap "Forget this and Start Fresh"
3. Verify: No way to undo/go back to previous version
4. Expected: Forward-only workflow

---

## Bug 24: Icons on Right Side, 48pt Size

**Files Modified:**
- `MemoirGuide/Views/StoryAssignmentView.swift`

**Changes:**
- Changed button layout from VStack (icon top, text bottom) to HStack (text left, icon right)
- Set icon size to 48pt
- Button width: 85% of screen
- Button height: 80pt

**Test Case 24.1 - Icon Position**
1. Navigate to story assignment screen
2. Verify both buttons:
   - "Something's missing, Fix it" - wand.and.stars icon on right
   - "Forget this and Start Fresh" - arrow.counterclockwise icon on right
3. Expected: Icons right-aligned, 48pt size

**Test Case 24.2 - Button Layout**
1. View story edit buttons
2. Verify: Text left-aligned, Spacer in middle, Icon right-aligned
3. Expected: Balanced layout with space between text and icon

**Test Case 24.3 - Touch Target**
1. Tap buttons on far right (icon area)
2. Tap buttons on left (text area)
3. Verify: Both taps activate button
4. Expected: Full button width is tappable

**Test Case 24.4 - Multi-line Text**
1. View "Something's missing, Fix it" button
2. Verify: Text wraps to multiple lines if needed
3. Verify: Icon remains right-aligned at vertical center
4. Expected: Clean multi-line layout

---

## Cross-Feature Integration Tests

**Test Case INT.1 - Theme Changes During Story Edit**
1. Generate a story
2. Navigate to story assignment screen
3. Change theme from Forest Green to Ocean Blue
4. Verify: Button colors update to match new theme
5. Expected: All UI elements reflect new theme

**Test Case INT.2 - Accessibility with Themes**
1. Enable VoiceOver
2. Change theme to Sunset Purple
3. Navigate story assignment screen
4. Verify: VoiceOver announces button labels correctly
5. Expected: Theme doesn't interfere with accessibility

**Test Case INT.3 - Large Text with New Buttons**
1. Enable Large Text (Settings > Accessibility > Display)
2. Navigate to story assignment screen
3. Verify: Button text scales appropriately
4. Verify: Icons remain 48pt (don't scale)
5. Expected: Readable text, consistent icon sizes

**Test Case INT.4 - Detail Preservation Across Themes**
1. Record a sample memory
2. Change to Slate Gray theme
3. Generate story with "Something's missing, Fix it"
4. Verify: Detail preservation works regardless of theme
5. Expected: AI behavior unaffected by UI theme

---

## Performance Tests

**Test Case PERF.1 - Theme Switch Performance**
1. Tap theme switcher rapidly 10 times
2. Verify: UI updates smoothly, no lag
3. Expected: <100ms per theme change

**Test Case PERF.2 - Detail Preservation Response Time**
1. Record 2-minute story
2. Tap "Something's missing, Fix it"
3. Measure time to completion
4. Expected: ~5-15 seconds depending on transcription length

**Test Case PERF.3 - Fresh Regeneration Speed**
1. Tap "Forget this and Start Fresh"
2. Measure response time
3. Expected: Similar to initial generation (~5-15 seconds)

---

## Known Issues / Limitations

1. **Threading Warnings (Deferred):**
   - Swift 6 warnings about @MainActor static properties
   - Non-blocking, will be addressed in future Swift 6 migration
   - Files affected: RecordingManager.swift, CoreDataManager.swift

2. **Theme System Limitations:**
   - Themes only affect main recording and story assignment screens
   - Library view and reader not yet themed (future enhancement)

3. **Detail Preservation:**
   - AI model may occasionally still condense despite instructions
   - Bracketed references depend on AI's knowledge base accuracy

---

## Regression Prevention Checklist

Before merging changes:
- [ ] All 24 test cases executed on physical iPhone 16 Pro
- [ ] VoiceOver testing completed
- [ ] Large Text accessibility verified
- [ ] Theme persistence confirmed
- [ ] Detail preservation AI prompt validated with 5+ sample recordings
- [ ] Performance benchmarks met
- [ ] No new compiler errors or blocking warnings
- [ ] Git commit includes all modified files
- [ ] Spec file updated with completion status

---

## Files Changed Summary

**Modified Files (5):**
1. `MemoirGuide/AppState.swift` - Theme system (+204 lines)
2. `MemoirGuide/Views/AccessibleRecordingView.swift` - Modern UI, theme switcher
3. `MemoirGuide/Views/LibraryView.swift` - Fixed unused variable warning
4. `MemoirGuide/Views/StoryAssignmentView.swift` - New button layout, detail preservation
5. `MemoirGuide/Managers/AIStoryGenerator.swift` - Detail preservation prompt
6. `MemoirGuide/MemoirGuideApp.swift` - Theme integration

**Test Files Created:**
- `REGRESSION_TESTS_Bugs_18-24.md` (this file)

**Build Status:**
- ✅ Build Succeeded
- Build ID: epqfraejcnnkljdjvzfnshzddiae
- Platform: iOS Simulator (arm64)
- Warnings: 6 non-blocking Swift 6 concurrency warnings

---

## Next Steps

1. Deploy to physical iPhone 16 Pro for real-device testing
2. Execute all regression test cases
3. Validate AI detail preservation with real user stories
4. Update spec file with completion status
5. Create git commit with unique build ID
6. Plan Bug 25+ based on user feedback

---

**End of Regression Test Documentation**

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->

