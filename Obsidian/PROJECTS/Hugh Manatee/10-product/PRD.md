# Hugh Manatee — PRD

**Status:** Draft v1.0
**Last updated:** 2026-04-23
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
2. **First session only:** three-screen onboarding — name (prefilled from device), voice selection (3–5 ElevenLabs voices, 5-second previews), optional birth year + hometown. Single "Next" tap ends onboarding.
3. Collage background fades in — softly blurred, era-appropriate stock imagery keyed to the user's childhood decade and hometown. 15% opacity. Ken Burns pan.
4. Hugh speaks: *"Hi {name}. I'm Hugh. It's nice to meet you. Everything we talk about stays here on your phone — just between us. Whenever you're ready, tell me about a memory."*
5. User speaks. Hugh waits, listens, responds with short sensory follow-ups. Turn-taking is handled by ElevenLabs Conversational AI (barge-in, VAD, streaming).
6. When the user is done, they say "I'm done" or close the app. Hugh replies: *"Thank you. That was good. I'll be here when you want to come back."*
7. The session saves locally: transcript, audio, detected entities (people, places, objects, dates), the "anchor" phrase for next session's opener.
8. Returning sessions open with a context-aware greeting: *"Last time we were at your grandmother's kitchen. Somewhere new today, or back there?"*

That's the whole product in v1. No feeds, no accounts, no screens to swipe, no buttons to press mid-session.

## 5. Design principles

- **Voice-first, zero-tap during capture.** The only taps are during onboarding and (later) sharing.
- **The user sets the pace.** Hugh never fills silence. Waits up to 15 seconds before offering a small door.
- **Concrete over conceptual.** Hugh asks about objects, smells, sounds, weather, people by name. Never "how did that make you feel?"
- **Elder-first, not elder-pandering.** Large text, high contrast, slow pace — but no cartoon mascots, no celebratory confetti, no "you're doing great!" Hugh is warm the way a good listener is warm, not the way a children's show host is.
- **Privacy stated once, then trusted.** Reassurance on the opener; not repeated. Nothing leaves the device unless the user explicitly shares.
- **Prompts are the product.** The quality of Hugh's questions, pauses, and reflections determines whether people come back. Every prompt change is versioned and tested against real sessions.

## 6. Features (v1 MVP)

### 6.1 Onboarding
- [ ] Name capture (prefilled from device contact card where permissions allow)
- [ ] Voice picker — 3–5 curated ElevenLabs voices, 5-sec preview each
- [ ] Optional birth year (year-only, not full DOB) — drives era hooks
- [ ] Optional hometown (free-text, not geocoded) — drives sensory hooks
- [ ] Privacy notice on single onboarding screen (plain English, no legalese mid-flow)
- [ ] All four stored in `expo-secure-store` / SQLite

### 6.2 Voice capture loop
- [ ] ElevenLabs Conversational AI agent per voice (5 agents, one per voice)
- [ ] System prompt loaded from `agent/system-prompt.md` (+ merged `follow-up-rules.md`)
- [ ] Deterministic opener rendered client-side from `agent/opening-scripts.md`
- [ ] Runtime context: name, birth_year, hometown, last_memory_topic, 5 seed prompts, era hooks
- [ ] Streaming voice in/out with barge-in enabled
- [ ] Session transcript + audio captured to local storage
- [ ] Graceful handling of app backgrounding mid-session

### 6.3 Collage background
- [ ] Static mode: gradient + 3–5 blurred stock images, 15% opacity, Ken Burns
- [ ] Image set chosen by era + hometown tags via Worker endpoint (keyed Unsplash or similar)
- [ ] Regenerates on new session theme (not per turn)

### 6.4 Local storage
- [ ] SQLite (via `expo-sqlite`) — schema in [[ARCHITECTURE#data-model]]
- [ ] Audio stored in app's document directory, indexed by session ID
- [ ] Full-text search index on transcripts (SQLite FTS5)
- [ ] Session post-processing: entity extraction (people/places/objects/dates), anchor phrase for next opener

### 6.5 Minimal "library" surface
- [ ] A single "Memories" screen showing session cards in reverse-chron order
- [ ] Tap a card → plays the audio, shows the transcript scrolling in sync
- [ ] One "Name this memory" prompt at session end (optional, skippable)
- [ ] Rename, delete. That's it — no editing.

### 6.6 Settings
- [ ] Change voice
- [ ] Change name / birth year / hometown
- [ ] Export all data (zip of audio + JSON)
- [ ] Delete all data (with hard confirmation)

## 7. Non-functional requirements

- **Latency:** round-trip voice < 800ms p50, < 1.2s p95. This is the single highest-leverage NFR.
- **Offline:** recording + transcription must fall back gracefully if network drops. Audio is always captured locally; Hugh's responses require network.
- **Battery:** a 20-minute session must not cost more than ~8% battery on a 3-year-old phone.
- **Accessibility:** Dynamic Type up to XXXL, VoiceOver/TalkBack labels on every surface, contrast ≥ 7:1, haptic feedback on turn boundaries, single-switch operable (no drag/swipe gestures required).
- **Privacy:** nothing persisted off-device in v1. ElevenLabs session data is the sole exception and is governed by their retention policy (which we configure for zero retention where possible).

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

- **Voice selection.** We need to listening-test 3–5 ElevenLabs voices with actual elderly users. Candidate brief: warm, unhurried, balanced genders, varied accents (RP, American Midwest, Scottish or Irish, Southern US, Canadian). Not locked yet.
- **Free vs paid.** Does v1 ship free? ElevenLabs CAI costs ~$0.10/min. A 15-minute daily habit costs ~$45/user/month. This is not sustainable as free. Options: (a) free tier with minutes cap, (b) paid from day one ($15/mo?), (c) family pays, elder uses. Needs decision before TestFlight.
- **Store listing strategy.** Do we launch as "memoir companion" and attract a broader audience, or tightly target elderly + adult children? Marketing decision, not engineering.
- **Consent for minors.** The brief is adult-focused but nothing stops a 14-year-old installing. Age gate or not? Lean toward simple "18+ recommended" in listing, no hard gate.

## 11. What we are not building

- No social feed, ever. If we build sharing, it's peer-to-peer via share sheet.
- No ads, ever.
- No analytics on memory *content*. We can count sessions, duration, crash rates. We do not read transcripts.
- No AI-generated "summary of your life" or "meaning of your memories." Hugh is not a biographer, not a therapist, not a greeting-card machine.

## 12. Related documents

- [[ARCHITECTURE]] — how it's built
- [[ROADMAP]] — when each piece lands
- [[001-expo-rewrite]] — single codebase decision
- [[002-elevenlabs-conversational-ai]] — voice loop decision
- [[003-local-only-storage]] — privacy decision
- Agent prompts → `/Users/mattwright/pandora/lifebook/agent/` (source of truth, linked not duplicated)
