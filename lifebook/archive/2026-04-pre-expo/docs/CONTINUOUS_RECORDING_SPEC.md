# Continuous Recording & ChatGPT Conversation Mode Specification
## Aurora - Pure Voice-First Experience

---

## 🎯 Vision Statement

**"The app becomes invisible. The conversation becomes everything."**

Users never tap to record. Hugh listens continuously while the app is open, responding naturally when the user pauses—exactly like ChatGPT's voice mode.

---

## 📋 Requirements (From Original Vision)

### Core Functionality
1. ✅ **Remove tap-to-record button** - continuous recording while app is open
2. ✅ **ChatGPT conversation mode** - AI responds when user pauses or loses their way
3. ✅ **Silence detection** - detect when user pauses to know when to respond
4. ✅ **Icon-only navigation** - 📖 for My Stories, 😊 for Me (family tree)
5. ✅ **Remove Help & Settings** - zero configuration, no menus needed
6. ✅ **10% safe space** - top and bottom of screen always unused
7. ✅ **Pure voice interaction** - all control via conversation, no manual UI

### User Experience Flow
```
User opens app
↓
Hugh greets: "Hi! I'm Hugh, your memory companion. What's on your mind today?"
↓
App starts listening immediately (continuous recording)
↓
User speaks naturally
↓
User pauses for 3+ seconds
↓
Hugh detects silence
↓
Hugh responds conversationally (encouragement, follow-up question, or confirmation)
↓
User continues or changes topic
↓
Cycle repeats
```

---

## 🏗️ Architecture Components

### 1. Continuous Recording Service
**File**: `Aurora/Services/ContinuousRecordingService.swift`

**Responsibilities**:
- Start recording immediately on app open
- Never stop recording while app is in foreground
- Continuously transcribe audio using Speech framework
- Segment recordings based on silence detection
- Auto-save segments in background

**Key Methods**:
```swift
class ContinuousRecordingService: ObservableObject {
    func startContinuousRecording() async
    func pauseForHughResponse() async
    func resumeAfterHugh() async
    func saveCurrentSegment() async
    func handleAppBackground() async
}
```

### 2. Silence Detection Service
**File**: `Aurora/Services/SilenceDetectionService.swift`

**Responsibilities**:
- Monitor audio levels in real-time
- Detect silence thresholds (< -50 dB for 3+ seconds)
- Trigger conversation manager when user pauses
- Distinguish between natural pauses and end of thought

**Key Methods**:
```swift
class SilenceDetectionService: ObservableObject {
    func startMonitoring(audioLevels: Published<Float>.Publisher)
    func detectSilence() -> AsyncStream<SilenceEvent>
    var silenceThreshold: Float { get set }
    var silenceDuration: TimeInterval { get set }
}
```

### 3. Conversation Manager Service
**File**: `Aurora/Services/ConversationManagerService.swift`

**Responsibilities**:
- Decide when Hugh should respond
- Generate contextual responses (encouragement, questions, confirmation)
- Integrate with HughVoiceService for TTS
- Manage conversation flow state

**Response Types**:
1. **Encouragement**: "That's a lovely memory. Thank you for sharing."
2. **Follow-up Question**: "I'd love to hear more about that. Can you tell me..."
3. **Topic Shift**: "Wonderful! What else is on your mind?"
4. **Confirmation**: "I'm saving that memory for you."

**Key Methods**:
```swift
class ConversationManagerService: ObservableObject {
    func handleUserPause(transcription: String) async
    func generateResponse(context: ConversationContext) async -> HughResponse
    func speakResponse(_ response: HughResponse) async
    var isHughSpeaking: Bool { get }
}
```

### 4. HomeView UI Redesign
**File**: `Aurora/HomeView.swift`

**Changes**:
- ❌ Remove tap-to-record button entirely
- ✅ Show live transcription always (conversation view)
- ✅ Icon-only navigation (📖 Stories, 😊 Me)
- ❌ Remove Help button
- ❌ Remove Settings button
- ✅ 10% top safe space (status bar + padding)
- ✅ 10% bottom safe space (gesture area + padding)
- ✅ Hugh speaking indicator (when responding)

