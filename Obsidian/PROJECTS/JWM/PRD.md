---
title: JWM Production System — PRD v1.0
status: Active
updated: 2026-04-30 (late session)
owner: sovereign.ai
phase: Phase 1 — core flow complete
contractual-deadline: end August 2026
engineering-target: 2026-05-19
---

# JWM Manufacturing System — Product Requirements Document

**Version:** 1.0  
**Date:** 2026-04-30  
**Author:** Matt Wright, sovereign.ai  
**Client:** John W. McDougall Company, Nashville TN  
**Phase 1 deadline:** end August 2026 (contractual) · 2026-05-19 (engineering target)  
**Phase 2 deadline:** end November 2026

---

## 1. Executive Summary

JWM is a Nashville metal fabricator ($30M, targeting $100M) replacing the production layer of Epicor with a sovereign stack. Financials stay in Spectrum; time/payroll stays in Paycor. This system owns **manufacturing execution**: ERF → Engineering → Router → Shop → QC → Shipping.

Archer Consulting quoted $430–550K over 2 years (Smartsheet Control Center, Jan 2027 go-live). This project replaces that scope at $165K + $25K contingency over 11 months, with JWM owning the infrastructure and the data.

**The system is live.** Phase 1 is in active development on production infrastructure. ERF submission, live Routing, Customers, Projects, Inventory, and Shop floor kiosk next-stop are all live against the JWM ERPNext instance as of 2026-04-30.

---

## 2. Users & Personas

| Persona | Role | Primary surface |
|---|---|---|
| **Chris Ball** | COO, executive sponsor | Executive dashboard, anomaly bell, route view |
| **Drew Adams** | Master Scheduler + Inventory Control | Inventory, shop efficiency, scheduling |
| **Paul Roberts** | VP Operations | ERF entry, traceability forms, form builder |
| **Collin** | Production Manager, Arch | Engineering view, Arch ERF queue |
| **Drew / Hannah** | Processing Ops | Processing ERF queue, T shop kiosk |
| **Shop operators** | Floor workers at kiosks | Workstation kiosk: start / stop / handoff / escalate |
| **QC officers** | Quality | NCR inbox, in-process QC gates |
| **Shipping** | Dispatch | Delivery Note sign-off — closes the job |

---

## 3. Production Flow (Phase 1)

This is the approved, locked manufacturing flow. QC is NOT terminal — Shipping closes the job.

```
ERF (Architectural  →  1010-NNNNN prefix)
    OR
ERF (Processing     →  1040-NNNNNN prefix)
         │
         ▼
   Engineering
   Categorisation / coding / programming
   Routing auto-generated on ERF submit (Server Script)
         │
         ▼
   Router Review Gate
   Human engineer reviews + confirms the 8-op Routing
   (auto-suggest, human-gated — never auto-commit)
         │
         ▼
   Shop Dispatch
   Work Orders created, dispatched per machine
         │
         ▼
   Machine Dissemination
   Operator start / stop / handoff / escalate (kiosk)
         │
         ▼
   QC — In-Process Checks
   In-process verification + approval for inventory-bound product
   NOT the terminal step
         │
         ▼
   Shipping — FINAL Sign-Off
   Delivery Note created → job closed
   This is the close.
```

**8 default routing operations** (auto-created on ERF submit):
Engineering → Cut → Form → Weld → Assemble → Finish → QC → Ship

---

## 4. Built State (live as of 2026-04-30)

Everything below reads live ERPNext. No canned data fallbacks remain in these paths.

