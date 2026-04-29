---
title: Epicor → ERPNext Full Replacement Plan (JWM)
status: Draft
updated: 2026-04-21
owner: sovereign.ai
plane: JWM1451-130
---

# Migrating JWM fully off Epicor onto ERPNext + Custom Shell

This brief covers the end-to-end replacement of JWM's **Epicor Kinetic** ERP with a sovereign **ERPNext** backend under a custom Next.js operator shell built by sovereign.ai. **Viewpoint Spectrum** (construction accounting) remains in scope for Phase 1 — bridged, not replaced. A Spectrum cut-over decision is parked until Epicor is fully retired and 6+ months of steady-state ERPNext production is observed.

This is the strategic/technical brief. The **data-level analysis** of Chris's first Epicor xlsx sample — and the scripts to ingest it — live in [[epicor-migration-plan]] and should be read alongside this doc.

---

## Executive summary

| | Today | Target |
|---|---|---|
| **Manufacturing ERP** | Epicor Kinetic (confirm: cloud or on-prem) | ERPNext v15 (Frappe) on JWM-owned hardware |
| **Operator UX** | Epicor Kinetic UI + Google Sheets + Smartsheet | Custom Next.js shell tailored to A-Shop / T-Shop / Engineering / Shop Floor / Exec workflows |
| **Construction accounting** | Viewpoint Spectrum (Trimble) | Unchanged Phase 1; bridged via ODBC; replacement evaluated Phase 3 |
| **Process orchestration** | Epicor BPMs + BAQs + Smartsheet glue | ERPNext Server Scripts + Workflows + Scheduled Jobs — inside the same system |
| **Data sovereignty** | Vendor-hosted (Epicor + Viewpoint) | JWM-owned server, off-site encrypted backup |
| **Per-user licence fee** | ~$175–$250/user/month (Epicor Kinetic, published list) | $0 seat cost (ERPNext is GPL-v3) |

**Business case**: eliminate Epicor licence + hosting, own the stack end-to-end, unlock the custom UX JWM's ops team has been working around with spreadsheets. No per-seat cap — shop floor, field supers, and office all get first-class access.

---

## The two external systems

### Epicor Kinetic — what we're migrating OUT of

Formerly **Epicor ERP 10 / E10**. Microsoft SQL Server underneath. The concepts that matter for migration:

- **Business Objects (BOs)** — the equivalent of ERPNext DocTypes. e.g. `Erp.Customer`, `Erp.Part`, `Erp.JobHead`, `Erp.OrderHed`, `Erp.POHeader`, `Erp.ABTLedger`. Hundreds of them; Epicor publishes a full BO reference.
- **UD (User-Defined) tables + fields** — Epicor's customization layer. Every standard BO has matching `UD<N>` tables and `Character01..20`, `Number01..20`, `ShortChar01..20`, `Date01..20`, `CheckBox01..20` extension columns. **This is where JWM-specific business meaning lives.** Ignore at your peril.
- **BAQs (Business Activity Queries)** — JWM-authored metadata queries. Every report JWM relies on is a BAQ. Exporting the full BAQ list is non-negotiable — it is the de-facto documentation of JWM's business rules as implemented.
- **BPMs (Business Process Management)** — Epicor's event hooks / triggers on BO events (pre-process, post-process, data directives). Any automation or enforcement JWM has built over time lives here.
- **Dashboards** — user-defined composite views built atop BAQs. Catalog these to understand what each role sees daily.
- **DMT (Data Management Tool)** — Epicor's own bulk import/export companion. Reads/writes CSV against the Epicor API in its native BO shape. We use DMT *against Epicor* for extract; we **do not** use it to load ERPNext.

**Access methods, ranked for our migration:**

| Method | Best for | Notes |
|---|---|---|
| **REST API** (`/api/v2/odata/...`) | Iterative dev; point-in-time extracts | OData v4, JWT or Basic auth, rate-limited. Present in all current Kinetic versions. |
| **Direct SQL Server read** (read-only cred) | Bulk extracts; historical data; schema introspection | Fastest path once IT grants access. Needs network route + credential. |
| **DMT bulk export** | Master data (Customer, Part, BOM, Routing) | CSVs mirror BO shape; lowest technical barrier; best for the first extract pass. |
| **SOAP services** | Legacy coverage where REST lacks an endpoint | Avoid unless REST is incomplete. |
| **SSRS / Crystal reports** | Historical finance snapshots | Read-only artifacts, not live integration. |

