# JWM Demo — Changelog

Chronological record of what shipped, when, and why.

---

## 2026-04-19 (evening) — Shop-focused pivot + PLAUD infra fix

### Shop overhaul Phase 1 — deployed
- Post-login now lands on `/shop` (was `/dashboard`). Sidebar reordered Shop → ERF → Dashboard → Estimator → Planner → QC → Admin.
- New surfaces built + live at jwm-demo.beyondpandora.com: `/shop` (workstation grid, anomaly inbox, critical path), `/shop/lead` (Phase-2 Gantt stub), `/shop/[workstation]` upgraded kiosk with handoff modal + 5s polling, `/erf` + `/erf/new` + `/erf/[id]` (ERF surfaces, canned backing store).
- Anomaly bell added to TopBar — anomalies surface at shop-floor level, not just exec dashboard.
- 7 commits on feat/jwm-demo, pushed. Deployed to CT 120 (systemd-managed). Runbook updated.
- Scope cut: `/shop/lead` Gantt is a stub page (Phase 2). Service worker / IndexedDB / PPR deferred — SWR polling in their place for now.

### PLAUD transcription migrated to LiteLLM → OpenAI Whisper
- Local whisper-api on PCT 146 was OOM-crashing (Ollama 11.7GB + whisper 3.9GB on 16GB GPU). Lost a Chris Ball recording earlier in the day.
- Replaced with LiteLLM-routed OpenAI Whisper on CT 123. Dedicated `plaud-pipeline` virtual key, $50/30d budget.
- n8n WF-1a "Whisper Transcribe" node rewritten to call `http://10.90.10.23:4000/v1/audio/transcriptions`.
- Local whisper kept running as deprecated backup.
- Verified: Chris's 41-min stalled recording (fileId `bd930dc2…`) transcribed successfully through the new path at 17:22.
- Cost observed: ~$0.006/min. Today's recording: ~$0.25.

### Monday-specific deliverables (in progress — agent building)
Per Matt's commitment to Chris in the 2026-04-19 15:08 session:
- `/shop/scheduler` — interactive grid matching JWM's 1010 A + 1040 T shop spreadsheets
- `/shop/efficiency` — dashboard matching Daily Efficiency Log with Drew's 6 KPIs
- `/shop/efficiency/new` — data entry form feeding the efficiency dashboard

### Transcript insights captured
- JWM personnel: Hannah (Ops Mgr Processing, oversees Lisa/Autumn/Owen), Lisa + Autumn (Customer Support Mgrs), Owen (PM). John McDougall owner.
- Starting point agreed with Chris: Quote/PO entry as system trigger (not estimating/CRM/accounting).
- Processing division is acute priority; architectural can wait.
- Data quality is the biggest current pain.
- External contact: Gretchen (neighbor, ex-PepsiCo VP Supply Chain, now SAP consultant) — intro to be facilitated.
- Spectrum confirmed as construction-oriented; JWM shoehorning manufacturing into it. Reinforces keep-Spectrum-for-now + Phase-5 replacement option.

### Docs added
- `MONDAY_PREP.md` — end-of-day brief for Matt's Monday morning
- `2026-04-19 15:08 Voice Recorder Recommendations and Subscription Costs.md` — today's transcript (misclassified title)

## 2026-04-19 (late) — Council challenge round

### Seat 5 (Dissent) + Seat 6 (Reference Architecture) filed
- Materially revised v1 numbers. Program drops **$195K → $165K + $25K contingency**.
- "Named senior Frappe dev 100%" line in v1 was ~$90K of unchallenged padding. Replaced with fractional SRE + 4-week cutover contractor + Matt @ 40% = ~$95K honest staffing. Matt's Phase-1-proof Claude-orchestrated pattern is the load-bearing assumption.
- Spectrum **stays through Year 1**. ERPNext Accounting replacement → visible Phase 5 option (+$60-100K, +$150-300K/yr recurring savings). Construction accounting (AIA/retainage/SOV/certified payroll) is genuinely weaker in ERPNext; year-end audit risk during migration is real.
- **Swap Phase 2 ↔ Phase 3**. Phase 2 = Inventory + Subcontracting + Purchasing (wins Drew day one; Archer dead-ends here). Phase 3 = Sales + Customer + Quoting + Frappe CRM + Frappe Insights + Avalara + EasyPost.
- **Reference architecture locked**: ERPNext backbone + `jwm_manufacturing` custom app + Frappe CRM (Phase 3) + Frappe Insights (Phase 3) + Frappe Helpdesk (Phase 4) + Next.js shell (everyday UI) + LiteLLM + n8n + Paperless-ngx. On-prem migration end of Phase 2.
- New files: `council/05-dissent.md`, `council/06-reference-architecture.md`, `council/SYNTHESIS_v2.md`. v2 supersedes v1 synthesis.

## 2026-04-19

