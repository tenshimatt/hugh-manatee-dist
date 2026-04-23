# Aurora UI Tests Documentation

## Overview
Comprehensive UI test suite for the Aurora iOS app covering onboarding, recording workflow, navigation, and permissions.

## Test File Location
`/Users/mattwright/pandora/lifebook/AuroraUITests/AuroraUITests.swift`

## Test Categories

### 1. Onboarding Tests

#### testOnboardingAppearsOnFirstLaunch
- **Purpose**: Verify welcome screen appears on first launch
- **Steps**:
  1. Reset onboarding state with `--reset-onboarding` launch argument
  2. Launch app
  3. Verify "Welcome to Lifebook" text appears
  4. Verify subtitle and name input field exist
  5. Verify "Let's Begin" button exists but is disabled

#### testOnboardingNameInput
- **Purpose**: Complete onboarding flow with name input
- **Steps**:
  1. Reset and launch app
  2. Tap name input field
  3. Enter "John"
  4. Verify button becomes enabled
  5. Tap "Let's Begin"
  6. Verify home screen appears with personalized greeting

#### testOnboardingSkippedOnSecondLaunch
- **Purpose**: Verify onboarding only shows once
- **Steps**:
  1. Complete onboarding on first launch
  2. Terminate app
  3. Relaunch app
  4. Verify app goes directly to home screen (no onboarding)

### 2. Recording Workflow Tests

#### testRecordButtonStartsRecording
- **Purpose**: Verify recording can be started
- **Steps**:
  1. Launch app and complete onboarding
  2. Tap "Tap to Record" button
  3. Handle microphone permission if prompted
  4. Verify "Recording..." label appears
  5. Verify stop button appears
  6. Verify recording duration displays

#### testStopRecordingShowsCompletion
- **Purpose**: Verify recording completion flow
- **Steps**:
  1. Start recording
  2. Wait 3 seconds
  3. Tap stop button
  4. Verify "Recording Complete" sheet appears
  5. Verify save/cancel buttons exist

#### testRecordingAppearsInStories
- **Purpose**: Verify saved recordings appear in My Stories
- **Steps**:
  1. Record and save a memory with title "Test Memory 1"
  2. Navigate to "My Stories"
  3. Verify "Your Memory Vault" screen appears
  4. Verify saved recording appears in list

### 3. Navigation Tests

#### testNavigateToStories
- **Purpose**: Test navigation to Stories view
- **Steps**:
  1. Tap "My Stories" button
  2. Verify "Your Memory Vault" title appears
  3. Verify tab selector exists

#### testNavigateToFamilyTree
- **Purpose**: Test navigation to Family Tree view
- **Steps**:
  1. Tap "Family Tree" button
  2. Verify "Your Family Tree" title appears
  3. Verify "Discovered through your stories" subtitle
  4. Verify progress circle exists

#### testBackButtonsWork
- **Purpose**: Test back navigation from all screens
- **Steps**:
  1. Navigate to My Stories → tap Back → verify home screen
  2. Navigate to Family Tree → tap Back → verify home screen

### 4. Permission Tests

#### testMicrophonePermissionPrompt
- **Purpose**: Verify microphone permission is requested
- **Steps**:
  1. Launch with `--reset-permissions` argument
  2. Tap record button
  3. Verify system permission alert appears (on device)
  4. Grant permission
  5. Verify recording starts

#### testPermissionDenialShowsSettings
- **Purpose**: Verify app shows settings alert when permission denied
- **Steps**:
  1. Launch with `--simulate-permission-denied` argument
  2. Tap record button
  3. Verify "Microphone Permission Required" alert
  4. Verify "Open Settings" button exists

### 5. Performance Tests

#### testLaunchPerformance
- **Purpose**: Measure app launch performance
- **Metrics**: XCTApplicationLaunchMetric

## Accessibility Identifiers Added

### OnboardingView
- `welcomeTitle` - "Welcome to Lifebook" text
- `welcomeSubtitle` - "Share your memories..." text
- `firstNameTextField` - Name input field
- `letsBeginButton` - Start button

### HomeView
- `startRecordingButton` - Record button (idle state)
- `stopRecordingButton` - Stop button (recording state)
- `recordingLabel` - "Recording..." text
- `recordingDuration` - Duration display
- `myStoriesButton` - My Stories navigation link
- `familyTreeButton` - Family Tree navigation link

### RecordingCompleteView
- `recordingCompleteTitle` - "Recording Complete" text
- `storyTitleTextField` - Title input field
- `saveMemoryButton` - Save button
- `recordAnotherButton` - Record another button

### StoriesListView
- `memoryVaultTitle` - "Your Memory Vault" text

### ProfileProgressView
- `familyTreeTitle` - "Your Family Tree" text

## Test Launch Arguments

### --reset-onboarding
Removes onboarding completion state to simulate first launch

### --uitesting
Marks the app as running in UI test mode

### --reset-permissions (future)
Would reset permission states (requires additional implementation)

### --simulate-permission-denied (future)
Would simulate permission denial scenario (requires mock implementation)

## Running Tests

### From Xcode
1. Select Aurora scheme
2. Select target device/simulator
3. Product → Test (Cmd+U)
4. Or select specific test and click diamond icon

### From Command Line
```bash
xcodebuild test \
  -project Aurora.xcodeproj \
  -scheme Aurora \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro'
```

## Notes and Limitations

### Simulator vs Device
- **Permissions**: System permission dialogs may behave differently on simulator
- **Microphone**: Recording functionality may not work fully on simulator
- **Best Practice**: Run permission tests on real device

### Async Operations
- Tests use `waitForExistence(timeout:)` for async UI updates
- Recording tests include `sleep()` to allow actual recording time
- AI extraction may take 2-3 seconds - tests account for this

### Test Isolation
- Each test should be independent
- Use `--reset-onboarding` to ensure clean state
- Helper methods like `completeOnboardingIfNeeded()` handle state setup

### Known Issues
1. Permission tests may need manual setup on first run
2. Recording tests require microphone access
3. Simulator may auto-grant some permissions

## Helper Methods

### completeOnboardingIfNeeded()
Automatically completes onboarding if the screen appears. Uses "UITestUser" as default name.

### recordAndSaveMemory(title:)
Complete flow to record and save a memory with specified title. Includes:
- Start recording
- Wait 3 seconds
- Stop recording
- Enter title
- Wait for AI extraction
- Save

## Test Maintenance

### When Adding New Features
1. Add accessibility identifiers to new UI elements
2. Create tests for new user flows
3. Update this documentation
4. Consider both happy path and edge cases

### When UI Changes
1. Update accessibility identifiers if element structure changes
2. Update test assertions for new text/labels
3. Verify existing tests still pass

## Coverage Goals

- **Onboarding**: 100% - All flows tested
- **Recording**: Core flow - Start, stop, save
- **Navigation**: All main screens accessible
- **Permissions**: Alert flows verified
- **Performance**: Launch time measured

## Future Test Additions

1. Error handling - No audio captured
2. AI extraction failures
3. Storage full scenarios
4. Background recording interruption
5. VoiceOver accessibility testing
6. Localization testing
7. Memory pressure scenarios
8. Network connectivity (if cloud features added)

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->
