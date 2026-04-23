# 🚀 Complete Life Book Deployment Guide

## Phase 1: Test on iPhone 15 Pro ⚡ (DO THIS FIRST)

### Connect & Deploy (5 minutes)
```bash
cd /Users/mattwright/pandora/lifebook

# Connect iPhone 15 Pro via USB cable
# Unlock iPhone, tap "Trust This Computer"

# Deploy the app
./deploy-to-iphone.sh
```

### Testing Checklist 📋
**Core Recording Features**:
- [ ] App launches without crashes
- [ ] Microphone permission prompt appears → Grant access
- [ ] Large blue record button (120pt) visible and responsive
- [ ] Tap record button → recording indicator appears
- [ ] Speak test phrase → real-time transcription displays text
- [ ] Tap red stop button → recording stops, saves automatically

**AI Conversation Features**:
- [ ] AI prompts appear: "Tell me about your childhood memories"
- [ ] Prompts adapt based on what you say
- [ ] Skip/Accept buttons work for AI suggestions
- [ ] Natural conversation flow maintained

**Accessibility Features**:
- [ ] Enable VoiceOver: Settings > Accessibility > VoiceOver
- [ ] VoiceOver reads: "Life Book - Your Memoir Recording App"
- [ ] All buttons announce correctly when touched
- [ ] Large text scales in Settings > Display & Brightness > Text Size

**Data & Sync**:
- [ ] Auto-save indicator appears every 30 seconds
- [ ] "My Stories" shows recorded sessions
- [ ] CloudKit sync status shows "Synced to iCloud"
- [ ] Test offline: Turn off WiFi, record still works

## Phase 2: Apple ID & Developer Account Setup 🍎

### Apple Developer Program
```bash
# Check if enrolled in Apple Developer Program
open https://developer.apple.com/account/

# If not enrolled:
# 1. Sign up at developer.apple.com ($99/year)
# 2. Use your Apple ID: [your-apple-id@email.com]
# 3. Complete verification process (2-3 business days)
```

### Xcode Apple ID Integration
```bash
# Open Xcode project
cd /Users/mattwright/pandora/lifebook/builds/LifeBook/iOS-App
open LifeBook.xcodeproj

# In Xcode:
# 1. Xcode > Preferences > Accounts
# 2. Click "+" → Add Apple ID
# 3. Enter your Apple ID credentials
# 4. Download certificates and profiles
```

### Configure Code Signing
```bash
# In Xcode project:
# 1. Select LifeBook target
# 2. Signing & Capabilities tab
# 3. Team: Select your Apple Developer team
# 4. Bundle Identifier: com.tenshimatt.memoirguide
# 5. Signing Certificate: Apple Development
# 6. Provisioning Profile: Automatic
```

## Phase 3: TestFlight Distribution 🧪

### Create App Store Connect Entry
```bash
# Access App Store Connect
open https://appstoreconnect.apple.com

# Create new app:
# Name: Life Book
# Bundle ID: com.tenshimatt.memoirguide
# Platform: iOS
# Primary Language: English
```

### Archive & Upload to TestFlight
```bash
# In Xcode:
# 1. Select "Any iOS Device" scheme
# 2. Product > Archive
# 3. Wait for build to complete
# 4. In Organizer window:
#    - Select archive
#    - Click "Distribute App"
#    - Choose "App Store Connect"
#    - Upload for TestFlight testing

# Command line alternative:
xcodebuild -workspace LifeBook.xcworkspace \
  -scheme LifeBook \
  -destination generic/platform=iOS \
  -archivePath LifeBook.xcarchive \
  archive

xcodebuild -exportArchive \
  -archivePath LifeBook.xcarchive \
  -exportPath . \
  -exportOptionsPlist ExportOptions.plist
```

### Add TestFlight Testers
```bash
# In App Store Connect:
# 1. Go to TestFlight tab
# 2. Select your build
# 3. Add Internal Testers (up to 100)
# 4. Add External Testers (up to 10,000)
# 5. Send invitations via email
```

## Phase 4: App Store Preparation 📱

### App Store Assets Needed
```bash
mkdir -p /Users/mattwright/pandora/lifebook/appstore-assets

# Create required screenshots:
# - iPhone 6.9" (iPhone 15 Pro Max): 1320x2868 pixels
# - iPhone 6.1" (iPhone 15 Pro): 1179x2556 pixels
# - iPad Pro 12.9": 2048x2732 pixels

# App Store listing:
# - App icon (1024x1024 PNG)
# - App description
# - Keywords for search
# - Privacy policy URL
# - Support URL
```

