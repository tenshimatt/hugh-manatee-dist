# Setup Instructions for Life Book

## 1. Prerequisites

### Required Software
- macOS Monterey (12.0) or later
- Xcode 14.0 or later
- iOS 15.0+ device or simulator

### Required Accounts
- Apple Developer Account ($99/year)
- OpenAI Account (for API access)
- iCloud account (for testing)

## 2. Initial Setup

### Clone or Download Project
```bash
cd ~/pandora/life-book
```

### Open in Xcode
```bash
open MemoirGuide.xcodeproj
```

## 3. Configure Apple Developer Account

### In Xcode:
1. Select the project in navigator
2. Select "MemoirGuide" target
3. Go to "Signing & Capabilities" tab
4. Set Team to your Apple Developer account
5. Bundle Identifier: `com.tenshimatt.memoirguide`
   - Change if needed to make unique

## 4. Configure CloudKit

### In Xcode:
1. Click "+ Capability"
2. Add "iCloud"
3. Check "CloudKit"
4. Container: `iCloud.com.tenshimatt.memoirguide`

### In CloudKit Dashboard:
1. Go to https://icloud.developer.apple.com
2. Select your container
3. Create Schema → Record Types
4. Add the following record types:

#### MemoirSession
- `startTime` (Date/Time)
- `status` (String)
- `totalWordCount` (Int64)
- `lastActiveDate` (Date/Time)
- `currentChapterID` (String)

#### MemoirSegment
- `transcription` (String)
- `aiPrompt` (String)
- `timestamp` (Date/Time)
- `duration` (Double)
- `audioFile` (Asset)
- `chapterID` (String)
- `people` (String List)
- `places` (String List)
- `dates` (String List)
- `emotions` (String List)

#### Chapter
- `title` (String)
- `segments` (String List)
- `summary` (String)
- `orderIndex` (Int64)
- `timelineDates` (Date/Time List)

## 5. Configure OpenAI API

### Get API Key:
1. Go to https://platform.openai.com
2. Create account or sign in
3. Go to API Keys section
4. Create new key
5. Copy the key (starts with `sk-proj-`)

### Add to App:
**Option A: Environment Variable (Recommended)**
```bash
export OPENAI_API_KEY="sk-proj-YOUR_KEY_HERE"
```

**Option B: Keychain (Most Secure)**
1. Open Keychain Access app
2. Create new password item
3. Name: `MemoirGuide-OpenAI`
4. Account: `api-key`
5. Password: Your API key

**Option C: Temporary (Development Only)**
Edit `AIInterviewer.swift`:
```swift
private let apiKey = "sk-proj-YOUR_KEY_HERE"
```

## 6. Configure Permissions

### Info.plist Already Contains:
- Microphone usage description
- Speech recognition usage description
- Background audio capability

### Verify in Settings:
1. Build and run app
2. iOS Settings → Privacy & Security
3. Ensure Microphone and Speech Recognition are enabled

## 7. Build and Run

### On Simulator:
1. Select iPhone 15 Pro or iPad simulator
2. Press ⌘R to build and run
3. Grant permissions when prompted

### On Device:
1. Connect iOS device via USB
2. Select your device in Xcode
3. Trust developer certificate on device:
   - Settings → General → VPN & Device Management
   - Select your developer profile
   - Trust
4. Press ⌘R to build and run

## 8. Test the App

### First Launch Test:
1. App should show single button
2. Tap button
3. Grant microphone permission
4. Grant speech recognition permission
5. Start speaking
6. See transcription appear
7. AI should respond with questions

### CloudKit Test:
1. Record for 35+ seconds
2. Check CloudKit Dashboard
3. Verify records appear

## 9. Family Sharing Setup

### Enable Family Sharing:
1. iOS Settings → [Your Name] → Family Sharing
2. Add family members
3. They can install app with same Apple ID family

### Share via Web Link:
1. In app, go to Library
2. Select chapter
3. Tap Share
4. Generate web link

## 10. Troubleshooting

### Common Issues:

**Microphone Permission Denied:**
- Settings → Privacy & Security → Microphone
- Enable for Life Book

**CloudKit Sync Issues:**
- Ensure signed into iCloud
- Check internet connection
- Verify CloudKit container exists

**Speech Recognition Not Working:**
- Settings → Privacy & Security → Speech Recognition
- Enable for Life Book
- Ensure device language is English

**OpenAI API Errors:**
- Verify API key is correct
- Check API usage limits
- Ensure internet connection

### Debug Mode:
Add to scheme environment variables:
- `DEBUG_MODE = 1`
- `VERBOSE_LOGGING = 1`

## 11. Production Deployment

### TestFlight Setup:
1. Archive app (Product → Archive)
2. Upload to App Store Connect
3. Add internal/external testers
4. Share TestFlight link

### App Store Submission:
1. Create app in App Store Connect
2. Fill in metadata
3. Upload screenshots
4. Submit for review

## Support

For setup issues, contact: tenshimatt@mac.com

## Next Steps

1. Test with target users (elderly family members)
2. Gather feedback on UI simplicity
3. Adjust AI prompts based on usage
4. Consider adding more languages

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->

