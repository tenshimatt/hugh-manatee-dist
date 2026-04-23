# LIFEBOOK PROJECT INSTRUCTIONS

## Project Overview
Life Book is an iOS memoir recording app designed specifically for elderly users to easily capture and preserve their life stories through AI-guided conversations.

## Development Workflow
1. Follow TDD principles for all new features
2. Test on real iOS devices for accessibility verification
3. Maintain CloudKit sync functionality
4. Ensure WCAG AAA accessibility compliance
5. Run tests before any commits: `xcodebuild test -scheme MemoirGuide`

## Key Technical Constraints
- iOS 15.0+ minimum deployment target
- SwiftUI-only interface (no UIKit mixing)
- CloudKit for sync (no third-party backends)
- On-device speech recognition when possible
- Large UI elements for elderly users (minimum 44pt touch targets)

## Testing Requirements
- Unit tests for all managers and models
- UI tests for critical user flows
- Accessibility tests using VoiceOver
- Performance tests for audio recording

## Deployment
- Requires Apple Developer Program enrollment
- CloudKit container: `iCloud.com.tenshimatt.memoirguide`
- TestFlight for beta distribution

## Current Status: iOS Swift/SwiftUI App
**Branch**: 003-create-a-comprehensive  
**Methodology**: Spec-kit/Specify with 88-task workflow  
**Status**: Phase 3 Complete - Infrastructure & Components Built, Missing Backend Services

### Project Structure
- **MemoirGuide.xcodeproj**: iOS Xcode project (Swift/SwiftUI)
- **MemoirGuide/**: iOS source code directory
- **frontend/**: INCORRECT - Next.js web app (should be deleted)
- **backend/**: INCORRECT - Express backend (should be deleted)

### What Actually Needs to Be Done
```
✅ EXISTS:
- iOS Xcode project with Swift/SwiftUI code
- Basic app structure and views

❌ TO DELETE:
- frontend/ directory (Next.js web app)
- backend/ directory (Express server)
- All web-related infrastructure

🎯 FOCUS:
- Work with the existing iOS Swift codebase in MemoirGuide/
- Build and deploy to real iPhone using Xcode
- Stop building web applications when spec says iOS
```

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->

