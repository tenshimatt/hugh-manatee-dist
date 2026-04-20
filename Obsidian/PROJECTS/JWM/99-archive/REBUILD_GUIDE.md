# JWM Demo — Rebuild Guide

> How to recreate this entire demo from scratch on Beyond Pandora infra.
> Tested build-out: ~2 days of parallel agent work.

---

## Order of operations

1. **Branding** — pull logo + colors from jwmcd.com
2. **Frappe ERPNext site** — new site on CT 171 Docker stack
3. **LiteLLM gateway** — reuse CT 123 or stand up new
4. **Next.js demo shell** — local build, deploy to CT 120 port 3200
5. **AI wiring** — shell's API routes call LiteLLM with real prompts
6. **Voice** — ElevenLabs TTS + Web Speech input
7. **Traefik + Cloudflared** — public URL wiring
8. **Authentik SSO** — replace stub sign-in
9. **Demo content** — fabricate estimate PDFs, seed Work Orders, historical scrap cluster
10. **Live data wiring** — shell reads ERPNext where it adds value

---

## Key infrastructure

| Component | Host | Purpose |
|---|---|---|
| **Next.js Shell** | CT 120 `/opt/jwm-demo/` | Demo UI |
| **ERPNext (JWM site)** | CT 171 Docker | System of record |
| **LiteLLM Gateway** | CT 123 | AI proxy (Claude + Ollama) |
| **Ollama GPU** | PCT 146 | Local model fallback |
| **Traefik** | PCT 103 | Reverse proxy + TLS |
| **Authentik** | PCT 105 | SSO |
| **Cloudflared** | PCT 113 | Public tunnel |

---

## Public URLs

- **Demo Shell:** `https://jwm-demo.beyondpandora.com`
- **ERPNext:** `https://jwm-erp.beyondpandora.com`
- **AI Gateway:** `https://jwm-ai.beyondpandora.com`

---

## Step 1 — Brand assets

```bash
# Logo: saved at demo-content/jwm-logo.svg (from John Wright's files)
# Or scrape: https://jwmcd.com/wp-content/uploads/2023/10/JWM-Primary-Blue-Orange-Logo.png
# Colors: navy #064162, gold #e69b40
# Tagline: "A Better Way to Build Since 1938"
```

Portfolio images (20 projects) scraped from `jwmcd.com/portfolio`:
- See list in `jwm-demo/shell/lib/canned/projects.ts`
- Stored in `shell/public/projects/*.jpg`

---

## Step 2 — ERPNext Site on CT 171

```bash
ssh root@10.90.10.10
pct exec 171 -- bash
docker exec -u frappe frappe_docker-backend-1 bash

# Create site
bench new-site jwm-erp.beyondpandora.com --admin-password 'JWMdemo2026!' --db-root-password <get from /home/frappe_docker/compose/>
bench --site jwm-erp.beyondpandora.com install-app erpnext

# Set up default company = JWM (via setup_wizard.py)
# Create custom fields:
#   Work Order.jwm_division (Select: Processing/Architectural/Mixed)
#   Work Order.jwm_baseline_date (Date)
#   Work Order.jwm_revised_date (Date)
#   Sales Order.jwm_division (Select)
#   Stock Entry.jwm_workstation (Link → Workstation)
#   Customer.jwm_customer_tier (Select)

# Create custom app jwm_manufacturing:
bench new-app jwm_manufacturing
# ...with DocTypes: NCR, RMA, JWM CAR, JWM Overrun Allocation, Project Traveler
bench --site jwm-erp.beyondpandora.com install-app jwm_manufacturing

# Seed data
bench --site jwm-erp.beyondpandora.com execute jwm_manufacturing.fullseed.run
bench --site jwm-erp.beyondpandora.com execute jwm_manufacturing.gap_fill.run
```

### Critical nginx fix
Frappe docker ships with `FRAPPE_SITE_NAME_HEADER: frontend` hardcoded. Change to `$$host` or the new site's traffic routes to the wrong site. Backup at `/home/frappe_docker/pwd.yml.bak.*` on CT 171.

