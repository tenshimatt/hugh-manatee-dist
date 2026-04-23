# AI Story Generation - Specification

## Overview
After recording, AI automatically transforms raw transcription into polished story text. User can then assign to existing or new story with undo/redo capabilities.

---

## 1. REAL-TIME STORY GENERATION

### When It Happens
- **Trigger:** User taps STOP RECORDING
- **Processing:** AI analyzes full transcription
- **Display:** Show processing indicator while AI works

### AI Processing Goals
Transform raw speech transcription into readable story text:

**Input (Raw Transcription):**
```
um so yeah I was born in 1945 in Boston and uh my father he worked at the
docks you know and uh we lived in a small apartment near the harbor and um
I remember the smell of the ocean every morning when I woke up
```

**Output (Story Text):**
```
I was born in 1945 in Boston. My father worked at the docks, and we lived
in a small apartment near the harbor. I remember waking up every morning
to the smell of the ocean.
```

### AI Transformation Rules
1. Remove filler words (um, uh, you know, like, etc.)
2. Fix grammar and punctuation
3. Organize into proper sentences and paragraphs
4. Preserve first-person narrative voice
5. Keep all factual content (names, dates, places)
6. Maintain chronological order
7. Add paragraph breaks for topic changes

---

## 2. AI SERVICE SELECTION

### Option A: Cloud API (RECOMMENDED)
**Service:** Anthropic Claude API or OpenAI GPT-4
**Pros:**
- High quality results
- Contextual understanding
- Handles complex narratives
- No device performance impact

**Cons:**
- Requires internet connection
- API costs (minimal for text)
- Slight latency (1-3 seconds)

**Fallback:** Save raw transcription if offline

### Option B: Local Model
**Service:** iOS Natural Language framework + on-device summarization
**Pros:**
- Works offline
- No API costs
- Fast

**Cons:**
- Lower quality
- Limited narrative understanding
- Higher battery usage

### DECISION: Use Cloud API with Local Fallback
- Try Claude API first
- If no internet: Save raw transcription, allow manual editing
- Process later when online

---

## 3. POST-RECORDING FLOW (NEW SCREEN)

### Screen: StoryAssignmentView

**Layout:**

```
┌─────────────────────────────────┐
│  Recording Complete              │
│                                  │
│  ┌───────────────────────────┐  │
│  │ [Original Transcription]  │  │
│  │ (scrollable, gray box)    │  │
│  │ 247 words                 │  │
│  └───────────────────────────┘  │
│                                  │
│  🤖 AI Story (Processing...)     │
│  ┌───────────────────────────┐  │
│  │ [Generated Story Text]    │  │
│  │ (scrollable, white box)   │  │
│  │ 198 words                 │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌─────────┐  ┌─────────┐       │
│  │ [UNDO]  │  │ [REDO]  │       │
│  │  ↶      │  │   ↷     │       │
│  └─────────┘  └─────────┘       │
│                                  │
│  ┌───────────────────────────┐  │
│  │ Add to Existing Story ▼   │  │
│  └───────────────────────────┘  │
│  or                              │
│  ┌───────────────────────────┐  │
│  │ + Create New Story        │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌───────────────────────────┐  │
│  │      SAVE STORY           │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### Component Sizes (Accessibility)
- Undo/Redo buttons: 80pt × 80pt each (large touch targets)
- Button text: 24pt font minimum
- Story text: User-controlled font size (Dynamic Type)
- All buttons: minimum 44pt height
- Padding: 20pt between sections

---

## 4. UNDO/REDO SYSTEM

### Undo/Redo Stack
Store history of AI-generated text versions:

```swift
struct StoryVersion {
    let text: String
    let timestamp: Date
    let wordCount: Int
}

