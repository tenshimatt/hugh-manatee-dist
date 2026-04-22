# Automagic — Product Requirements Document
**Voice-to-Action Pipeline: From voice note to managed project in seconds**

| Field | Value |
|---|---|
| Version | 3.1 |
| Date | 2026-04-18 |
| Author | Matt Wright |
| Status | Living Document |
| Plane Project | Automagic (43e10311) |
| Workspace | beyond-pandora |

---

## 1. Problem Statement

Voice notes are the fastest way to capture ideas, decisions, and tasks. But the gap between recording a thought and it becoming actionable work is enormous. Notes sit in folders, unclassified and unprocessed. Ideas decay. Action items get lost. The cognitive overhead of processing each note manually means most never get processed at all.

The current pipeline (Plaud Note Pro → Obsidian via n8n + Whisper large-v3 + LiteLLM) solves transcription, summarization, semantic tagging, and folder routing. Notes are automatically classified by an LLM and filed into project folders. But the downstream artifact generation and project management integration is where the real leverage lives.

### 1.1 What We Lose Today

- Product ideas captured in voice notes never become PRDs or tracked features
- Meeting action items are transcribed but never become trackable tasks
- Architecture decisions are spoken but never formalized as ADRs
- Business ideas are noted but never structured into canvases or GTM plans
- There is no way to rebuild the system from documentation because none exists

---

## 2. Vision

Automagic transforms voice notes into managed work. Record a thought, and the system classifies it, generates the appropriate artifact (PRD, business canvas, ADR, task list), creates issues in Plane, and optionally executes auto-work like drafting documents. The user reviews and approves rather than creates from scratch.

### 2.1 Design Principles

- **Transparency over magic:** every step visible in n8n execution logs and Plane issue history
- **Parallel not blocking:** new pipeline stages never break existing Obsidian sync
- **Rebuild from PRD:** this document is the single source of truth for rebuilding the entire system
- **Obsidian is the master:** all documents (transcriptions, PRDs, ADRs, canvases) live in Obsidian only. Plane stores tasks, not documents. No duplication.
- **PRD drives tasks:** Plane issues are derived from the PRD, not generated independently. The PRD is the blueprint; tasks are the execution plan extracted from it.
- **Adapter pattern:** every external integration swappable without touching core logic
- **Self-hosted first:** all components run on BeyondPandora infrastructure, zero vendor lock-in

---

## 3. Target Users

**Primary:** Solo founder/operator who captures ideas and decisions via voice throughout the day and needs them automatically structured and tracked.

**Secondary:** Small teams using Plane (or Jira) for project management who want voice-driven task creation and artifact generation.

---

## 4. System Architecture

### 4.1 Infrastructure

| Component | Location | Details |
|---|---|---|
| n8n | CT 107 @ 10.90.10.7 | https://n8n.beyondpandora.com — 7 workflows |
| Plane | CT 106 @ 10.90.10.6 (Docker) | https://plane.beyondpandora.com |
| LiteLLM | CT 123 @ 10.90.10.23:4000 | Gateway to Anthropic API |
| Whisper ASR | PCT 146 @ 10.90.10.46:8000 | RTX A4000 GPU, whisper large-v3 |
| Automagic Console | CT 120 @ 10.90.10.20:3100 | https://automagic.beyondpandora.com |
| Obsidian/PLAUD_NOTES | CT 107 `/opt/PLAUD_NOTES/` | Synced via Syncthing to local Obsidian |
| Traefik | CT 103 @ 10.90.10.3 | Reverse proxy for *.beyondpandora.com |
| Authentik | CT 105 | SSO for Automagic Console and other services |

### 4.2 Pipeline Flow

**Canonical pipeline (document-first, sequential view):**

```
Audio (Plaud) → Whisper large-v3 (GPU) → Transcription
    → LLM Summarise (Sonnet) → LLM Title (Sonnet) → LLM Semantic Tags (Sonnet)
    → Build Markdown → Write to /PLAUD_NOTES/PROJECTS/<Folder>/YYYY-MM-DD HH:MM Title.md
    → WF-2 Classifier → WF-3 Artifact Generator → PRD/ADR/Canvas → Obsidian
    → Tasks extracted FROM the document → WF-4 Plane Adapter → Plane issues
```

Obsidian receives content at two points: the tagged transcription is written immediately after summarisation and semantic classification; the generated artifact (PRD/ADR/Canvas) is written before any Plane interaction.

**n8n workflow graph (6 active workflows):**

```
Plaud Note Pro → WF-1a (Poll & Transcribe, 17 nodes) → sequential chain:
  Schedule (1min) → Fetch Plaud API → Filter New → Get Audio URL → Download Audio
  → Whisper Transcribe (GPU, 10.90.10.46:8000)
  → LiteLLM Summarise (Sonnet) → Build Title Payload → LiteLLM Title Fix (Sonnet)
  → Build Tag Payload → LiteLLM Classify Tags (Sonnet)        ← NEW: semantic tagging
  → Build Markdown (with folder routing)                       ← tags + PROJECTS/<folder>/
  → Convert to File → Write to PLAUD_NOTES
  → Mark Processed + Release Lock → Wrap for WF-2 → Execute WF-2

WF-1b (Webhook alternative): same ASR+Summarise+Tag+Write pipeline, webhook-triggered

WF-2 (Classify) → WF-3 (Generate Artifacts) → WF-4 (Plane Adapter)
WF-5 (Webhook Listener): Plane state changes → auto-work → Plane comments
```

