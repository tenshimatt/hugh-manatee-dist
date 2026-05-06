# Hugh Manatee — Android Native App Implementation Plan

> **For Hermes:** Build phase by phase. Each task is independently testable.

**Goal:** Build a native Android app (Kotlin + Jetpack Compose) for Hugh Manatee —
an elderly-friendly memoir recording app using ElevenLabs Conversational AI.

**Architecture:** Single-activity Compose app with Navigation Compose routing.
Cloudflare Worker backend (already deployed). ElevenLabs CAI via LiveKit Android
SDK WebRTC. Local-only storage via Room (SQLite + FTS5). No cloud sync, no
accounts — everything stays on device.

**Tech Stack:**
- Kotlin 2.0 + Jetpack Compose + Material 3
- LiveKit Android SDK (`io.livekit:livekit-android`) for ElevenLabs WebRTC
- Retrofit + OkHttp + Kotlin Serialization for Worker API
- Room (SQLite + FTS5) for local persistence
- DataStore for key-value preferences
- Navigation Compose for routing
- Coroutines + Flow for async

**Design System (ported from Expo theme.ts):**
- Colors: bgTop=#F4ECE1, ink=#1E1B17, accent=#B8651A, surface=#FFFFFF
- Font sizes: body=22sp, bodyLarge=26sp, heading=34sp, display=56sp
- Touch targets: minimum 56dp primary, 44dp secondary
- Large text support via CompositionLocal

**Bundle ID:** `com.beyondpandora.hughmanatee`

---

## Phase 0 — Project Scaffold

### Task 0.1: Create Android project

**Objective:** Scaffold a clean Kotlin/Compose project with Gradle KTS

**Files:**
- Create: `android/` directory with full Gradle project structure

**Commands:**
```bash
mkdir -p /tmp/hugh-manatee-app/lifebook/android
cd /tmp/hugh-manatee-app/lifebook/android
# Manual scaffold — no Android Studio available on server
```

Use Android Gradle Plugin 8.6, Kotlin 2.0, Compose BOM 2024.05, targeting API 24+ (matching existing iOS 15.0+).

### Task 0.2: Theme system

**Objective:** Port design tokens from `app/src/lib/theme.ts` to Kotlin

**Files:**
- Create: `.../ui/theme/Color.kt`
- Create: `.../ui/theme/Type.kt`
- Create: `.../ui/theme/Spacing.kt`
- Create: `.../ui/theme/Theme.kt`

Exact color values from the Expo theme:
```kotlin
val BgTop = Color(0xFFF4ECE1)
val BgBottom = Color(0xFFE8D9C4)
val Ink = Color(0xFF1E1B17)
val InkSoft = Color(0xFF4A443C)
val Accent = Color(0xFFB8651A)
val Surface = Color(0xFFFFFFFF)
val Danger = Color(0xFF9A2A2A)
val Divider = Color(0xFFD8CEBE)
```

Large type scale (elderly-first):
```kotlin
val HughType = Typography(
    bodyLarge = TextStyle(fontSize = 26.sp),
    bodyMedium = TextStyle(fontSize = 22.sp),
    headlineLarge = TextStyle(fontSize = 34.sp),
    displayLarge = TextStyle(fontSize = 56.sp),
)
```

### Task 0.3: Navigation scaffold

**Objective:** Set up NavHost with routes for all screens

**Files:**
- Create: `.../navigation/HughNavHost.kt`
- Create: `.../navigation/Routes.kt`

Routes:
```kotlin
sealed class Route(val path: String) {
    object Onboarding : Route("onboarding")
    object Conversation : Route("conversation")
    object Library : Route("library")
    data class Session(val id: String) : Route("session/{id}")
    object Settings : Route("settings")
}
```

Entry redirect logic: check DataStore for profile → go to /onboarding if none, else /conversation.

---

## Phase 1 — Backend Integration

### Task 1.1: Worker API client

**Objective:** Retrofit client for the three Worker endpoints