var undoStack: [StoryVersion] = []
var redoStack: [StoryVersion] = []
var currentVersion: StoryVersion
```

### Operations

**UNDO Button:**
- Pops current version onto redo stack
- Loads previous version from undo stack
- Disabled if undo stack empty
- Large button with ↶ icon

**REDO Button:**
- Pops version from redo stack
- Pushes to undo stack
- Disabled if redo stack empty
- Large button with ↷ icon

### When to Save Version
- Initial AI generation
- Manual text edits (if implemented)
- Re-generate with different AI settings

---

## 5. DATA STORAGE

### Core Data Schema Updates

**MemoirSegmentEntity (UPDATED):**
```swift
@NSManaged public var transcription: String?      // Raw speech
@NSManaged public var aiStoryText: String?        // AI-generated version
@NSManaged public var aiProcessed: Bool           // True if AI ran
@NSManaged public var aiModel: String?            // "claude-3-5" or "local"
@NSManaged public var editHistory: Data?          // JSON: [StoryVersion]
```

**ChapterEntity (UNCHANGED):**
- Already has relationship to sessions/segments
- Story text built from all assigned segments' aiStoryText

### Local Storage Structure
```
Documents/
├── memoir_2025-09-29_21-30-00_1.m4a  (audio)
└── CoreData.sqlite                    (text + metadata)
```

---

## 6. USER FLOWS

### Flow 1: New Recording with AI Story
1. User records 2-minute memory
2. Auto-saves happen every 30 seconds (raw transcription)
3. User taps STOP RECORDING
4. Show StoryAssignmentView immediately
5. Display raw transcription at top
6. Show "🤖 Generating story..." spinner
7. AI processes (1-3 seconds)
8. Story text appears in editable box
9. User reviews, can undo/redo
10. User selects "Add to 'My Childhood'" or "Create New Story"
11. Taps SAVE STORY
12. Segment saved with both transcription and AI story text
13. Return to recording screen

### Flow 2: Offline Recording
1. User records with no internet
2. Taps STOP RECORDING
3. Show StoryAssignmentView
4. Display raw transcription
5. Show "⚠️ No internet - story generation unavailable"
6. Show "Use original transcription" button
7. Or "Wait for internet and regenerate later"
8. User can still assign to story
9. AI can process later from vault

### Flow 3: Edit Existing Story
1. User taps segment in vault
2. Shows detail view with original + AI version
3. Can tap "Regenerate Story" button
4. New AI pass with fresh prompt
5. Undo/redo available

---

## 7. AI PROMPT ENGINEERING

### System Prompt
```
You are a memoir editor helping elderly users preserve their life stories.
Transform spoken transcriptions into polished, readable narrative text while
preserving the speaker's voice and all factual details.

Rules:
1. Remove filler words (um, uh, like, you know)
2. Fix grammar and add proper punctuation
3. Maintain first-person perspective
4. Keep all names, dates, places, and facts exactly as stated
5. Organize into clear paragraphs (new paragraph every 3-5 sentences)
6. Preserve emotional tone and personal voice
7. Do not add information not present in the original
8. Do not change the meaning or interpretation

Output only the improved story text, no explanations or meta-commentary.
```

### User Prompt (Per Recording)
```
Transform this spoken memory into polished story text:

[TRANSCRIPTION]
um so yeah I was born in 1945 in Boston and uh my father he worked at the
docks you know and uh we lived in a small apartment near the harbor...

