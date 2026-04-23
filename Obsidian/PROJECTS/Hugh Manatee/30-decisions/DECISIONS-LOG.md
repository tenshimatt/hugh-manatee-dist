# Decisions log

Smaller decisions that don't rise to a full ADR. Newest first.

---

## 2026-04-23 — Hugh doesn't talk about being a manatee

Cutesy mascot voice would torpedo the elder-first tone. The manatee is a brand layer on the app surface; the voice is just a warm companion named Hugh. Can be revisited if user testing says otherwise.

## 2026-04-23 — Openers are deterministic, not LLM-generated

Hugh's first utterance in any session is rendered client-side from `agent/opening-scripts.md`. First impressions can't vary. The LLM takes over starting turn 2.

## 2026-04-23 — Privacy reassurance is said once, then not repeated

Repeated reassurance reads as *un*trustworthy. Hugh says "everything stays on your phone" at the opener and when directly asked, and otherwise never mentions privacy, data, recording, or tech.

## 2026-04-23 — No "how did that make you feel?" by default

Sensory probes (smell, sound, light, weather, clothing, object) elicit richer answers from older users than feeling-probes. Feelings surface on their own.

## 2026-04-23 — Voice selection punted to week 5

We'll listening-test 3–5 candidate ElevenLabs voices with real elderly users before locking. Picking from a designer's ear alone is wrong for this audience.

## 2026-04-23 — Archive, don't delete

The existing Swift code, old Xcode projects, and ~30 `*_COMPLETE.md` files move to `archive/2026-04-pre-expo/`. Hard delete is reserved for a later pass after the Expo port reaches feature parity.

## 2026-04-23 — Single codebase via Expo; see ADR-001

Rejected: Swift + Kotlin twins (2× maintenance), Flutter (weaker ElevenLabs SDK).

## 2026-04-23 — No analytics on memory content, ever

We can count sessions, duration, crash rates. We do not read transcripts, ever, for any reason — including "for AI improvement". This is a standing rule, not a v1 constraint.
