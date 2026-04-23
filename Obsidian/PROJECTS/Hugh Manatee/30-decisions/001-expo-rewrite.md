# ADR-001: Rewrite from native Swift to Expo (React Native)

**Status:** Accepted
**Date:** 2026-04-23
**Decision by:** Matt, with agent analysis

## Context

The existing codebase (`/Users/mattwright/pandora/lifebook`) is two parallel iOS Xcode projects (`Aurora/` and `MemoirGuide/`) with ~144 Swift files, a Cloudflare Workers proxy, and roughly 30 markdown files claiming various states of "complete" that don't match reality. Actual on-device features: recording, transcription, local storage, basic onboarding. Missing: voice-first loop, collage background, family sharing, global repo, **any Android presence at all**. No CI signing, no TestFlight submission.

The product calls for both iOS and Android, elder-friendly UX, a voice-first zero-tap experience. The mobile surface is unusually simple: one full-screen audio-centric view plus onboarding and a library. Almost no complex native integrations.

## Options considered

1. **Keep Swift, add Kotlin twin for Android.**
2. **Rewrite in Flutter.**
3. **Rewrite in Expo (React Native) with TypeScript.**
4. **Keep Swift for iOS demo, defer Android indefinitely.**

## Decision

**Option 3: Expo + React Native + TypeScript.**

## Rationale

- **Single codebase.** The mobile surface is light: microphone, audio playback, SQLite, secure store, file system, WebSocket to ElevenLabs, a few screens. All available cross-platform in Expo with first-party modules.
- **Native isn't paying for itself.** Swift buys best-in-class animations and deep iOS integration. Hugh is 95% a full-screen soft collage + audio. We don't need those wins.
- **Two codebases is 2× maintenance forever.** For a solo/small-team project that cost compounds. Option 1 is rejected on that ground alone.
- **Flutter vs RN is a wash for this app.** Both would work. React Native wins on ecosystem depth for audio and auth, and on prompt-library tooling (YAML/TS native). Expo's EAS Build + Submit removes the single most annoying part of mobile shipping (signing + CI).
- **ElevenLabs CAI has solid JS SDKs.** Dart support exists but is thinner. Don't fight that.
- **The Worker stays.** It's the right shape (Cloudflare edge, stateless). Keeping it unchanged isolates the rewrite to the mobile layer.

## Consequences

**Gained:**
- iOS + Android from one codebase
- EAS handles signing, TestFlight, Play Internal Testing without custom CI
- Faster prompt iteration (change YAML → ship)
- Doc + code inflation gets cleaned up during the move

**Given up:**
- Best-in-class iOS haptics and subtle animation polish
- ~6 weeks of existing Swift work (services, onboarding, recording) — some patterns will port conceptually but the code does not
- Near-term knowledge retention in Swift for any future iOS-only feature

**Mitigations:**
- Native iOS polish is not what this audience values; they value latency and voice warmth, both of which RN can deliver.
- The Swift code is archived, not deleted, in `archive/2026-04-pre-expo/` in case we need to reference a specific service implementation during the port.

## Follow-ups

- [[002-elevenlabs-conversational-ai]] — the voice decision this enables
- [[ROADMAP]] — week 1 scaffold, week 2 core loop, 6-week target to TestFlight + Play Internal