**Files:**
- Create: `.../data/worker/WorkerApi.kt`
- Create: `.../data/worker/WorkerModels.kt`
- Create: `.../data/worker/WorkerClient.kt`

Endpoints (matching `app/src/services/worker.ts`):
```kotlin
interface WorkerApi {
    @POST("/agent/config")
    suspend fun getAgentConfig(@Body req: AgentConfigRequest): AgentConfigResponse

    @POST("/collage/images")
    suspend fun getCollageImages(@Body req: CollageRequest): CollageResponse

    @POST("/session/anchor")
    suspend fun getSessionAnchor(@Body req: AnchorRequest): AnchorResponse
}
```

Base URL: `https://hugh-manatee-worker.findrawdogfood.workers.dev`

Models exactly matching the TypeScript interfaces in worker.ts:
```kotlin
@Serializable
data class AgentConfigRequest(
    val first_name: String,
    val birth_year: Int? = null,
    val hometown: String? = null,
    val voice_id: String,
    val last_anchor: String? = null,
    val preference: String? = null
)

@Serializable
data class AgentConfigResponse(
    val agent_id: String,
    val conversation_token: String,
    val first_turn: String,
    val runtime_context: RuntimeContext
)
```

### Task 1.2: Local database schema

**Objective:** Room entities + DAOs matching SQLite schema from `app/src/db/schema.ts`

**Files:**
- Create: `.../data/local/entities/ProfileEntity.kt`
- Create: `.../data/local/entities/SessionEntity.kt`
- Create: `.../data/local/entities/TurnEntity.kt`
- Create: `.../data/local/dao/ProfileDao.kt`
- Create: `.../data/local/dao/SessionDao.kt`
- Create: `.../data/local/dao/TurnDao.kt`
- Create: `.../data/local/HughDatabase.kt`

Tables matching the existing SQLite schema exactly:
```kotlin
@Entity(tableName = "profile")
data class ProfileEntity(
    @PrimaryKey val id: Int = 1, // CHECK id = 1
    val first_name: String,
    val birth_year: Int?,
    val hometown: String?,
    val voice_id: String,
    val agent_id: String,
    val created_at: Long,
    val updated_at: Long
)

@Entity(
    tableName = "sessions",
    foreignKeys = [ForeignKey(...)]
)
data class SessionEntity(
    @PrimaryKey val id: String, // UUID
    val started_at: Long,
    val ended_at: Long?,
    val duration_sec: Int?,
    val title: String?,
    val anchor_phrase: String?,
    val audio_path: String?,
    val prompt_version: String
)

@Entity(tableName = "turns")
data class TurnEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val session_id: String,
    val ordinal: Int,
    val speaker: String, // "user" or "hugh"
    val text: String,
    val started_at: Long,
    val duration_ms: Int?
)
```

FTS5 on `turns.text` — Room FTS4 wrapper + raw query or use `@RawQuery` for FTS5.

### Task 1.3: Repository layer

**Objective:** Repository classes wrapping DAO + Worker API

**Files:**
- Create: `.../data/repository/ProfileRepository.kt`
- Create: `.../data/repository/SessionRepository.kt`
- Create: `.../data/repository/ConversationRepository.kt`

---

## Phase 2 — Onboarding Flow (4 screens)

### Task 2.1: Name screen (ONB-01)

**Objective:** First onboarding step — capture first name

**Files:**
- Create: `.../ui/onboarding/NameScreen.kt`

UI:
- Large "Welcome" heading
- "What should Hugh call you?" subtext
- TextField with `fontSize=26.sp`, auto-focus, Next button
- StickyFooter with "Continue" button (minHeight=56.dp)
- `maxFontSizeMultiplier=1.15` equivalent via `fontScale` clamp

### Task 2.2: Voice picker (ONB-02)

**Objective:** Choose Hugh's voice from 3 options

**Files:**
- Create: `.../ui/onboarding/VoicePickerScreen.kt`

