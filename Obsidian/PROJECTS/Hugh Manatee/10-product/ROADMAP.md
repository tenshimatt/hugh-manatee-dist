# Hugh Manatee — Roadmap

**Updated:** 2026-04-23
**Target:** TestFlight + Play Internal Testing by **2026-06-04** (6 weeks from today).

---

## Week 1 (2026-04-23 → 2026-04-29) — Prompts, foundation, voice loop, collage ✅

**Landed on day 1:**

- ✅ Agent prompts (`agent/system-prompt.md`, `opening-scripts.md`, `question-library.yaml`, `follow-up-rules.md`)
- ✅ Obsidian PRD, 3 ADRs, architecture, runbooks (Apple / Google / EAS / ElevenLabs / listening-tests)
- ✅ Plane project + 48-task backlog across 9 modules
- ✅ Expo app scaffold (`app/`) — TypeScript, 5 screens, SQLite + FTS5
- ✅ Slim Worker (`worker/`) — three endpoints live (`/agent/config`, `/collage/images`, `/session/anchor`), compiles clean
- ✅ Archived Swift + 46 stale docs to `archive/2026-04-pre-expo/`
- ✅ Onboarding (name from contacts, voice picker, birth year + hometown, privacy screen)
- ✅ ElevenLabs CAI voice loop in conversation.tsx (VOICE-01..07 except barge-in tests)
- ✅ Collage background with Ken Burns drift + Unsplash-backed images (VIS-01..03)

**Remaining (user-blocked):**

- [ ] ElevenLabs account: pick 3–5 candidate voices, create one agent per voice, paste system prompt (follow runbook `04-elevenlabs-setup.md`)

## Week 2 (2026-04-30 → 2026-05-06) — Accessibility, audio persistence, settings

- [ ] Dynamic Type XXXL support across all screens (A11Y-01)
- [ ] VoiceOver / TalkBack audit (A11Y-02)
- [ ] Contrast audit ≥ 7:1 (A11Y-03)
- [ ] Haptic feedback on turn boundaries — partial already done (A11Y-04)
- [ ] Audio persistence — buffer ElevenLabs output, store per-session (DATA-02)
- [ ] Session audio playback in library/session/[id] (part of DATA-03)
- [ ] Export all (zip of audio + JSON manifest) (SET-03)
- [ ] Device backup opt-in (SET-05)

## Week 3 (2026-05-07 → 2026-05-13) — Beta prep

- [ ] Listening tests with 3–5 elderly users — lock 3 production voices (BETA-01, runbook 05)
- [ ] Replace `PLACEHOLDER_VOICES` in `app/src/lib/profile.ts` with real voice IDs
- [ ] Worker secrets set: `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENTS`, `UNSPLASH_ACCESS_KEY`, `ANTHROPIC_API_KEY`
- [ ] First `eas build --platform ios --profile preview` (runbook 03)
- [ ] First `eas build --platform android --profile preview`
- [ ] "Name this memory" prompt (skippable)
- [ ] Settings modal: voice, profile, export, delete

## Week 4 (2026-05-14 → 2026-05-20) — Polish & accessibility

- [ ] Collage image lookup + Ken Burns pan
- [ ] Dynamic Type XXXL support across all screens
- [ ] VoiceOver / TalkBack labels audit
- [ ] Contrast audit (≥ 7:1)
- [ ] Haptic feedback on turn boundaries
- [ ] Handle app backgrounding / audio interruption / lost network

## Week 5 (2026-05-21 → 2026-05-27) — Beta prep & voice tests

- [ ] Listening tests with 3–5 elderly users (family + friends of family)
- [ ] Lock final 3 voices
- [ ] EAS Build iOS + Android
- [ ] App Store Connect + Play Console metadata (screenshots, description, privacy labels)
- [ ] TestFlight internal testing group
- [ ] Play Internal Testing track

## Week 6 (2026-05-28 → 2026-06-04) — Beta distribution & fixes

- [ ] Invite 10–20 beta users (mix of elderly + their adult children)
- [ ] Daily crash + session-length dashboard
- [ ] Prompt iteration loop: voice-test prompt tweaks, version bump, redeploy
- [ ] Decide pricing model before public launch (see [[PRD#10-open-questions]])

## Post-v1

- **Phase 2 (weeks 7–10):** family sharing via share sheet (peer-to-peer bundles)
- **Phase 3 (month 3+):** sanitized global repo — requires real backend + moderation
- **Phase 4 (month 6+):** friends-of-friends enrichment (explicit opt-in linking)

---

## What kills the timeline

- Voice latency > 1.5s on LTE → users give up → back to ElevenLabs config + possibly switching to a different voice provider. Test this in week 1.
- ElevenLabs pricing making per-user cost untenable → pricing decision forced forward from week 5 to week 2.
- Apple review on a voice-AI app hitting edge cases (they've been cautious about AI apps in 2025–2026) → add a week buffer for resubmission.
