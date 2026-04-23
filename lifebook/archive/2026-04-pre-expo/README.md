# 2026-04-pre-expo archive

Snapshot of the Lifebook repo state immediately prior to the Expo (React Native) rewrite, captured 2026-04-23 per ADR-001 (see `Obsidian/PROJECTS/Hugh Manatee/` for the decision record).

Contents are the retired native-iOS generation of the app (Aurora and MemoirGuide Swift/SwiftUI projects, Xcode configuration, Apple certs, build artifacts, deploy scripts) plus the stale top-level documentation that accumulated across previous phases (MVP, phase 1-3 specs, deployment success notes, bookstack imports, etc.) and the two retired spec-kit feature trees (`specs/001-lifebook-mvp`, `specs/003-create-a-comprehensive`).

Nothing here is active. Kept for historical reference and in case we need to lift individual assets (icons, media, privacy policy text, test plans) into the Expo build. Delete only after the Expo app ships and we are certain nothing here is still referenced.

Organization:

- `swift/` — Xcode projects, Swift sources, build output, certs, Xcode config, Swift-era Documentation/
- `docs/` — every top-level `*.md` that lived at the repo root (except `CLAUDE.md`)
- `build-artifacts/` — `.ipa`, `.tar.gz` build output that was checked in
- `scripts/` — root-level `.sh`/`.rb` Xcode/iPhone deploy helpers
- `specs/` — retired spec-kit feature directories
