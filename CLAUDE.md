# CLAUDE.md — Hugh Manatee global rules

> Auto-loaded by Claude Code on every session in this repo. Also
> loaded into every Archon workflow context. Treat as ALWAYS-IN-EFFECT.

## What this repo is

Hugh Manatee — voice-first memory-capture iOS app for elderly users.
Code at `/Users/mattwright/pandora/lifebook/`. App at
`app/` (Expo SDK 54 + React Native). Cloudflare Worker backend at `worker/`.
Distributed via TestFlight; App Store ID `6763658895`,
bundle `com.beyondpandora.hughmanatee`.

## Tech stack — DO NOT CHANGE WITHOUT AN ADR

| Layer | Tech | Locked because |
|---|---|---|
| Framework | Expo SDK 54 + React Native 0.81.5 + TypeScript 5.9 | Capacitor-free, OTA updates, native modules work |
| Routing | expo-router 6.0 (file-based) | Routing + deep links wired |
| Voice AI | ElevenLabs Conversational AI (`@elevenlabs/react-native` 1.1.2) | Agent config + VAD + streaming committed |
| WebRTC transport | LiveKit (via ElevenLabs SDK) | Native modules, not web polyfill |
| Local storage | expo-sqlite (SQLite + FTS5) | Schema committed: profile, sessions, turns, entities |
| Audio | expo-av | Recording + playback |
| Backend | Cloudflare Worker (`worker/`) | Stateless, edge-deployed, no server to manage |
| AI (Worker) | Claude via Anthropic SDK on Worker | Session anchor + agent config generation |
| Distribution | EAS Build → TestFlight → App Store | CI wired in `.github/workflows/` |
| Testing | Maestro (iOS e2e, `.maestro/`) + Jest (unit) | Established test dirs |

If a change needs to deviate, write an ADR in
`Obsidian/PROJECTS/Hugh Manatee/30-decisions/` first.

## Architecture contract — must hold across every screen

Every screen uses expo-router file convention and wraps content in:

```tsx
<SafeAreaView style={{ flex: 1 }}>
  {/* screen content */}
</SafeAreaView>
```

- `SafeAreaView` from `react-native-safe-area-context` — required on ALL screens
- Sticky footer buttons use `useSafeAreaInsets()` + `paddingBottom: Math.max(insets.bottom, spacing.md)`
- `maxFontSizeMultiplier={1.15}` on all `<Text>` and `<TextInput>`
- Minimum touch target: 44pt on every interactive element
- `ConversationProvider` wraps the conversation screen; `useConversation` / `useConversationInput` only called inside it

**Brand palette** (from `app/src/theme.ts`):
Warm cream background, deep teal primary, warm coral accent.

## Hard rules

1. **Mobile-first, elder-first.** Every screen must render without overflow
   at iPhone SE viewport. VoiceOver must reach every interactive element.
2. **Mic mutes on navigate away.** When the user leaves the conversation
   screen, `setMuted(true)` fires. This is a privacy promise stated to
   the user in onboarding. Non-negotiable.
3. **No secrets in repo.** `.env`, `.env.local`, `*.p8` Apple keys,
   ElevenLabs API keys, Cloudflare tokens — all gitignored or in
   `pandora-ci/.secrets/`.
4. **Tests required for new behaviour.** PRs that change `app/src/` or
   `worker/src/` without a corresponding test file change are rejected.
5. **Mission anchor.** Every behavioural change must trace to `§X.Y` in
   the PRD. The `archon-feature` workflow enforces this for autonomous
   runs; manual commits should follow the same rule.
6. **No `startSession()` guard violations.** Never call `setMuted()` or
   any `useConversation` method before `status === "live"`. Guard all
   such calls on status.

## How work flows here

- **Idea → Plane ticket** (identifier `HUGH`, workspace `beyond-pandora`,
  project UUID `a0855ada-7e70-494d-99dd-07c2598924d3`)
- **Plane label `archon-ready`** → 5-min poller on CT 111 picks it up
- **Workflow runs**: PRD edit → classify → plan → diagrams → reviews →
  tests → code → validate → PR
- **3 human gates** (PRD, plan, PR) — comment `:approve:` /
  `:reject: <reason>` on the Plane ticket
- **PR opens** against `https://github.com/tenshimatt/hugh-manatee-dist`

Full ops doc (once created):
`Obsidian/PROJECTS/Hugh Manatee/40-operations/archon-hugh-manatee-workflow.md`

## Files I should always read

When entering this repo for any non-trivial task:

1. **This file** (`CLAUDE.md`) — global rules
2. **`mission.md`** — what the product is + scope boundaries
3. **`factory-rules.md`** — operating constraints for autonomous runs
4. **`Obsidian/PROJECTS/Hugh Manatee/10-product/PRD.md`** — the PRD

For specific features also load:
`Obsidian/PROJECTS/Hugh Manatee/20-architecture/<slug>.md`

## Project quirks to remember

- `document.createElement` errors in Metro/simulator are LiveKit web
  fallback noise — simulator-only, real device uses native WebRTC. Not a crash.
- The Cloudflare Worker is the source of truth for the ElevenLabs agent
  config (voice, system prompt, opener). Local `.env.local` holds
  `WORKER_URL` pointing at the deployed Worker.
- EAS build uses `app/credentials.json` + `app/certs/` for manual
  signing. Provisioning profile: `HughManatee AppStore`.
- `nukeDb()` in `app/src/db/schema.ts` is the correct full-wipe. Always
  call it before `clearProfile()` in any delete-all flow.
- Expo token `wGQPBp9nBS1soonNDSjSJ42oTA5nWDSQ5uw6DuHZ` is exposed in
  git history (HM-11) — rotate before public repo access.

## Anti-patterns — DO NOT INTRODUCE

1. **Generic AI chat** — Hugh is a memory guide. Off-topic prompts get
   redirected, never answered at length.
2. **Mid-session UI** — no buttons, modals, or notifications during a
   live conversation. The only tap is End.
3. **Cloud sync without explicit user opt-in** — v1 is on-device only.
4. **UIKit or web components** — Expo/React Native only; no UIKit mixing,
   no web-only APIs (document, window, localStorage).
5. **Forced upgrade gates** — never block the app on a version check.
6. **Confetti / gamification** — warm and human, not celebratory.
7. **Vibe-coding without a test** — covered by factory-rules.md hard rule #2.

## Pandomagic section

This project runs the Pandomagic Archon-driven development process.
Reference: `/Users/mattwright/pandora/pandomagic/README.md`.

- Workflow file: `.archon/workflows/hugh-manatee-feature.yaml`
- Config: `.archon/config.yaml`
- Plane project: `HUGH` / `a0855ada-7e70-494d-99dd-07c2598924d3`
- Archon harness: CT 111 (`10.90.10.10` → `pct exec 111`)
- Pyramid levels doc: `docs/architecture/levels.md`

**Last reviewed: 2026-04-27**

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->