Three voice cards (matching PLACEHOLDER_VOICES):
- Nora: "Warm, calm. A friend over tea."
- Arthur: "Steady, gentle. An older friend."
- June: "Brighter, curious. Asks good questions."

Each card shows label + description. Selected state with accent border. Continue in sticky footer.

### Task 2.3: Birth year + hometown (ONB-03, ONB-04)

**Objective:** Optional demographic context for better conversation

**Files:**
- Create: `.../ui/onboarding/ContextScreen.kt`

- Birth year: numeric TextField, 4 digits, strips non-numeric
- Hometown: free-text TextField
- Both optional, "Skip" button + "Continue" in footer

### Task 2.4: Privacy statement (ONB-05)

**Objective:** Plain-English privacy screen before first conversation

**Files:**
- Create: `.../ui/onboarding/PrivacyScreen.kt`

Text: "Everything stays on your phone. Hugh doesn't share your stories with anyone. No accounts, no cloud storage, no data collection. When you delete the app, everything is gone."

Single button: "Meet Hugh" → saves profile to Room, navigates to /conversation.

### Task 2.5: OnboardingViewModel + state management

**Objective:** Wire all 4 screens to a shared ViewModel

**Files:**
- Create: `.../ui/onboarding/OnboardingViewModel.kt`
- Modify: Onboarding screens to consume ViewModel

---

## Phase 3 — Conversation Screen (the core product)

### Task 3.1: LiveKit WebRTC integration

**Objective:** ElevenLabs CAI connection via LiveKit Android SDK

**Files:**
- Create: `.../data/livekit/HughLiveKitClient.kt`
- Create: `.../data/livekit/LiveKitAudioHandler.kt`

Flow:
1. Fetch `conversation_token` from Worker `/agent/config`
2. Connect to LiveKit room using the token
3. Handle audio tracks — publish local mic, play remote agent audio
4. Receive data messages (transcript turns via WebRTC data channel)
5. Mute/unmute mic on lifecycle changes

ElevenLabs uses LiveKit's standard WebRTC. The `conversation_token` is a LiveKit access token. Connection:
```kotlin
val room = LiveKitRoom.connect(
    context, url = "wss://api.elevenlabs.io", token = conversationToken
)
```

### Task 3.2: Conversation screen UI

**Objective:** The main conversation screen — status indicator + footer bar

**Files:**
- Create: `.../ui/conversation/ConversationScreen.kt`
- Create: `.../ui/conversation/ConversationViewModel.kt`

UI structure:
- Full-screen with CollageBackground (gradient + blurred images)
- Center: status text + Hugh's first turn
- Footer: [Memories] [End] [Settings] — matching iOS layout exactly
- Status states: loading → ready → live → ending → error
- "End" shows AlertDialog confirmation

### Task 3.3: Transcript capture during session

**Objective:** Write every turn to Room/SQLite as it happens

**Files:**
- Modify: `.../ui/conversation/ConversationViewModel.kt`
- Modify: SessionRepository for appendTurn()

On each data message from LiveKit:
- Parse speaker (user/hugh) and text
- Increment ordinal
- Call `appendTurn(sessionId, ordinal, speaker, text, timestamp)`

### Task 3.4: Session lifecycle management

**Objective:** Start/end sessions, mute on background, anchor fetch

**Files:**
- Modify: `.../ui/conversation/ConversationViewModel.kt`

- `startSession()`: create session row → connect LiveKit → send dynamic variables
- `endSession()`: disconnect → POST last 10 turns to /session/anchor → update session row
- App background → mute mic (setMuted(true)) — privacy promise
- Navigate away → mute mic
- Navigate to /library on explicit end

---

## Phase 4 — Library & Session Detail

### Task 4.1: Library screen (DATA-03)

**Objective:** Reverse-chronological list of past sessions

**Files:**
- Create: `.../ui/library/LibraryScreen.kt`
- Create: `.../ui/library/LibraryViewModel.kt`

- LazyColumn of session cards
- Each card: title (or "Untitled"), formatted date, duration
- Tap → navigate to /session/{id}
- Empty state: "No memories yet. Start a conversation with Hugh."