### Backend (ERPNext / Frappe v15 on CT 171)
| Item | Status |
|---|---|
| ERPNext v15.105.x + Frappe | ✅ Live — `jwm-erp.beyondpandora.com` |
| `jwm_manufacturing` custom app | ✅ Installed on `jwm-erp.beyondpandora.com` |
| ERF DocType (custom) | ✅ Live — fields: division, job_number, release_code, customer, project, ship_target_date, notes, items child table |
| Server Script: "JWM ERF Submit — Auto Routing" | ✅ Live — fires After Submit on ERF; creates Routing with 8 default ops per ERF item |
| 8 Operations seeded | ✅ Engineering, Cut, Form, Weld, Assemble, Finish, QC, Ship |
| 81 Customers | ✅ Live |
| 795 Items | ✅ Live |
| 116 Projects | ✅ Live |
| 3,948 Schedule Lines | ✅ Live (JWM Production Schedule Line DocType) |
| 430 Daily Efficiency rows | ✅ Live (JWM Daily Efficiency DocType) |
| Custom Fields: Project (39), Opportunity (32), Work Order (5) | ✅ Live |
| Authentik OIDC — 5 JWM users | ✅ Live |
| Resend SMTP | ✅ Live |
| Inventory (Bin + Item + Warehouse) | ✅ Live — 795 items, Warehouse records exist |

### Shell (Next.js 15 on CT 120 port 3200)
| Route | Status | Data source |
|---|---|---|
| `/arch/erf` | ✅ Live | `listERFs("Architectural")` |
| `/arch/erf/new` | ✅ Live | POST `/api/erf` → ERPNext ERF DocType |
| `/processing/erf` | ✅ Live | `listERFs("Processing")` |
| `/processing/erf/new` | ✅ Live | POST `/api/erf` → ERPNext ERF DocType |
| `/customers` | ✅ Live | `listCustomers()` — 81 customers |
| `/projects` | ✅ Live | `listProjects()` — 116 projects |
| `/projects/[name]` | ✅ Live | Single project + linked ERFs |
| `/jobs/[name]/route` | ✅ Live | `getJobRoute()` — Work Orders + Operations timeline |
| `/inventory` | ✅ Live | `getInventory()` — Bin + Warehouse rollup |
| `/qc` | ✅ Live | `getNCRsHydrated()` — Quality Inspections (empty state, no NCRs yet) |
| `/shop/[workstation]` | ✅ Live | Job Cards — with live "next stop" from WO operations |
| `/shop/efficiency` | ✅ Live | JWM Daily Efficiency DocType |
| `/shop/scheduler` | ✅ Live | JWM Production Schedule Line DocType |
| Cmd-K command palette | ✅ Live | Searches projects/customers/items/ERFs in parallel |
| TopBar bell (anomaly) | ✅ Live | LLM analysis of live scrap events from Stock Entry |
| CustomerPicker typeahead | ✅ Live | `/api/customers?q=` |
| ItemPicker typeahead | ✅ Live | `/api/items?q=` |

### API endpoints
| Endpoint | Status |
|---|---|
| `GET /api/erf` | ✅ Live |
| `POST /api/erf` | ✅ Live — creates real ERF + fires auto-routing |
| `GET /api/customers` | ✅ Live |
| `GET /api/items` | ✅ Live |
| `GET /api/projects` | ✅ Live |
| `GET /api/job-cards/[name]/next-stop` | ✅ Live |
| `GET /api/ncr/list` | ✅ Live (0 QI records, shows empty state) |

---

## 5. Phase 1 Remaining Work

### Built 2026-04-30 (this session)

| Feature | Status | Notes |
|---|---|---|
| Export `jwm_manufacturing` DocTypes as Frappe fixture JSON | ✅ Done | 5 fixture files committed |
| Strip Phase-2 routes from sidebar nav | ✅ Done | Sidebar Phase-1 only; QC + Engineering groups updated |
| Engineering ERF review queue at `/engineering` | ✅ Done | Live ERFs from ERPNext, pending/other sections |
| Router review gate — Confirm Routing button | ✅ Done | Sets `is_active=1` on ERPNext Routing via API |
| Operator start/stop/handoff writes to ERPNext | ✅ Done | Fire-and-forget calls to job-card start/complete APIs |
| NCR submission from kiosk | ✅ Done | Creates Quality Inspection in ERPNext |
| QC in-process gate at `/qc/review` | ✅ Done | Live completed Job Cards, Pass/Raise NCR |
| Quality dashboard at `/qc/quality` | ✅ Done | Live QI aggregation, pass rate, by-workstation |
| Shipping Delivery Note sign-off | ✅ Done | DeliveryNoteForm creates + submits DN in ERPNext |
| Authentik OIDC for shell | ✅ Done | Code live; env vars confirmed on CT 120 |
| Data Source Map at `/admin/data-sources` | ✅ Done | data-sources.ts updated with live states |