**Layout**:
```
┌─────────────────────────┐
│   10% Safe Space        │  <- Status bar area
├─────────────────────────┤
│   Good Morning, Matt    │  <- Greeting
├─────────────────────────┤
│   Today's Prompt        │  <- AI prompt card
│   Tell me about...      │
├─────────────────────────┤
│                         │
│   Live Conversation     │  <- Scrolling transcript
│   User: I remember...   │     Always visible
│   Hugh: How wonderful!  │     Auto-scrolls
│   User: It was 1965...  │
│                         │
├─────────────────────────┤
│   📖              😊    │  <- Icon-only nav
├─────────────────────────┤
│   10% Safe Space        │  <- Bottom gesture area
└─────────────────────────┘
```

---

## 🔧 Implementation Tasks

### Task 1: Silence Detection Service
**Agent**: `silence-detection-specialist`
**File**: `Aurora/Services/SilenceDetectionService.swift`
**Deliverables**:
- Monitor audio levels from AVAudioRecorder metering
- Detect silence: < -50 dB for 3+ seconds
- Emit silence events via AsyncStream
- Unit tests for silence detection thresholds

### Task 2: Continuous Recording Service
**Agent**: `continuous-recording-specialist`
**File**: `Aurora/Services/ContinuousRecordingService.swift`
**Deliverables**:
- Start recording on app launch
- Continuous transcription using Speech framework
- Auto-segment on silence detection
- Background saving of segments
- Integration with existing AudioRecordingManager

### Task 3: Conversation Manager Service
**Agent**: `conversation-manager-specialist`
**File**: `Aurora/Services/ConversationManagerService.swift`
**Deliverables**:
- Handle silence events
- Generate contextual Hugh responses
- Integrate with HughVoiceService for TTS
- Pause recording during Hugh speech
- Resume after Hugh finishes

### Task 4: HomeView UI Redesign
**Agent**: `ui-redesign-specialist`
**File**: `Aurora/HomeView.swift`
**Deliverables**:
- Remove record button entirely
- Implement conversation transcript view
- Icon-only navigation (📖, 😊)
- Remove Help & Settings buttons
- 10% safe space top/bottom
- Hugh speaking indicator

### Task 5: Backend Conversation Endpoints
**Agent**: `backend-conversation-specialist`
**File**: `Aurora-backend/src/index.js`
**Deliverables**:
- `POST /ai/respond` - Generate Hugh's conversational response
- Accept: transcription, conversationHistory, userPauseType
- Return: response text, responseType (encouragement/question/confirmation)
- Integrate with Claude API for natural responses

### Task 6: Integration & Testing
**Agent**: `integration-testing-specialist`
**Files**: All above
**Deliverables**:
- Integrate all services into HomeView
- Test continuous recording → silence detection → Hugh response cycle
- Verify memory auto-saving works
- Test conversation state persistence
- Deploy to device and validate

---

## 📐 Technical Specifications

### Silence Detection Parameters
- **Silence Threshold**: < -50 dB
- **Silence Duration**: 3 seconds
- **Sampling Rate**: 100ms intervals
- **Pause Types**:
  - Short pause (1-2s): Continue listening, no response
  - Medium pause (3-4s): Hugh encouragement or question
  - Long pause (5+ s): Save segment, suggest new topic

### Audio Configuration
- **Sample Rate**: 44.1 kHz
- **Bit Depth**: 16-bit
- **Channels**: Mono
- **Format**: Linear PCM
- **Metering**: Enabled (for silence detection)

### Conversation State Machine
```
States:
- LISTENING: User speaking, transcribing
- SILENT: User paused, analyzing context
- HUGH_RESPONDING: Hugh speaking, recording paused
- SAVING: Segment complete, saving to storage

Transitions:
LISTENING → SILENT (silence detected)
SILENT → HUGH_RESPONDING (Hugh generates response)
HUGH_RESPONDING → LISTENING (Hugh finishes speaking)
LISTENING → SAVING (long pause or topic shift)
```

### Hugh Response Logic
```swift
func generateResponse(context: ConversationContext) -> HughResponse {
    // Determine response type based on:
    // 1. Length of user's speech (short vs long)
    // 2. Content analysis (complete thought vs incomplete)
    // 3. Conversation history (new topic vs continuation)

    if context.speechDuration < 10.0 {
        return .encouragement("That's interesting! Tell me more.")
    } else if context.seemsComplete {
        return .question(generateFollowUpQuestion(context.transcription))
    } else {
        return .encouragement("I'm listening...")
    }
}
```

---

## 🎨 Design System Updates

