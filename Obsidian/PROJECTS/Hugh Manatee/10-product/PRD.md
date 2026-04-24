# Hugh Manatee — PRD

**Status:** Draft v1.1
**Last updated:** 2026-04-24
**Owner:** Matt Wright

---

## 1. Problem

Memories die with the people who hold them. Families discover, usually too late, that they never asked — what was the kitchen like, who were the neighbors, what did school smell like, how did you meet her. The people who hold the richest memories (the elderly) are also the people least served by keyboard-and-screen apps. Voice notes are closer but still require someone to know where to start, and they fill up a Notes folder with nothing to hold them together.

## 2. Solution

A mobile app with exactly one interaction: **open it and talk**. A gentle AI voice named **Hugh** (the manatee — play on *humanity*) greets the user by name, reassures them about privacy, and asks one small sensory question ("what did your kitchen smell like on a Sunday?"). Hugh listens, waits patiently, reflects one concrete detail, asks the next small question. Sessions are saved locally. Over time the app builds a private, searchable archive of a person's memories in their own voice.

Later — in carefully-gated phases — those memories can be shared with named family, or, if the user opts in and the data is sanitized, contributed to a global memory commons.

## 3. Primary audience

- **Primary user (the recorder):** adults 65+ recalling childhood through present-day memories. Often has some degree of memory drift, tech fatigue, small-screen struggles. Uses a phone for calls, texts, maybe FaceTime. Not confident with apps.
- **Primary installer (often not the user):** adult child, 35–60, installs the app on their parent's phone, maybe sits with them for the first session.
- **Secondary user:** anyone who wants to capture memories — not age-restricted — but the experience is tuned to the primary and will not be compromised for younger users who want more features.

## 4. Core experience

1. User taps app icon.
2. **First session only:** four-screen onboarding — name (prefilled from device contact), voice selection (3 curated ElevenLabs voices), optional birth year + hometown, privacy statement. Single sticky "Next/Meet Hugh" button always visible above keyboard.
3. Collage background fades in — softly blurred, era-appropriate stock imagery keyed to the user's childhood decade and hometown. 15% opacity. Ken Burns pan.
4. Hugh speaks: *"Hi {name}. Good to hear you again. Where would you like to start today?"* (first session has a fresh opener from the Worker).
5. User speaks. Hugh waits, listens, responds with short sensory follow-ups. Turn-taking is handled by ElevenLabs Conversational AI (barge-in, VAD, streaming).
6. When the user taps End and confirms, Hugh saves the session. The conversation is gone from screen but lives in the Memories list.
7. The session saves locally: transcript, audio (future), detected entities (people, places, objects, dates), the "anchor" phrase for next session's opener.
8. Returning sessions open with a context-aware greeting: *"Last time we were at your grandmother's kitchen. Somewhere new today, or back there?"*

That's the whole product in v1. No feeds, no accounts, no screens to swipe, no buttons to press mid-session.

## 5. Design principles

- **Voice-first, zero-tap during capture.** The only taps are during onboarding and session control (End).
- **The user sets the pace.** Hugh never fills silence. Waits up to 15 seconds before offering a small door.
- **Concrete over conceptual.** Hugh asks about objects, smells, sounds, weather, people by name. Never "how did that make you feel?"
- **Elder-first, not elder-pandering.** Large text, high contrast, slow pace — but no cartoon mascots, no celebratory confetti, no "you're doing great!" Hugh is warm the way a good listener is warm, not the way a children's show host is warm.
- **Privacy stated once, then trusted.** Reassurance on the opener; not repeated. Nothing leaves the device unless the user explicitly shares.
- **Prompts are the product.** The quality of Hugh's questions, pauses, and reflections determines whether people come back. Every prompt change is versioned and tested against real sessions.
- **Mic only when present.** When the user navigates away from the conversation screen (to Settings, Memories, or any other screen), the microphone mutes immediately. Hugh cannot hear them in another context. This is a hard rule, not a preference.
- **Buttons always reachable.** Primary action buttons (Next, End, Save) are pinned in a sticky footer outside the scroll area. iOS Large Text setting must not be able to hide a CTA.

## 6. Features (v1 MVP)

### 6.1 Onboarding ✅
- ✅ Name capture (prefilled from device contact card where permissions allow)
- ✅ Voice picker — 3 curated ElevenLabs voices (placeholder IDs; real IDs locked after listening tests)
- ✅ Optional birth year (year-only) — drives era hooks in Worker runtime context
- ✅ Optional hometown (free-text) — drives sensory hooks + collage image query
- ✅ Privacy notice on single onboarding screen (plain English, no legalese mid-flow)
- ✅ All four stored in SQLite via expo-sqlite

### 6.2 Voice capture loop ✅ (core done; VAD tuning pending)
- ✅ ElevenLabs Conversational AI — single agent for now; one agent per voice after listening tests
- ✅ System prompt loaded into ElevenLabs agent configuration
- ✅ Deterministic opener rendered by Worker `/agent/config` from name + last anchor
- ✅ Runtime context: name, birth_year, hometown, last_memory_topic, 5 seed prompts, era hooks
- ✅ Streaming voice in/out over WebRTC (LiveKit)
- ✅ Session transcript captured to SQLite turns table live
- ✅ Graceful backgrounding — AppState listener ends session
- ✅ Mic mutes on navigate away — useFocusEffect + setMuted(true/false)
- ⬜ Audio buffering to local file (DATA-02 / HM-51)
- ⬜ VAD barge-in tuning with elderly users (VOICE-04 / HM-50)

