# Hugh Manatee — Mission

> **Loaded into every Archon workflow context.** Don't bloat. If a thing
> doesn't help an autonomous agent decide whether to build something,
> it doesn't belong in this file. Detail goes in
> `Obsidian/PROJECTS/Hugh Manatee/10-product/PRD.md` (the PRD).

## What Hugh Manatee is

Hugh Manatee is a voice-first memory-capture iOS app for elderly users. The
interaction is deliberately minimal: open the app, hear Hugh greet you by name,
and talk. A gentle AI voice guides the user through one small sensory question at
a time, capturing life stories in the user's own words. Sessions are saved
locally. The app builds a private, searchable archive of memories over time.

The product positioning is: **"the easiest way to save your stories."**
Voice-first. One interaction. No feeds, no accounts, no mid-session taps.

## Who it's for

1. **The recorder (primary user)** — adults 65+, recalling memories. Often
   has some tech fatigue, small-screen struggles. Uses a phone for calls and
   texts. Not confident with apps.
2. **The installer (often not the user)** — adult child 35–60, installs on
   parent's phone, may sit with them for the first session.
3. **Secondary recorders** — anyone who wants to capture memories; experience
   is tuned to the primary and will not be compromised for younger users
   wanting more features.
4. **Family readers (Phase 2)** — named family members who receive shared
   memory excerpts; read-only in v1.

## In scope (the factory will build these)

- Onboarding: name, voice selection (3 curated ElevenLabs voices), optional
  birth year + hometown, privacy notice
- Voice capture loop: ElevenLabs Conversational AI, barge-in VAD, WebRTC
  streaming, context-aware greeter, sensory follow-up prompts
- Collage background: blurred era-appropriate imagery, Ken Burns pan
- Local storage: SQLite transcript + turns + entities + FTS5
- Session post-processing: anchor phrase + title via Cloudflare Worker (Claude)
- Memories library: list of past sessions, playback
- Settings: edit profile, manage voices, delete data
- Accessibility: Dynamic Type, VoiceOver, 44pt minimum touch targets,
  high-contrast palette
- TestFlight / App Store distribution
- **Operational transparency** — build version visible in Settings; error
  states surface enough detail for the user to report via Plane/TestFlight

## Out of scope (hard boundaries — factory must REFUSE)

- **Accounts / cloud sync in v1** — everything stays on-device until Phase 2
  family-sharing is explicitly scoped and designed
- **Android** — iOS-only; no cross-platform port in this codebase
- **Web app** — there is no web surface; delete any web scaffolding still
  in the repo
- **Gamification / streaks / achievements** — no confetti, no "you're doing
  great!", no nudge mechanics
- **Generic AI chat** — Hugh is a memory guide, not a general assistant;
  off-topic chat is gently redirected
- **Supplier / marketplace / payments** — not this product
- **Social feeds** — no public sharing, no follower counts
- **Anything contradicting PRD §11 (what we are not building)**

## Issue triage rules (Plane `archon-ready` label)

When a ticket is labelled `archon-ready`, the workflow's first AI step
checks it against this mission. The ticket is **rejected** if:

1. It requests an out-of-scope feature (above)
2. It contradicts the PRD anchor at `§X.Y` it cites
3. It can't be specified as a testable acceptance criterion
4. It would require breaking the architecture contract (PRD §4)

Rejected tickets get the `archon-failed` label + a comment explaining why.
Matt can still drive the work manually if he disagrees with the rejection.

## Default model + cost expectations

Per Pandomagic dual-tier architecture:
- **Architect-review node only**: Claude Opus 4.7 (1M context) — adversarial review
- **All worker nodes**: DeepSeek-V4-Pro (plan, implement, reviews) or
  DeepSeek-V4-Flash (triage, classify, tickets, open-pr) via Anthropic-compat
  endpoint. ~14× cheaper output tokens than Sonnet.
- Halt-on-fail: if DEEPSEEK_API_KEY is missing or DeepSeek is down, the
  workflow halts. We do NOT silently fall back to Claude.
- Per-feature workflow run target: ~$1–3

## When this file changes

This is the source of truth for "what Hugh Manatee is" from the harness's
perspective. Material edits go through:

1. Discussion in a Claude Code session OR a dedicated Plane ticket
2. Update this file
3. Update the PRD anchor's §1 / §2 / §11 to match
4. Bump `Last reviewed` date in PRD

**Last reviewed: 2026-04-27**