### 4.3 Document Flow

**Obsidian is the single source of truth for all documents.** Plane manages projects and tasks only — no document content lives in Plane.

| Document Type | Written To | Plane Role |
|---|---|---|
| Transcription (tagged) | `/PLAUD_NOTES/PROJECTS/<Folder>/YYYY-MM-DD HH:MM Title.md` | Not in Plane |
| Transcription (untagged) | `/PLAUD_NOTES/YYYY-MM-DD HH:MM Title.md` (root) | Not in Plane |
| Folder Config | `/PLAUD_NOTES/00 Folder Config.md` | Not in Plane |
| PRD | `/PLAUD_NOTES/PROJECTS/<ProjectName>/PRD.md` | Issues store path only |
| ADR | `/PLAUD_NOTES/PROJECTS/<ProjectName>/ADR.md` | Issues store path only |
| Business Canvas | `/PLAUD_NOTES/PROJECTS/<ProjectName>/Canvas.md` | Issues store path only |
| Meeting Summary | `/PLAUD_NOTES/YYYY-MM-DD HH:MM Title.md` | Action items become issues |

**Architectural rules:**

1. **PRDs are written ONLY to Obsidian.** Never duplicated in Plane. Plane issues store the Obsidian file path in their description field — nothing more.
2. **Tasks in Plane are derived from the PRD.** The PRD is the blueprint; Plane issues are the execution plan extracted from it. No Plane task exists independently of a source document.
3. **Claude reads the PRD from Obsidian at build time.** When WF-5 triggers auto-work on a Plane issue, it reads the Obsidian path from the issue description and loads the full PRD from Obsidian before generating anything. The PRD is an operational document used actively during execution, not decorative metadata.
4. **Updates go to Obsidian only.** If a PRD changes, edit Obsidian. Plane tasks may need re-derivation but the document lives in one place.

### 4.4 Workflow Specifications

#### n8n Workflow IDs

| Workflow | Internal ID | Description |
|---|---|---|
| WF-1a | `QCybD1D7TPuRlSxy` | Poll & Transcribe (schedule-triggered, 17 nodes) |
| WF-1b | `KVAgqT59SOwJ5mu2` | Transcribe & Summarise (webhook-triggered) |
| WF-2 | `ZGXyevhwCLoO1NQv` | Classifier & Router |
| WF-3 | `ymyqsCkRkriynHMd` | Artifact Generator |
| WF-4 | `Kgo3OVp7hiiGNvmq` | Plane Adapter |
| WF-5 | `LiHaBwRnPkEckxkf` | Webhook Listener |

#### WF-1a: Poll & Transcribe (17 nodes)

Polls Plaud API every 1 minute for new recordings. Tracks processed files via `.processed.json` on disk. Downloads audio, sends to Whisper large-v3 ASR on GPU (PCT 146), calls LiteLLM/Sonnet for summarisation, generates AI title via LiteLLM/Sonnet, performs LLM-based semantic tagging via LiteLLM/Sonnet, builds markdown with folder routing, writes to PLAUD_NOTES, then sends to WF-2 for classification.

**Node chain (17 nodes):**
```
Every 1 Minute → Fetch Plaud File List → Filter New Recordings → Get Audio URL
→ Download Audio → Whisper Transcribe → LiteLLM — Summarise → Build Title Payload
→ LiteLLM — Title Fix → Build Tag Payload → LiteLLM — Classify Tags
→ Build Markdown → Convert to File → Write to PLAUD_NOTES
→ Mark Processed + Release Lock → Wrap for WF-2 → Execute WF-2 Classifier
```

**Concurrency control:** File-based lock system (`.processing.lock` + `.processed.json` in `/opt/PLAUD_NOTES/`). The lock file is written immediately when processing starts and removed after completion. Lock timeout: 11 minutes. Max 1 concurrent processing execution. Failed recordings are automatically retried (processedIds only updated after successful pipeline completion).

**Title generation:** `Build Title Payload` (Sonnet) → `LiteLLM — Title Fix` generates a concise 3-8 word title from the transcription. Filename format: `YYYY-MM-DD HH:MM <AI Title>.md`.

**Semantic tagging (added 2026-04-17):** Replaced keyword-based tagging with LLM-based semantic classification. `Build Tag Payload` reads `00 Folder Config.md`, extracts all keyword→tag and tag→folder mappings, constructs a prompt with the title + first 60 lines of summary. `LiteLLM — Classify Tags` (Sonnet) returns `{primary_tag, secondary_tags, reasoning}`. The LLM determines what the recording is *primarily about* rather than matching every keyword mention. This prevents false positives (e.g., a passing mention of "Standard Bank" no longer tags a JWM pitch as `standard-bank`).

