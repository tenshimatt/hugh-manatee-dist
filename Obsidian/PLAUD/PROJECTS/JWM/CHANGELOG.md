# JWM Demo — Changelog

Chronological record of what shipped, when, and why.

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
