# Zero-Configuration Voice System Specification
## Aurora - Voice-First Memoir App

---

## 🎯 Core Philosophy

**The app becomes invisible. The conversation becomes everything.**

Users don't configure—they just talk. Hugh adapts conversationally through natural language commands.

---

## ✅ Implementation Status

### Completed Components

#### 1. Dynamic Voice/Speed Control (HughVoiceService.swift)
**Location**: `/Users/mattwright/pandora/lifebook/Aurora/Services/HughVoiceService.swift`

**Features**:
- ✅ `@AppStorage` persistence for voice and speed preferences
- ✅ Default: Echo voice, 0.9 speed (optimal for elderly)
- ✅ Methods for conversational adjustments:
  - `slowDown()` - Reduces speed by 0.1 (min 0.7)
  - `speedUp()` - Increases speed by 0.1 (max 1.0)
  - `changeToDeeper()` - Switches to Onyx voice
  - `changeToLighter()` - Switches to Nova voice
  - `changeToClearer()` - Switches to Alloy voice
  - `changeToSofter()` - Switches to Shimmer voice
  - `cycleVoice()` - Rotates through all 6 voices
  - `confirmPreference()` - Confirms "I'll remember that"

#### 2. Voice Command Detection (VoiceCommandService.swift)
**Location**: `/Users/mattwright/pandora/lifebook/Aurora/Services/VoiceCommandService.swift`

**Detects**:
- Speed commands: "too fast", "slow down", "slower", "faster", "speed up"
- Voice changes: "deeper", "lighter", "clearer", "softer", "different voice"
- Confirmations: "that's better", "yes that's good", "perfect"

**Flow**:
```
User: "Slow down"
↓
VoiceCommandService detects command
↓
Calls hughVoice.slowDown()
↓
Hugh responds: "I'll slow down for you"
↓
Preference saved automatically
```

#### 3. Backend TTS with Voice Parameters (index.js)
**Location**: `/Users/mattwright/pandora/lifebook/Aurora-backend/src/index.js`

**Updated Endpoint**: `POST /ai/speak`

**Accepts**:
```json
{
  "text": "Hello!",
  "voice": "echo",     // Optional, default: echo
  "speed": 0.9,        // Optional, default: 0.9
  "phraseKey": "welcome" // Optional, for caching
}
```

**Caching Strategy**:
- Cache key = `phraseKey_voice_speed`
- Example: `welcome_echo_0.9`
- Allows different cached versions per voice/speed combo

**OpenAI TTS Integration**:
```javascript
async function generateOpenAITTS(text, apiKey, voice = 'echo', speed = 0.9) {
  // Sends voice and speed to OpenAI TTS API
  model: 'tts-1',
  voice: voice,  // echo, alloy, nova, shimmer, onyx, fable
  speed: speed   // 0.7 - 1.0
}
```

#### 4. Integration into Recording Flow (HomeView.swift)
**Location**: `/Users/mattwright/pandora/lifebook/Aurora/HomeView.swift`

**Voice Command Detection**:
```swift
if voiceCommands.containsVoiceCommand(result.transcription) {
    await voiceCommands.processTranscription(result.transcription)
    return // Don't save command as a story
}
```

**Welcome Message Updated**:
```
Old: "Hi there! I'm Hugh, your manatee guide. I'm here to help you preserve your precious memories. Ready to share a story?"
New: "Hi! I'm Hugh, your memory companion. What's on your mind today?"
```

---

## 📋 Remaining Tasks

### Task 1: Deploy Backend with Voice Support
**Action**: Deploy updated Cloudflare Workers backend
**Command**:
```bash
cd Aurora-backend
npx wrangler deploy
```

**Expected Output**: Backend deployed with `/ai/speak` accepting voice/speed params

### Task 2: Build iOS App
**Action**: Build updated Aurora app with voice command detection
**Command**:
```bash
xcodebuild -project Aurora.xcodeproj -scheme Aurora -configuration Debug -sdk iphoneos build
```

**Expected**: Build succeeds with no errors

### Task 3: Install on Device
**Action**: Install on test device
**Command**:
```bash
xcrun devicectl device install app --device 00008140-0019355A22D2801C /Users/mattwright/Library/Developer/Xcode/DerivedData/Aurora-gwgnhwkncypqigfdghsagssytivg/Build/Products/Debug-iphoneos/Aurora.app
```

### Task 4: Test Voice Commands
**Test Scenarios**:

1. **Speed Adjustment Test**:
   - Open app → Hugh greets in Echo 0.9
   - Say: "Slow down"
   - Expected: Hugh responds "I'll slow down for you" (now 0.8 speed)
   - Say: "That's better"
   - Expected: Hugh responds "Great, I'll remember that"
   - Close and reopen app
   - Expected: Hugh still speaks at 0.8 speed (persisted)

2. **Voice Change Test**:
   - Say: "Speak deeper"
   - Expected: Hugh switches to Onyx voice, says "How's this?"
   - Say: "Different voice"
   - Expected: Hugh cycles to next voice, says "Is this better?"

3. **Multiple Adjustments Test**:
   - Say: "Too fast"
   - Expected: Speed reduces
   - Say: "Clearer voice"
   - Expected: Switches to Alloy voice
   - Say: "Perfect"
   - Expected: Saves both speed and voice preferences

4. **Persistence Test**:
   - Make adjustments (e.g., Onyx voice, 0.75 speed)
   - Force quit app
   - Reopen app
   - Expected: Hugh speaks in Onyx voice at 0.75 speed

