# Life Book - App Store Deployment Guide

## Apple Developer Account Configuration

**Account**: tenshimatt@mac.com  
**Program**: Apple Developer Program ($99/year) ✅  
**Bundle ID**: com.tenshimatt.memoirguide  

## Pre-Deployment Checklist

### 1. Xcode Project Setup
- [ ] Create new iOS project in Xcode
- [ ] Set bundle identifier to `com.tenshimatt.memoirguide`
- [ ] Set development team to your Apple Developer account
- [ ] Configure automatic signing
- [ ] Set deployment target to iOS 15.0+

### 2. Capabilities Configuration

#### Required Capabilities:
- [ ] **CloudKit** - For memoir sync across devices
- [ ] **Background Modes** - Audio (for extended recording)
- [ ] **App Groups** (optional) - For sharing with family

#### Privacy Permissions:
- [ ] **Microphone Usage** - "Life Book needs microphone access to record your stories"
- [ ] **Speech Recognition** - "Life Book uses speech recognition to transcribe your stories"

### 3. CloudKit Setup

#### Container Configuration:
1. Log into CloudKit Console: https://icloud.developer.apple.com
2. Create container: `iCloud.com.tenshimatt.memoirguide`
3. Configure record types (see CloudKit Schema below)
4. Deploy schema to production

#### CloudKit Record Types:
```
MemoirSession
- id: String (Indexed)
- startTime: Date/Time
- status: String
- totalWordCount: Int64
- lastActiveDate: Date/Time

MemoirSegment  
- id: String (Indexed)
- transcription: String
- audioFileName: String
- duration: Double
- wordCount: Int64
- sessionReference: Reference (to MemoirSession)

Chapter
- id: String (Indexed)  
- title: String
- chapterNumber: Int64
- status: String
- totalWordCount: Int64
- userProfileReference: Reference (to UserProfile)

UserProfile
- id: String (Indexed)
- name: String
- languagePreference: String
- accessibilitySettings: String
- familyInviteCode: String
```

### 4. App Store Connect Configuration

#### App Information:
- **Name**: Life Book - Memoir Recording
- **Subtitle**: Record & preserve your life stories
- **Category**: Lifestyle
- **Age Rating**: 4+ (suitable for all ages)

#### App Description:
```
Life Book is designed specifically for elderly users to easily record and preserve their life stories. Using gentle AI guidance and automatic transcription, anyone can create beautiful digital memoirs to share with family.

KEY FEATURES:
• One-button recording - Simple, large interface
• AI conversation guide - Gentle prompts to help tell your stories  
• Automatic transcription - Your words appear as you speak
• Auto-save every 30 seconds - Never lose your memories
• Family sharing - Securely share stories with loved ones
• Large text support - Easy to read for all ages
• VoiceOver compatible - Full accessibility support

DESIGNED FOR ACCESSIBILITY:
Life Book follows WCAG AAA accessibility guidelines with:
• Large, high-contrast buttons
• Dynamic Type support (text scaling)
• VoiceOver compatibility
• Haptic feedback
• Simple navigation

PRIVACY & SECURITY:
• All recordings stored in your private iCloud
• No third-party tracking or analytics
• On-device speech recognition when possible
• Family sharing requires explicit permission
```

#### Keywords:
memoir, stories, elderly, accessibility, recording, transcription, family, memories, voice, autobiography

#### Screenshots Required:
- [ ] iPhone 6.7" (iPhone 14 Pro Max) - 6 screenshots
- [ ] iPhone 6.5" (iPhone 14 Plus) - 6 screenshots  
- [ ] iPhone 5.5" (iPhone 8 Plus) - 6 screenshots

### 5. Build Configuration

#### Release Build Settings:
```swift
// Build Settings
ENABLE_BITCODE = NO
SWIFT_OPTIMIZATION_LEVEL = -O
DEAD_CODE_STRIPPING = YES
DEPLOYMENT_POSTPROCESSING = YES

// Info.plist Updates
LSRequiresIPhoneOS = YES
UIRequiresFullScreen = YES
UIStatusBarHidden = NO
UISupportedInterfaceOrientations = [UIInterfaceOrientationPortrait]

// Privacy Usage Descriptions
NSMicrophoneUsageDescription = "Life Book needs microphone access to record your stories and preserve your memories."
NSSpeechRecognitionUsageDescription = "Life Book uses speech recognition to create written transcripts of your spoken stories."
```

## Deployment Steps

### Step 1: Archive Build
1. In Xcode: Product → Archive
2. Select "Distribute App"
3. Choose "App Store Connect"
4. Select automatic signing
5. Upload to App Store Connect

### Step 2: App Store Connect Review
1. Log into App Store Connect
2. Select your app
3. Complete app information
4. Upload screenshots and metadata
5. Submit for review

### Step 3: TestFlight Testing (Recommended)
1. Invite elderly beta testers via TestFlight
2. Focus testing on:
   - First-time user experience
   - 4+ hour recording sessions
   - VoiceOver accessibility
   - Family sharing workflows
   - CloudKit sync across devices

### Step 4: App Store Review
Expected review time: 24-48 hours

#### Common Review Issues to Avoid:
- [ ] Ensure all privacy permissions have clear explanations
- [ ] Test app works without network connection (offline recording)
- [ ] Verify CloudKit sync works correctly
- [ ] Confirm accessibility features work with VoiceOver
- [ ] Test on various iPhone models and iOS versions

## Marketing & Launch

### App Store Optimization:
- Focus on accessibility and elderly-friendly features
- Use keywords: memoir, stories, elderly, accessibility
- Emphasize privacy and security in description

### Launch Strategy:
1. **Soft Launch**: Release to family and friends first
2. **Senior Community Outreach**: Partner with senior centers
3. **Accessibility Community**: Engage with accessibility advocates
4. **PR Outreach**: Contact tech journalists who cover accessibility

### Support Infrastructure:
- Email support: support@lifebook-app.com (to be created)
- Simple help documentation
- Video tutorials for common tasks
- Phone support option for elderly users

## Post-Launch Monitoring

### Key Metrics to Track:
- Daily Active Users (target: 40% weekly usage)
- Session Duration (target: 15-20 minutes average)
- CloudKit sync success rate (target: >99.5%)
- App Store rating (target: 4.5+ stars)
- Family sharing adoption (target: 30% of users)

### Update Schedule:
- **Week 2**: Bug fixes and minor improvements
- **Month 2**: Photo integration features
- **Month 4**: Advanced export options
- **Month 6**: Cross-platform family viewing

## Technical Support Plan

### Tier 1 Support (Email):
- Basic troubleshooting
- Permission issues
- CloudKit sync problems

### Tier 2 Support (Phone):
- Complex technical issues
- Accessibility setup help
- Family sharing configuration

### Documentation:
- Getting Started Guide
- Accessibility Setup Guide
- Family Sharing How-To
- Troubleshooting Guide

---

**Ready for Deployment**: All core functionality implemented with accessibility-first design, CloudKit sync, and App Store compliance.

**Next Actions**:
1. Create Xcode project with above configuration
2. Import all Swift files from MemoirGuide folder
3. Configure CloudKit container in Apple Developer portal
4. Test on physical devices
5. Create App Store Connect app listing
6. Submit for review

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->

