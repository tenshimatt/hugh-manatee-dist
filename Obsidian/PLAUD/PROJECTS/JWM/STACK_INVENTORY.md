# JWM Demo — Stack Inventory

> Complete inventory of every component, where it lives, and how it's glued together.
> As of 2026-04-17.

---

## Public URLs

| | URL | What |
|---|---|---|
| 🎯 | https://jwm-demo.beyondpandora.com | Demo shell (Next.js) |
| 🛠 | https://jwm-erp.beyondpandora.com | ERPNext backend |
| 🤖 | https://jwm-ai.beyondpandora.com | LiteLLM gateway |
| 🔐 | https://authentik.beyondpandora.com | SSO provider |

---

## Hosts & Services

### CT 120 — `automagic-console` (10.90.10.20)
- Port 3100: automagic-console (existing, untouched)
- **Port 3200: JWM demo shell** (new) — systemd service `jwm-demo.service`
- Source: `/opt/jwm-demo/`
- Env file: `/opt/jwm-demo/.env.local` (mode 600)

### CT 171 — `frapperawgle` (10.90.10.71)
- Docker compose stack (`frappe_docker-*` containers)
- Two Frappe sites:
  - `frontend` (original, untouched)
  - **`jwm-erp.beyondpandora.com`** (the JWM site)
- Custom app: `jwm_manufacturing` (at `/home/frappe/frappe-bench/apps/jwm_manufacturing/`, git-committed)

### CT 123 — `ai-gateway` (10.90.10.23)
- LiteLLM Docker stack at `/opt/docker/litellm/`
- Port 4000
- Postgres backend for keys + spend tracking
- JWM virtual key, $50/mo budget, 60 rpm

### PCT 146 — Ollama GPU (10.90.10.46)
- RTX A4000 (16GB)
- Local fallback models: `mistral-small3.2:24b`, `gpt-oss:20b`, `qwen3-32k:latest`

### PCT 103 — Traefik
- `/etc/traefik/conf.d/proxy-jwm-demo.yml` → CT 120:3200
- `/etc/traefik/conf.d/proxy-jwm-erp.yml` → CT 171:8080
- `/etc/traefik/conf.d/proxy-jwm-ai.yml` → CT 123:4000
- Wildcard `*.beyondpandora.com` Let's Encrypt cert

### PCT 105 — Authentik
- OIDC provider for SSO
- Application slug: `jwm-demo`
- Client type: Confidential

### PCT 113 — Cloudflared
- Token-based tunnel, dashboard-managed
- Routes all `*.beyondpandora.com` through the tunnel to PCT 103

---

## Data Model (ERPNext)

### Standard DocTypes (seeded)
- **Company** — `JWM`
- **Customer** — 8 records (Disney/LSU/Vanderbilt/etc.)
- **Item** — 15 records across Raw Material / Sub Assembly / Products / Services
- **UOM** — Sheet, Ft, M, Pc, Each, Kg, Lb
- **BOM** — 11 records (8 original + 3 v2 with operations)
- **Sales Order** — 6 records
- **Work Order** — 20 records (`MFG-WO-2026-00001..00020`)
- **Job Card** — 7 records
- **Workstation** — 12 records
- **Operation** — 5 records (Laser Cut, Press Brake Form, TIG Weld, Assembly, QC Inspection)
- **Stock Entry** — 29 records (including 26 scrap events with workstation tag)
- **Holiday List** — `JWM US 2026`

### Custom Fields
| DocType | Field | Type | Purpose |
|---|---|---|---|
| Work Order | `jwm_division` | Select: Processing/Architectural/Mixed | Division tagging |
| Work Order | `jwm_baseline_date` | Date | Immutable promised date |
| Work Order | `jwm_revised_date` | Date | Adjustable schedule date |
| Sales Order | `jwm_division` | Select | Same as above |
| Sales Order | `jwm_project_traveler` | Link → Project Traveler | Legacy link |
| Customer | `jwm_customer_tier` | Select | Strategic customer flag |
| Stock Entry | `jwm_workstation` | Link → Workstation | For scrap aggregation |

### Custom DocTypes (in module `JWM Manufacturing`)
- **Project Traveler** (+ 3 child tables: Material Spec, Production Milestone, QC Checkpoint)
- **NCR** — 3 records `NCR-2026-0001..03`
- **JWM CAR** — 3 records `CAR-2026-0006..08`
- **RMA** — 2 records `RMA-2026-0004..05`
- **JWM Overrun Allocation** — 4 records `OVR-2026-0009..0012`

### Seed scripts (in container)
- `jwm_manufacturing.fullseed.run` — initial seed
- `jwm_manufacturing.gap_fill.run` — workstations, scrap pattern, more WOs, Job Cards, CARs, Overruns

---

## AI Gateway Configuration

### LiteLLM config (CT 123 `/opt/docker/litellm/config.yaml`)
- Models exposed: `anthropic/claude-sonnet-4-6`, Ollama locals
- Guardrails: PII scanning (Llama Guard), rate limits, cost caps
- Logging: every request + response to Postgres

