# Life Book - Vault & Story System Specification

## Overview
Life Book captures spoken memories through audio recording and transcription. All recordings are permanently stored in "The Vault" - a never-deleted archive. Users can organize vault contents into "Stories" (chapters) for easier reading and sharing.

---

## 1. THE VAULT - Permanent Storage System

### Definition
The Vault is the permanent, immutable storage of all recorded memoir segments. Nothing in the vault is ever deleted.

### Requirements

#### 1.1 Automatic Segment Saving
**WHEN:** Recording is active
**WHAT:** Every 30 seconds, save current transcription and audio to Core Data
**WHERE:** `RecordingManager.autoSave()` (line 225)

**Implementation Checklist:**
- [ ] Create `MemoirSegmentEntity` in Core Data
- [ ] Save transcription text to entity
- [ ] Save audio file path to entity
- [ ] Save recording duration
- [ ] Save timestamp
- [ ] Link to current `MemoirSessionEntity`
- [ ] Persist context with error handling
- [ ] Update `lastAutoSave` timestamp on success

#### 1.2 Manual Segment Saving
**WHEN:** User taps STOP RECORDING
**WHAT:** Save complete segment to Core Data
**WHERE:** `AccessibleRecordingView.stopRecording()` (line 346)

**Implementation Checklist:**
- [ ] Receive `MemoirSegment` from `RecordingManager.stopRecording()`
- [ ] Save to Core Data via `CoreDataManager.createMemoirSegment()`
- [ ] Try CloudKit sync (non-blocking)
- [ ] Show success message with segment word count
- [ ] Keep segment in vault even if CloudKit fails

#### 1.3 Vault Persistence Rules
- **Rule 1:** All segments remain in Core Data forever
- **Rule 2:** Audio files stored in Documents directory, never deleted
- **Rule 3:** Failed CloudKit syncs retry automatically
- **Rule 4:** User cannot delete individual segments (only entire sessions)
- **Rule 5:** Segments without transcription are kept (audio-only backup)

---

## 2. STORY ORGANIZATION SYSTEM

### Definition
Stories (implemented as `ChapterEntity`) are user-created containers that organize vault segments into readable narratives.

### Requirements

#### 2.1 Story Creation
**WHERE:** LibraryView.swift (currently shows placeholder)

**User Flow:**
1. User navigates to "My Stories"
2. Taps "Create New Story" button
3. System prompts: "What would you like to call this story?"
4. User speaks story name OR types it
5. System creates `ChapterEntity` with that title
6. System shows story in library list

**Implementation Checklist:**
- [ ] Add "Create New Story" button to LibraryView
- [ ] Show sheet/modal for story name input
- [ ] Support voice input via speech recognition
- [ ] Support text input via keyboard
- [ ] Call `CoreDataManager.createChapter(title:)`
- [ ] Add new story to displayed list
- [ ] Auto-focus on new story for immediate editing

#### 2.2 Assigning Segments to Stories
**WHERE:** StoryEditorView (needs to be created)

**User Flow:**
1. User taps existing story in library
2. System shows story editor with:
   - Story title at top
   - "Add Recording" button
   - List of current segments in story
   - Preview of segment text
3. User taps "Add Recording"
4. System shows all vault segments not in this story
5. User taps segment to add it
6. Segment moves to story

**Implementation Checklist:**
- [ ] Create StoryEditorView.swift
- [ ] Display story title (editable)
- [ ] Show segments already in story (from `ChapterEntity.sessions`)
- [ ] Show "Add Recording" button
- [ ] Create segment picker showing unassigned vault segments
- [ ] Link selected segment's session to chapter
- [ ] Update chapter word count and duration
- [ ] Save changes to Core Data

#### 2.3 Story Display
**WHERE:** ReaderView.swift (exists but needs enhancement)

**Requirements:**
- [ ] Show story title as header
- [ ] Display all segments in chronological order
- [ ] Show segment timestamps
- [ ] Support playback of segment audio
- [ ] Allow text selection for copying
- [ ] Show total reading time estimate
- [ ] Generate AI summary of story (optional)

---

## 3. HELP SYSTEM

### Requirements

#### 3.1 Help Button Functionality
**WHERE:** `AccessibleRecordingView.showHelp()` (line 440)