**Folder routing (added 2026-04-17):** `Build Markdown` resolves the primary tag to a folder via the Tag→Folder mapping in config. If the folder exists on disk under `/opt/PLAUD_NOTES/PROJECTS/`, the file is written there (e.g., `PROJECTS/JWM/2026-04-17 18:40 Title.md`). If no folder matches or the folder doesn't exist, the file stays in root (preserving previous behaviour). The `project_folder` field is added to frontmatter and passed to WF-2.

**Fallback safety:** If the LLM classify call fails or returns unparseable JSON, the recording gets `['voice-note', 'plaud']` tags only and stays in root.

#### WF-1b: Transcribe & Summarise (Webhook)

Webhook-triggered alternative path. Receives audio from Plaud via webhook (`/webhook/plaud-inbound`), runs the same pipeline as WF-1a: ASR → Summarise → AI Title → Semantic Tags → Build Markdown → Write → WF-2.

**Both WF-1a and WF-1b produce the same output format** and send the same payload to WF-2 (including `project_folder`).

#### WF-2: Classifier & Router

Webhook receives transcription data (including `project_folder` from WF-1a/1b semantic tagging). Two LiteLLM/Haiku calls:
1. Title fix to `YYYY-MM-DD - Summary` format (max 15 words)
2. Classification into 7 categories with confidence score, project name suggestion, urgency, and tags

7-output Switch router sends to appropriate handler. MIXED category segments the note and re-classifies each segment with a dedup guard to prevent infinite loops. TASK and MEETING_NOTES route directly to WF-4 (Plane). IDEA_PRODUCT, IDEA_BUSINESS, and ARCHITECTURE route to WF-3 first for artifact generation.

#### WF-3: Artifact Generator

5 category branches with tailored prompt chains. Each branch follows the Obsidian-first pattern: generate document → write to Obsidian → extract tasks → send to WF-4.

- **IDEA_PRODUCT:** Sonnet generates PRD (problem, users, metrics, requirements, risks) → Write PRD to Obsidian (`/PROJECTS/<ProjectName>/PRD.md`) → Haiku extracts feature list with effort estimates → WF-4 creates Plane project + issues referencing the Obsidian PRD path
- **IDEA_BUSINESS:** Sonnet generates Business Model Canvas (9 blocks) → Write Canvas to Obsidian → Haiku extracts GTM tasks → WF-4
- **ARCHITECTURE:** Sonnet generates ADR (context, decision, consequences, alternatives) → Write ADR to Obsidian → Haiku extracts implementation tasks → WF-4
- **TASK:** Haiku extracts structured action items with assignee, deadline, priority → WF-4 (no document generated)
- **MEETING_NOTES:** Haiku extracts action items, decisions, and follow-ups → WF-4 (transcription already in Obsidian)

Plane issues include a reference to the Obsidian document path in the description (e.g. `PRD: /PROJECTS/Jim's Tractors/PRD.md`). Meeting action items use To Do state; everything else defaults to Backlog.

**Project creation:** WF-3 does NOT hardcode a project ID. It passes `project_name` to WF-4, which uses `find_or_create_project` to fuzzy-match or create a new Plane project per transcript.

#### WF-4: Plane Adapter

Webhook-based CRUD adapter for Plane. 4 actions:
- `find_or_create_project` (with Levenshtein fuzzy matching at 80% threshold)
- `create_issue`
- `create_issues_batch` (with 300ms throttle)
- `update_issue`

Uses `$env` variables for Plane credentials. Response mode: `responseNode` for synchronous replies.

> **Adapter Pattern:** To swap Plane for Jira, replace this workflow and update the `PM_ADAPTER_WORKFLOW_ID` env var. Core logic in WF-2 and WF-3 never changes.

#### WF-5: Webhook Listener

Catches Plane webhook events on issue state changes. Deduplicates using n8n static data with 60-second TTL and garbage collection (Plane sends ~3 duplicate events per state change). Filters for To Do state transitions only.

Label-based routing: `auto-prd`, `auto-research`, `auto-draft` trigger immediate Sonnet-powered work. Results posted as Plane issue comments, issue moved to Review state. Unlabeled items available for manual processing.

---

## 5. Classification System

| Category | Description | Plane Behavior |
|---|---|---|
| `TASK` | Direct action items, to-dos, requests | Create individual issues in existing project |
| `IDEA_PRODUCT` | Product concepts, features, UX ideas | Create project + PRD issue + feature backlog |
| `IDEA_BUSINESS` | Business model, GTM, market opportunity | Create project + business canvas + tasks |
| `ARCHITECTURE` | System design, technical architecture | Create project + ADR + implementation tasks |
| `MEETING_NOTES` | Meeting summaries, decisions, follow-ups | Extract action items as issues (To Do state) |
| `JOURNAL` | Personal reflections, thinking-out-loud | Obsidian only, no Plane issues created |
| `MIXED` | Contains multiple categories | Segment into parts, re-classify each |

### 5.1 Classification Prompt

Model: `anthropic/claude-haiku-4-5` via LiteLLM. System prompt instructs JSON-only response.