### Viewpoint Spectrum — what we're KEEPING (Phase 1)

Construction accounting suite — GL, AP, AR, Payroll, Job Cost, Equipment Cost, Subcontracts, Work Orders (field service flavor). Trimble-owned (acquired Viewpoint 2018; Viewpoint bought Spectrum from Dexter + Chaney 2017). Cloud-hosted for most customers; on-prem option still supported.

- **Access methods**: **ODBC driver** (read-only, mature, the standard path) + **Spectrum Web API** (newer REST, module-scoped, read/write on supported areas).
- **Integration strategy Phase 1**: nightly ODBC pull of Job Cost actuals into ERPNext, surfaced on `/exec/spectrum-drift` and related exec dashboards. **No writes to Spectrum.** See [[../40-operations/AWAITING_JWM|AWAITING_JWM]] § 1 for the point-in-time export ask.
- **Phase 3 replacement**: evaluate whether ERPNext Accounts + Payroll + a custom job-cost layer can replace Spectrum. Hold that decision until 6+ months of ERPNext production. Replacing finance systems is a separate engagement.

---

## What we're migrating INTO

### ERPNext (backend / system of record)

- Frappe v15 + MariaDB + Redis. Docker Compose on JWM's on-prem server (see [[server-migration-plan]]).
- Covers: Customer, Item, BOM, Routing/Operation, Work Order, Job Card, Stock Entry, Quality Inspection, Purchase Order, Sales Order, Supplier, Employee, Project, Task, Warehouse. All Epicor equivalents have an ERPNext counterpart.
- **JWM UD-field equivalents**: ERPNext **Custom Fields** on the relevant DocType, naming convention `custom_jwm_<name>`.
- **Orchestration (entirely inside ERPNext)**: **Server Scripts** (event hooks), **Scheduled Job** (cron), **Workflow** DocType (approval chains + state machines), **Notification** DocType (email / webhook / Slack). One system, one audit log, one auth boundary. See [[../30-decisions/007-n8n-out-of-jwm-stack|ADR-007]].

### Custom Next.js shell (operator UX)

- Replaces the Epicor Kinetic UI entirely for day-to-day operations.
- Role-tailored surfaces: **Executive / Architectural / Processing / Engineering / Shop Floor / QC / Safety / Maintenance / Fleet.** (See [[../README|the JWM canonical menu order]].)
- **Data-source map** at `/admin/data-sources` tracks which screens read live-ERPNext, which are seeded, and which are waiting on JWM data — see [[../40-operations/AWAITING_JWM|AWAITING_JWM]].
- Public demo URL: <https://jwm-demo.beyondpandora.com>.

---

## The ONE process flow (pre-condition for migration)

**Before any data moves, lock down one canonical lead-to-deliver process.** Without this, migration is just copying Epicor's inherited chaos into ERPNext.

```
Lead → Quote → Contract → ERF → Engineering (BOM + Routing) →
Work Order → Shop Floor (Job Card) → QC → Ship → Invoice → Closeout
```

Every handoff annotated with: **who owns it, what artifact, what state change, what triggers the next step.** Signed off by Chris (COO), Drew (Production), Laura (PM lead), David (Engineering), Paul (Exec).

Deliverable: `20-architecture/process-flow.md` (to be authored) — BPMN or equivalent diagram + per-step detail. Each step maps to an ERPNext DocType + State + Transition. Any Epicor capability not natively present in ERPNext is bridged via **Custom DocType** or **Custom Field** — not a third system.

---

## Migration approach

### Phase 1 — Extract + Introspect (weeks 1–2)

1. Obtain from JWM IT: Epicor **REST credential** + **read-only SQL Server credential**.
2. Build **Epicor Inspector** tool (`scripts/erp-import/epicor_inspector.py`):
   - Inventory every BO and every UD table (row counts, columns, sample rows).
   - Emit `epicor-inventory.md` + raw JSON per BO for diff / audit.