### JWM virtual key policy
- **Allowed models**: claude-sonnet-4-6, mistral-small3.2:24b, gpt-oss:20b, qwen3-32k
- **Limits**: 60 rpm, 100k tpm, $50/mo budget
- **Metadata**: `tenant=JWM, purpose=Nashville demo, no_training=true`

### Cost per demo run
~$0.10–0.12 per full 12-min walkthrough.
Estimator-heavy (3 PDFs): ~$0.30.

---

## Next.js Shell

### Project structure
```
shell/
├── app/
│   ├── (app)/                   # authed layout wrapper
│   │   ├── admin/
│   │   ├── dashboard/
│   │   ├── estimator/
│   │   ├── planner/[wo]/
│   │   ├── qc/
│   │   ├── shop/[workstation]/
│   │   └── layout.tsx
│   ├── api/
│   │   ├── admin/reset/         # demo reset
│   │   ├── ai/
│   │   │   ├── query/           # chat (streaming Claude)
│   │   │   ├── status/          # live-or-canned indicator
│   │   │   └── speak/           # ElevenLabs TTS proxy
│   │   ├── anomaly/             # scrap anomaly detection
│   │   ├── auth/
│   │   │   ├── [...nextauth]/   # Authentik OIDC (if wired)
│   │   │   └── stub/            # fallback sign-in
│   │   ├── data/status/         # ERPNext live-or-canned indicator
│   │   ├── estimator/extract/   # PDF → BOM
│   │   ├── kpis/
│   │   ├── ncr/draft/           # observation → NCR
│   │   └── wo/create/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                 # landing
├── components/
│   ├── ProjectMarquee.tsx       # 20 JWM projects carousel
│   ├── chrome/                  # TopBar, Sidebar, Shell, AIChat
│   ├── dashboard/               # KpiCard, Charts, AnomalyCard
│   └── ui/                      # Button, Card, Badge
├── lib/
│   ├── erpnext.ts               # Frappe REST client
│   ├── litellm.ts               # LiteLLM client
│   ├── useSpeechRecognition.ts  # Web Speech API hook
│   ├── useTTS.ts                # ElevenLabs playback hook
│   ├── text-for-speech.ts       # strip markdown for TTS
│   ├── reset-demo.ts            # reset flow helper
│   └── canned/                  # all canned fallback data
│       ├── ai-responses.ts
│       ├── anomaly.json
│       ├── estimate-001-bom.json
│       ├── kpis.json
│       ├── projects.ts          # 20 real JWM projects
│       ├── scrap-events.json
│       └── work-orders.ts
└── public/
    ├── logo-jwm.svg
    ├── logo-white.png
    ├── logo-blue.png
    ├── sample-traveler.pdf
    └── projects/                # 20 JWM project cover images
```

### AI Flows
| Flow | Route | Model | Latency |
|---|---|---|---|
| Chat (John) | `/api/ai/query` | Claude Sonnet 4.6 (streaming) | ~3-5s first token |
| Estimate extract | `/api/estimator/extract` | Claude Sonnet 4.6 | 30-45s full extract |
| NCR draft | `/api/ncr/draft` | Claude Sonnet 4.6 (vision-capable) | 5-8s |
| Anomaly detect | `/api/anomaly` | Claude Sonnet 4.6 | 10-15s |
| TTS | `/api/ai/speak` | ElevenLabs eleven_turbo_v2_5 | 1-2s to first byte |

All flows have canned fallback when `LITELLM_URL` or env vars missing.

---

## Secrets (kept in `.env.local`, 600, never committed)

- `LITELLM_URL`, `LITELLM_KEY`, `LITELLM_MODEL`
- `ERPNEXT_URL`, `ERPNEXT_API_KEY`, `ERPNEXT_API_SECRET`
- `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`
- `AUTH_SECRET`, `AUTHENTIK_ISSUER`, `AUTHENTIK_CLIENT_ID`, `AUTHENTIK_CLIENT_SECRET`
- `NEXTAUTH_URL`

Reference: `/Users/mattwright/pandora/jwm-demo/docs/credentials.md` (mode 600 on Matt's Mac).

---

## Monitoring + health

- Shell health: `curl https://jwm-demo.beyondpandora.com/api/ai/status` → `{live: true, model: "..."}`
- ERPNext health: `curl -H "Authorization: token ..." https://jwm-erp.beyondpandora.com/api/method/ping`
- LiteLLM health: `curl https://jwm-ai.beyondpandora.com/health/readiness`
- Beyond Pandora portal at portal.beyondpandora.com has the big picture

---

## Known limitations + Phase 2 opportunities

- Shell doesn't auto-collapse sidebar when AI drawer opens on iPad portrait
- Command palette (`⌘K`) is a placeholder
- Chat history is component-state only (lost on reload)
- Authentik SSO is wired but can fall back to stub
- No automated backup of the Frappe site (manual dump sufficient for demo)
- TTS budget: 10k chars/mo free tier — upgrade for production
- Shop floor queue refresh is not real-time (polls every 10s); websocket integration is a Phase 2 add

---

Linked: [[DEMO_GUIDE]] · [[REBUILD_GUIDE]] · [[JWM_Production_System_PRD_v0.2]]