### Traveler PDF
Print Format `JWM Project Traveler` — Jinja HTML with base64-embedded SVG logo. Attached to Job Card + Work Order.

---

## Step 3 — LiteLLM Gateway (CT 123 — likely already exists)

```bash
pct exec 123 -- bash
ls /opt/docker/litellm/   # config.yaml + .env
```

Add new virtual key for demo:
```bash
curl -X POST http://10.90.10.23:4000/key/generate \
  -H "Authorization: Bearer sk-admin-1234" \
  -d '{"key_alias":"jwm-demo","models":["anthropic/claude-sonnet-4-6","mistral-small3.2:24b","gpt-oss:20b"],"rpm_limit":60,"max_budget":50,"metadata":{"tenant":"JWM","no_training":true}}'
```

Gateway needs `ANTHROPIC_API_KEY` env var set in `/opt/docker/litellm/.env` — real key already in place.

Add Traefik route: `/etc/traefik/conf.d/proxy-jwm-ai.yml` on PCT 103 → `http://10.90.10.23:4000`.

---

## Step 4 — Next.js Shell

Source lives locally: `/Users/mattwright/pandora/jwm-demo/shell/`

Stack: Next.js 15, TypeScript, Tailwind, Bun/npm, react-markdown, react-hot-toast, recharts.

Build:
```bash
cd /Users/mattwright/pandora/jwm-demo/shell
bun install
bun run build
```

Screens (all in `app/(app)/`):
- `/` — landing (with marquee of 20 JWM projects)
- `/dashboard` — KPIs, anomaly card, division mix, activity feed
- `/estimator` — PDF drop → extraction → BOM
- `/planner/[wo]` — work order detail
- `/shop/[workstation]` — shop floor kiosk + NCR composer
- `/qc` — NCR inbox
- `/admin` — reset button + links

---

## Step 5 — AI wiring

API routes in `app/api/`:
- `/ai/query` — streaming chat with KPI context injection
- `/ai/status` — exposes `{live, model}` for the TopBar pill
- `/ai/speak` — ElevenLabs TTS proxy
- `/estimator/extract` — PDF → Claude → structured BOM
- `/ncr/draft` — observation → Claude → structured NCR (vision-capable)
- `/anomaly` — scrap events → Claude → anomaly detection
- `/kpis` — dashboard metrics
- `/admin/reset` — demo state reset

Every route uses pattern:
```ts
if (liteLLMConfigured() && erpnextConfigured()) {
  try { return live-mode response; }
  catch { fall through to canned; }
}
return canned-mode response;
```

Env vars: see `.env.local.example`.

---

## Step 6 — Voice

- **Input**: `lib/useSpeechRecognition.ts` — Web Speech API, 1.5s silence auto-stop
- **Output**: `lib/useTTS.ts` — ElevenLabs stream via `/api/ai/speak`, fallback to `speechSynthesis`
- **Voice**: Adam (`pNInz6obpgDQGcFmaJgB`) — deep American male

ElevenLabs free-tier: 10k chars/month. Upgrade before production use.

---

## Step 7 — Deploy shell to CT 120

```bash
# From Mac
rsync -az --exclude=node_modules --exclude=.next --exclude=.env.local \
  /Users/mattwright/pandora/jwm-demo/shell/ \
  root@10.90.10.10:/tmp/jwm-demo-src/

# On Proxmox host
tar -C /tmp -cf /tmp/jwm-demo-src.tar jwm-demo-src
pct push 120 /tmp/jwm-demo-src.tar /root/jwm-demo-src.tar
pct exec 120 -- bash -c "
  mkdir -p /opt/jwm-demo
  tar --strip-components=1 -xf /root/jwm-demo-src.tar -C /opt/jwm-demo
  cd /opt/jwm-demo
  npm install --no-audit --no-fund
  npm run build
"
```

Write `/opt/jwm-demo/.env.local` (mode 600) with all the keys.

systemd unit at `/etc/systemd/system/jwm-demo.service` running `npm run start` (or `bun run start`) with `Restart=always`.