3. Export the full **BAQ list** (XML) — catalog every custom query JWM runs.
4. Export the full **BPM list** — catalog every custom trigger / data directive.
5. Export **Dashboard definitions** — catalog what each role sees today.
6. Install **Spectrum ODBC driver** on the migration VM; confirm read access to Job Cost tables.

### Phase 2 — Map (weeks 2–4): the Field-Level Mapping Register (holy grail)

One spreadsheet, version-controlled in git. Columns:

`epicor_bo` · `epicor_field` · `epicor_description` · `erpnext_doctype` · `erpnext_fieldname` · `transform_rule` · `status (1:1 / transform / drop / new)` · `owner` · `sign-off_date`

Filled domain by domain in this order:
**Customers → Suppliers → Items → BOMs → Routings → Warehouses → Employees → Open POs → Open SOs → Open Work Orders → WIP → Stock Ledger → Historical closed Work Orders → Quality records → Shipping → GL bridge.**

A JWM data owner signs off each domain before the importer is written. Optionally expose the register at `/admin/mapping` in the shell so Chris can click through and sign off field-by-field.

### Phase 3 — Build ETL (weeks 3–6)

Per domain, a `scripts/erp-import/epicor_<domain>.py`:
- **Idempotent** (re-run safe — natural-key upserts).
- **Dry-run mode** — reports what it *would* do without writing.
- **Batched** (500 records / API call, exponential-backoff retry).
- **Reconciliation emission** — counts + key sums logged per run.

### Phase 4 — Parallel-run + Reconcile (weeks 5–8)

- **Shadow mode**: ERPNext receives data in parallel with Epicor (via ETL pull + shell forms). JWM ops still transacts in Epicor for finance-of-record.
- `/admin/reconciliation` dashboard: per-domain row counts + key sums match between Epicor and ERPNext. Green/red per row, daily snapshot.
- Run for 2–4 weeks until steady-state green across all domains.

### Phase 5 — Cutover (week 8–9)

- Code freeze on Epicor side (no new POs / WOs entered).
- Final delta extract + import.
- 100% reconciliation green.
- DNS flip — shell becomes primary for day-to-day ops.
- Epicor becomes **read-only historical archive** for compliance retention (typically 3–7 years).

### Phase 6 — Post-cutover (months 3–12)

- Decommission Epicor licence at next renewal.
- Re-evaluate Spectrum replacement (Phase 3 decision point).
- On-prem GPU for local LLM inference per [[server-migration-plan]].

---

## Spectrum — Phase 1 bridge, Phase 3 evaluation

### Phase 1 (parallel with Epicor cutover)

- Keep Spectrum as finance system-of-record. No writes from our side.
- Nightly ODBC pull of Job Cost actuals into an ERPNext staging DocType. Powers `/exec/spectrum-drift` and PMO forecast tiles.
- If Epicor today feeds Job Cost into Spectrum via an integration, rebuild that feed from ERPNext → Spectrum import shape at cutover (week 9). This is the only Phase 1 Spectrum-side change.

### Phase 3 evaluation (month 6–12)

Criteria for Spectrum replacement:
- ERPNext has been steady-state production for 6+ months.
- JWM finance is comfortable ERPNext Accounts + a custom job-cost layer meets their construction-accounting needs (AIA billing, retention, bonds, Davis-Bacon payroll, certified payroll, etc.).
- Business case: Spectrum annual cost vs. one-time migration cost vs. ongoing sovereign stack value.

Likely outcome: Spectrum replaced for JOB COST + AP/AR; a specialised external payroll continues (payroll is the hardest piece in construction because of prevailing-wage + union reporting — replacing that would be a dedicated engagement).

---

## Open questions (must answer before Phase 1 starts)