---

## 🎯 Available Voices

### 6 OpenAI TTS Voices

1. **Echo** (Default)
   - Personality: Warm, professional, George Clooney/Paul Rudd vibe
   - Best for: Most elderly users

2. **Alloy**
   - Personality: Balanced, clear, trustworthy
   - Best for: Users who want crisp speech

3. **Nova**
   - Personality: Upbeat, encouraging, positive
   - Best for: Users who want energy

4. **Shimmer**
   - Personality: Calm, gentle, nurturing
   - Best for: Users who want softness

5. **Onyx**
   - Personality: Deep, wise, grandfatherly
   - Best for: Users who want authoritative voice

6. **Fable**
   - Personality: British accent, storyteller
   - Best for: Users who want theatrical voice

---

## 🔄 Voice Command Reference

### Speed Commands
| User Says | Action | Hugh Response |
|-----------|--------|---------------|
| "Too fast" / "Slow down" / "Slower" | `slowDown()` | "I'll slow down for you." |
| "Too slow" / "Faster" / "Speed up" | `speedUp()` | "I'll speed up a bit." |

### Voice Commands
| User Says | Action | Hugh Response |
|-----------|--------|---------------|
| "Deeper" / "Lower voice" | `changeToDeeper()` (Onyx) | "How's this?" |
| "Higher" / "Lighter" | `changeToLighter()` (Nova) | "How's this?" |
| "Clearer" | `changeToClearer()` (Alloy) | "Is this clearer?" |
| "Softer" / "Gentler" | `changeToSofter()` (Shimmer) | "How about this?" |
| "Different voice" | `cycleVoice()` | "Is this better?" |

### Confirmation Commands
| User Says | Action | Hugh Response |
|-----------|--------|---------------|
| "That's better" / "Yes that's good" / "Perfect" | `confirmPreference()` | "Great, I'll remember that." |

---

## 🧪 Testing Checklist

### Functional Tests
- [ ] Backend accepts voice/speed parameters
- [ ] Default voice (Echo 0.9) works on first launch
- [ ] "Slow down" command reduces speed
- [ ] "Faster" command increases speed
- [ ] "Deeper" command switches to Onyx voice
- [ ] "Different voice" cycles through voices
- [ ] "That's better" saves preferences
- [ ] Preferences persist across app restarts
- [ ] Voice commands don't save as stories
- [ ] Regular recordings still work normally

### Edge Cases
- [ ] Speed doesn't go below 0.7
- [ ] Speed doesn't go above 1.0
- [ ] Voice cycling loops back to first voice
- [ ] Multiple rapid commands handled correctly
- [ ] Commands work during auto-save mode

### User Experience
- [ ] Hugh's responses feel natural
- [ ] Voice changes are smooth (no jarring transitions)
- [ ] Confirmation messages are clear
- [ ] No UI needed for voice adjustments
- [ ] Commands are easy to remember

---

## 📊 Success Metrics

- ✅ Zero-configuration: User never sees voice selection UI
- ✅ Conversational: All adjustments via natural language
- ✅ Persistent: Preferences saved automatically
- ✅ Smooth: Voice changes feel like conversation, not config
- ✅ Accessible: Elderly users can adjust without menus

---

## 🚀 Deployment Instructions

### Step 1: Deploy Backend
```bash
cd /Users/mattwright/pandora/lifebook/Aurora-backend
npx wrangler deploy
```

### Step 2: Build iOS App
```bash
cd /Users/mattwright/pandora/lifebook
xcodebuild -project Aurora.xcodeproj -scheme Aurora -configuration Debug -sdk iphoneos build
```

### Step 3: Install on Device
```bash
xcrun devicectl device install app --device 00008140-0019355A22D2801C /Users/mattwright/Library/Developer/Xcode/DerivedData/Aurora-gwgnhwkncypqigfdghsagssytivg/Build/Products/Debug-iphoneos/Aurora.app
```

### Step 4: Test Voice Commands
- Open app
- Let Hugh greet you
- Try: "Slow down"
- Try: "Speak deeper"
- Try: "That's better"
- Verify preferences persist

---

## 🎬 Final User Flow

1. **User downloads app**
2. **Opens app** → Hugh speaks immediately in Echo 0.9: "Hi! I'm Hugh, your memory companion. What's on your mind today?"
3. **User starts talking** → Hugh listens
4. **(Optional) User says "Too fast"** → Hugh slows down automatically
5. **(Optional) User says "Deeper voice"** → Hugh switches to Onyx
6. **(Optional) User says "That's better"** → Hugh saves preference
7. **User continues sharing memories** → Hugh remembers their voice preferences forever

**Zero menus. Zero configuration. Just conversation.**

---

## 📝 Next Enhancements (Future)

1. **AI Auto-Detection**
   - Detect "What?" repetitions → Auto slow down
   - Detect struggle → Auto switch to clearer voice

2. **Continuous Recording Mode**
   - Remove tap-to-record button
   - Always-on recording with silence detection
   - ChatGPT-style conversation (Hugh responds on pause)

3. **Advanced Voice Commands**
   - "Speak like [name]" → Match family member's voice
   - "Read that back" → Hugh reads story in user's preferred voice
   - "Change speed to 0.8" → Precise speed control

---

**Status**: ✅ Core implementation complete. Ready for deployment and testing.

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->