### 6.3 Collage background ✅
- ✅ Gradient + 3–5 blurred stock images at 15% opacity, Ken Burns pan
- ✅ Image set: Picsum (seeded, stable) when UNSPLASH_ACCESS_KEY absent; Unsplash when present
- ✅ Falls back to warm gradient if fetch fails; network failure never blocks conversation

### 6.4 Local storage ✅ (schema done; audio pending)
- ✅ SQLite (expo-sqlite) — schema: profile, sessions, turns, entities, FTS5 index
- ✅ Session post-processing: anchor phrase + title via Worker `/session/anchor` (Claude)
- ⬜ Audio stored in app document directory, indexed by session ID (DATA-02 / HM-51)
- ⬜ Full-text search on transcripts via FTS5 (DATA-07 / HM-55)

### 6.5 Memories library (basic shell done)
- ✅ Session list screen — reverse-chron, shows title or "Untitled", date
- ⬜ Tap card → audio playback + scrolling transcript (DATA-04 / HM-52)
- ⬜ "Name this memory" post-session prompt (DATA-05 / HM-53)
- ⬜ Rename, delete (DATA-06 / HM-54)

### 6.6 Settings ✅ (voice done; edit profile + export pending)
- ✅ Change voice — inline picker with friendly labels, saves immediately
- ⬜ Edit name / birth year / hometown inline (SET-02 / HM-57)
- ⬜ Export all data (zip of audio + JSON) (SET-03 / HM-58)
- ✅ Delete all data (hard confirmation + clearProfile + nukeDb)
- ⬜ Delete audio files on nuke (SET-04a / HM-60)
- ⬜ Device backup opt-in config (SET-05 / HM-61)

## 7. Non-functional requirements

- **Latency:** round-trip voice < 800ms p50, < 1.2s p95. This is the single highest-leverage NFR.
- **Offline:** recording + transcription must fall back gracefully if network drops. Audio is always captured locally; Hugh's responses require network.
- **Battery:** a 20-minute session must not cost more than ~8% battery on a 3-year-old phone.
- **Accessibility:** Dynamic Type up to XXXL, VoiceOver/TalkBack labels on every surface, contrast ≥ 7:1, haptic feedback on turn boundaries, single-switch operable (no drag/swipe gestures required). `maxFontSizeMultiplier=1.15` caps text growth on specific elements where uncapped growth breaks layout, but overall layout must be readable at XXXL.
- **Privacy:** nothing persisted off-device in v1. ElevenLabs session data is the sole exception (governed by their retention policy; configure zero retention where possible). Microphone is muted whenever the conversation screen is not in focus.

## 8. Phases beyond v1

### Phase 2 — Family sharing (weeks 7–10 post-launch)
- Export a memory as a signed bundle (audio + transcript + metadata JSON)
- Share via iOS/Android share sheet to any contact who has the app
- Recipient opens the bundle, sees the memory, records an enhancement, shares back
- No accounts, no server, no feed. Peer-to-peer via share sheet.

### Phase 3 — Sanitized global repo (post-launch, 3+ months)
- Opt-in, per-memory, not blanket
- PII stripping via Claude with a redaction prompt (names → roles, specific places → region)
- Backend: Cloudflare Workers + D1, moderation queue, abuse reporting
- Read-only browse for contributors, keyed by era and theme

### Phase 4 — Friends-of-friends enrichment
- If two users share a memory with overlapping entities (same school, same year, same place), offer to link them with both users' consent
- Never auto-link. Always explicit.

## 9. Success metrics

**v1 (6 weeks post-launch):**
- ≥ 50 installs via direct outreach (family + test group)
- ≥ 30% of installed users complete a second session within 7 days
- Median first session length ≥ 4 minutes (proxy for Hugh's voice feeling natural)
- Crash-free sessions ≥ 99%

**v2+ (3 months post-launch):**
- ≥ 40% of returning users have 5+ sessions
- Prompt quality bar: voice-tested every prompt change, logged against session length

## 10. Open questions

- **Voice selection.** Listening tests with 3–5 elderly users needed before locking 3 production voices. Candidates: warm male, warm female, bright/curious female. Runbook: `40-operations/05-listening-test-protocol.md`.
- **Free vs paid.** ElevenLabs CAI costs ~$0.10/min. A 15-minute daily habit = ~$45/user/month at list. Decision needed before TestFlight. Options: (a) free tier with minutes cap, (b) $9.99/mo subscription, (c) family-pays model. See HM-71.
- **Store listing strategy.** "Memoir companion" for broad audience vs. tightly targeted elderly + adult children framing. Marketing decision, not engineering.
- **ANTHROPIC_API_KEY on worker.** Session anchor extraction (post-session title + anchor phrase) calls Claude. Key not yet set on worker — anchor extraction silently fails. Set `ANTHROPIC_API_KEY` via `npx wrangler secret put ANTHROPIC_API_KEY` from `/lifebook/worker/`.

## 11. What we are not building

- No social feed, ever. If we build sharing, it's peer-to-peer via share sheet.
- No ads, ever.
- No analytics on memory *content*. We can count sessions, duration, crash rates. We do not read transcripts.
- No AI-generated "summary of your life" or "meaning of your memories." Hugh is not a biographer, not a therapist, not a greeting-card machine.

## 12. Related documents

- [[ARCHITECTURE]] — how it's built
- [[ROADMAP]] — when each piece lands
- [[CHANGELOG]] — what's shipped and when
- [[001-expo-rewrite]] — single codebase decision
- [[002-elevenlabs-conversational-ai]] — voice loop decision
- [[003-local-only-storage]] — privacy decision
- Agent prompts → `/Users/mattwright/pandora/lifebook/agent/` (source of truth, linked not duplicated)
- Plane project → https://plane.beyondpandora.com/hugh-manatee/ (HM-8 through HM-73)