Output schema:
```json
{
  "category": "CATEGORY",
  "confidence": 0.0-1.0,
  "segments": [  // only if MIXED
    { "category": "...", "text": "...", "summary": "..." }
  ],
  "project_name": "suggested project name or null",
  "urgency": "low|medium|high",
  "tags": ["tag1", "tag2"]
}
```

### 5.2 MIXED Handler

When classified as MIXED, the classifier returns segments with per-segment category and summary. Each segment is re-submitted to WF-2 as an independent note. A dedup guard (max 1 re-classification) prevents infinite loops.

---

## 6. LLM Strategy

### 6.1 WF-1a/1b Models (Transcription Pipeline)

All WF-1a/1b LLM calls upgraded to Sonnet 4.5 on 2026-04-17 (worth the quality improvement for voice note processing).

| Task | Model | Rationale |
|---|---|---|
| Summarisation | `claude-sonnet-4-5-20250929` | High-quality structured summaries |
| Title generation | `claude-sonnet-4-5-20250929` | Better contextual title generation |
| Semantic tag classification | `claude-sonnet-4-5-20250929` | Semantic understanding of primary topic |

### 6.2 WF-2/3/4/5 Models (Classification & Artifacts)

| Task | Model | Rationale |
|---|---|---|
| WF-2 title fix | claude-haiku-4-5 | Simple reformatting |
| WF-2 classification | claude-haiku-4-5 | Pattern matching, low complexity |
| Task extraction | claude-haiku-4-5 | Structured extraction from text |
| PRD generation | claude-sonnet-4 | Complex reasoning, long-form quality |
| Business canvas | claude-sonnet-4 | Strategic analysis, multi-faceted |
| ADR generation | claude-sonnet-4 | Technical depth, trade-off analysis |
| Auto-work execution | claude-sonnet-4 | Complex deliverable generation |

All models accessed via LiteLLM gateway at `10.90.10.23:4000` using the `anthropic/` prefix. WF-1a uses `$env.LITELLM_API_KEY` for Bearer auth. Other workflows use the `httpBearerAuth` credential (ID: `F8MZsFiyXy1u2o1W`).

---

## 7. Adapter Pattern (Enterprise Extensibility)

Every external integration is abstracted behind an adapter interface implemented as an n8n sub-workflow. The core orchestrator never calls Plane, Slack, or Obsidian directly. Adapters are resolved by environment variable (`ADAPTER_PROFILE`).

| Integration | Personal | Enterprise | Adapter ID |
|---|---|---|---|
| Project Mgmt | Plane | Jira Cloud | `pm-adapter` |
| Messaging | Slack | MS Teams | `msg-adapter` |
| File Sync | Syncthing | OneDrive/SharePoint | `sync-adapter` |
| Knowledge Base | Obsidian | Confluence | `kb-adapter` |
| LLM Gateway | LiteLLM | LiteLLM | `llm-adapter` |
| Transcription | faster-whisper | Azure Speech | `stt-adapter` |

---

## 8. Trigger System

Two modes determine when work executes.

### 8.1 Auto-Work (Immediate)

When a note is classified as `IDEA_PRODUCT`, `IDEA_BUSINESS`, or `ARCHITECTURE`, WF-3 immediately generates the artifact using LiteLLM/Sonnet and **writes it directly to Obsidian** (`/PROJECTS/<ProjectName>/PRD.md`, `Canvas.md`, or `ADR.md`). WF-4 then creates a Plane project and issues that **reference the Obsidian path** — Plane never stores document content. Default auto-work: PRD generation, business canvas creation, ADR drafting.

`TASK` and `MEETING_NOTES` skip artifact generation and send structured action items directly to WF-4.

### 8.2 Manual Trigger (Column-Based)

Tasks requiring human judgment are created in Backlog. When the user moves them to To Do in Plane, WF-5 catches the webhook event and triggers label-based work. WF-5 reads the referenced Obsidian PRD/ADR for context, executes the work (code drafts, research, implementation plans), and posts results as Plane issue comments. The Obsidian document is the input; the Plane comment is the output artifact for that specific task. Default manual: implementation tasks, decisions requiring approval, tasks with external dependencies.

### 8.3 Trigger Decision Matrix

| Category | Artifacts | Tasks | Work Execution |
|---|---|---|---|
| TASK | Auto | Auto (Backlog) | Manual (move to To Do) |
| IDEA_PRODUCT | Auto (PRD) | Auto (Backlog) | Auto for PRD, manual for features |
| IDEA_BUSINESS | Auto (Canvas) | Auto (Backlog) | Auto for canvas, manual for GTM |
| ARCHITECTURE | Auto (ADR) | Auto (Backlog) | Auto for ADR, manual for impl |
| MEETING_NOTES | Auto (summary) | Auto (To Do) | Manual |

---

## 9. Folder Config & Semantic Tagging

### 9.1 Configuration File

`/opt/PLAUD_NOTES/00 Folder Config.md` is an Obsidian-editable configuration file read at runtime by WF-1a. It controls tag assignment and folder routing for all PLAUD recordings.

**Sections:**