### App Review Information
```bash
# Prepare for App Store Review:
# 1. Demo account (if login required)
# 2. Review notes explaining AI features
# 3. Age rating questionnaire
# 4. Privacy policy compliance
# 5. Content rights documentation
```

### Submit for Review
```bash
# In App Store Connect:
# 1. Complete App Information
# 2. Upload screenshots and metadata
# 3. Set pricing (Free recommended for elderly users)
# 4. Submit for App Store Review
# 5. Review time: 24-48 hours typically
```

## Phase 5: CI/CD Integration 🔄

### Automated TestFlight Pipeline
```bash
# Add to CI pipeline on 10.90.10.6
ssh root@10.90.10.6 "cat > /opt/lifebook-ci/testflight-upload.sh << 'SCRIPT'
#!/bin/bash
# Automated TestFlight upload after CI build
cd /opt/lifebook-ci/builds/LifeBook/iOS-App

# Archive
xcodebuild -project LifeBook.xcodeproj \
  -scheme LifeBook \
  -destination generic/platform=iOS \
  -archivePath LifeBook.xcarchive \
  archive

# Export IPA
xcodebuild -exportArchive \
  -archivePath LifeBook.xcarchive \
  -exportPath . \
  -exportOptionsPlist ExportOptions.plist

# Upload to TestFlight
xcrun altool --upload-app \
  --file LifeBook.ipa \
  --username YOUR_APPLE_ID \
  --password YOUR_APP_SPECIFIC_PASSWORD
SCRIPT"
```

## Phase 6: Production Monitoring 📊

### CloudKit Dashboard
```bash
# Monitor CloudKit usage:
open https://icloud.developer.apple.com/dashboard

# Check:
# - Private database usage
# - API request volume
# - Storage consumption
# - User adoption metrics
```

### Crash Reporting
```bash
# In Xcode:
# 1. Window > Organizer
# 2. Crashes tab
# 3. Monitor crash reports from TestFlight and App Store users
# 4. Fix critical issues in updates
```

## 🎯 Immediate Action Plan

### Today (Testing Phase):
1. **Deploy to iPhone 15 Pro** - Test all 56 features
2. **Verify recording quality** - Test in different environments
3. **Check accessibility** - Enable VoiceOver, test with elderly user
4. **Test CloudKit sync** - Verify data appears across devices

### This Week (Distribution Setup):
1. **Apple Developer enrollment** - If not already enrolled
2. **Create App Store Connect entry** - Reserve app name
3. **TestFlight build** - Upload first beta version
4. **Internal testing** - Test with family members

### Next Week (App Store Submission):
1. **Create app screenshots** - Professional marketing images
2. **Write app description** - Focus on elderly user benefits
3. **Privacy policy** - Required for App Store
4. **Submit for review** - Target public release

## 🔧 Troubleshooting Common Issues

### Code Signing Problems
```bash
# Fix certificate issues:
# 1. Keychain Access > login keychain
# 2. Delete old certificates
# 3. Xcode > Preferences > Accounts > Download Manual Profiles
# 4. Clean build folder: Cmd+Shift+K
```

### TestFlight Upload Failures
```bash
# Common solutions:
# 1. Check bundle version number (increment for each build)
# 2. Verify entitlements match App Store Connect
# 3. Use Application Loader for manual uploads
# 4. Check for invalid characters in metadata
```

### App Store Rejection Issues
```bash
# Common rejection reasons:
# 1. Missing privacy policy for data collection
# 2. Accessibility issues with VoiceOver
# 3. Incomplete app functionality
# 4. Missing age rating information
```

## ✅ Success Criteria

**Testing Complete When**:
- [ ] All 56 functional requirements verified on iPhone 15 Pro
- [ ] Recording quality acceptable in quiet and noisy environments
- [ ] AI conversation prompts helpful and contextual
- [ ] Elderly users can navigate interface without assistance
- [ ] CloudKit sync working reliably

**Ready for App Store When**:
- [ ] TestFlight testing completed with 5+ testers
- [ ] No critical crashes or data loss bugs
- [ ] All App Store assets prepared
- [ ] Privacy policy and support documentation ready
- [ ] Apple Developer Program enrollment complete

---

**Current Status**: Ready to test on iPhone 15 Pro
**Next Immediate Step**: Run `./deploy-to-iphone.sh` and begin testing checklist

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->

