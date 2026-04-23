# 🚀 Quick Launch - Lifebook Demo

## Fastest Way to Run

### Option 1: Open in Xcode (Recommended)

1. Open Xcode
2. **File → New → Project**
3. Choose **iOS → App**
4. Settings:
   - Product Name: `LifebookDemo`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Save location: Desktop or anywhere
5. **Delete these default files:**
   - `LifebookDemoApp.swift`
   - `ContentView.swift`
6. **Drag ALL these files into your project:**
   ```
   /Users/mattwright/pandora/lifebook/test-ui/LifebookApp/*.swift
   ```
   (Right-click project → Add Files → Select all .swift files → Copy items if needed)
7. **Run:** Press ⌘R or click Play button
8. Choose **iPhone 15 Pro** simulator

---

## What You'll See

### 1. **Onboarding Screen**
- Large text field: "What's your first name?"
- Enter your name
- Tap "Let's Begin" button

### 2. **Home Screen** 
- Greeting: "Good Morning/Afternoon/Evening, [Your Name]"
- AI prompt suggestion
- **HUGE 200pt record button** (can't miss it)
- Tap to start recording

### 3. **Recording Active**
- Button turns RED
- Pulsing animation
- Live timer
- Tap again to stop

### 4. **Recording Complete Screen**
- Mock transcription appears
- **Tap PLAY button** → See word-by-word orange highlighting
- "Save Memory" button at bottom

### 5. **Navigation**
- Bottom tabs: "My Stories" | "My Memory Vault"
- Stories organized by theme
- Help icon (?) shows expandable topics

---

## Key Demo Features

✅ **No forms or complex screens** - Just record and speak
✅ **200pt touch targets** - Huge buttons for elderly users  
✅ **18-32pt fonts** - Readable at arm's length
✅ **Word highlighting** - Orange highlight tracks playback
✅ **Pulsing animations** - Clear visual feedback
✅ **Time-based greetings** - "Good morning, John"
✅ **Mock data included** - Ready to test immediately

---

## Files Included

- `LifebookApp.swift` - App entry point
- `ContentView.swift` - Navigation controller
- `DesignSystem.swift` - Colors, fonts, constants
- `OnboardingView.swift` - Name entry screen
- `HomeView.swift` - Main recording screen
- `RecordingCompleteView.swift` - Playback with highlighting
- `StoriesListView.swift` - Browse saved stories
- `StoryDetailView.swift` - Individual story view
- `HelpView.swift` - Expandable help topics

---

## Demo Flow

```
Launch App
    ↓
Enter Name (Onboarding)
    ↓
Home Screen → Tap Record Button
    ↓
Recording (Pulsing Red Button)
    ↓
Stop Recording
    ↓
Playback Screen (Word Highlighting)
    ↓
Save Memory
    ↓
View in "My Stories"
```

---

## Important Notes

- **All recordings are MOCK data** - No real audio yet
- Backend integration points marked with comments
- AVAudioRecorder hookup ready (commented out)
- Transcription service placeholder for Whisper API
- CloudKit sync structure prepared

---

## Next Steps After Viewing

Compare this UX approach with the current MemoirGuide app:

**This Demo:**
- No forms ❌
- Conversational AI-driven ✅
- One action per screen ✅
- Huge buttons for seniors ✅

**Current MemoirGuide:**
- Form-based profile entry ❌
- Needs conversion to conversational ✅

---

**Questions? Run the demo first, then we'll discuss integrating this approach!**

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->