### Icon-Only Navigation
```swift
// Replace text buttons with icon-only
HStack(spacing: 40) {
    Button(action: { /* Navigate to Stories */ }) {
        Image(systemName: "book.fill")
            .font(.system(size: 32))
            .foregroundColor(DesignSystem.primaryTeal)
    }

    Button(action: { /* Navigate to Me */ }) {
        Image(systemName: "face.smiling.fill")
            .font(.system(size: 32))
            .foregroundColor(.purple)
    }
}
```

### Safe Space Enforcement
```swift
// 10% top safe space
.padding(.top, UIScreen.main.bounds.height * 0.10)

// 10% bottom safe space
.padding(.bottom, UIScreen.main.bounds.height * 0.10)
```

### Conversation Transcript View
```swift
ScrollViewReader { proxy in
    ScrollView {
        VStack(alignment: .leading, spacing: 16) {
            ForEach(conversationMessages) { message in
                if message.speaker == .user {
                    UserMessageBubble(text: message.text)
                } else {
                    HughMessageBubble(text: message.text)
                }
            }
        }
        .padding()
    }
    .onChange(of: conversationMessages.count) { _ in
        // Auto-scroll to latest message
        proxy.scrollTo(conversationMessages.last?.id)
    }
}
```

---

## 🧪 Testing Strategy

### Unit Tests
- ✅ Silence detection thresholds (various dB levels)
- ✅ Conversation state machine transitions
- ✅ Hugh response generation logic
- ✅ Audio segmentation accuracy

### Integration Tests
- ✅ End-to-end: User speaks → Silence → Hugh responds → User continues
- ✅ Background saving of conversation segments
- ✅ Voice command detection during conversation
- ✅ App foreground/background transitions

### User Acceptance Tests
1. **Natural Conversation Flow**
   - Open app → Hugh greets immediately
   - Speak naturally → Hugh listens without interruption
   - Pause 3+ seconds → Hugh responds appropriately
   - Continue conversation → Hugh adapts to context

2. **Voice Command Integration**
   - Say "slow down" during conversation → Hugh adjusts and confirms
   - Say "deeper voice" → Hugh switches voice mid-conversation
   - Voice commands don't break conversation flow

3. **Memory Preservation**
   - Long conversation auto-segments appropriately
   - All content saved to Stories
   - AI enhancement happens in background
   - No data loss during transitions

---

## 📊 Success Metrics

- ✅ Zero tap-to-record interactions needed
- ✅ Natural conversation flow maintained
- ✅ Hugh responds within 0.5s of silence detection
- ✅ 100% of conversation content saved
- ✅ Zero UI configuration required
- ✅ Elderly users can converse without manual controls

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All services implemented and unit tested
- [ ] Integration tests passing
- [ ] HomeView redesigned (icons only, no buttons)
- [ ] Backend conversation endpoint deployed
- [ ] Device testing completed

### Deployment Steps
1. Deploy backend: `cd Aurora-backend && npx wrangler deploy`
2. Build iOS app: `xcodebuild -project Aurora.xcodeproj -scheme Aurora build`
3. Install on device: `xcrun devicectl device install app --device [ID] [APP_PATH]`
4. Test continuous recording flow
5. Verify Hugh responds naturally to pauses
6. Confirm all memories auto-save

### Post-Deployment Validation
- [ ] App opens → Hugh greets → Continuous recording starts
- [ ] User speaks → Transcription appears in real-time
- [ ] User pauses 3s → Hugh responds contextually
- [ ] Voice commands work mid-conversation
- [ ] Icon navigation functional
- [ ] 10% safe spaces enforced
- [ ] All conversation segments saved to Stories

---

## 📝 Implementation Notes

### Audio Session Management
```swift
// Configure for continuous recording + playback
let session = AVAudioSession.sharedInstance()
try session.setCategory(
    .playAndRecord,
    mode: .spokenAudio,
    options: [.defaultToSpeaker, .allowBluetooth, .duckOthers]
)
```

### Background Audio Handling
```swift
// Continue recording when app backgrounds
// Save current segment and pause transcription
func handleAppBackground() {
    saveCurrentSegment()
    pauseTranscription()
    // Recording continues via background audio capability
}
```

### Memory Management
```swift
// Conversation segments saved every 5 minutes or on long pause
// Max segment length: 5 minutes
// Auto-save prevents data loss during long conversations
```

---

**Status**: 📝 Specification Complete - Ready for Agent Implementation

**Next Step**: Spawn 6 specialist agents to implement each task in parallel

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->

