# JWM Production System — PRD Addendum: Built State

> **Companion to [[JWM_Production_System_PRD_v0.2]].**
> What was actually built as a working demo in the 48 hours before Chris Ball's meeting.

**Date:** 2026-04-17
**Status:** Live, running, tested

---

## TL;DR

The Phase 1 architecture described in the PRD (§5) is no longer a proposal. It's running. A 48-hour build produced a working demo that covers:

- ✅ Real ERPNext Manufacturing backend with JWM customizations
- ✅ Branded Next.js operational UI (the "skin" Chris will use)
- ✅ LiteLLM AI gateway with Claude + local Ollama fallback
- ✅ Four live AI flows (estimate → BOM, chat, NCR draft, anomaly detection)
- ✅ Voice in (Web Speech API) + out (ElevenLabs)
- ✅ Public URL with valid TLS
- ✅ Authentik SSO wiring
- ✅ Seed data matching JWM's division split, workstation layout, real project portfolio

This is the opposite of Archer's approach. Archer sold 20 pages of "TBD during detailed design." We built the thing.

---

## What's live

### Public URLs

| URL | Component | State |
|---|---|---|
| https://jwm-demo.beyondpandora.com | Operational UI (Next.js) | Live, tested |
| https://jwm-erp.beyondpandora.com | ERPNext backend | Live, real DocTypes |
| https://jwm-ai.beyondpandora.com | LiteLLM gateway | Live, Claude + Ollama |

### Functional coverage vs PRD §4

| PRD Section | What was built | Status |
|---|---|---|
| 4.1 Order Intake & Traveler Management | WO/BOM creation via UI, real ERPNext Sales Order → Work Order flow, traveler PDF print format with QR placeholder | ✅ Demo-ready |
| 4.2 Shop Floor Execution | Role-based kiosk view per workstation, Job Card with start/complete/scrap, voice NCR composer | ✅ Demo-ready |
| 4.3 Date Tracking & On-Time Delivery | `jwm_baseline_date` + `jwm_revised_date` custom fields on Work Order; dashboard OTD metric | ✅ Demo-ready |
| 4.4 Master Data | 8 customers seeded, dropdown-fed, `jwm_customer_tier` flag | ✅ Demo-ready |
| 4.5 Inventory (visibility + manual) | 12 workstations, Stock Entries flowing, material receipts, manual journal-entry-equivalent via Stock Entry | ✅ Demo-ready |
| 4.6 Quality | `JWM NCR` + `JWM CAR` + 26 scrap Stock Entries with anomaly cluster | ✅ Demo-ready |
| 4.7 Job Overrun & RMA | `JWM Overrun Allocation` + `RMA` DocTypes with 4 + 2 records | ✅ Demo-ready |
| 4.8 Capacity & Scheduling | Workstation capacity fields, portfolio-level static config | ✅ Demo-ready |
| 4.9 Dashboards & Reporting | Executive dashboard + NL chat + anomaly card | ✅ Demo-ready |
| 4.10 Training & Handoff | Documented in [[REBUILD_GUIDE]] + [[STACK_INVENTORY]] | ✅ Documented |

### AI Layer vs PRD §6

All 4 Phase 1 use cases are live and wired to real Claude:

| PRD §6 use case | Demo endpoint | Latency | Cost/call |
|---|---|---|---|
| 6.1 Estimate PDF → BOM | `/api/estimator/extract` | 30-45s | ~$0.04 |
| 6.2 Natural Language Dashboard Queries | `/api/ai/query` (streaming) | ~3s first token | ~$0.005 |
| 6.3 Scrap & Variance Anomaly Detection | `/api/anomaly` | 10-15s | ~$0.01 |
| 6.4 NCR Drafting from Shop Floor | `/api/ncr/draft` (vision-capable) | 5-8s | ~$0.003 |

Total: **~$0.12 per full demo run.**

AI governance items from PRD §6.5 all in place:
- ✅ All requests via LiteLLM gateway
- ✅ Contractual no-training metadata on every call
- ✅ Ollama local fallback operational
- ✅ Full Postgres audit log
- ✅ Cost caps + rate limiting enforced ($50/mo, 60 rpm)
- ⏳ PII scanning (Llama Guard) — Phase 2 add

---

## Extras beyond PRD scope

Built because it was fast and made the demo better:

1. **Voice interface** — John speaks back through ElevenLabs (deep male voice). Chris can talk to the system hands-free.
2. **Project marquee** — 20 real JWM projects scraped from jwmcd.com, auto-scrolling on landing page.
3. **Live/canned switch** — TopBar pills show "AI: Live" + "Data: Live" so Matt can see at a glance which mode is active.
4. **Demo reset** — ⌘+Shift+R clears state between runs; admin page button for a clean session.
5. **Themed markdown rendering** — chat responses use JWM navy for bold, gold bullets, inline tables.
6. **JWM-branded traveler PDF** — Jinja template with embedded logo + QR placeholder.

---

## Stack summary

See [[STACK_INVENTORY]] for full detail.

- **CT 171** — Frappe/ERPNext (new site `jwm-erp.beyondpandora.com` alongside existing `frontend` site; no disruption)
- **CT 120** — Next.js shell on port 3200 (systemd, auto-restart)
- **CT 123** — LiteLLM gateway (existing, added JWM virtual key)
- **PCT 146** — Ollama GPU fallback
- **PCT 103** — Traefik reverse proxy (3 new routes)
- **PCT 105** — Authentik (OIDC provider for demo)
- **PCT 113** — Cloudflared public tunnel

---

## What's NOT built (deferred, per PRD)

- Automated inventory back-flushing (Phase 2)
- Dynamic production roster (Phase 2)
- Customer portal (out of scope)
- Spectrum bidirectional sync (one-way outbound in scope)
- Paycor inbound (wired as n8n workflow skeleton; needs real Paycor API creds)
- Mobile-native shop floor app (PWA possible; native deferred)
- Epicor data migration (scenario-dependent, Week 2-3 activity)

---

## Implications for commercial model (PRD §10)

The "build phase" Archer sold ($18K discovery + TBD build) is materially cheaper now:

- The risk Archer's design tried to paper over (Smartsheet platform limitations per their §4) is simply not present on ERPNext.
- Every "TBD during detailed design" in Archer's deliverables doc has a concrete answer on this stack.
- 70-80% of their Phase 1 RIDs map to existing ERPNext DocTypes with zero custom code. The rest were built in 48 hours.
- Chris can evaluate pricing (Options 1-4 in PRD §10) against a *working system*, not a specification.

**Recommendation:** lead with **Option 1 — Self-hosted, $55,000 fixed with Year 1 maintenance included.** The demo collapses the sales cycle. Signed contract within 72 hours is realistic.

---

## Next steps after the meeting

1. Contract signed (Option 1 default, adjustable).
2. Week 1: confirm Epicor migration scenario (A/B/C per PRD §8.1), kick off data extraction.
3. Week 2-4: MVP phase per PRD §9, using THIS demo as the foundation — no rebuild.
4. Week 5-8: real data + connectors (Spectrum out, Paycor in).
5. Week 9-12: parallel run with Epicor, work center by work center.
6. Week 13-16: cutover, pre-Australia departure 26 June.

---

Linked: [[JWM_Production_System_PRD_v0.2]] · [[DEMO_GUIDE]] · [[REBUILD_GUIDE]] · [[STACK_INVENTORY]]