**Implementation Checklist:**
- [ ] Create HelpView.swift
- [ ] Present as full-screen sheet with large text
- [ ] Show help sections (see 3.2)
- [ ] Support VoiceOver navigation
- [ ] Add "Close Help" button (large, accessible)
- [ ] Optionally speak help content aloud

#### 3.2 Help Content Sections

**Section 1: Getting Started**
```
RECORDING YOUR STORY

Tap the big green button to start recording.
Speak naturally - the app will write down your words.
Your recordings save automatically every 30 seconds.
Tap the red button to stop.

Everything you record is kept forever in your vault.
```

**Section 2: The Vault**
```
YOUR MEMORY VAULT

All your recordings are stored safely in the vault.
Nothing is ever deleted.
Your words are backed up to iCloud.
You can organize vault recordings into stories.
```

**Section 3: Creating Stories**
```
ORGANIZING INTO STORIES

Tap "My Stories" to see what you've recorded.
Tap "Create New Story" to start a new chapter.
Give it a name like "My Childhood" or "The War Years".
Add recordings from your vault to the story.
Share stories with family when ready.
```

**Section 4: Tips**
```
RECORDING TIPS

• Find a quiet place
• Speak clearly at a normal pace
• The app listens even if you pause
• Take breaks - recordings save automatically
• Review your stories anytime in the library
```

#### 3.3 Contextual Help
- [ ] Show help hint on first app launch
- [ ] Offer help after 30 seconds of inactivity
- [ ] Context-aware help based on current screen

---

## 4. ON-SCREEN TEXT & LABELS

### 4.1 Recording Screen Labels

**Main Recording Button (when idle):**
```
START RECORDING
```

**Main Recording Button (when recording):**
```
STOP RECORDING
[00:05:32]
```

**Screen Title/Header:**
```
Share Your Story
```

**Subtitle/Instructions:**
```
Tap to record. Your words are saved automatically.
```

**Auto-Save Status:**
```
✓ Auto-saved at 2:45 PM
```

**Transcription Header:**
```
Your Words
```

### 4.2 Library Screen Labels

**Screen Title:**
```
My Stories
```

**Buttons:**
```
+ Create New Story
```

**Empty State:**
```
No stories yet.
Tap + to create your first story.
```

### 4.3 Help Button Label
```
Help & Tips
```

---

## 5. TECHNICAL REQUIREMENTS

### 5.1 Core Data Schema (Already Exists)
- ✅ `MemoirSessionEntity` - Recording session
- ✅ `MemoirSegmentEntity` - Individual segment with transcription
- ✅ `ChapterEntity` - Story container
- ✅ `UserProfileEntity` - User data
- ✅ Relationships properly configured

### 5.2 File Storage
- **Audio Files:** `/Documents/memoir_YYYY-MM-DD_HH-mm-ss_N.m4a`
- **Persistence:** Core Data with CloudKit sync
- **Backup:** Automatic iCloud sync when connected

### 5.3 Performance Requirements
- Auto-save must complete in < 500ms
- UI must remain responsive during save
- Support recordings up to 4 hours
- Handle 1000+ segments in vault
- Load library in < 2 seconds

### 5.4 Accessibility Requirements (WCAG AAA)
- All buttons minimum 44pt touch target
- All text supports Dynamic Type (up to XXXL)
- Full VoiceOver support with labels
- High contrast mode support
- Reduce motion support
- Haptic feedback for state changes

---

## 6. DEFINITION OF DONE

### Vault System Complete When:
- [ ] Auto-save creates Core Data entries every 30 seconds during recording
- [ ] Stop recording saves final segment to Core Data
- [ ] All segments visible in raw vault view (can be in library)
- [ ] Audio files playable from vault
- [ ] CloudKit sync working (background, non-blocking)
- [ ] No data loss on app crash/termination

### Story System Complete When:
- [ ] User can create new story with custom name
- [ ] User can add vault segments to stories
- [ ] Stories display all assigned segments in order
- [ ] User can view multiple stories
- [ ] Story metadata (word count, duration) auto-calculated
- [ ] Segments can belong to multiple stories (non-destructive)

