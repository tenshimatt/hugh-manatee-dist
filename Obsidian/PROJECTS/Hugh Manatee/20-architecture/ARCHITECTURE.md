# Hugh Manatee — Architecture

**Status:** Draft v1.0 (Expo rewrite)
**Last updated:** 2026-04-23

---

## Stack

| Layer | Tech | Why |
|---|---|---|
| **Mobile** | Expo (React Native) + TypeScript | Single codebase, iOS + Android, low-native-surface app |
| **Voice** | ElevenLabs Conversational AI | Streaming TTS+STT+VAD+barge-in in one API — don't build this |
| **Storage** | `expo-sqlite` + `expo-file-system` + `expo-secure-store` | On-device only, no cloud in v1 |
| **Backend** | Cloudflare Workers (existing `Aurora-backend/`, slimmed) | Stateless proxy for ElevenLabs agent config + Unsplash image lookup |
| **Build/Deploy** | EAS Build + EAS Submit | iOS TestFlight + Google Play Internal Testing |

See [[001-expo-rewrite]] for why not Swift+Kotlin or Flutter.

---

## High-level data flow

```
┌──────────────────────────────────────────────────────┐
│  Device (nothing leaves unless user shares)           │
│                                                        │
│  ┌────────────┐   ┌──────────────┐   ┌────────────┐   │
│  │ Onboarding │──▶│ Conversation │──▶│  Library   │   │
│  │            │   │    screen    │   │            │   │
│  └────────────┘   └──────┬───────┘   └────────────┘   │
│         │                 │                 ▲          │
│         ▼                 ▼                 │          │
│  ┌──────────────────────────────────────────┴──────┐  │
│  │  SQLite  |  file system (audio)  |  secure store│  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────┬───────────────┘
                     │                 │
              (voice stream)     (agent config,
                     │            image lookup)
                     ▼                 ▼
          ┌───────────────────┐ ┌──────────────────────┐
          │ ElevenLabs CAI    │ │ CF Worker (stateless)│
          │ (per-voice agent) │ │ /agent/config        │
          └───────────────────┘ │ /collage/images      │
                                └──────────────────────┘
```

**Two network boundaries only:**
1. ElevenLabs voice stream (duplex)
2. Worker (agent config + image lookup) — one-shot, boring JSON

No user-content backend. No database off-device. No analytics backend.

---

## Data model (SQLite)

```sql
-- User profile (single row, id=1)
CREATE TABLE profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  first_name TEXT NOT NULL,
  birth_year INTEGER,           -- optional
  hometown TEXT,                -- optional, free text
  voice_id TEXT NOT NULL,       -- ElevenLabs voice ID
  agent_id TEXT NOT NULL,       -- ElevenLabs agent ID (per voice)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- One session = one open-and-talk
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,            -- uuid
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  duration_sec INTEGER,
  title TEXT,                     -- user-provided or auto-derived
  anchor_phrase TEXT,             -- for next session's opener
  audio_path TEXT,                -- relative to documentDirectory
  prompt_version TEXT NOT NULL    -- git-hash-like identifier of the prompt used
);

-- Turn-by-turn transcript
CREATE TABLE turns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  speaker TEXT NOT NULL CHECK (speaker IN ('user', 'hugh')),
  text TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  duration_ms INTEGER
);

-- Entities extracted post-session (people, places, objects, dates)
CREATE TABLE entities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('person', 'place', 'object', 'date', 'event')),
  value TEXT NOT NULL,
  first_mentioned_turn INTEGER REFERENCES turns(id)
);

-- FTS5 full-text search over turns
CREATE VIRTUAL TABLE turns_fts USING fts5(text, content='turns', content_rowid='id');
```

See [[003-local-only-storage]] for the privacy rationale.

---

## Voice loop detail

The voice loop is the product. Everything else serves it.

1. **App opens conversation screen.** Reads profile, queries last session for `anchor_phrase`.
2. **App calls Worker** `/agent/config` with a stripped context payload (first_name, birth_year, hometown, last_anchor, preference). Worker returns:
   - `agent_id` (the ElevenLabs agent bound to the selected voice)
   - `signed_url` (ElevenLabs WebSocket URL with short-lived signature)
   - `first_turn` (the deterministic opener rendered from `opening-scripts.md`)
   - `runtime_context` (seed prompts + era hooks, passed as ElevenLabs `dynamic_variables`)