| Section | Purpose |
|---|---|
| `## Title Keywords` | Keywords matched against the note title only → tag |
| `## Content Keywords` | Keywords matched against title + summary → tag |
| `## Tag to Folder Mapping` | Tag → `PROJECTS/<Folder>` mapping |

### 9.2 How Semantic Tagging Works

1. `Build Tag Payload` reads the full config file and extracts keyword tables + folder mapping
2. Constructs a system prompt that instructs the LLM to determine the PRIMARY topic
3. Sends the recording's AI-generated title + first 60 lines of summary to Sonnet
4. LLM returns `{primary_tag, secondary_tags, reasoning}` as JSON
5. `Build Markdown` resolves `primary_tag` → folder via the Tag→Folder mapping
6. File written to `PROJECTS/<Folder>/YYYY-MM-DD HH:MM Title.md` if folder exists on disk

**Key design decisions:**
- The LLM sees the keyword→tag configuration but makes a **semantic** judgment, not keyword matching
- A passing mention ("Standard Bank was hacked last week" as an example) won't trigger tagging
- Only ONE primary_tag is assigned; secondary_tags are for topics substantially discussed
- If no tag matches, primary_tag is null and the file stays in root
- Folder must exist on disk (`/opt/PLAUD_NOTES/PROJECTS/<Folder>/`) — pipeline never auto-creates folders

### 9.3 Current Tags & Folders (24 tags, 23 folders)

| Tag | Folder |
|---|---|
| `standard-bank` | Standard Bank |
| `composable-banking` | Composable Banking Platform |
| `avec` | AVEC |
| `slxr` / `superluxe` | SUPERLUXE |
| `automagic` | Automagic |
| `australia` | Australia |
| `ai-safety` | AI Safety |
| `rawgle` | Rawgle |
| `gohunta` | GoHunta |
| `happiecat` | Happiecat |
| `locrawl` | Locrawl |
| `mirofish` | MiroFish |
| `hermes` | Hermes |
| `oshun` | Oshun |
| `beyondpandora` | BeyondPandora |
| `sovrein` | Sovrein.ai |
| `hugh` | Hugh Manatee |
| `allarma` | Allarma |
| `archon` | Archon |
| `matt-personal` | Personal - Matt |
| `business-filing` | Business Filing |
| `jwm` | JWM |
| `proxmox` | Proxmox |

### 9.4 Frontmatter Schema

Every PLAUD transcription has YAML frontmatter:

```yaml
---
title: "AI-generated title"
date: 2026-04-17
time: "18:40"
duration_mins: 12
tags:
  - voice-note
  - plaud
  - jwm              # primary_tag from LLM
  - beyondpandora     # secondary_tag (if any)
source: plaud
project_folder: "JWM"  # only present if folder-routed
---
```

---

## 10. Automagic Console

Pipeline management UI for monitoring and searching PLAUD voice note processing. Two-tier architecture: Express API backend (stable) + Next.js frontend (new, world-class UI).

### 10.1 Architecture

| Component | Technology | Location |
|---|---|---|
| API Backend | Node.js 20 + Express | CT 120 `/opt/console/server.js` (port 3100) |
| UI Frontend | Next.js 16 + React 19 + Tailwind v4 | CT 120 `/opt/console-next/` (port 3200) |
| Database | SQLite + FTS5 (better-sqlite3) | `/opt/console/data/index.sqlite` |
| Real-time | SSE (Server-Sent Events) | Express `/api/sse`, proxied via Next `/proxy/sse` |
| Indexer | node-cron, every 5 min | `/opt/console/indexer.js` |

### 10.2 Frontend (Next.js, added 2026-04-18)

Mirrors the JWM demo's stack (Next.js 16 App Router, React 19, Tailwind v4, CVA primitives, Recharts). Replaced the original Alpine.js UI with a proper component-driven app.

**Brand palette:** three hex values — `#61a5c2` (sky, primary), `#52b69a` (teal, success), `#ffbf69` (gold, accent). Light AND dark mode, toggle persists in `localStorage` with inline-script FOUC prevention.

**Pages:**
- `/dashboard` — KPI cards (transcriptions, projects, pipeline success %, 24h errors), 3-chart row (project donut, classification bars, workflow success/error stacked), recent transcriptions + Plane issues feeds
- `/transcriptions` — filterable list (project / tag / classification / date range), 25/page pagination, detail view with linked Plane issues
- `/projects` — grid of Plane projects with issue + transcription counts
- `/projects/[id]` — 5-column kanban (Backlog / To Do / In Progress / Done / Cancelled) + linked voice notes
- `/pipeline` — live SSE timeline of n8n executions + workflow breakdown with progress bars
- `/search` — FTS5 full-text search across transcriptions and issues

**Data layer:** Server components fetch from Express via `AUTOMAGIC_API_URL=http://127.0.0.1:3100`. Client components hit `/proxy/[...path]` (Next route handler) to avoid CORS and keep the URL server-only.

**Chrome:** `Shell.tsx` (sidebar + topbar + main), `TopBar.tsx` (logo, search, live pipeline-health pill, reindex button, theme toggle), `Sidebar.tsx` (collapsible, 5 nav items with active-state sky highlight).