### Task 4.2: Session detail / transcript view

**Objective:** Read-only transcript of a completed session

**Files:**
- Create: `.../ui/session/SessionDetailScreen.kt`
- Create: `.../ui/session/SessionDetailViewModel.kt`

- Load turns for session_id ordered by ordinal
- Chat-like layout: "Hugh" bubbles left, "You" bubbles right
- Large readable text (body=22sp)
- Session title + date at top

---

## Phase 5 — Settings & Polish

### Task 5.1: Settings screen (SET-01, SET-02, SET-04)

**Objective:** Profile view/edit, voice change, delete all data

**Files:**
- Create: `.../ui/settings/SettingsScreen.kt`
- Create: `.../ui/settings/SettingsViewModel.kt`

- Profile section: read-only name/birth year/hometown → tap "Edit" to inline edit
- Voice section: current voice displayed → "Change" expands 3-option picker
- Data section: "Delete all data" → AlertDialog confirmation → nukeDb()
- "Export all data" → coming soon stub (SET-03, deferred)

### Task 5.2: Accessibility audit

**Objective:** Ensure all interactive elements have content descriptions

**Files:**
- Modify: All screens

- Every clickable element: `contentDescription` set
- Every state change: `semantics { liveRegion = LiveRegionMode.Polite }`
- Touch targets verified at 56dp minimum
- Font scale capped via `CompositionLocalProvider(LocalFontScale provides fontScale.coerceIn(0.8f, 1.15f))`

### Task 5.3: CollageBackground port

**Objective:** Port the animated blurred image background

**Files:**
- Create: `.../ui/components/CollageBackground.kt`

- Fetch images from Worker `/collage/images`
- Render gradient + semi-transparent images
- Ken Burns animation via `Animatable` on translation + scale

---

## Phase 6 — Android Platform Constraints

### Task 6.1: Permissions

**Objective:** Runtime permission handling

**Files:**
- Create: `.../permissions/PermissionHandler.kt`

Android permissions needed:
- `RECORD_AUDIO` — for mic (conversation)
- `INTERNET` — for Worker + LiveKit
- `MODIFY_AUDIO_SETTINGS` — for audio routing
- `CONTACTS` (optional, ONB-01 prefill equivalent via `READ_CONTACTS`)

### Task 6.2: ProGuard / R8 rules

**Objective:** Keep LiveKit, Retrofit, Kotlin Serialization classes

**Files:**
- Create: `proguard-rules.pro`

### Task 6.3: Build configuration

**Objective:** gradle.properties, signing config, version code

**Files:**
- Create: `gradle.properties`
- Modify: `app/build.gradle.kts`

- `minSdk = 24`
- `targetSdk = 34`
- `versionCode = 1`, `versionName = "1.0.0-beta1"`
- Application ID: `com.beyondpandora.hughmanatee`

---

## What's NOT in this plan (deferred)

- Audio file persistence (DATA-02) — audio is streamed, not buffered
- FTS5 search UI (DATA-07) — schema exists, search bar deferred
- "Name this memory" post-session prompt (DATA-05) — session anchor covers this
- Session rename/delete (DATA-06)
- Export zip (SET-03)
- Device backup toggle (SET-05)
- Haptic feedback (A11Y-04) — Android haptics on turn boundaries
- Real ElevenLabs voice IDs (BETA-03) — placeholder IDs work with Worker fallback

---

## Execution Order

| Phase | Tasks | Est. Duration | Depends On |
|-------|-------|---------------|------------|
| 0 | 3 | 30 min | — |
| 1 | 3 | 45 min | 0 |
| 2 | 5 | 60 min | 1 |
| 3 | 4 | 90 min | 2 |
| 4 | 2 | 30 min | 3 |
| 5 | 3 | 45 min | 4 |
| 6 | 3 | 20 min | 0 |

**Total estimated:** ~5 hours of focused work for MVP. Phases 0–2 give a runnable app.
