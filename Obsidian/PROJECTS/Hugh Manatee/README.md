# Hugh Manatee

Voice-first memory-capture mobile app. "Hugh Manatee" plays on *humanity* — the goal is to capture, quietly and privately, the memories and stories of ordinary people (primary audience: elderly users recalling childhood), and eventually weave them together with the memories of friends, family, and the world.

## Where things live

| Artifact | Home |
|---|---|
| **Code** | `/Users/mattwright/pandora/lifebook/` |
| **Agent prompts (source of truth)** | `/Users/mattwright/pandora/lifebook/agent/` |
| **Project docs (this folder)** | `/Users/mattwright/pandora/Obsidian/PROJECTS/Hugh Manatee/` |
| **Tasks** | [Plane — Hugh Manatee (HUGH)](https://plane.beyondpandora.com/beyond-pandora/projects/a0855ada-7e70-494d-99dd-07c2598924d3/issues/) |

## Quick links

- [[PRD]] — what we're building and why
- [[ARCHITECTURE]] — tech stack, data flow, privacy model
- [[ROADMAP]] — week-by-week plan to TestFlight + Play Internal
- [[001-expo-rewrite]] — why we're rewriting from native Swift to Expo
- [[002-elevenlabs-conversational-ai]] — why we're using ElevenLabs CAI, not building a custom voice loop
- [[003-local-only-storage]] — why nothing leaves the device in v1
- [[DECISIONS-LOG]] — running list of smaller decisions
- [[ADR]] — index of architecture decision records
- [[CHANGELOG]] — project changelog

## Runbooks (first-time publisher)

- [[01-apple-developer-and-testflight]] — Apple Developer enrollment + TestFlight
- [[02-google-play-console]] — Google Play Console + Internal Testing
- [[03-eas-build-and-submit]] — EAS Build + Submit pipeline
- [[04-elevenlabs-setup]] — ElevenLabs voices + Conversational AI agents
- [[05-listening-test-protocol]] — Pick the final 3 voices with real elderly testers

## By topic

| Folder | Purpose |
|---|---|
| 00-meta | Task backlog, project meta |
| 10-product | PRD, roadmap |
| 20-architecture | Stack, data flow, privacy model |
| 30-decisions | ADRs + rolling decisions log |
| 40-operations | Runbooks (empty for now) |
| 50-research | PLAUD transcripts, research notes |
| 99-archive | Superseded docs |

## One-line product description

> A kind voice named Hugh that asks gentle questions and helps you record your memories, with nothing leaving your phone unless you choose to share.

## Primary user

**Elderly people** recording childhood and life memories, with **minimum friction**: ideally zero taps after the initial onboarding. Voice in, voice out. A second audience — their **adult children** setting the app up for a parent — matters too, but they're not the user during capture.

## Not goals (v1)

- Account systems, cloud sync, login
- Transcription display, editing UI, text input
- Global shared repository (phase 2)
- Photo integration, video
- Any form of social feed