### Help System Complete When:
- [ ] Help button opens full help screen
- [ ] All 4 help sections display correctly
- [ ] Help text readable in XXXL Dynamic Type
- [ ] Help screen closes properly
- [ ] Contextual help shows on first launch
- [ ] VoiceOver reads help content correctly

### Overall System Complete When:
- [ ] User can record → auto-saves → stops → segment in vault
- [ ] User can view vault contents
- [ ] User can create story → add recordings → view story
- [ ] Help system explains all features
- [ ] All features work offline (CloudKit deferred)
- [ ] No crashes during 30-minute recording session
- [ ] Passes accessibility audit with VoiceOver

---

## 7. USER SCENARIOS (ACCEPTANCE TESTS)

### Scenario 1: First-Time User Records Memory
1. User opens app for first time
2. Sees welcome prompt
3. Taps Help, reads instructions
4. Closes help
5. Taps START RECORDING
6. Speaks for 2 minutes
7. Sees words appear in transcription area
8. Sees "Auto-saved" message appear
9. Taps STOP RECORDING
10. Sees confirmation: "Recording saved (247 words)"
11. ✅ **PASS:** Segment exists in Core Data vault

### Scenario 2: Organize Recordings into Story
1. User has 5 recorded segments in vault
2. Taps "My Stories"
3. Taps "+ Create New Story"
4. Says "My Childhood in Boston"
5. New story appears in list
6. Taps story to open editor
7. Taps "Add Recording"
8. Selects 3 segments from vault
9. Segments appear in story
10. Taps back to library
11. ✅ **PASS:** Story contains 3 segments, readable in ReaderView

### Scenario 3: Long Recording with Auto-Save
1. User starts recording
2. Speaks continuously for 10 minutes
3. Observes "Auto-saved" message every 30 seconds
4. App crashes at 8 minutes (simulated)
5. User reopens app
6. Goes to vault
7. ✅ **PASS:** 16 auto-saved segments recovered (8 min × 2 per min)

### Scenario 4: Offline Recording
1. User disables WiFi and cellular
2. Records 3-minute segment
3. Stops recording
4. Sees "Recording saved locally, will sync when online"
5. Re-enables network
6. ✅ **PASS:** Segment syncs to CloudKit automatically

---

## 8. IMPLEMENTATION PRIORITY

### Phase 1: Core Vault Functionality (CRITICAL)
1. Fix auto-save to persist to Core Data
2. Fix stop recording to persist to Core Data
3. Add vault view to LibraryView (show all segments)
4. Test recording → save → retrieve cycle

### Phase 2: Story Organization (HIGH)
1. Create story creation UI
2. Build story editor view
3. Implement segment assignment
4. Update ReaderView for stories
5. Test full story workflow

### Phase 3: Help System (MEDIUM)
1. Create HelpView with all sections
2. Wire up Help button
3. Add first-launch help prompt
4. Test accessibility with VoiceOver

### Phase 4: Polish (LOW)
1. Add contextual help hints
2. Improve error messages
3. Add segment search
4. Add story sharing

---

## 9. FILES TO MODIFY

### Existing Files
- `MemoirGuide/Managers/RecordingManager.swift` (fix auto-save)
- `MemoirGuide/Views/AccessibleRecordingView.swift` (wire help button)
- `MemoirGuide/Views/LibraryView.swift` (add story creation)
- `MemoirGuide/Views/ReaderView.swift` (enhance story display)
- `MemoirGuide/Managers/CoreDataManager.swift` (verify save methods)

### New Files to Create
- `MemoirGuide/Views/HelpView.swift` (help system)
- `MemoirGuide/Views/StoryEditorView.swift` (story management)
- `MemoirGuide/Views/VaultView.swift` (raw segment browser)
- `MemoirGuide/Views/Components/SegmentCard.swift` (reusable segment UI)

---

## 10. SUCCESS CRITERIA

**The implementation is complete when:**

An 80-year-old user with limited tech experience can:
1. Open the app
2. Understand what to do (via help or UI)
3. Record a 5-minute memory
4. Know it was saved (visual feedback)
5. Create a story about their childhood
6. Add 3 recordings to that story
7. Read the story back
8. Trust that nothing will be lost

**All of the above without asking for assistance.**

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->