**Auth:** Inherits from the existing Traefik + Authentik SSO chain in front of CT 120 — no auth code in Next.js. Users are already authenticated by the time requests reach the app.

### 10.3 Deployment

| Service | Port | systemd | Purpose |
|---|---|---|---|
| `automagic-console.service` | 3100 | enabled | Express API (stays running) |
| `automagic-console-next.service` | 3200 | enabled | Next.js UI (replaces old Alpine frontend) |

Traefik route on CT 103 (`/etc/traefik/conf.d/proxy-automagic.yml`) points `automagic.beyondpandora.com` at CT 120:3200 (cut over 2026-04-21).

### 10.5 Correlation engine (fixed 2026-04-22)

Voice-note ↔ Plane-issue linking was shipped inert (0 links in DB). Root cause: the scorer required title similarity against issue names, but voice-note titles rarely echo ticket names. Fixed by making `project_folder` the primary join key:

- Voice-note `project_folder` is normalised and matched against each Plane project's `name` and `identifier` (case-insensitive, symbol-stripped)
- Within the matched project, pairs are scored: +0.3 for project match, up to +0.5 for title trigram similarity, +0.3 for content-overlap (issue name words appearing in the summary or transcript), +0.05..0.25 for date proximity (30d / 7d / 1d)
- Threshold 0.4; top 5 issues kept per transcription
- Cross-project fallback: pure title match ≥ 0.45

Result on current corpus: 215 transcriptions → 685 links (up from 0), 141 transcriptions covered, 651 above 0.6 confidence.

Source: `automagic/console/lib/correlator.js` (exec from `automagic/console/indexer.js` every 5 min).

### 10.4 Local audio drop ingest (added 2026-04-21)

Second ingestion path alongside PLAUD polling. Web UI has a drag-drop widget on `/dashboard`. Files land on CT 107 and are processed by a Python script that mirrors WF-1a's chain (no new n8n workflow; avoids DB surgery).

**Upload flow:**
1. User drops audio on `/dashboard` → `DropZone.tsx` XHR-posts multipart to `/proxy-upload`
2. Next.js route `/proxy-upload` streams to Express `/api/upload` at `127.0.0.1:3100`
3. Express (`/opt/console/upload-route.js`, uses `multer`): saves to `/opt/console/uploads/`, `scp`'s to `root@10.90.10.7:/opt/PLAUD_NOTES/_drops/<YYYY-MM-DD HH:MM title__dropId>.<ext>`
4. File sits in `_drops/` until the timer picks it up

**Processor (CT 107):**
- `/opt/automagic_drops_processor.py` — one-shot, fires per-minute via `automagic-drops-processor.timer`
- Lock file at `/tmp/automagic_drops.lock` (one file at a time)
- Per file: ffprobe duration → Whisper (`10.90.10.46:8000/v1/audio/transcriptions`) → Sonnet 4.6 summarise → Sonnet 4.6 title-fix → Sonnet 4.6 classify (reads `00 Folder Config.md`) → build markdown → write to `PROJECTS/<folder>/` or root → POST to `wf2-classify` webhook → move file to `_drops/_processed/` (or `_drops/_errored/<file>` + `<file>.error.txt` on failure)
- Frontmatter marks drops: `source: automagic-drop`, tags include `local-drop`

**Limits / assumptions:**
- Accepted: mp3, m4a, wav, ogg, flac, webm, mp4, aac, opus
- Max size: 500 MB per file
- Express-side SSH uses existing `/root/.ssh/id_ed25519` key on CT 120 → CT 107
- Failed Whisper call = file parked in `_errored/` (NOT retried — human review needed)

**Source files (in repo):**
- `automagic/console-next/components/dashboard/DropZone.tsx` — widget
- `automagic/console-next/app/proxy-upload/route.ts` — streaming multipart proxy
- `automagic/console/upload-route.js` — Express handler + multer + scp
- `automagic/scripts/automagic_drops_processor.py` — CT 107 processor
- `automagic/scripts/automagic-drops-processor.{service,timer}` — systemd units

**Update code:**
```bash
cd /Users/mattwright/pandora/automagic/console-next
tar czf /tmp/automagic-console-next.tar.gz --exclude='node_modules' --exclude='.next' .
scp /tmp/automagic-console-next.tar.gz root@10.90.10.10:/tmp/
ssh root@10.90.10.10 "pct push 120 /tmp/automagic-console-next.tar.gz /tmp/automagic-console-next.tar.gz && \
  pct exec 120 -- bash -c 'tar xzf /tmp/automagic-console-next.tar.gz -C /opt/console-next && \
    cd /opt/console-next && npm install && npm run build && \
    systemctl restart automagic-console-next'"
```

### 10.2 Data Flow

```
CT107 (n8n) ──rsync cron 5min──> CT120:/opt/console/data/plaud-notes/
CT107 (n8n) ──rsync cron 5min──> CT120:/opt/console/data/n8n.sqlite (read-only copy)
CT106 (Plane) ──HTTP API poll──> CT120 indexer (14 projects, 1316 issues → FTS5 index)
```

### 10.3 Access

