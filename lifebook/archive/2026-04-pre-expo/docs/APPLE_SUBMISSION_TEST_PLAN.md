# Aurora - Apple Submission Test Plan

**App Name**: Aurora
**Bundle ID**: com.oshun.Aurora
**Target**: Apple App Store via TestFlight
**Test Date**: 2025-10-02
**Platform**: iOS 26.0+

---

## Executive Summary

This test plan ensures Aurora meets all Apple App Store Review Guidelines and functions correctly for end users. All critical user flows must pass before TestFlight submission.

---

## 1. Test Objectives

### Primary Goals
- ✅ Zero crashes during Apple review process
- ✅ All core features functional and tested
- ✅ Permissions properly requested and handled
- ✅ Data persistence works correctly
- ✅ UI/UX accessible for elderly users
- ✅ Memory and performance within acceptable limits

### Success Criteria
- 100% pass rate on critical path tests
- 90%+ pass rate on extended tests
- No blocking bugs
- Test coverage >80% on core managers

---

## 2. Test Scope

### In Scope

#### 2.1 Core Functionality
- App launch and initialization
- Onboarding flow (first-time user experience)
- Audio recording (start, stop, save)
- Speech recognition and transcription
- Core Data persistence (recordings, profile)
- Stories list and detail views
- Family tree progress tracking
- Navigation between all screens

#### 2.2 Permissions & Privacy
- Microphone permission request
- Speech recognition permission request
- Permission denial handling
- Settings redirect functionality

#### 2.3 Data Management
- Recording creation, read, update, delete
- Profile information extraction
- Data migration on app updates
- Large dataset handling (100+ recordings)

#### 2.4 Edge Cases
- Empty states (no recordings, no profile data)
- Interrupted recordings
- Background/foreground transitions
- Low memory conditions
- Airplane mode / no internet

### Out of Scope
- CloudKit sync (future release)
- Multi-device testing (single device for TestFlight)
- Localization (English only for v1.0)
- iPad-specific layouts (iPhone-first release)

---

## 3. Test Environment

### Devices
- **Primary**: iPhone 16 Pro (Physical device)
- **Secondary**: iPhone 17 Simulator (iOS 26.0)

### Test Data Requirements
- 5 sample recordings (varying lengths: 10s, 30s, 1min, 2min, 5min)
- 3 sample profiles (0%, 50%, 100% complete)
- Edge cases: empty transcription, very long transcription (5000+ words)

---

## 4. Test Categories

### 4.1 Unit Tests (AuroraTests/)

**RecordingDataManager Tests**
- ✅ Create recording
- ✅ Fetch all recordings
- ✅ Fetch recording by ID
- ✅ Update recording title/category
- ✅ Delete recording
- ✅ Search recordings by query
- ✅ Statistics calculation (total duration, word count)
- ✅ Core Data model creation

**ProfileChecklistManager Tests**
- ✅ Profile initialization
- ✅ Field completion detection
- ✅ Progress percentage calculation
- ✅ Critical vs optional fields
- ✅ Profile update triggers

**AIEntityExtractor Tests**
- ✅ Name extraction from text
- ✅ Date extraction and parsing
- ✅ Location extraction
- ✅ Relationship extraction (mother, father, spouse)
- ✅ Multiple entity handling
- ✅ Invalid input handling

**AudioRecordingManager Tests** (Mock-based)
- ✅ Recording state management
- ✅ Duration tracking
- ✅ Audio file creation
- ✅ Error handling (permission denied, file write failure)

### 4.2 UI Tests (AuroraUITests/)

**Onboarding Flow**
- ✅ Welcome screen appears on first launch
- ✅ Name input and validation
- ✅ Navigation to home screen after completion
- ✅ Onboarding skipped on subsequent launches

**Recording Workflow**
- ✅ Tap record button starts recording
- ✅ Recording UI shows (red button, timer, pulse animation)
- ✅ Live transcription appears during recording
- ✅ Stop recording shows completion sheet
- ✅ Save recording persists to database
- ✅ Recording appears in "My Stories"

**Stories List & Detail**
- ✅ Empty state shows when no recordings
- ✅ Recordings display with title, date, duration
- ✅ Tap recording opens detail view
- ✅ Detail view shows full transcription
- ✅ Audio playback works
- ✅ Delete recording removes from list

**Family Tree**
- ✅ Progress circle shows correct percentage
- ✅ Completed fields show with green checkmarks
- ✅ Missing fields show grayed out
- ✅ "Suggested Next Story" appears when data missing
- ✅ Tapping suggestion navigates to home
- ✅ "How It Works" shows for first week only

**Navigation**
- ✅ All navigation links work
- ✅ Back buttons return to previous screen
- ✅ No navigation deadlocks

**Permissions**
- ✅ Microphone permission alert appears on first record
- ✅ Permission denial shows alert with Settings link
- ✅ Granting permission allows recording
- ✅ Speech recognition permission handled

### 4.3 Integration Tests

**End-to-End Critical Path**
1. Fresh install → Onboarding → Home
2. Record first story → Transcribe → Save
3. View in "My Stories" → Open detail
4. Check "Family Tree" → Verify progress update
5. Record second story with family info → Verify extraction
6. Check "Family Tree" → Verify new fields completed

**Data Persistence**
- ✅ App termination preserves recordings
- ✅ App background/foreground maintains state
- ✅ Large dataset loads quickly (<2s for 100 recordings)

