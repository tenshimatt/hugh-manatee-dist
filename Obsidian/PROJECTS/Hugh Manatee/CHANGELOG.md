# Hugh Manatee — Changelog

## 2026-04-30 — TestFlight build uploaded + run 5 in progress

- **TestFlight**: App Store-signed IPA (v1.0.0, Apr 24 archive) uploaded to App Store Connect via `xcrun altool`. Delivery UUID: `d91e86dd-f57d-4b7c-9e67-3f6c226d6c7b`. Build will appear in TestFlight after Apple processing (~10–30 min).
- **Root cause of missing TestFlight**: builds were signed with AdHoc profile, not App Store. Fixed by exporting existing xcarchive with App Store profile (`HughManatee AppStore`) using system rsync (Homebrew rsync 3.4.1 doesn't support Apple's `-E` flag).
- **App Store Connect API credentials** now stored in `.env.local` and CT 111 poller env for autonomous future uploads.
- **Run 5 triggered**: Bug HM-E fixed (test-first now creates `package.json` at repo root). Run 4 correctly implemented Dynamic Type (29 `maxFontSizeMultiplier={1.15}` props) but validate failed at bun install.

---

## 2026-04-30 — Pandomagic run 4 in progress (A11Y-01 Dynamic Type XXXL)

Archon workflow HUGH-35 triggered for A11Y-01 (Dynamic Type support up to XXXL across all screens). Three prior runs exposed and fixed four harness-level bugs:

| Bug | Description | Fix |
|-----|-------------|-----|
| HM-A | plan node generated a Next.js web app instead of React Native | Added explicit Expo/RN stack constraint to `plan` prompt |
| HM-B | test-first used `_playwright.request` private Playwright API — 6/57 tests crashed | Added PLAYWRIGHT PATTERNS section to `test-first` prompt |
| HM-C | gate-plan auto-approved by a stale `:approve:` from gate-prd | `wait-for-approval.sh` now anchors on the gate comment's own ID as `LAST_SEEN` |
| HM-D | architect-review Claude Code subprocess exceeded 60s `first_event_timeout` on CT 111 | Switched `architect-review` to `deepseek-v4-pro` (HTTP provider, no subprocess) |

Run 4 triggered 2026-04-30 08:27 UTC. Awaiting gate-prd approval before continuing to plan → implement → PR.

Dist repo: `tenshimatt/hugh-manatee-dist` commits `7def6d0` (HM-A/B/C), `cc01eaa` (HM-D attempt 1), `1576d6c` (HM-D final fix).

---

## 2026-04-27 — Pandomagic conversion complete

Hugh Manatee is now on the Pandomagic Archon-driven dev process:
- Workflow YAML: `tenshimatt/hugh-manatee-dist:.archon/workflows/hugh-manatee-feature.yaml` (26 nodes)
- Poller: `archon-plane-poller-hm.timer` on CT 111 (fires every 5 min)
- All governance files in dist repo: `mission.md`, `factory-rules.md`, `CLAUDE.md`, `docs/architecture/levels.md`
- 6 Rawgle harness rails backported
- DeepSeek first-class provider wired for all 25 worker nodes

---

## 2026-04-24 — voice live end-to-end + UX polish

### Voice works
- Worker `ELEVENLABS_API_KEY` and `ELEVENLABS_DEFAULT_AGENT_ID` (agent_7201kpwvsa9yf6pvw7tm4rpmm0t5) set as Cloudflare Worker secrets.
- Worker now falls back to `ELEVENLABS_DEFAULT_AGENT_ID` when `ELEVENLABS_AGENTS` map has no entry for the stored voice_id — fixes stale "warm" profiles from early builds.
- Hugh speaks. First real end-to-end conversation confirmed on device.

### Bug fixes
- **DOMException polyfill** — Hermes doesn't ship `DOMException`. LiveKit (via `@elevenlabs/react-native`) references it at module load, crashing the conversation screen before it rendered. Fixed: `src/polyfills.ts` sets `global.DOMException`; imported as the first line of `app/_layout.tsx` so it's always in place before lazy-loaded modules evaluate.
- **Unhandled promise rejections** — `conversation.startSession()` and `conversation.endSession()` were called without `await` inside try/catch blocks. Both now awaited; rejections are caught.