- LAN: `http://10.90.10.20:3100`
- External: `https://automagic.beyondpandora.com` (Cloudflare → Traefik → Authentik SSO → CT120)
- systemd service: `automagic-console.service`, env: `/opt/console/.env`

### 10.4 API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/stats` | Dashboard metrics (counts, health, distributions) |
| `GET /api/transcriptions` | Paginated list with filters (project, date, tag, classification) |
| `GET /api/transcriptions/:id` | Single transcription + linked Plane issues |
| `GET /api/search?q=...` | FTS5 full-text search across transcriptions and issues |
| `GET /api/projects` | All Plane projects with transcription counts |
| `GET /api/pipeline` | Recent n8n executions + per-workflow breakdown |
| `GET /api/sse` | Server-Sent Events for live pipeline status |
| `POST /api/reindex` | Manual reindex trigger |

---

## 11. Discovery Scripts

Guided recording templates for each category, designed to maximize the quality of classifier input and artifact generation output.

| Script | Duration | Key Sections |
|---|---|---|
| Product Idea | 5–8 min | Problem, users, solution, features, constraints, success metrics, risks |
| Business Idea | 6–9 min | Opportunity, customers, value prop, channels, revenue, costs, partners, moat |
| Architecture | 5–8 min | Context, problem, options, decision, consequences, dependencies, risks |
| Task Capture | 1–3 min | What, who, when, priority, dependencies, definition of done |
| Meeting Notes | 2–4 min | Attendees, agenda, decisions, action items, follow-ups |

See [[Discovery Scripts/]] folder for full templates.

---

## 12. Legacy Management Dashboard

Single-page HTML dashboard (`dashboard.html`) with Node.js proxy (`dashboard-proxy.js`) for CORS. Pulls live data from n8n executions API and Plane issues API. Dark theme, auto-refreshes every 30 seconds.

### 12.1 Dashboard Tabs

- **Overview:** stats row (issue count, active workflows, 24h runs, error rate), classification donut chart, workflow health, recent issues
- **Workflows:** cards for each n8n workflow showing status, success/error counts, last run, execution sparkbar
- **Plane Issues:** full table with priority, state (color-coded), category badge, date
- **Activity:** execution log grouped by day across all pipeline workflows

---

## 13. Environment Variables

All variables must be accessible as `$env.*` in n8n workflows. Set as environment variables on the n8n container (CT 107).

| Variable | Used By | Value |
|---|---|---|
| `PLANE_BASE_URL` | WF-4, WF-5 | https://plane.beyondpandora.com |
| `PLANE_API_KEY` | WF-4, WF-5 | `plane_api_e82da32c...` |
| `PLANE_WORKSPACE_SLUG` | WF-4, WF-5 | `beyond-pandora` |
| `LITELLM_API_KEY` | WF-2, WF-3, WF-5 | `sk-admin-1234` (replace with virtual key) |
| `LITELLM_BASE_URL` | WF-2, WF-3, WF-5 | `http://10.90.10.23:4000/v1/chat/completions` |
| `PLANE_ADAPTER_WEBHOOK_URL` | WF-2, WF-3 | `.../webhook/plane-adapter` |
| `ARTIFACT_GEN_WEBHOOK_URL` | WF-2 | `.../webhook/artifact-generator` |
| `CLASSIFIER_WEBHOOK_URL` | WF-1 | `.../webhook/classify` |
| `SLACK_WEBHOOK_URL` | WF-5 | *(optional)* |

---

## 14. Success Criteria

- [ ] A voice note recorded on Plaud flows end-to-end to a Plane issue within 60 seconds of transcription completing
- [ ] Classification accuracy above 85% on a sample of 20+ voice notes across all categories
- [ ] Generated PRDs and ADRs are usable as-is or with minor edits (not requiring a rewrite)
- [ ] Existing Obsidian sync path is never disrupted by pipeline failures
- [ ] Dashboard shows live pipeline status without manual configuration
- [ ] Any component can be swapped via adapter pattern without modifying core workflow logic
- [ ] This PRD is sufficient to rebuild the entire system from scratch

---

## 15. Current Status (2026-04-17)

### 15.1 Completed

**Core Pipeline (WF-1a/1b):**
- [x] WF-1a (Poll & Transcribe): 17 nodes, polls every 1 minute, file-based concurrency lock (.processing.lock + .processed.json)
- [x] Whisper ASR on GPU: PCT 146, RTX A4000, whisper large-v3 at `10.90.10.46:8000`
- [x] AI title generation: Build Title Payload → LiteLLM — Title Fix (Sonnet 4.5)
- [x] LLM summarisation upgraded to Sonnet 4.5 (2026-04-17)
- [x] LLM-based semantic tagging (2026-04-17): replaced keyword matching with Sonnet-powered classification
- [x] Automatic folder routing (2026-04-17): tagged files written to `PROJECTS/<Folder>/` based on primary tag
- [x] `00 Folder Config.md`: Obsidian-editable keyword→tag and tag→folder configuration (24 tags, 23 folders)
- [x] WF-1b (Webhook): alternative webhook-triggered path, same output format
- [x] Dual-pipeline conflict resolved (2026-04-13): disabled `plaud_sync.py` cron on PCT 146, n8n is sole pipeline