**Memory & Performance**
- ✅ App memory usage <200MB during normal use
- ✅ No memory leaks during recording
- ✅ Smooth 60fps scrolling in lists

---

## 5. Test Data Generation

### Sample Recordings

**Recording 1: Childhood Memory (Short)**
- Duration: 15 seconds
- Transcription: "I grew up in Boston, Massachusetts. My mother's name was Margaret O'Brien, and my father was John Smith. We lived on Elm Street."
- Expected Extractions:
  - placeOfBirth: "Boston, Massachusetts"
  - motherFullName: "Margaret O'Brien"
  - fatherFullName: "John Smith"

**Recording 2: Wedding Story (Medium)**
- Duration: 45 seconds
- Transcription: "I met my wife Sarah at a dance in 1965. We got married the following year in Chicago. Her maiden name was Sarah Johnson. It was the best day of my life."
- Expected Extractions:
  - spouseName: "Sarah"
  - whereMetSpouse: "dance in 1965"

**Recording 3: Career Story (Long)**
- Duration: 2 minutes
- Transcription: Long-form story about career, no family information
- Expected Extractions: None (testing non-family content)

**Recording 4: Multi-generational (Complex)**
- Duration: 90 seconds
- Transcription: "My full name is Matthew James Wright. I was born on March 15, 1950 in New York City. My mother, Elizabeth Anne Wright, was born in Ireland. My father, Robert Wright, was from England."
- Expected Extractions:
  - fullName: "Matthew James Wright"
  - dateOfBirth: March 15, 1950
  - placeOfBirth: "New York City"
  - motherFullName: "Elizabeth Anne Wright"
  - motherBirthplace: "Ireland"
  - fatherFullName: "Robert Wright"
  - fatherBirthplace: "England"

**Recording 5: Edge Case (Empty)**
- Duration: 3 seconds
- Transcription: "" (silence or unintelligible)
- Expected Behavior: Validation warning, not saved

---

## 6. Bug Severity Levels

### Critical (P0) - Must Fix Before Submission
- App crashes
- Data loss
- Core features completely broken
- Privacy violations

### High (P1) - Should Fix Before Submission
- Major features partially broken
- Confusing UX for target users
- Performance issues affecting usability

### Medium (P2) - Fix If Time Permits
- Minor UI glitches
- Edge cases with workarounds
- Non-critical feature issues

### Low (P3) - Future Release
- Nice-to-have features
- Minor polish items
- Rare edge cases

---

## 7. Test Execution Schedule

### Phase 1: Unit Tests (Tasks 4-7)
- Build test infrastructure
- Write and run unit tests
- Fix critical bugs
- **Duration**: 2-3 hours

### Phase 2: UI Tests (Tasks 8-12)
- Build UI test helpers
- Write and run UI tests
- Fix navigation and interaction bugs
- **Duration**: 3-4 hours

### Phase 3: Integration & E2E (Tasks 13-14)
- Run full test suite
- Debug failures
- Performance testing
- **Duration**: 2-3 hours

### Phase 4: Final Validation (Tasks 15-16)
- Coverage analysis
- Final test run on physical device
- Sign-off for TestFlight submission
- **Duration**: 1 hour

**Total Estimated Time**: 8-11 hours

---

## 8. Apple Review Checklist

### Required for Approval
- [ ] App launches without crashing
- [ ] All advertised features work
- [ ] Permissions properly requested with clear descriptions
- [ ] Privacy policy included (if collecting data)
- [ ] No placeholder content or "lorem ipsum"
- [ ] App metadata matches functionality
- [ ] Screenshots represent actual app
- [ ] No broken links or missing content
- [ ] Accessible for users with disabilities
- [ ] Works offline (where applicable)

### Aurora Specific
- [ ] Microphone permission description clear and accurate
- [ ] Speech recognition permission description clear
- [ ] Recording saves successfully
- [ ] Transcription appears (even if not perfect)
- [ ] Family tree extraction works for basic cases
- [ ] No crashes when permissions denied
- [ ] Handles empty states gracefully
- [ ] All navigation works
- [ ] Large font sizes work for elderly users
- [ ] No memory leaks during extended recording sessions

---

## 9. Success Metrics

### Test Completion
- ✅ All P0 tests pass: 100%
- ✅ All P1 tests pass: >95%
- ✅ All P2 tests pass: >80%
- ✅ Code coverage: >80% on managers

### Performance
- ✅ App launch time: <3 seconds
- ✅ Recording start latency: <1 second
- ✅ List scrolling: 60fps
- ✅ Memory usage: <200MB peak

### User Experience
- ✅ Zero navigation dead-ends
- ✅ All buttons respond to touch
- ✅ Font sizes readable for elderly users
- ✅ Clear error messages for all failures

---

## 10. Known Limitations (Document for Apple Review Notes)

1. **Speech Recognition Accuracy**: Depends on device capabilities and user's speech clarity
2. **AI Entity Extraction**: Best-effort parsing, may not catch all family information
3. **Offline Mode**: Transcription requires internet connection (on-device speech recognition as fallback)
4. **Language Support**: English only in v1.0

---

## 11. Next Steps After Testing

1. ✅ All tests pass → Archive for App Store
2. ✅ Upload to TestFlight
3. ✅ Internal testing with family
4. ✅ Submit for App Review
5. ✅ Address any review feedback
6. ✅ Public release

---

**Test Plan Owner**: Claude Code
**Last Updated**: 2025-10-02
**Status**: Ready for Execution

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->

