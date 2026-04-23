# Hugh Manatee — handoff state (2026-04-23)

Where things stand and what you (Matt) need to do next. This doc will move into `99-archive/` once everything here is resolved.

---

## What's built and committed

All in `/Users/mattwright/pandora/lifebook/`, clean typecheck, clean wrangler dry-run, three commits on `feat/jwm-demo`:

- **`agent/`** — Hugh's persona, openers, 80-prompt question library with era hooks, follow-up rules. Source of truth.
- **`app/`** — Expo SDK 54 + TypeScript, 5 screens, SQLite+FTS5 local storage, `@elevenlabs/react-native` voice loop wired end-to-end (dynamic variables, turn capture, anchor extraction on close), `CollageBackground` with Ken Burns drift over Unsplash imagery.
- **`worker/`** — Cloudflare Worker with three endpoints: `/agent/config` (ElevenLabs token + deterministic opener + runtime context), `/collage/images` (Unsplash + 24h KV cache), `/session/anchor` (Claude-extracted anchor + title + entities).

Plane: 23 of 48 issues moved to Done or In Progress. See [plane.beyondpandora.com/beyond-pandora/projects/a0855ada-7e70-494d-99dd-07c2598924d3/issues/](https://plane.beyondpandora.com/beyond-pandora/projects/a0855ada-7e70-494d-99dd-07c2598924d3/issues/).

## What you need to do — in order, nothing overlaps

### This week (can do in parallel)

1. **Apple Developer Program** — [enroll](https://developer.apple.com/programs/enroll/). $99/yr, 1–3 days. Runbook: `40-operations/01-apple-developer-and-testflight.md`.
2. **Google Play Console** — [sign up](https://play.google.com/console/signup). $25 one-time, 1–2 days. Runbook: `40-operations/02-google-play-console.md`.
3. **ElevenLabs** — [sign up](https://elevenlabs.io), Creator tier ($22/mo). Runbook: `40-operations/04-elevenlabs-setup.md`.

### After ElevenLabs is live

4. Save 5 candidate voices to VoiceLab (runbook 04 step 2 has the brief).
5. Create one CAI agent per voice, paste in Hugh's system prompt (runbook 04 step 3).
6. Set Worker secrets: `npx wrangler secret put ELEVENLABS_API_KEY`, `ELEVENLABS_AGENTS` (JSON map), `UNSPLASH_ACCESS_KEY`, `ANTHROPIC_API_KEY`.
7. Run the listening test (runbook `40-operations/05-listening-test-protocol.md`). 3–5 testers aged 60+, 1 afternoon.
8. Tell me the 3 winning voice_id + agent_id pairs. I'll swap `PLACEHOLDER_VOICES` for real values and commit.

### After Apple + EAS ready

9. From `app/`: `npx eas-cli login`, `npx eas-cli init`, first iOS build (runbook 03).
10. `npx eas-cli submit --platform ios` to push to TestFlight.
11. Same for Android → Play Internal Testing.

## What I'll do next — tell me when you're ready

- **Accessibility pass** (A11Y-01..05): Dynamic Type, VoiceOver, contrast audit, no-gesture-required operation. 1 focused session, no external blockers.
- **Audio persistence** (DATA-02): buffer ElevenLabs output into session's audio_path, wire playback into `session/[id].tsx`. ~0.5 session.
- **Settings export/delete** (SET-03, SET-05): zip-export + device-backup opt-in. ~0.5 session.
- **Integration smoke test**: once you have real agent IDs, run a 2-minute end-to-end session in the simulator with the real Worker pointed at dev ElevenLabs. ~0.5 session.

None of those need Apple enrollment to proceed. Say "go" and I'll pick them up in order.

## What I won't do without permission

- Set any secrets or run `wrangler secret put` — those require keys you haven't shared.
- Deploy the Worker to production.
- Run `eas build` (triggers billing, needs your account).
- Make any App Store Connect / Play Console changes.
- Publish anything to any store.

## Open questions waiting on you

- **Pricing decision** (PRD §10). ElevenLabs CAI at ~$0.10/min × 15 min/day = ~$45/user/month. Free tier not viable at scale. Decide before beta invites beyond immediate family.
- **Voice selection** — blocked on listening test. You'll tell me the 3 voice_ids.
- **Store listing copy** — descriptions, screenshots. We can draft these once the simulator session runs cleanly.