Traefik: `/etc/traefik/conf.d/proxy-jwm-demo.yml` on PCT 103 → `http://10.90.10.20:3200`.

---

## Step 8 — Cloudflare

Add Public Hostname in Cloudflare Zero Trust dashboard:
- Hostname: `jwm-demo.beyondpandora.com`
- Service: `http://10.90.10.3:80` (Traefik)

(Wildcard *.beyondpandora.com rule may handle this automatically.)

---

## Step 9 — Authentik SSO

Authentik admin: https://authentik.beyondpandora.com (check creds in skills dir).

Create OIDC provider + application:
- Slug: `jwm-demo`
- Redirect URIs: `https://jwm-demo.beyondpandora.com/api/auth/callback`
- Client type: Confidential

Shell env vars:
```
AUTH_SECRET=<random>
AUTHENTIK_ISSUER=https://authentik.beyondpandora.com/application/o/jwm-demo/
AUTHENTIK_CLIENT_ID=<from Authentik>
AUTHENTIK_CLIENT_SECRET=<from Authentik>
```

Demo user in Authentik: `chris.ball` / `JWMdemo2026!`.

---

## Step 10 — Demo content

Fabricated PDFs (script at `jwm-demo/scripts/generate_estimates.py`):
1. `estimate-001-architectural-stair.pdf` — Music City Center, $260K, 27 items
2. `estimate-002-processing-brackets.pdf` — Southeast HVAC, $21K, 16 items
3. `estimate-003-mixed-facade.pdf` — Vanderbilt, $87K, mixed

Rerunnable:
```bash
/tmp/estimate-venv/bin/python3 /Users/mattwright/pandora/jwm-demo/scripts/generate_estimates.py
```

Historical scrap cluster: in the ERPNext seed. Last 5 days of Flat Laser 2 with kerf-drift remarks on:
- JWM-BRK-11G-0043
- JWM-BRK-14G-0088
- JWM-ACM-RSC-0112

---

## Credentials (secrets NOT committed)

See the working file: `/Users/mattwright/pandora/jwm-demo/docs/credentials.md` (mode 600).

Rebuild with these types of values:
- ERPNext Administrator password
- ERPNext API key + secret
- LiteLLM virtual key
- ElevenLabs API key
- Authentik client secret + AUTH_SECRET

---

## Iteration after rebuild

Shell redeploy (fastest):
```bash
rsync -az --exclude=node_modules --exclude=.next --exclude=.env.local \
  ~/pandora/jwm-demo/shell/ root@10.90.10.10:/tmp/jwm-demo-src/
ssh root@10.90.10.10 'tar -C /tmp -cf /tmp/jwm-demo-src.tar jwm-demo-src && \
  pct push 120 /tmp/jwm-demo-src.tar /root/jwm-demo-src.tar && \
  pct exec 120 -- bash -c "cd /opt && tar --strip-components=1 -xf /root/jwm-demo-src.tar -C jwm-demo && \
    cd jwm-demo && npm install --no-audit --no-fund && npm run build && systemctl restart jwm-demo"'
```

ERPNext seed rerun:
```bash
ssh root@10.90.10.10 "pct exec 171 -- docker exec -u frappe frappe_docker-backend-1 bench --site jwm-erp.beyondpandora.com execute jwm_manufacturing.gap_fill.run"
```

---

## Total build time (for reference)

With parallel agents: ~6 hours of wall-clock, ~20 hours of agent time.
- Backend (Frappe + seed + nginx fix): 3 hours
- Shell (scaffolding + 7 screens + API stubs): 2 hours
- AI wiring (4 flows live): 1 hour
- Voice: 45 min
- Deploy (CT 120 + Traefik + Cloudflare): 30 min
- Authentik SSO: ~1 hour
- Polish (markdown rendering, project marquee, branding): 30 min

Solo human (no agents): 5-7 days.

---

Linked: [[DEMO_GUIDE]] · [[STACK_INVENTORY]] · [[JWM_Production_System_PRD_v0.2]]
