# Hugh Manatee

Voice-first memory-capture app. Hugh the manatee (a play on *humanity*) guides users through unhurried, private memory-capture conversations — elder-first, voice-only, local-only.

## Structure
- `app/` — Expo (React Native + TypeScript) mobile app
- `worker/` — Cloudflare Worker (agent config, image lookup, anchor extraction)
- `agent/` — Prompt library (system prompt, opening scripts, question library, follow-up rules). Source of truth for Hugh's behavior.
- `archive/` — Retired Swift code and pre-Expo docs. Reference only.

## Docs & tasks
- **Project docs:** `/Users/mattwright/pandora/Obsidian/PROJECTS/Hugh Manatee/` (PRD, architecture, ADRs, roadmap, deployment runbooks)
- **Tasks:** [Plane — Hugh Manatee (HUGH)](https://plane.beyondpandora.com/beyond-pandora/projects/a0855ada-7e70-494d-99dd-07c2598924d3/issues/)

## Quickstart
- App: `cd app && npm install && npx expo start`
- Worker: `cd worker && npm install && npx wrangler dev`

See Obsidian for deeper docs.