### Unblocked — remaining Phase 1

| Feature | Priority | Notes |
|---|---|---|
| Traceability forms (Operator Processing Check, CNC Setup Check, Arch Panel Check, Arch Daily, Job-Specific) | Urgent | Awaiting Paul Roberts field lists (JWM-222) |
| Form builder wrapper | Follows traceability forms | — |

### Blocked — awaiting JWM input

| Feature | Blocked by | Ticket |
|---|---|---|
| Traceability forms (Operator Processing Check, CNC Setup Check, Arch Panel Check, Arch Daily, Job-Specific) | Paul Roberts — field lists needed | JWM-222 |
| Form builder wrapper | Follows traceability forms | — |
| Operation → Workstation mapping (which of 40 stations runs which of 8 ops) | Paul Roberts | JWM-221 |
| Repeat-job routing behaviour (auto-apply vs one-click confirm vs full review) | Chris Ball | JWM-124 |
| Spectrum ODBC bridge — nightly Job Cost actuals | JWM IT credential | JWM-122 |
| Epicor DB export for historical import | JWM IT | JWM-118 |
| JWM server access for production infra | JWM IT | JWM-117 |

---

## 6. Phase 2 Scope (Jun–Nov 2026)

Deadline: end November 2026. No Phase-2 features are in Phase 1.

- **PM dashboards** — 1010 (A Shop) + 1040 (T Shop) project management ops
- **Fleet** — vehicles, drivers, bookings (drafted; hidden from Phase 1 nav)
- **Machine maintenance** — PM schedule, downtime tracking
- **Safety** — incident log, OSHA 300, operator escalation integration
- **Facilities** — building-level tracking

Deferred further (no commitment):
- Sales pipeline / opportunity tracking / quick-quote AI
- Spectrum drift comparison UI (credential still pending)
- Full Epicor retirement → 2027-03-31 target

---

## 7. Architecture

### Stack
| Layer | Technology | Host |
|---|---|---|
| ERP backbone | ERPNext + Frappe v15.105.x | CT 171, Docker |
| Custom app | `jwm_manufacturing` (Frappe app, git-tracked) | CT 171, bind-mounted |
| Shell UI | Next.js 15, TypeScript, Tailwind | CT 120, port 3200, systemd |
| AI gateway | LiteLLM (CT 123) → Claude / Gemini / Ollama | CT 123 |
| Auth | Authentik OIDC (CT 105) | CT 105 |
| Hosting | Beyond Pandora lab (production-equivalent until JWM infra ready) | — |

### JWM Production infra spec (pending JWM IT)
4 VMs — Ubuntu/Debian, SSH key only, `jwmadmin` sudo user:
- **VM 1**: Frontend (Next.js shell)
- **VM 2**: ERP (ERPNext + Frappe, MariaDB)  
- **VM 3**: DB (MariaDB dedicated — for HA config)
- **VM 4**: Services (LiteLLM, Authentik, Backups)

Specs per VM: 8–16GB RAM / 4–8 vCPU / 50–100GB disk. Max 10 concurrent / 50 periodic users.

### Key architectural decisions
- **ADR-001**: Headless ERPNext — shell is the everyday UI, ERPNext desk is the admin/power-user UI
- **ADR-002**: System-as-router — ERPNext native Routing + BOM Operation; no custom Shop Router DocType
- **ADR-003**: A Shop / T Shop naming — 1010=A Shop=Architectural, 1040=T Shop=Processing
- **ADR-004**: LiteLLM gateway for all AI — single key, model-agnostic
- **ADR-007**: No external workflow orchestrator — all async on ERPNext Server Script / Scheduled Job / Workflow

