# Task backlog — mirror of Plane

Source of truth is [plane.beyondpandora.com/hugh-manatee](https://plane.beyondpandora.com/hugh-manatee/). This file is the readable mirror at the time of the backlog's initial seed (2026-04-23). Updates happen in Plane; this doc gets re-synced on demand.

Format: `ID | module | title — why it matters`. Modules roughly map to weeks in [[ROADMAP]].

## Foundation (week 1)

1. **F-01** | foundation | Scaffold Expo app with TypeScript — establishes the single codebase; replaces Swift
2. **F-02** | foundation | Slim Cloudflare Worker to two endpoints (`/agent/config`, `/collage/images`) — drops Aurora cruft
3. **F-03** | foundation | Archive retired Swift + docs to `archive/2026-04-pre-expo/` — remove repo bloat, keep as reference
4. **F-04** | foundation | Set up EAS Build for iOS + Android — unblock deployment to TestFlight/Play Internal
5. **F-05** | foundation | Set up per-voice ElevenLabs CAI agents (3–5 candidates, system prompt loaded) — one agent per voice
6. **F-06** | foundation | Replace bloated root `README.md` with pointer to Obsidian + short quickstart — reduce doc confusion

## Onboarding (week 2)

7. **ONB-01** | onboarding | Name capture screen with `expo-contacts` prefill of device-owner name — minimize typing
8. **ONB-02** | onboarding | Voice picker (3–5 voices, 5s preview per voice) — user picks Hugh's voice
9. **ONB-03** | onboarding | Optional birth-year field (year-only, picker) — drives era hooks
10. **ONB-04** | onboarding | Optional hometown field (free-text) — drives sensory hooks
11. **ONB-05** | onboarding | Plain-English privacy statement on onboarding screen — single reassurance
12. **ONB-06** | onboarding | Persist profile to `expo-secure-store` + SQLite — no network on onboarding

## Voice loop (week 2–3)

13. **VOICE-01** | voice | ElevenLabs CAI WebSocket client (connect/disconnect/mic in/audio out) — core conversation pipe
14. **VOICE-02** | voice | Client-rendered deterministic opener from `agent/opening-scripts.md` — first turn never LLM-generated
15. **VOICE-03** | voice | Dynamic variables injection (name, birth_year, hometown, last_anchor, seeds, era hooks) — per-session context
16. **VOICE-04** | voice | Barge-in + VAD config validated against elderly-user pauses — latency is the product
17. **VOICE-05** | voice | Turn-by-turn transcript capture to in-memory state + SQLite on session end — preserves memory
18. **VOICE-06** | voice | Graceful handling of app backgrounding / audio interruption / lost network — robust loop
19. **VOICE-07** | voice | Post-session entity extraction + anchor phrase via Worker `/session/anchor` — builds context for next session

## Storage & library (week 3)

20. **DATA-01** | data | SQLite schema + migrations (profile, sessions, turns, entities, FTS5) — durable local store
21. **DATA-02** | data | Audio file storage in `expo-file-system` document directory, indexed by session ID — full fidelity copy
22. **DATA-03** | data | Library screen: session cards, reverse-chron, tap to play — minimum "my memories" surface
23. **DATA-04** | data | Synced scrolling transcript during playback — recognize where you are in the audio
24. **DATA-05** | data | "Name this memory" post-session prompt (skippable) — user-controlled title
25. **DATA-06** | data | Session rename + delete — minimal edit surface
26. **DATA-07** | data | Full-text search over transcripts (FTS5) — find memories by phrase

## Settings (week 3)

27. **SET-01** | settings | Change voice (repicks from curated list, re-binds agent_id) — allow second thoughts
28. **SET-02** | settings | Change profile fields (name, birth_year, hometown) — fix mistakes
29. **SET-03** | settings | Export all data (zip of audio + JSON manifest) — user-owned backup
30. **SET-04** | settings | Delete all data with hard confirmation — single-tap nuke
31. **SET-05** | settings | Device backup opt-in (iOS/Android backup include/exclude) — explicit consent

## Collage background (week 4)

32. **VIS-01** | visual | Gradient + 3–5 blurred stock images at 15% opacity — ambient, not busy
33. **VIS-02** | visual | Ken Burns slow pan animation — gentle motion
34. **VIS-03** | visual | Worker `/collage/images` — Unsplash lookup by era + hometown tags, 24h cache — avoid per-user generation cost

## Accessibility & polish (week 4)

35. **A11Y-01** | a11y | Dynamic Type support up to XXXL across all screens — elder-first sizing
36. **A11Y-02** | a11y | VoiceOver + TalkBack labels on every interactive surface — screen-reader parity
37. **A11Y-03** | a11y | Contrast audit (≥ 7:1 on all text) — readability
38. **A11Y-04** | a11y | Haptic feedback on turn boundaries — sensory confirmation
39. **A11Y-05** | a11y | No drag/swipe gestures required — single-switch operable

## Beta prep (week 5)

40. **BETA-01** | beta | Listening tests with 3–5 elderly users, lock final 3 voices — remove designer bias
41. **BETA-02** | beta | App Store Connect metadata: description, screenshots (elder-friendly), privacy labels — submission-ready
42. **BETA-03** | beta | Play Console metadata + privacy declarations — Android parity
43. **BETA-04** | beta | EAS Build iOS production + Android internal track — ship artifacts
44. **BETA-05** | beta | TestFlight internal testing group (family + direct outreach) — 10–20 beta users
45. **BETA-06** | beta | Pricing decision (free tier / paid / family-pays model) — unblocks public launch

## Beta run (week 6)

46. **RUN-01** | run | Crash-free + session-length dashboard (Sentry with transcript content excluded) — without reading transcripts
47. **RUN-02** | run | Prompt iteration loop: voice-test → version bump → redeploy — product is the prompts
48. **RUN-03** | run | Collect qualitative feedback from beta users — adjust before public launch

---

## Post-v1 (phases 2–4)

Phase 2 (family sharing via share-sheet bundles), Phase 3 (sanitized global repo), Phase 4 (friends-of-friends linking) — deferred. See [[PRD#8-phases-beyond-v1]].