1. **Epicor deployment**: Kinetic SaaS or on-prem?
2. **Epicor version**: 10.2.x / Kinetic 2022+ / 2024+? (affects REST availability and BO names)
3. **JWM IT contact**: who grants API credential + read-only SQL access?
4. **Named data owner per domain**: who signs off the Mapping Register? (Proposed: Chris for process; Drew for production/WO/routing; Laura for projects; David for engineering/BOMs; finance lead for Spectrum bridge.)
5. **Epicor licence renewal date**: sets latest cutover window.
6. **Customization inventory**: how many BPMs, UD fields, BAQs, Dashboards exist? (Extract in Phase 1 § 3–5.)
7. **Integrations crossing the Epicor boundary today**: Spectrum ↔ Epicor sync? Smartsheet exports? Fleet? Payroll? Enumerate.
8. **Spectrum ODBC access**: who at JWM IT / Viewpoint provisions the ODBC user?
9. **Regulatory or audit constraints**: SOX / ITAR / customer-specific requirements on where data can live.
10. **Acceptable cutover window**: weekend, multi-day, or staged-by-domain?

---

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| Undocumented Epicor customization missed during extract | Inspector dumps *every* BO + UD table. BAQ + BPM + Dashboard exports catalog every custom query/trigger/view. Nothing escapes. |
| User rejection ("old system had X, this doesn't") | Field-Level Mapping Register signed off per domain; no domain ships without JWM owner approval. |
| Reconciliation drift during parallel-run | Daily reconciliation dashboard; any domain going red triggers fix before Phase 5 can start. |
| Spectrum interface breaks post-migration | Phase 1 keeps Spectrum. Only the upstream feed (Epicor → Spectrum job cost) changes. Rebuild that feed from ERPNext at cutover. |
| Cutover rollback needed | Epicor kept live (read-only) through week 9; rollback = DNS flip back. Documented runbook with reverse-ETL path. |
| JWM IT unavailable for credentials | Track as a dated ask in [[../40-operations/AWAITING_JWM|AWAITING_JWM]]. Executive escalation via Chris if >5 business days. |
| Hidden business rules only Drew / Laura / David carry in their heads | The ONE process flow + sign-off gates surface these early. Pair programming during Mapping Register passes. |

---

## Costs (estimate — refine once Epicor/Spectrum contracts surface)

| Item | Phase 1 capex | Phase 1 opex/mo | Notes |
|---|---|---|---|
| ERPNext licence | $0 | $0 | GPL-v3 |
| On-prem server + optional GPU | ~$1,500–$8,500 one-time | $60 (power) | See [[server-migration-plan]] |
| Off-site backup (Backblaze B2) | $0 | $3 | 500 GB |
| Migration engineering (Inspector + mapping + ETL + reconciliation) | sovereign.ai engagement | — | ~6–8 weeks full-build |
| Epicor parallel-run licence | — | existing | Carry through week 9 |
| Spectrum | — | existing | Unchanged Phase 1 |
| **Savings at cutover** | — | **Eliminate Epicor licence** | Replaces per-seat cost with sovereign infrastructure |

---

## First concrete asks (send to Chris)

1. **Epicor REST API** base URL + credential (read-only is fine for Phase 1).
2. **Epicor read-only SQL Server credential** (preferred over REST for bulk extract).
3. **Epicor Data Dictionary PDF / schema export** if available from IT.
4. **List of all BAQs** JWM actively runs — XML export via *BAQ Designer → Actions → Export*.
5. **List of all BPMs** active on production BOs.
6. **List of all Dashboards** each role uses daily.
7. **1-hour live walkthrough** with JWM IT on the Epicor deployment + customizations.
8. **ODBC driver install package + credential** for Viewpoint Spectrum (read-only, Job Cost tables at minimum).

---

## Related docs

- [[epicor-migration-plan]] — data-level analysis of the first Epicor xlsx sample + the ingest-script plan for that slice
- [[server-migration-plan]] — on-prem hosting + local GPU (JWM1451-116)
- [[ha-active-active-plan]] — active-active across JWM sites (JWM1451-117)
- [[historical-data-ingestion-plan]] — xlsx / CSV seed flow (JWM1451-113)
- [[../30-decisions/004-litellm-gateway]] — LLM gateway for AI-assisted features (quote extraction, routing)
- [[../30-decisions/007-n8n-out-of-jwm-stack]] — no external orchestrator; orchestration stays inside ERPNext
- [[../40-operations/AWAITING_JWM]] — dated list of blocking asks for Chris / JWM IT
- [[../README|JWM vault root]]