---

## 8. Hard Rules (non-negotiable)

1. **`docker commit rollback/<svc>:<ts>` before any container patch.** Non-negotiable.
2. **No state in writable container layer.** Every DocType, Custom Field, Server Script = JSON fixture in git.
3. **All Python seed scripts are idempotent.** No side effects on re-run.
4. **Backups before any change touching production data.** `bench backup --with-files` minimum.
5. **No canned data in production code.** `source: "canned"` is a defect, not a feature.
6. **No "demo mode" toggles.** The system JWM uses is this system.
7. **Single source of truth per concept.** Customer/Project/Item lives in ERPNext. Plane tracks software tickets only.
8. **Test in sandbox CT 172 before touching CT 171 (production ERPNext).**
9. **Every route has a source-state in `lib/data-sources.ts`.** Production = all `live`.
10. **`sudo` not `root` on JWM VMs.** User: `jwmadmin`. `PermitRootLogin no`.

---

## 9. Blockers — open as of 2026-04-30

| Blocker | Owner | Ticket | Impact |
|---|---|---|---|
| Repeat-job routing decision | Chris Ball | JWM-124 | Can't finalise Router Review Gate UX |
| Operation→Workstation mapping | Paul Roberts | JWM-221 | Kiosk next-stop static map is incomplete |
| Traceability form field lists | Paul Roberts | JWM-222 | Traceability forms can't be built |
| JWM server access | JWM IT | JWM-117 | Can't deploy to JWM-owned infra |
| Epicor DB export | JWM IT | JWM-118 | Historical data import blocked |
| Spectrum ODBC credential | JWM IT | JWM-122 | Spectrum bridge blocked |

---

## 10. Timeline

| Milestone | Target | Status |
|---|---|---|
| ERF live (Arch + Processing) | ✅ Done | 2026-04-30 |
| Live inventory, customers, projects | ✅ Done | 2026-04-30 |
| Shop kiosk next-stop (live) | ✅ Done | 2026-04-30 |
| Cmd-K search palette | ✅ Done | 2026-04-30 |
| Engineering ERF review queue | ✅ Done | 2026-04-30 |
| Router Review Gate (Confirm button) | ✅ Done | 2026-04-30 |
| Operator start/stop/handoff (writes ERPNext) | ✅ Done | 2026-04-30 |
| NCR submission from kiosk → Quality Inspection | ✅ Done | 2026-04-30 |
| QC in-process gate (/qc/review) | ✅ Done | 2026-04-30 |
| Quality dashboard (/qc/quality) | ✅ Done | 2026-04-30 |
| Shipping Delivery Note sign-off | ✅ Done | 2026-04-30 |
| Authentik OIDC SSO | ✅ Done | 2026-04-30 |
| Traceability forms | TBD | Blocked — JWM-222 (Paul Roberts) |
| Form builder | TBD | Blocked — JWM-222 |
| UAT (Chris + Drew + Paul + Collin) | Week 2–3 | — |
| **Phase 1 engineering target** | **2026-05-19** | — |
| **Phase 1 contractual deadline** | **end Aug 2026** | — |
| **Phase 2 deadline** | **end Nov 2026** | — |

---

## 11. Related Documents

- [[PRODUCTION_SCOPE]] — primary scope doc in `github.com/tenshimatt/jwm`
- [[00-meta/SCOPE_LOCKED_2026-04-29]] — scope locked after Chris + Paul email thread
- [[40-operations/AWAITING_JWM]] — dated checklist of items needed from JWM
- [[ADR]] — architecture decision records
- [[CHANGELOG]] — historical build log (demo-phase history; production log starts 2026-04-29)
- Plane workspace: `plane.beyondpandora.com/jwm/`
- Shell: `jwm-demo.beyondpandora.com` (CT 120)
- ERPNext: `jwm-erp.beyondpandora.com` (CT 171)
