# Life Book - Memoir Recording App

## Overview
Life Book is an iOS app designed specifically for elderly users to easily record and preserve their life stories. The app uses AI-powered conversation guidance to help users tell their stories naturally, with automatic transcription, organization, and cloud sync.

## Features

### Core Features
- **One-Button Recording**: Simple interface with a single large button to start/stop recording
- **AI Conversation Guide**: Gentle AI interviewer that asks questions and guides the storytelling
- **Automatic Transcription**: Real-time speech-to-text conversion
- **Auto-Save**: Recordings automatically saved every 30 seconds
- **Chapter Organization**: Stories automatically organized into chapters
- **CloudKit Sync**: Automatic backup and sync across devices
- **Family Sharing**: Share stories with family members
- **Export Options**: Export memoirs as PDF or ePub

### Accessibility Features
- Large, high-contrast buttons
- Adjustable text size
- Voice feedback
- Simple navigation
- Automatic silence detection
- Haptic feedback

## Technical Stack

### Frontend
- **SwiftUI**: Native iOS interface
- **AVFoundation**: Audio recording and playback
- **Speech Framework**: On-device speech recognition

### Backend
- **CloudKit**: Data storage and sync
- **OpenAI API**: AI conversation generation
- **Core Data**: Local caching

### Languages
- Swift 5.5+
- iOS 15.0+

## Project Structure

```
life-book/
├── MemoirGuide/
│   ├── MemoirGuideApp.swift       # App entry point
│   ├── AppState.swift              # Global state management
│   ├── Models/
│   │   ├── MemoirSession.swift    # Recording session model
│   │   ├── MemoirSegment.swift    # Individual recording segment
│   │   └── Chapter.swift          # Chapter organization
│   ├── Managers/
│   │   ├── RecordingManager.swift # Audio recording logic
│   │   ├── AIInterviewer.swift    # AI conversation guide
│   │   └── CloudKitManager.swift  # CloudKit sync
│   ├── Views/
│   │   ├── ContentView.swift      # Main container
│   │   ├── RecordingView.swift    # Recording interface
│   │   ├── LibraryView.swift      # Chapter library
│   │   └── ReaderView.swift       # Read/playback view
│   ├── Utilities/
│   │   ├── SilenceDetector.swift  # Detect recording silence
│   │   └── Extensions.swift       # Helper extensions
│   ├── Resources/
│   │   ├── Info.plist             # App configuration
│   │   └── MemoirGuide.entitlements # App permissions
│   └── Tests/
│       └── RecordingManagerTests.swift # Unit tests
├── Documentation/
│   ├── README.md                  # This file
│   ├── SETUP.md                   # Setup instructions
│   └── API_KEYS.md               # API key configuration
└── Configuration/
    ├── CloudKit-Schema.md         # CloudKit setup
    └── TestPlan.md               # Test coverage plan
```

## Getting Started

### Prerequisites
1. Xcode 14.0 or later
2. iOS 15.0+ device or simulator
3. Apple Developer Account
4. OpenAI API key

### Setup Instructions
See [SETUP.md](SETUP.md) for detailed setup instructions.

## User Flow

1. **First Launch**
   - App requests microphone and speech recognition permissions
   - Automatic sign-in with Apple ID
   - Shows single "Tap to Start" button

2. **Recording Session**
   - User taps button to start recording
   - AI asks gentle questions to guide conversation
   - Real-time transcription displayed on screen
   - Auto-save every 30 seconds
   - Silence detection prompts gentle encouragement

3. **Chapter Organization**
   - AI automatically detects story segments
   - Creates chapters based on themes/timeline
   - Generates chapter titles

4. **Reading & Sharing**
   - View stories in library grid
   - Read with adjustable text size
   - Play original audio recordings
   - Export as PDF/ePub
   - Share with family via iCloud

## Development

### Building the App
1. Open `MemoirGuide.xcodeproj` in Xcode
2. Set your development team
3. Update bundle identifier if needed
4. Build and run (⌘R)

### Running Tests
```bash
xcodebuild test \
  -scheme MemoirGuide \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro'
```

### CloudKit Setup
1. Enable CloudKit capability in Xcode
2. Create container: `iCloud.com.tenshimatt.memoirguide`
3. Define record types (see CloudKit-Schema.md)

## Security & Privacy

- All recordings stored privately in user's iCloud
- On-device speech recognition when possible
- API keys stored securely in Keychain
- No third-party analytics or tracking
- Family sharing requires explicit permission

## Support

For support, contact: tenshimatt@mac.com

## License

Proprietary - All rights reserved

## Acknowledgments

- Designed specifically for elderly users
- Built with accessibility as a priority
- Inspired by the need to preserve family stories

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->