[END TRANSCRIPTION]
```

---

## 8. IMPLEMENTATION FILES

### New Files to Create
1. **Views/StoryAssignmentView.swift** - Post-recording screen
2. **Managers/AIStoryGenerator.swift** - AI service integration
3. **Models/StoryVersion.swift** - Undo/redo data model
4. **Services/ClaudeAPIClient.swift** - API wrapper (or use existing AIInterviewer)

### Existing Files to Modify
1. **Views/AccessibleRecordingView.swift**
   - After stopRecording(), navigate to StoryAssignmentView
   - Pass segment data

2. **Models/CoreDataEntities.swift**
   - Add aiStoryText, aiProcessed, aiModel, editHistory fields

3. **Managers/CoreDataManager.swift**
   - Update createMemoirSegment() to accept AI story text
   - Add method: updateSegmentWithAIStory()

4. **MemoirGuide/Models/LifeBook.xcdatamodeld**
   - Add new attributes to MemoirSegmentEntity

---

## 9. CONFIGURATION

### API Keys (Secure Storage)
Store in iOS Keychain, not hardcoded:

```swift
// Keychain storage
KeychainHelper.save(key: "ANTHROPIC_API_KEY", value: apiKey)
KeychainHelper.retrieve(key: "ANTHROPIC_API_KEY")
```

### Settings (Future)
- AI model selection (Claude vs GPT vs Local)
- Processing speed (fast vs quality)
- Auto-assign to last story (skip selection screen)
- Always use raw transcription (disable AI)

---

## 10. UI/UX DETAILS

### Colors & Styling
- Raw transcription box: Light gray background (#F5F5F5)
- AI story box: White background with subtle border
- Undo button: Orange/yellow tint (↶ icon)
- Redo button: Blue/green tint (↷ icon)
- Processing spinner: Blue animated circle
- Save button: Green, prominent, 60pt height

### Accessibility
- All buttons: VoiceOver labels
- Story text: Supports Dynamic Type
- Undo/Redo: Haptic feedback on tap
- Status announcements: "Story generated successfully"
- Color contrast: WCAG AAA compliant

### Animations
- Story text fade-in when AI completes (0.3s ease)
- Button press: Scale 0.95 on touch
- Undo/redo: Slide transition between versions

---

## 11. ERROR HANDLING

### Possible Errors
1. **No internet connection**
   - Show alert: "No internet. Save with original transcription?"
   - Option: "Retry when online"
   - Fallback: Use raw transcription

2. **API error/timeout**
   - Retry once automatically
   - If fails: "Story generation unavailable. Use original?"
   - Log error for debugging

3. **Empty transcription**
   - Show: "No speech detected. Recording was audio only."
   - Still allow save to vault
   - Skip story assignment

4. **API rate limit**
   - Show: "Too many requests. Please wait 1 minute."
   - Disable regenerate button temporarily
   - Queue for later processing

---

## 12. TESTING SCENARIOS

### Test 1: Basic AI Story Generation
1. Record 30-second segment
2. Stop recording
3. ✅ EXPECT: StoryAssignmentView appears
4. ✅ EXPECT: Raw transcription visible
5. ✅ EXPECT: "Generating story..." shows
6. ✅ EXPECT: AI story appears within 3 seconds
7. ✅ EXPECT: Story is cleaned up (no "um", proper punctuation)

### Test 2: Undo/Redo
1. Complete Test 1
2. Tap UNDO button
3. ✅ EXPECT: Previous version shows (or initial if first)
4. Tap REDO button
5. ✅ EXPECT: Returns to latest version
6. ✅ EXPECT: Undo disabled at start of history
7. ✅ EXPECT: Redo disabled at end of history

### Test 3: Assign to Existing Story
1. Complete Test 1
2. Tap "Add to Existing Story" dropdown
3. ✅ EXPECT: List of existing stories appears
4. Select "My Childhood"
5. Tap SAVE STORY
6. ✅ EXPECT: Segment added to chapter
7. Go to Library → My Stories → "My Childhood"
8. ✅ EXPECT: Story shows new segment text

### Test 4: Create New Story
1. Complete Test 1
2. Tap "+ Create New Story" button
3. ✅ EXPECT: Text field appears
4. Type "The War Years"
5. Tap SAVE STORY
6. ✅ EXPECT: New chapter created
7. ✅ EXPECT: Segment assigned to it
8. Go to Library → My Stories
9. ✅ EXPECT: "The War Years" appears with 1 recording

### Test 5: Offline Behavior
1. Disable internet
2. Record segment
3. Stop recording
4. ✅ EXPECT: Warning about no internet
5. ✅ EXPECT: Raw transcription still available
6. ✅ EXPECT: Can save to story without AI version
7. Re-enable internet
8. Tap "Regenerate Story" in vault
9. ✅ EXPECT: AI processes and updates segment

---

## 13. PERFORMANCE REQUIREMENTS

- **AI Processing Time:** < 5 seconds for 500-word transcription
- **UI Responsiveness:** Main thread never blocks
- **Memory Usage:** < 50MB for AI processing
- **Battery Impact:** Minimal (API call, not local processing)
- **Storage:** ~2KB per segment for AI text (negligible)

---

## 14. DEFINITION OF DONE

### ✅ Feature Complete When:
- [ ] StoryAssignmentView created and displays after recording
- [ ] Raw transcription shows in top box
- [ ] AI story generates and displays in bottom box
- [ ] Undo button works (navigates version history)
- [ ] Redo button works (navigates forward)
- [ ] Can select existing story from dropdown
- [ ] Can create new story inline
- [ ] SAVE STORY button persists to Core Data
- [ ] Both transcription and AI story saved
- [ ] Offline mode gracefully degrades
- [ ] VoiceOver accessibility works
- [ ] Large button sizes (80pt) for undo/redo
- [ ] No crashes during AI processing
- [ ] API errors handled gracefully

### ✅ Quality Checks:
- [ ] AI output is readable and grammatically correct
- [ ] All names/dates/facts preserved exactly
- [ ] Filler words successfully removed
- [ ] Paragraph breaks logical and helpful
- [ ] First-person voice maintained
- [ ] Undo/redo works for at least 10 versions
- [ ] UI remains responsive during API calls
- [ ] Font sizes respect Dynamic Type settings

---

## 15. IMPLEMENTATION PRIORITY

### Phase 2A: Core AI Integration (HIGH PRIORITY)
1. Create AIStoryGenerator service
2. Integrate Claude API
3. Add aiStoryText field to Core Data
4. Update RecordingManager to call AI after stop
5. Test basic AI generation

### Phase 2B: Story Assignment UI (HIGH PRIORITY)
1. Create StoryAssignmentView
2. Display raw transcription
3. Display AI story text
4. Add story selection dropdown
5. Add create new story option
6. Wire up SAVE STORY button
7. Test full flow

### Phase 2C: Undo/Redo (MEDIUM PRIORITY)
1. Implement version history data model
2. Create undo/redo stack
3. Add large undo/redo buttons
4. Test version navigation
5. Add haptic feedback

### Phase 2D: Polish (LOW PRIORITY)
1. Offline fallback
2. Error handling UI
3. Loading animations
4. Accessibility audit
5. Performance optimization

---

## 16. TECHNICAL NOTES

### Claude API Integration
```swift
// Example API call
let client = Anthropic(apiKey: apiKey)
let message = client.messages.create(
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    messages: [
        .init(role: .user, content: prompt)
    ]
)
```

### Async/Await Pattern
```swift
func generateStory(from transcription: String) async throws -> String {
    let prompt = buildPrompt(transcription)
    let response = try await claudeAPI.generate(prompt)
    return response.content
}
```

### Core Data Thread Safety
```swift
// Always update on main thread
await MainActor.run {
    segment.aiStoryText = generatedStory
    segment.aiProcessed = true
    try? coreDataManager.save()
}
```

---

## 17. COST ESTIMATION

### Claude API Costs (Approximate)
- Input: 500 words ≈ 700 tokens @ $3/1M tokens = $0.0021
- Output: 400 words ≈ 550 tokens @ $15/1M tokens = $0.0083
- **Cost per recording: ~$0.01**
- **100 recordings: ~$1.00**

Very affordable for personal use.

---

## NEXT STEPS

1. Review this spec
2. Confirm AI service choice (Claude vs GPT vs Local)
3. Get API key if using cloud service
4. Begin Phase 2A implementation
5. Create StoryAssignmentView mockup
6. Test with real recordings

**Ready to implement? Confirm approach and I'll start building.**

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->

