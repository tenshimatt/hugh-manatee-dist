# Task backlog — mirror of Plane

Source of truth: [plane.beyondpandora.com/hugh-manatee](https://plane.beyondpandora.com/hugh-manatee/projects/340bef5e-9194-449d-9f55-38cad79a2c8c/issues/)
**Last synced:** 2026-04-30. HM-8 through HM-73 live in Plane.

---

## ✅ Done (shipped by 2026-04-24)

| HM# | ID | Title |
|---|---|---|
| HM-20 | — | DOMException polyfill in _layout.tsx (Hermes/LiveKit) |
| HM-21 | — | await startSession + endSession (unhandled promises) |
| HM-22 | — | Mic mutes when navigating away from conversation screen |
| HM-23 | — | Worker DEFAULT_AGENT_ID fallback + ELEVENLABS_API_KEY set |
| HM-24 | — | Collage background Picsum fallback |
| HM-25 | — | Conversation footer: icons, sizing, centred |
| HM-26 | — | Settings: inline voice picker with friendly labels |
| HM-27 | — | Sticky footer pattern across all screens |
| HM-28 | F-01 | Expo TypeScript scaffold |
| HM-29 | F-02 | Cloudflare Worker — three endpoints |
| HM-30 | F-03 | Archive retired Swift + stale docs |
| HM-31 | F-04 | EAS Build + OTA pipeline |
| HM-32 | F-05 | ElevenLabs CAI agent live |
| HM-33 | ONB-01 | Name capture with expo-contacts prefill |
| HM-34 | ONB-02 | Voice picker (3 voices) |
| HM-35 | ONB-03 | Birth year field |
| HM-36 | ONB-04 | Hometown field |
| HM-37 | ONB-05 | Privacy statement screen |
| HM-38 | ONB-06 | Profile persisted to SQLite |
| HM-39 | VOICE-01 | ElevenLabs CAI WebRTC client |
| HM-40 | VOICE-02 | Deterministic opener via dynamic variables |
| HM-41 | VOICE-03 | Dynamic variables injection (6 vars) |
| HM-42 | VOICE-05 | Turn-by-turn transcript capture |
| HM-43 | VOICE-06 | Backgrounding + mic mute on navigate |
| HM-44 | VOICE-07 | Post-session anchor via Worker |
| HM-45 | DATA-01 | SQLite schema + migrations |
| HM-46 | DATA-03 | Library screen: session list |
| HM-47 | VIS-01 | Gradient + blurred image collage |
| HM-48 | VIS-02 | Ken Burns animation |
| HM-49 | VIS-03 | Worker /collage/images with era+hometown |
| HM-56 | SET-01 | Change voice in Settings (inline picker) |
| HM-59 | SET-04 | Delete all data with confirmation |

---

## 🔄 In Progress

| HM# | ID | Title | Notes |
|---|---|---|---|
| HM-62 | A11Y-01 | Dynamic Type XXXL audit all screens | Pandomagic HUGH-35 run 4 active (2026-04-30). gate-prd pending. |

---

## 🔲 Todo — next up

### Urgent / High
| HM# | ID | Title |
|---|---|---|
| HM-11 | — | Rotate exposed Expo token from session logs |
| HM-50 | VOICE-04 | VAD/barge-in validation with elderly users |
| HM-51 | DATA-02 | Audio persistence — buffer to local file |
| HM-66 | BETA-01 | Listening tests 3–5 elderly users |
| HM-68 | BETA-03 | Replace PLACEHOLDER_VOICES with real IDs |
| HM-69 | BETA-04 | EAS production build iOS + Android |
| HM-71 | BETA-06 | Pricing decision |

### Medium
| HM# | ID | Title |
|---|---|---|
| HM-12 | DATA-02 | Audio persistence (buffer ElevenLabs stream) |
| HM-13 | SET-03 | Export zip of audio + transcripts |
| HM-15 | — | Automate IPA rebuild + OTA (CI/CD) |
| HM-16 | BETA-01 | Beta testing protocol with elderly users |
| HM-18 | — | Library screen: past sessions with title + date |
| HM-52 | DATA-04 | Session audio playback + synced transcript |
| HM-55 | DATA-07 | FTS5 search on transcripts |
| HM-57 | SET-02 | Edit profile fields inline |
| HM-58 | SET-03 | Export all data (zip) |
| HM-60 | SET-04a | Delete audio files on nuke |
| HM-63 | A11Y-02 | VoiceOver + TalkBack audit |
| HM-64 | A11Y-03 | Contrast audit ≥ 7:1 |
| HM-67 | BETA-02 | App Store Connect metadata |
| HM-70 | BETA-05 | TestFlight + Play Internal Testing |
| HM-72 | RUN-01 | Sentry crash + session-length dashboard |
| HM-73 | RUN-02 | Prompt iteration pipeline |

### Low / Later
| HM# | ID | Title |
|---|---|---|
| HM-17 | VOICE-03 | Dynamic variables via ElevenLabs overrides |
| HM-19 | — | Live transcript on conversation screen |
| HM-53 | DATA-05 | "Name this memory" post-session prompt |
| HM-54 | DATA-06 | Session rename + delete |
| HM-61 | SET-05 | Device backup opt-in |
| HM-65 | A11Y-04 | Haptic on Hugh turn boundaries |

---

## Post-v1 (phases 2–4)

Phase 2 (family sharing via share-sheet bundles), Phase 3 (sanitized global repo), Phase 4 (friends-of-friends linking) — deferred. See [[PRD#8-phases-beyond-v1]].