### Claude Council convened — full Epicor replacement scope quote produced
- 4-seat Council analysed the new `/attachments/` drop (Drew Adams's Friday email thread + 3 operational workbooks totalling 80 sheets / 177 max columns).
- **Finding:** JWM is running a hand-rolled MES inside Excel on top of Epicor. The `Uses Workaround` + `Corrected PEM/OS Start` columns show Epicor scheduling bugs baked into the data model.
- **Finding:** Drew Adams (Master Scheduler + Inventory Control) is the hidden decision-maker. His 6 KPIs (efficiency by op/material/operator, est-vs-actual, part history) are NOT in Archer's Phase 1 but ARE already in the Daily Efficiency Log raw data. One new DocType + 3 charts surfaces all six.
- **Headline quote:** $195K fixed / 11 months / Epicor retired 2027-03-31. Phases 1 ($55K live) + 2 ($40K) + 3 ($80K) + 4 ($20K).
- **Monday ask:** 1-page engagement letter for Phases 1+2 ($95K); Phases 3+4 optioned.
- **vs Archer 2yr TCO ~$430-550K** and never retires Epicor.
- Council outputs in `council/`: `01-email-analysis.md`, `02-data-model-analysis.md`, `03-epicor-scope.md`, `04-commercial-quote.md`, `SYNTHESIS.md`.

### ERPNext Desk + portal + login fully JWM-branded
- New CSS layer `jwm-demo/erpnext-theme/jwm_brand.css` (549 lines) registered via `app_include_css` + `web_include_css` in the `jwm_manufacturing` app `hooks.py`.
- **Desk** (`/app/*`): navy gradient navbar with gold accent strip, cream body wash, gold primary buttons, gold-accented sidebar selection, logo injected next to breadcrumbs when sidebar collapsed.
- **Portal** (`/me`, etc.): navy top bar, gold JWM brand text, card-style panels, gold-hover sidebar items.
- **Login page**: navy gradient backdrop, elevated white card, JWM logo prominent, tagline pinned bottom-left; title reads "Login to JWM" (was "Login to Frappe").
- **Search dropdown**: navy text on white, subtle gold `<mark>` highlighting on matched letters, gold left-border on hover. Scoped so navbar white-text rule no longer bleeds into dropdowns.
- **Frappe v15 gotcha captured**: backend + frontend containers have *separate* anonymous volumes mounted at `/home/frappe/frappe-bench/sites/assets`. Backend write doesn't reach nginx; deploy script `docker cp`s to both.
- Idempotent `erpnext-theme/deploy.sh` re-applies CSS + brand settings + cache clear in one run.

### Komodo removed from CT 171
- Komodo-core, -periphery, -mongo stopped + removed; network `komodo_default` pruned; weekly cron `/etc/cron.d/komodo-core-restart` deleted; `/etc/komodo` + `/root/komodo.creds` archived at `/root/_archive-komodo-2026-04-18/`.
- Frappe/ERPNext unaffected — verified `jwm-erp.beyondpandora.com` + `jwm-demo.beyondpandora.com` both HTTP 200 immediately after.
- Root cause of CT slowness was two-stacked: (1) Komodo zombie process accumulation, (2) ZFS `arc_prune` storm on the Proxmox host. Host-side ZFS ARC cap deferred pending calm window (not demo-critical).

### Third Authentik user provisioned
- `ashaked` / `asafmandula@gmail.com` (pk=30), same temp password as Mark. Creds sent via Telegram.

---

## 2026-04-18

### Authentik SSO end-to-end (fixed)
- Bug: `pages.signIn: "/"` in `auth.ts` made NextAuth treat GET sign-in as "return to custom page" → Configuration error.
- Bug: landing page used `window.location.href` (raw GET) instead of the NextAuth `signIn()` helper.
- Bug: CT 120 `.env.local` was missing the Authentik vars (excluded on rsync).
- **Fix:** removed `pages.signIn`, switched to `signIn("authentik")` from `next-auth/react`, appended Authentik env vars to CT 120, redeployed.
- **Verified:** POST `/api/auth/signin/authentik` → 302 to Authentik authorize URL with PKCE + state.

### Authentik app renamed — slug dependency documented
- User renamed the Authentik application *JWM Demo* → *JWM*, which changed the OIDC slug `jwm-demo` → `jwm`.
- **Impact:** `AUTHENTIK_ISSUER` env var broke (was `/application/o/jwm-demo/`).
- **Fix:** updated `.env.local` on CT 120 + local Mac: `AUTHENTIK_ISSUER=https://auth.beyondpandora.com/application/o/jwm/`.
- **Gotcha captured:** if you rename the application in Authentik UI, the slug changes, the issuer URL changes, every OIDC client needs the new URL.

### Users provisioned
- **Chris Ball** — pk=28, username `cball`, email `cball@jwmcd.com`, temp pw `JWM-Chris-2026!`
- **Mark Slingsby** — pk=29, username `mslingsby`, email `markslingsby@gmail.com`, temp pw `JWM-Mark-2026!`
- Both users are unconstrained by group bindings (JWM app currently open to any authenticated Authentik user).
- Credentials delivered via Telegram (bot `jakebot` / chat 374047225).

### labs.beyondpandora.com — access state noted
- Currently public (Express app, HTTP 200 with no auth gate).
- If we want to gate it via Authentik for Mark only: create Proxy Provider + Traefik forward-auth middleware + group binding. Not done yet. Flagged as follow-up.

---

## 2026-04-17 (build day)

### Phase 0 — Brief + context
- Read PRD v0.2 + Archer's 20-page Phase 1 Deliverables PDF
- Audited existing infra: CT 171 already had Frappe+ERPNext in Docker; CT 123 already had LiteLLM gateway; brand scraped from jwmcd.com

### Phase 1 — Backend
- New Frappe site `jwm-erp.beyondpandora.com` alongside existing `frontend` site (nginx FRAPPE_SITE_NAME_HEADER=$host fix critical)
- Custom app `jwm_manufacturing` with DocTypes: NCR, JWM CAR, RMA, JWM Overrun Allocation, Project Traveler (and 3 child tables)
- Custom fields on Work Order (`jwm_division`, `jwm_baseline_date`, `jwm_revised_date`), Sales Order, Customer, Stock Entry
- 20 Work Orders, 11 BOMs, 12 Workstations, 15 Items, 3 NCRs, 3 CARs, 2 RMAs, 4 Overruns, 29 Stock Entries (26 with Flat Laser 2 scrap cluster)
- JWM-branded traveler Print Format (Jinja, base64 logo, QR placeholder)

### Phase 2 — Shell
- Next.js 15 + TypeScript + Bun + Tailwind
- Screens: `/`, `/dashboard`, `/estimator`, `/planner/[wo]`, `/shop/[workstation]`, `/qc`, `/admin`
- JWM-branded top bar, sidebar, AI drawer, floating chat button
- Landing page with 20 real JWM projects scraped from jwmcd.com portfolio (auto-scrolling marquee)
- Reset button + ⌘+Shift+R shortcut

### Phase 3 — AI
- LiteLLM gateway reused (CT 123) with new JWM virtual key
- 4 live flows: chat (`/api/ai/query`, streaming), estimator (`/api/estimator/extract`, PDF → BOM), NCR draft (`/api/ncr/draft`, vision-capable), anomaly (`/api/anomaly`, clusters Laser #2 scrap)
- Each flow: live Claude first, canned fallback if env missing
- Cost per full demo run: ~$0.12

### Phase 4 — Voice
- ElevenLabs TTS streaming (`/api/ai/speak`) — voice ID `pNInz6obpgDQGcFmaJgB` ("Adam")
- Web Speech API for mic input, 1.5s silence auto-stop
- Barge-in: mic stops TTS
- Fallback to `speechSynthesis` if ElevenLabs fails

### Phase 5 — Deployment
- CT 120 port 3200 (port 3100 already in use by automagic-console)
- systemd service `jwm-demo.service`
- Traefik route `proxy-jwm-demo.yml` on PCT 103
- Cloudflared wildcard rule picked up `jwm-demo.beyondpandora.com` automatically
- Valid Let's Encrypt cert, HTTP→HTTPS redirect

### Phase 6 — Live data
- TopBar now shows "AI: Live" + "Data: Live" pills driven by `/api/ai/status` + `/api/data/status`
- `/api/kpis` computes on-time delivery, active WOs, 30d scrap events, open NCRs from live ERPNext
- Planner, QC, shop floor pages fetch real records
- 10s in-memory cache to avoid rate-limit on rapid clicks

### Phase 7 — Authentik SSO
- OIDC provider + application `jwm-demo` → then renamed to `jwm`
- Middleware guards `(app)` routes, accepts both NextAuth session + legacy stub cookie
- "Use local ERPNext credentials" button remains as fallback

### Phase 8 — Documentation
- Demo runbook in `docs/demo-runbook.md` (12-min narration)
- All Obsidian docs: README, FEATURES_WORKING, DEMO_GUIDE, REBUILD_GUIDE, STACK_INVENTORY, PRD_ADDENDUM_built_state
- Demo PDFs copied into `demo-content/`

---

## Credentials current state

| System | Location | Access |
|---|---|---|
| ERPNext admin | `/Users/mattwright/pandora/jwm-demo/docs/credentials.md` | 600 |
| LiteLLM JWM key | Same file | 600 |
| ElevenLabs key | `.env.local` (gitignored) | — |
| Authentik admin token | `jwm-demo-setup` (Authentik UI → Tokens) | revoke post-demo |
| Chris password | Sent via Telegram | Chris rotates on first login |
| Mark password | Sent via Telegram | Mark rotates on first login |

---

Linked: [[README]] · [[FEATURES_WORKING]] · [[DEMO_GUIDE]] · [[STACK_INVENTORY]]
