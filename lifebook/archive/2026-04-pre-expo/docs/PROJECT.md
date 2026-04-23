# Lifebook Project - Primary Working Directory

## 🎯 Active Project Location

**Working Directory:** `/Users/mattwright/pandora/lifebook/`

**Xcode Project:** `LifebookDemo.xcodeproj` (at project root)

**To Open in Xcode:**
```bash
open /Users/mattwright/pandora/lifebook/LifebookDemo.xcodeproj
```

## ✅ Build Status

**Last Successful Build:** October 2, 2025
**Build Result:** ✅ BUILD SUCCEEDED
**Target:** iOS Simulator - iPhone 17, iOS 26.0

## 📱 Project Details

### Technology Stack
- Swift 5.0
- SwiftUI (iOS 26.0 deployment target)
- Core Data for local persistence
- AVFoundation for audio recording
- Speech Recognition framework for transcription
- Combine framework for reactive programming

### Key Features
- ✅ Real audio recording (.m4a format)
- ✅ Live speech-to-text transcription
- ✅ Core Data persistence with RecordingEntity
- ✅ AI entity extraction (names, dates, relationships)
- ✅ Auto-population of ProfileInfoEntity
- ✅ Category organization (Childhood, Family, Career, etc.)
- ✅ Senior-friendly UI (200pt buttons, high contrast)
- ✅ Profile progress tracking

### Project Structure
```
LifebookDemo/
├── LifebookDemo/                    # Source code
│   ├── LifebookApp.swift           # App entry point
│   ├── ContentView.swift           # Main view
│   ├── HomeView.swift              # Home screen
│   ├── AudioRecordingManager.swift # Recording + transcription
│   ├── RecordingDataManager.swift  # Core Data persistence
│   ├── AIEntityExtractor.swift     # AI extraction
│   ├── ProfileAutoPopulator.swift  # Auto-populate profile
│   ├── ProfileChecklistManager.swift
│   ├── ProfileInfoEntity.swift     # Core Data entity
│   ├── ProfileProgressView.swift
│   ├── RecordingCompleteView.swift
│   ├── StoriesListView.swift       # Stories by category
│   ├── StoryDetailView.swift
│   ├── OnboardingView.swift
│   ├── HelpView.swift
│   └── DesignSystem.swift
├── LifebookDemo.xcodeproj/
├── LifebookDemoTests/
├── LifebookDemoUITests/
├── BACKEND_COMPLETE.md             # Backend integration docs
└── PERMISSIONS_SETUP.md            # Privacy permissions guide
```

## 🔧 Recent Fixes (Oct 2, 2025)

### Fixed During Xcode/VSCode Crash Recovery
1. **Duplicate property error** - Removed duplicate `completionPercentageDouble` extension
2. **Missing Combine imports** - Added to AIEntityExtractor.swift and ProfileAutoPopulator.swift
3. **Build verification** - Confirmed clean build succeeds

## 🚀 Next Steps

### Required for Device Testing
1. **Add Privacy Permissions** (see PERMISSIONS_SETUP.md):
   - NSMicrophoneUsageDescription
   - NSSpeechRecognitionUsageDescription

2. **Lower Deployment Target** (optional):
   - Current: iOS 26.0 (beta)
   - Recommended: iOS 15.0 (per spec)
   - Allows deployment to more devices

### Build & Run
```bash
# Build
xcodebuild -project LifebookDemo.xcodeproj \
  -scheme LifebookDemo \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 17,OS=26.0' \
  clean build

# Or open in Xcode and press ⌘R
open /Users/mattwright/pandora/lifebook/test-ui/LifebookApp/LifebookDemo/LifebookDemo.xcodeproj
```

## 📂 Archive Location

Old versions archived at: `/Users/mattwright/pandora/lifebook/archive/`

See `archive/README.md` for details on what's archived and why.

## 📝 Documentation

- **BACKEND_COMPLETE.md** - Backend integration completion report
- **PERMISSIONS_SETUP.md** - How to add microphone/speech permissions
- **CLAUDE.md** (project root) - Development guidelines
- **archive/README.md** - Archive organization

## 🔗 Git Status

**Branch:** `003-create-a-comprehensive`
**Repository:** `/Users/mattwright/pandora/lifebook/`
**Working Directory:** `test-ui/` (currently untracked)

---

**Last Updated:** October 2, 2025
**Status:** ✅ Ready for development

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->

