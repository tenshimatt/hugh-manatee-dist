# ADR-003: All user content is local-only in v1

**Status:** Accepted
**Date:** 2026-04-23

## Context

The primary audience — elderly users recalling childhood — is also the audience most cautious about "where does this go?" and most harmed by a data breach involving intimate memories. The product's core promise, repeated in Hugh's opening line, is **"everything stays on your phone"**.

We could offer cloud sync, account-based backup, cross-device access. Each of those is a feature someone will ask for. Each also introduces:

- A surface for compromise (backend, auth, encryption key management)
- A compliance footprint (GDPR data subject requests, deletion audit trail, data residency)
- A trust story that is harder to explain in one sentence

## Decision

**All user content stays on the device in v1.** No account system, no cloud sync, no cross-device. Nothing leaves the phone unless the user explicitly initiates a share.

The only two network connections during normal use:
1. **ElevenLabs Conversational AI** — duplex voice stream (configured for zero retention where supported)
2. **Cloudflare Worker** — stateless proxy for agent config + image lookup (no user content passes through)

## Rationale

- **The promise must be simple to state and true.** "Stays on your phone." Full stop. Any caveat dilutes trust with this audience.
- **The backend we avoid building is a backend we don't have to secure.** For a small team, not having a user-content backend is a compounding safety win.
- **Device-local is the default on modern phones anyway.** SQLite + file system + secure store is robust. Backup to iCloud / Google Drive is user-controlled and opt-in in settings.
- **The phase 2 sharing model doesn't require a server.** Share-sheet bundles are peer-to-peer. No hosted inbox.
- **The phase 3 global-repo model, when we get there, is explicit-opt-in per memory with PII stripping.** That's a separate consent than "store my stuff in the cloud." Keeping v1 local-only doesn't commit us either way on v3.

## Consequences

**Gained:**
- Trust story fits on one line
- No backend for user content → no backend incidents for user content
- No GDPR subject access / deletion pipeline to build (deletion = uninstall or "delete all data")
- Simpler threat model: device encryption + app sandbox is the boundary

**Given up:**
- No cross-device continuity (user switches phone → memories don't follow without manual export/import)
- No cloud backup without user enabling iOS/Android device backup (which is also user-controlled, not app-controlled)
- Features some users will ask for ("can my daughter see these on her phone?") are deferred to phase 2 sharing

**Mitigations:**
- **Export all** in settings: zip of audio + JSON manifest. User can back up however they like.
- **Delete all** in settings: single-tap nuke with hard confirmation. Also what uninstall does.
- **Device backup opt-in** in settings: if enabled, SQLite + audio included in iOS/Android device backup. Off by default.
- Explicit onboarding text: "If you lose this phone, these memories are lost. Use *Export all* in Settings to keep a copy somewhere safe."

## Threat model (v1)

In scope:
- Device theft (mitigated by device PIN/biometric + app sandbox encryption)
- Unauthorized app access by household members (not mitigated in v1; app PIN is a possible phase 2 feature)
- Transport interception (mitigated by TLS + cert pinning on both network endpoints)
- Vendor breach at ElevenLabs (mitigated by zero-retention config; content passes through but is not stored)

Out of scope:
- Forensic recovery from a wiped-and-not-securely-wiped device
- Targeted device compromise (jailbreak, rootkit)
- State-level adversaries

## Review trigger

This ADR is revisited if:
- A user research session with >3 users independently asks for cross-device continuity
- Phase 2 sharing demand makes peer-to-peer bundles feel inadequate
- A compliance requirement (insurer, institutional partner) requires a different posture