3. **App opens WebSocket to ElevenLabs.** Streams mic audio up; streams Hugh's voice down. ElevenLabs handles VAD, barge-in, endpointing.
4. **App receives transcript events** per turn. Appends to in-memory session; writes to SQLite at end.
5. **User says "I'm done" / app closes / 60s silence** → app sends close event. Hugh says the closing line (also deterministic client-side), WebSocket closes.
6. **Post-session, background task:** extract entities, compute anchor phrase (via a small Worker endpoint that runs Claude with a terse prompt), write to `entities` and `sessions.anchor_phrase`.

**Latency budget:**
- Mic → ElevenLabs ingress: ~80ms on LTE
- ElevenLabs LLM + TTS streaming first byte: ~400ms
- TTS egress → speaker: ~80ms
- **Total p50 target: 600ms**, p95: 1000ms. ElevenLabs CAI is designed for this.

---

## Backend (Cloudflare Worker)

The existing `Aurora-backend/` gets slimmed to two endpoints:

### `POST /agent/config`
Input:
```json
{
  "first_name": "Jon",
  "birth_year": 1948,
  "hometown": "Glasgow",
  "voice_id": "...",
  "last_anchor": "at your grandmother's kitchen",
  "preference": "past"
}
```
Output:
```json
{
  "agent_id": "elevenlabs-agent-id",
  "signed_url": "wss://api.elevenlabs.io/v1/convai/conversation?...",
  "first_turn": "Hi Jon. Last time we were at your grandmother's kitchen. Somewhere new today, or back there?",
  "runtime_context": {
    "seed_prompts": ["...", "..."],
    "era_hooks": ["...", "..."]
  }
}
```

### `POST /collage/images`
Input: `{ birth_year, hometown, theme }`
Output: 3–5 Unsplash image URLs + colors for gradient. Cached aggressively (24h).

### `POST /session/anchor` (post-session, optional)
Input: last 10 turns of transcript.
Output: `{ anchor_phrase, title_suggestion, entities }` — runs Claude with a short redaction-aware prompt.

**Worker holds no user state.** Each call is stateless. Secrets: `ELEVENLABS_API_KEY`, `ANTHROPIC_API_KEY`, `UNSPLASH_ACCESS_KEY` — in Worker env, never in the mobile app.

---

## Security & privacy

- **Transport:** WSS + HTTPS, certificate pinning for `api.elevenlabs.io` and the Worker host.
- **Storage at rest:** SQLite file stored in app sandbox. Audio files in `expo-file-system` document directory. Both are per-app and excluded from iCloud/Google backup by default (explicit opt-in to device backup in settings).
- **ElevenLabs retention:** configure zero-retention on the CAI agent where supported. Audit our Privacy Policy to match.
- **No crash logs containing transcripts.** Sentry or equivalent can be enabled but transcript content is excluded from breadcrumbs.
- **Delete all data:** single action in settings; wipes SQLite, audio directory, secure store in one transaction.

See [[003-local-only-storage]].

---

## Repo layout (target)

```
/Users/mattwright/pandora/lifebook/
├── agent/                      # prompt source of truth
│   ├── system-prompt.md
│   ├── opening-scripts.md
│   ├── question-library.yaml
│   ├── follow-up-rules.md
│   └── README.md
├── app/                        # Expo app (NEW)
│   ├── app.json
│   ├── package.json
│   ├── App.tsx
│   ├── src/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── db/
│   │   └── lib/
│   └── eas.json
├── worker/                     # slimmed Cloudflare Worker (was Aurora-backend/)
│   ├── src/index.ts
│   ├── wrangler.toml
│   └── package.json
├── archive/                    # everything being retired
│   └── 2026-04-pre-expo/
├── README.md
├── ROADMAP.md
└── CLAUDE.md
```

Docs live in Obsidian (this folder). Tasks live in Plane. See the [[README]].

---

## What we deliberately don't use

- **No Redux / Zustand.** React Context + `useReducer` is enough for the state surface.
- **No React Navigation stack beyond 3 screens** (Onboarding / Conversation / Library + Settings modal).
- **No backend for user content.** If we need it in phase 3, we pick Cloudflare D1 or Supabase — not build one now.
- **No custom WebSocket protocol.** ElevenLabs CAI gives us a WebSocket already; don't layer on top.
- **No offline LLM.** Hugh requires network. That's a product constraint, communicated on the first launch screen.