### Conversation screen UX
- **Mic mutes on navigate away** — using `useFocusEffect` + `useConversationInput().setMuted()`. Hugh stops listening the instant you enter Settings or Library. Session stays alive; mic resumes when you return. Addresses the "eavesdropping" feeling.
- **End button**: only disabled during the brief "Saving…" state (session being written). Always tappable while conversation is live.
- **Footer layout**: three `flex:1` slots with `gap`. Memories (albums-outline icon) and Settings (settings-outline icon) are 72pt wide with icon + 11pt label. End pill is dead-centred, height 40.

### Background images
- Worker `/collage/images` now uses Picsum as a fallback when `UNSPLASH_ACCESS_KEY` is absent. Images seeded by birth decade + hometown (e.g. `picsum.photos/seed/1950-glasgow-0/600/900`) so they're stable per user. Unsplash path still used when key is present.

### Settings screen
- Voice row shows friendly label ("Arthur") not raw voice_id ("voice-warm-male-01" or stale "warm").
- Inline voice picker: tap "Change" to expand three voice cards; tap a voice to save and collapse. Removes the need to re-run full onboarding to change voice.
- Removed "Change voice" footer button (replaced by inline picker).
- Row labels shortened ("Year you were born" → "Born") to prevent wrapping on small screens.

### Plane backlog
- Full 48-task backlog (+ 24 additional session-specific issues) pushed to Plane `hugh-manatee` workspace. HM-8 through HM-73. Every completed item marked Done with implementation notes.

---

## 2026-04-23 — handoff + listening-test protocol

- Runbook `40-operations/05-listening-test-protocol.md` — step-by-step for running elderly-user voice tests, scoring, and updating the app with real voice IDs.
- `HANDOFF.md` at project root — snapshot of what's built, user-blocked steps in order, what I'll do next, what I won't do without permission.
- Roadmap collapsed: week 1 largely landed day 1; week 2 pivots to accessibility + audio persistence + settings export; week 3 becomes beta prep (listening test, EAS first builds).

## 2026-04-23 — collage background

New `CollageBackground` component sits behind the conversation:
- Gradient (from/to colors from the Worker collage response; warm fallback matching the theme).
- 3–5 blurred stock images at 15% opacity, positioned in a 2-column mosaic, each drifting independently (Ken Burns via react-native-reanimated — slow sine waves on translateX/Y and a gentle scale pulse, 28–40s cycles).
- `BlurView` over the top (intensity 30) keeps everything ambient.
- Falls back to gradient-only if `/collage/images` errors. Network failure never blocks the conversation.

Worker `/collage/images` already fetched Unsplash by era + hometown + theme, KV-cached 24h. Fallback gradient corrected from dark navy to the app's warm palette.

Added deps: `expo-image` (faster remote loads + disk cache), `expo-blur`.

Plane: VIS-01, VIS-02, VIS-03 → Done.

## 2026-04-23 — voice loop landed

Wired the real ElevenLabs Conversational AI integration end-to-end in `conversation.tsx`:

- Worker `/agent/config` now returns a short-lived `conversation_token` (via ElevenLabs `GET /v1/convai/conversation/token`) instead of a raw signed URL. RN SDK uses WebRTC + LiveKit under the hood.
- App wraps the router in `ConversationProvider` (the RN re-export of `@elevenlabs/react`'s provider).
- Conversation screen uses `useConversation`:
  - Fetches config + creates a local SQLite session before opening the mic
  - Delivers the deterministic opener via `first_turn` dynamic variable (agent's "First Message" field configured as `{{first_turn}}`)
  - Passes six dynamic variables (`first_name`, `birth_year`, `hometown`, `last_memory_topic`, `suggested_seeds`, `era_hooks`) to the agent
  - Captures every `onMessage` turn into the `turns` table live
  - On end / app background / unmount: calls `/session/anchor`, persists title + anchor phrase
- Haptic tick on connect. Large "End" button, alert confirms before closing.

Plane: VOICE-01, -02, -03, -05, -06, -07 → Done. VOICE-04 (barge-in/VAD listening tests) → Backlog — needs real ElevenLabs agents + elderly-user testing.

## 2026-04-23 — inception

Project inception. Rewriting from native Swift (Aurora/MemoirGuide) to Expo (React Native). Agent prompt library established at `lifebook/agent/`. PRD, ADRs 001–003, roadmap, architecture docs written.
