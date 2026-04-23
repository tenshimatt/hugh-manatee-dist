# Lifebook - Senior-Friendly Memory Recording App

## 📱 Pixel-Perfect SwiftUI Demo

A voice-first memory preservation app designed specifically for users aged 60-90, emphasizing simplicity, large touch targets, and clear navigation.

## 🎯 Design Principles

- **One primary action per screen** - No confusion about what to do
- **Large touch targets** - All buttons minimum 60pt height
- **High contrast** - Clear text on clean backgrounds
- **Voice-first** - Recording is the primary interaction
- **No hidden menus** - Everything important is visible
- **Clear feedback** - Visual and haptic responses to all actions

## 📂 Project Structure

```
LifebookApp/
├── LifebookApp.swift          # Main app entry point
├── ContentView.swift          # Navigation controller
├── DesignSystem.swift         # Colors, fonts, spacing constants
├── OnboardingView.swift       # Simple 1-field setup
├── HomeView.swift             # Main recording screen
├── RecordingCompleteView.swift # Save/review recordings
├── StoriesListView.swift      # Browse saved stories
├── StoryDetailView.swift      # Individual story details
└── HelpView.swift             # Simple help documentation
```

## 🚀 How to Run

### Option 1: Create New Xcode Project

1. Open Xcode
2. Create new iOS App project
3. Name: "LifebookApp"
4. Interface: SwiftUI
5. Language: Swift
6. Copy all .swift files to your project
7. Run on iPhone simulator (iPhone 14 or newer recommended)

### Option 2: Quick Setup Script

```bash
# Create Xcode project structure
mkdir -p LifebookApp.xcodeproj
mkdir -p LifebookApp

# Copy all Swift files to project
cp *.swift LifebookApp/

# Open in Xcode
open -a Xcode LifebookApp.xcodeproj
```

## ✨ Key Features Implemented

### 1. **Simplified Onboarding**
- Single text field (first name only)
- Large, readable fonts
- Clear "Let's Begin" button

### 2. **One-Button Recording**
- 200pt circular record button
- Pulsing animation when recording
- Clear visual states (green/red)
- Live timer display

### 3. **Smart Transcription View**
- Word-by-word highlighting during playback
- Orange highlight for current word
- Pale orange for previous word
- Auto-scrolling to keep current word centered

### 4. **Visual Story Cards**
- Emoji icons for easy recognition
- Large play buttons
- Clear metadata (duration, word count)
- No complex navigation

### 5. **Dual View System**
- "My Stories" - Organized memories
- "Vault" - Raw recordings timeline
- Simple toggle between views

### 6. **Senior-Optimized UI**
- 18-32pt fonts throughout
- 70pt minimum button heights
- High contrast colors
- Rounded, friendly design
- Shadow effects for depth perception

## 🎨 Color Palette

- **Primary Teal**: `#5B9A8B` - Main actions
- **Record Red**: `#EF4747` - Recording state
- **Warm Gray**: `#F5F3F0` - Backgrounds
- **Text Primary**: `#212121` - Main text
- **Text Secondary**: `#6B6B6B` - Supporting text
- **Background Beige**: `#FAF8F5` - App background

## 📱 Responsive Features

- Adaptive greeting based on time of day
- Haptic feedback on all interactions
- Smooth animations (0.3s transitions)
- Loading states and success confirmations
- Auto-save functionality

## 🔊 Accessibility Features

- VoiceOver compatible
- Dynamic Type support ready
- High contrast mode compatible
- Clear button states
- Predictable navigation

## 🏃 Quick Test Flow

1. **Launch** → See onboarding
2. **Enter name** → "John"
3. **Tap "Let's Begin"** → Home screen
4. **Tap record button** → See pulsing animation
5. **Tap stop** → Recording complete screen
6. **Tap play** → See word highlighting
7. **Save memory** → Success animation
8. **Navigate to "My Stories"** → See saved content
9. **Tap help icon** → Expandable help topics

## 📝 Notes for Developers

- Uses `@AppStorage` for persistent user preferences
- Mock data included for demonstration
- Haptic feedback requires physical device
- Animation timings optimized for older users (slower)
- All images use SF Symbols (no external assets needed)

## 🎯 Target Devices

- iPhone 12 and newer
- iOS 16.0+
- Optimized for standard and Plus/Max sizes
- Light mode only (better for seniors)

## 🚧 Features Ready for Backend Integration

- Audio recording (AVAudioRecorder hookup ready)
- Transcription service (placeholder for Whisper API)
- CloudKit sync (Core Data models prepared)
- Family sharing (structure in place)

## 📱 Testing Checklist

- [ ] Text readable at arm's length
- [ ] Buttons easily tappable with arthritis
- [ ] Navigation path always clear
- [ ] Error states friendly, not technical
- [ ] Success feedback prominent
- [ ] No timeout pressures
- [ ] Voice-first, typing minimal

---

Built with ❤️ for the generation that has stories to tell.

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->

