# Hugh Manatee — Roadmap

**Updated:** 2026-04-24
**Target:** TestFlight + Play Internal Testing by **2026-06-04** (6 weeks from project start).

---

## Week 1 (2026-04-23 → 2026-04-29) — Foundation, voice loop, collage ✅

**All landed:**

- ✅ Agent prompts (`agent/system-prompt.md`, `opening-scripts.md`, `question-library.yaml`, `follow-up-rules.md`)
- ✅ Obsidian PRD, 3 ADRs, architecture, runbooks (Apple / Google / EAS / ElevenLabs / listening-tests)
- ✅ Plane project + full 66-task backlog (HM-8 through HM-73)
- ✅ Expo app scaffold — TypeScript, expo-router, 5 screens, SQLite + FTS5
- ✅ Worker — three endpoints live (`/agent/config`, `/collage/images`, `/session/anchor`), deployed at `hugh-manatee-worker.findrawdogfood.workers.dev`
- ✅ Worker secrets set: `ELEVENLABS_API_KEY`, `ELEVENLABS_DEFAULT_AGENT_ID`
- ✅ Archived Swift MemoirGuide + 46 stale docs to `archive/2026-04-pre-expo/`
- ✅ Onboarding (name from contacts, voice picker, birth year + hometown, privacy screen)
- ✅ ElevenLabs CAI voice loop — connects, Hugh speaks, turns captured, session ends cleanly
- ✅ Collage background — Ken Burns + Picsum/Unsplash images + BlurView
- ✅ OTA install pipeline — EAS local build, IPA on GitHub releases, itms-services:// via Cloudflare Pages
- ✅ Sticky footer pattern — primary CTAs always outside ScrollView, `maxFontSizeMultiplier=1.15`
- ✅ Mic mutes on navigate away (`useFocusEffect` + `setMuted`)
- ✅ Settings inline voice picker with friendly labels
- ✅ DOMException polyfill for Hermes/LiveKit
- ✅ Voice confirmed working end-to-end on real device

**Still open:**
- [ ] Run listening tests to pick final 3 voices (BETA-01) — user action
- [ ] Replace `PLACEHOLDER_VOICES` with real voice IDs after tests (HM-68)
- [ ] Set `UNSPLASH_ACCESS_KEY` on worker for era-matched imagery (currently using Picsum)
- [ ] Set `ANTHROPIC_API_KEY` on worker for session anchor extraction

## Week 2 (2026-04-30 → 2026-05-06) — Audio + accessibility

- [ ] Audio persistence — buffer ElevenLabs output to local file (DATA-02 / HM-51)
- [ ] Dynamic Type XXXL audit — all screens, not just conversation (A11Y-01 / HM-62)
- [ ] VoiceOver / TalkBack labels audit (A11Y-02 / HM-63)
- [ ] Contrast audit ≥ 7:1 (A11Y-03 / HM-64)
- [ ] Haptic on Hugh turn boundaries (A11Y-04 / HM-65)
- [ ] Edit profile fields inline in Settings (SET-02 / HM-57)
- [ ] Delete audio files on data nuke (SET-04a / HM-60)

## Week 3 (2026-05-07 → 2026-05-13) — Beta prep

- [ ] Listening tests with 3–5 elderly users (BETA-01 / HM-66) — lock 3 final voices
- [ ] Replace PLACEHOLDER_VOICES with real IDs (HM-68)
- [ ] Set all worker secrets (ANTHROPIC_API_KEY, UNSPLASH_ACCESS_KEY)
- [ ] Session audio playback in library (DATA-04 / HM-52)
- [ ] "Name this memory" post-session prompt (DATA-05 / HM-53)
- [ ] First `eas build --profile preview` iOS + Android (BETA-04 / HM-69)
- [ ] VAD/barge-in validation from listening tests (VOICE-04 / HM-50)

## Week 4 (2026-05-14 → 2026-05-20) — Library + search

- [ ] Session rename + delete (DATA-06 / HM-54)
- [ ] FTS5 search on Library screen (DATA-07 / HM-55)
- [ ] Export zip (audio + JSON manifest) (SET-03 / HM-58)
- [ ] Device backup opt-in config (SET-05 / HM-61)
- [ ] App Store Connect metadata draft (BETA-02 / HM-67)

## Week 5 (2026-05-21 → 2026-05-27) — TestFlight + pricing

- [ ] EAS production build iOS + Android (BETA-04 / HM-69)
- [ ] TestFlight internal group (BETA-05 / HM-70)
- [ ] Play Internal Testing track (BETA-05 / HM-70)
- [ ] **Pricing decision** (BETA-06 / HM-71) — must be made before App Store submission
- [ ] Sentry integration, crash-free dashboard (RUN-01 / HM-72)

## Week 6 (2026-05-28 → 2026-06-04) — Beta run

- [ ] Invite 10–20 beta users (elderly + adult children)
- [ ] Monitor crash rate + session length daily
- [ ] Prompt iteration cycle — test → version bump → redeploy (RUN-02 / HM-73)
- [ ] Fix issues from beta feedback

## Post-v1

- **Phase 2 (weeks 7–10):** family sharing via share sheet (peer-to-peer bundles)
- **Phase 3 (month 3+):** sanitised global repo — requires real backend + moderation
- **Phase 4 (month 6+):** friends-of-friends enrichment (explicit opt-in linking)

---

## What kills the timeline

- Voice latency > 1.5s on LTE → users give up. Test weekly against the live agent.
- ElevenLabs pricing per user untenable → forces pricing decision forward from week 5 to week 2.
- Apple review on voice-AI app → add a week buffer. Have a "why this is safe" doc ready.
- No elderly users available for listening tests → BETA-01 blocks voice lock which blocks PLACEHOLDER_VOICES replacement which blocks production build.