**Classification & Artifacts (WF-2/3/4/5):**
- [x] WF-2 (Classifier & Router): 7-category classification, MIXED segmentation, receives `project_folder` from WF-1a
- [x] WF-3 (Artifact Generator): Obsidian-first pattern (PRDs/ADRs/Canvases written before Plane tasks)
- [x] WF-4 (Plane Adapter): find_or_create_project with fuzzy matching, create_issues_batch with throttle
- [x] WF-5 (Webhook Listener): label-based auto-work (`auto-prd`, `auto-research`, `auto-draft`)

**Infrastructure:**
- [x] Automagic Console (CT 120): Pipeline management UI at `automagic.beyondpandora.com` with Authentik SSO
- [x] Console data sync: rsync cron every 5min from CT107 (PLAUD_NOTES + n8n.sqlite)
- [x] Plane API sync: 14 projects, 1316 issues indexed into FTS5 full-text search
- [x] Environment variables: all set. NODE_FUNCTION_ALLOW_BUILTIN=* and NODE_FUNCTION_ALLOW_EXTERNAL=* enabled
- [x] Full pipeline e2e: Plaud recording → WF-1a → WF-2 → WF-3 → WF-4 → Plane project. Total: ~2 min
- [x] n8n DB management: published version updates require both `workflow_entity` AND `workflow_history` (learned 2026-04-14)
- [x] Test projects verified: Luigi's Plumbing, Jim's Tractors, Mario's Plumbing, smart-garden-monitor, pet-feeding-scheduler

### 15.2 Remaining

- [ ] Create dedicated LiteLLM virtual key (replace master key `sk-admin-1234`)
- [ ] MIXED category handler: test segmentation and re-classification path end-to-end
- [ ] Adapter pattern implementation: `ADAPTER_PROFILE` env var and sub-workflow resolution
- [ ] Cleanup: remove test projects from Plane
- [ ] Console correlation engine: fuzzy matching between transcription titles and Plane issue titles needs tuning (currently 0 correlations)
- [ ] WF-1b: update to match WF-1a's semantic tagging and folder routing (currently may lag behind)
- [ ] Backfill: re-tag existing root-level transcriptions that should be in project folders

---

## 16. File Manifest

### Source of Truth

| File | Location | Purpose |
|---|---|---|
| **This PRD** | Obsidian `/PROJECTS/Automagic/Automagic PRD.md` | Master system documentation |
| `00 Folder Config.md` | CT107 `/opt/PLAUD_NOTES/00 Folder Config.md` | Runtime tag & folder configuration |

### Automagic Console (CT 120)

| File | Purpose |
|---|---|
| `/opt/console/server.js` | Express server, API routes, SSE, cron |
| `/opt/console/indexer.js` | Full index cycle: markdown → Plane → n8n → correlator |
| `/opt/console/lib/db.js` | Database init, schema, FTS5 setup |
| `/opt/console/lib/markdown-parser.js` | YAML frontmatter + section extraction |
| `/opt/console/lib/plane-client.js` | Plane REST API wrapper |
| `/opt/console/sync-data.sh` | Rsync cron script (PLAUD_NOTES + n8n.sqlite from CT107) |

### Obsidian Project Files

| File | Purpose |
|---|---|
| `PROJECTS/Automagic/Setup Guide.md` | Deployment and setup instructions |
| `PROJECTS/Automagic/CLI-HANDOFF.md` | CLI handoff documentation |
| `PROJECTS/Automagic/Project Workflow Standard.md` | Workflow standards |
| `PROJECTS/Automagic/Discovery Scripts/` | Recording templates (product, business, architecture, task, meeting) |

### Known Issues

- LiteLLM master key (`sk-admin-1234`) is still in use; a scoped virtual key should replace it before any external exposure
- MIXED category segmentation path in WF-2 is implemented but untested end-to-end
- Console correlation engine returns 0 correlations — fuzzy matching between transcription titles and Plane issue titles needs tuning
- WF-1b may not have semantic tagging/folder routing parity with WF-1a yet
- n8n.sqlite rsync to Console is 502MB — consider syncing only needed tables

### Changelog

| Date | Version | Changes |
|---|---|---|
| 2026-04-11 | 1.0 | Initial PRD with WF-1 through WF-5 |
| 2026-04-12 | 2.0 | Obsidian-first document pattern, full e2e verified |
| 2026-04-12 | 2.1 | AI title generation, concurrency lock, processedIds fix |
| 2026-04-17 | 3.0 | LLM semantic tagging (replaced keyword matching), folder routing, all WF-1a models upgraded to Sonnet 4.5, Automagic Console section added, workflow IDs documented, infrastructure table corrected |
| 2026-04-18 | 3.1 | Console UI rebuilt as Next.js 16 + React 19 + Tailwind v4 app at `/opt/console-next/` on CT 120:3200. Mirrors JWM demo stack. Brand palette `#61a5c2` / `#52b69a` / `#ffbf69` with light + dark modes. Express API unchanged |
