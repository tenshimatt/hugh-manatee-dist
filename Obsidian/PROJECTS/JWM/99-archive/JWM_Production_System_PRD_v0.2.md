# JWM Production System — Product Requirements Document

**Version:** 0.2 (draft)
**Date:** 17 April 2026
**Author:** Matt Wright, sovereign.ai
**Client:** John W. McDougall Company (JWM), Nashville TN
**Status:** Working draft, pre-Monday meeting with Chris Ball + team

---

## 0. Summary

JWM is replacing the production layer of their ERP. They've already moved financials to Spectrum and time/payroll to Paycor, so what remains in Epicor is production tracking, BOMs, routing, inventory, shop floor execution, and quality. They hired Archer Consulting for a discovery phase ($18K) which produced a 20-page deliverables document proposing a Smartsheet Control Center rebuild with Jan 2027 go-live.

sovereign.ai proposes an alternative: replace the scope Archer defined with an open-source ERP (Frappe/ERPNext Manufacturing) extended with an AI gateway (LiteLLM) and workflow orchestration (n8n). Pre-Australia go-live targeted for late July / early August 2026.

Hosting offered in two models (self-hosted on JWM infrastructure or SaaS on sovereign.ai-managed infrastructure), with commercial flexibility on pricing structure. All options include first-year maintenance and AI gateway operations.

This PRD is a working document. Open questions for Monday's meeting are listed in Section 11.

---

## 1. Context

**The business.** JWM is a Nashville-area manufacturer in a growth phase — $30M → $100M trajectory. Two divisions:

- **Processing** — make-to-print. Jobs are fully estimable and schedulable at intake.
- **Architectural** — engineer-to-order. BOMs and routing not finalized until engineering releases layouts, sometimes shortly before shop release.

Scale: 100–200 active POs, 10–20K active items, 16–20K operation instances, 1M+ parts/year (per Archer's discovery).

Work centers include flat laser, CNC, press brake, weld, assembly, QC, paint, shipping. Some operations are outsourced.

**Current systems.**

- Production tracking: Epicor (being replaced — this project)
- Financials: Viewpoint Spectrum (construction accounting — interesting choice for a manufacturer, suggests progress-billing / retention workflows)
- Time & payroll: Paycor
- Collaboration: Microsoft Teams (not in scope for this project)

**The competitive situation.** Archer has completed discovery and is pitching a Smartsheet Control Center build. Their architecture wraps a custom web app + replicated database around Smartsheet, which their own Section 4 lists six platform risks for. Chris is evaluating alternatives. He knows Matt, trusts the sovereignty pitch, and has indicated strong interest in our approach.

**Prior conversation context.** Matt's earlier call with Chris was a capabilities overview, not a scoped proposal — a deliberately broad walkthrough of the sovereign.ai stack (ERP, AI gateway, Nextcloud, passwordless auth, on-prem HA) to establish credibility and give Chris a menu to point at. Monday's meeting narrows that menu to the specific slice JWM needs first: the manufacturing production system with AI gateway embedded. Everything else explicitly parks as Phase 2 / future engagements.

**Strategic framing.** JWM is heading to $100M. Their production system choice compounds for the next decade. Locking into Smartsheet licensing + Control Center + Work Apps + Data Shuttle + Data Mesh indefinitely, on a SaaS platform hosting their production data in US-based Smartsheet infrastructure, is a liability as they scale. An open-source stack on JWM-owned infrastructure, with AI capabilities native to the system, compounds the other way.

---

## 2. Goals and Non-Goals

### Goals (Phase 1)

1. Replace Epicor's production layer with a modern, extensible system that JWM owns.
2. Give Paul Roberts a tool to build travelers/work orders fast, including importing from estimate documents.
3. Give the shop floor role-based views of their work queue without raw-data exposure.
4. Track inventory, scrap, quality events, NCRs, and RMAs with operational discipline.
5. Dashboards for executive leadership (Chris, George), project execs (Josh), and work-center leads.
6. AI-assisted workflows embedded where they add value, not as a bolt-on.
7. Data sovereignty: hosting on JWM-owned infrastructure, no vendor lock-in on the data layer.
8. Integrations to Spectrum (outbound) and Paycor (inbound) for unified visibility.
9. Pre-Australia go-live: late July / early August 2026.

### Non-Goals (Phase 1)

1. Full Epicor retirement (scenario-dependent — see Section 8).
2. Replacing Spectrum or Paycor.
3. Replacing Microsoft Teams or the collaboration stack.
4. Customer portal or external-facing collaboration tools.
5. Fully automated inventory (back-flushing, automatic consumption, reorder triggers). Manual-first, with the structure in place to automate in Phase 2.
6. Production roster and dynamic capacity management (static capacity values in Phase 1, same approach as Archer).
7. Biometric/passwordless authentication rollout org-wide (Phase 2 / separate engagement).
8. On-prem HA architecture across multiple sites (Phase 2 / separate engagement).

---

## 3. Users and Personas

| Persona | Role | Primary Need |
|---|---|---|
| **Chris Ball** | COO, executive sponsor | Strategic KPIs: on-time delivery, scrap rate, work center utilization, growth-trajectory metrics |
| **George Holland** | Executive leadership | Overall business visibility, archived year-over-year trends |
| **Paul Roberts** | Engineering & Quality Executive, system admin | Build and manage travelers, configure BOMs/routings, maintain master data, admin UI access |
| **Josh McPherson** | Project Executive | Project-level tracking, visibility across active POs |
| **Estimators** | Sales-adjacent | Import estimates into the system, transform estimate BOMs into travelers |
| **Planners / Schedulers** | Operations | Release work orders, adjust dates, batch/split jobs, handle engineering approval gates |
| **Work Center Leads** | Shop floor supervisors | Queue management, operator assignment, daily status |
| **Operators** | Shop floor (welders, CNC operators, etc.) | View assigned work, update job status, log quantities, report scrap |
| **QC Team** | Quality | Inspections, NCR creation and tracking, corrective actions |
| **Shipping** | Logistics | Ready-to-ship queue, packing, dispatch |
| **Caitlin Moi** | Accounting (Spectrum owner) | Data flowing from production into Spectrum for costing |

---

## 4. Functional Scope

Grouped by area. Mapped to Archer's RIDs where relevant but without the ceremony.

### 4.1 Order Intake & Traveler Management

- Intake a PO or sales order from a customer
- Build a traveler (work order) for each part/assembly, either from scratch, from template, or by copying a previous PO
- Support multi-level BOMs (assembly → sub-assembly → part)
- Standardized operation codes (flat laser, CNC, press brake, weld, assembly, QC, paint, etc.)
- Per-operation routing with durations, materials, quantities
- Revision control for parts and BOMs
- Engineering approval gate for shortened architectural job dates
- Batching and splitting for nested material runs (yield optimization)
- Print a PDF traveler with a QR/barcode placeholder for future scanning

**Mapped RIDs:** 2, 7, 8, 11, 34, 42

### 4.2 Shop Floor Execution

- Role-based shop floor UI: welder sees welding queue, CNC operator sees CNC queue, etc.
- Job card view per operation with part details, routing, drawings, notes
- Operator updates: start, complete, quantity done, scrap reported
- Work center queue and scheduling view for leads
- Outsourced operation tracking with expected return dates
- Notes and attachments per operation
- No access to the admin UI or raw tables from the shop floor

**Mapped RIDs:** 4, 5, 9, 52, 53

### 4.3 Date Tracking & On-Time Delivery

- Dual-date tracking: immutable baseline requested/promised date, adjustable revised schedule date
- On-time delivery measured against the baseline date and the ready-to-ship date (not customer pickup)
- Release-level and assembly-level variance, not just project-level
- Dashboard rollups by division, customer, and overall

**Mapped RIDs:** 1, 2, 12

### 4.4 Master Data

- Master customer list as single source of truth
- Standardized nomenclature for customers and part numbers
- Admin-controlled, dropdown-fed into all intake forms
- Strategic customer flagging for targeted reporting

**Mapped RIDs:** 55

### 4.5 Inventory

Phase 1 is **visibility + manual transactions**, not full perpetual automated inventory.

- Project-level inventory (per work order) and company-level master ledger
- Three inventory categories: JWM stock, order-specific, customer-provided
- Rules preventing cross-contamination (customer-provided material cannot be used on another customer's job)
- Allocation codes: department, customer, project
- Manual journal entries for cycle counts, transfers, reconciliation
- Min/max columns present but no active reorder triggers in Phase 1
- Purchasing and receiving with allocation codes
- Stock job workflow (sub-components produced in batches, go to inventory, consumed by top-level assemblies)

**Mapped RIDs:** 6, 14, 16, 17, 19, 24, 25, 38

### 4.6 Quality

- Scrap tracking with configurable thresholds (default: 10% or 25 pieces, whichever is fewer)
- Notifications when thresholds exceeded (not auto-NCR generation)
- Material variance (planned vs actual) via daily reporting
- Non-conformance tracking: internal NCRs, supplier NCRs (SNCR), customer NCRs
- Corrective Action Reports (CARs) with status, owner, due date, resolution
- Quality dashboards: trends by operation, part, project

**Mapped RIDs:** 20, 35, 51

### 4.7 Job Overrun & RMA

- Overrun handling: operator logs extra parts, admin reviews and allocates to future orders, customer purchase, or stock
- RMA process with unique IDs, dispositions (credit only, rework at JWM, rework by customer, remake and reship)
- Rework flows back through production with RMA flag
- Recut vs rework decision with production leadership approval
- RMA dashboards: quality escapes, disposition trends

**Mapped RIDs:** 21, 22, 23

### 4.8 Capacity & Scheduling

- Portfolio-level work center configuration: hours/day, days/week, weekly capacity
- Static values in Phase 1, maintained by admins
- Schedule recalculation on shift changes, applied to remaining quantities only
- Support both processing (predictable) and architectural (late-binding) scheduling patterns

**Mapped RIDs:** 3

### 4.9 Dashboards & Reporting

- Executive dashboard: on-time delivery, active projects, scrap, RMA trends, utilization
- Division dashboards: processing vs architectural with volume-weighted metrics
- Customer dashboards for strategic accounts
- Work center operational dashboards: queue, schedule, status
- Quality dashboards: NCR/SNCR/CAR aggregation
- Natural language query capability (AI layer — see Section 6)
- Archived data for year-over-year trend analysis

**Mapped RIDs:** 12, 54

### 4.10 Training & Handoff

- Paul Roberts trained as primary internal admin
- Operational runbooks for standard procedures and exception handling
- Admin training on traveler building, BOM management, work center config, report building
- Shop floor training per work center role
- Quality team training on NCR/CAR workflow

---

## 5. Architecture

### 5.1 Component Overview

```
┌────────────────────────────────────────────────────────────────┐
│                    JWM-Owned Infrastructure                     │
│                (on-prem or JWM-controlled cloud)                │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │  ERPNext     │  │  Frappe CRM  │  │   AI Gateway       │   │
│  │  (Frappe)    │──│              │  │   (LiteLLM)        │   │
│  │              │  │              │  │                    │   │
│  │  - Mfg       │  │  - Customers │  │  - Anthropic       │   │
│  │  - Stock     │  │  - Contacts  │  │  - Local (Ollama)  │   │
│  │  - Quality   │  │  - Leads     │  │  - Guardrails      │   │
│  │  - Purchase  │  │              │  │  - Audit logging   │   │
│  │  - Sales     │  │              │  │                    │   │
│  └──────┬───────┘  └──────────────┘  └────────┬───────────┘   │
│         │                                       │               │
│         │          ┌──────────────┐            │               │
│         └──────────│     n8n      │────────────┘               │
│                    │  Workflows   │                             │
│                    └──────┬───────┘                             │
│                           │                                     │
│  ┌──────────────┐  ┌─────▼────────┐  ┌────────────────────┐   │
│  │  Paperless   │  │  PostgreSQL  │  │   Authentik        │   │
│  │  -ngx        │  │              │  │   (SSO, RBAC)      │   │
│  │  (docs)      │  │  (ERPNext    │  │                    │   │
│  └──────────────┘  │   + state)   │  └────────────────────┘   │
│                    └──────────────┘                             │
│                                                                  │
└────────────────────┬─────────────────────────────────────────┘
                     │
      ┌──────────────┼──────────────┐
      │              │              │
      ▼              ▼              ▼
  ┌────────┐   ┌────────┐    ┌────────┐
  │Spectrum│   │ Paycor │    │ Epicor │
  │(finance│   │ (time) │    │ (TBD)  │
  │  API)  │   │  API)  │    │        │
  └────────┘   └────────┘    └────────┘
```

### 5.2 Core Platform: Frappe / ERPNext

**Why Frappe/ERPNext:**

- ERPNext Manufacturing module covers 70–80% of Archer's RIDs natively as existing DocTypes: BOM, Work Order, Job Card, Production Plan, Workstation, Subcontracting, Sales Order, Purchase Order, Stock Entry, Quality Inspection, Customer
- Open source (MIT license), no vendor lock-in on the platform
- Extensible via Frappe Framework: new DocTypes, custom scripts, workflows, reports, dashboards
- REST API and webhooks for all integrations
- Role-based permissions at the field and document level
- Mobile-responsive Desk UI works for shop floor on tablets
- Mature, production-proven at thousands of manufacturing companies

**Customizations needed (the ~20–30% JWM-specific work):**

- Custom traveler PDF layout with QR code placeholder
- NCR / SNCR / CAR DocType (ERPNext has basic Quality NonConformance; we extend it)
- RMA DocType with disposition workflow
- Overrun allocation workflow
- Customer-provided material category and cross-contamination rules
- Division tagging (processing vs architectural) with appropriate behaviors
- Shop floor kiosk view (if native Job Card UI isn't tactile enough)
- Custom dashboards for Chris/George's specific KPIs (defined post-Monday)

### 5.3 AI Gateway: LiteLLM

**Why LiteLLM:**

- Proxies requests to multiple LLM providers behind a single API surface
- Policy enforcement: rate limiting, cost caps, model routing
- No training on JWM data (provider contracts + proxy config)
- Audit logging of every request and response
- Works with Anthropic (quality), Ollama local models (cost/sovereignty), OpenAI, Google Vertex, Azure OpenAI as fallbacks
- Guardrails layer (Llama Guard or similar) for PII/sensitive data leakage protection

### 5.4 Workflow Orchestration: n8n

Used for:
- Spectrum integration (outbound cost and production data)
- Paycor integration (inbound time data)
- Epicor integration (scenario-dependent)
- Email notifications (NCR escalation, shipping notices, shift schedule changes)
- Scheduled data operations (archiving, rollups)
- AI workflow orchestration (estimate PDF → structured BOM pipeline)

### 5.5 Document Management: Paperless-ngx

- Estimate PDFs and Excel files
- Customer purchase orders
- Drawings and technical specs
- Shipping documents
- OCR-searchable archive
- Feeds into AI gateway for document-based workflows

### 5.6 Identity & Access: Authentik

- SSO for all system components
- RBAC with mapping to ERPNext roles
- Ready for future passwordless / biometric rollout in Phase 2
- Integration with Microsoft 365 for user provisioning (if JWM wants)

### 5.7 Hosting

Two engagement options, presented neutrally. JWM chooses based on preferred cash-flow shape, infrastructure ownership model, and IT operational posture. AWS is the default cloud provider in both (noted as comfortable in prior conversation); Azure or GCP available if preferred.

**Option A — Self-hosted on JWM infrastructure.**

JWM owns the AWS account. sovereign.ai deploys the stack into JWM's environment and hands over full control. Maintenance, updates, and operational support delivered under a continuing agreement inside JWM's environment.

- Full data sovereignty — JWM controls accounts, keys, backups, retention
- Clean separation between build phase and long-term ownership
- JWM can in-source operations later if they grow dedicated IT capacity
- AWS bills JWM directly (estimated ~$300–600/month at MVP, ~$600–1,200/month at full production scale)
- On-prem alternative available at a JWM facility if preferred (~$15–25K one-time hardware, eliminates monthly cloud spend)

**Option B — SaaS on sovereign.ai-managed AWS.**

sovereign.ai hosts the stack on our AWS infrastructure. JWM pays a single monthly fee covering hosting, maintenance, updates, and AI gateway operations. No cloud bill management, no infrastructure ownership, no operational overhead on JWM's side.

- Single predictable monthly invoice
- Zero operational burden on JWM IT
- Dedicated single-tenant deployment — not shared with other sovereign.ai customers
- Standard SaaS exit provisions: data export in open formats, migration assistance if JWM later moves to Option A
- sovereign.ai carries the infrastructure cost and manages it at scale

Data sovereignty guarantees (no LLM training on JWM data, full audit logging, encrypted at rest and in transit) are identical in both options. In Option A, JWM holds keys directly. In Option B, JWM holds contractual control of the same guarantees via sovereign.ai, with the gateway architecture enforcing them at the technical layer.

---

## 6. AI Layer

The AI layer is not a separate product. It's embedded in the workflows where it adds real value. Four Phase 1 use cases:

### 6.1 Estimate PDF → Structured BOM

**Problem:** Estimating happens in PDFs, Excel, or other tools. Today, transferring that estimate into a traveler is manual re-entry. Archer handwaves this in D-02 as "UI facilitates BOM-to-traveler import" without explaining how.

**Solution:** Estimator uploads estimate document. Document goes through Paperless-ngx OCR → structured extraction via LLM (Anthropic Claude for quality). Output is a draft BOM in ERPNext that the planner reviews and approves. Reduces estimate-to-release time from hours to minutes. Handles PDFs, Excel, even scanned documents.

### 6.2 Natural Language Dashboard Queries

**Problem:** Executives want answers, not reports. "Which jobs are at risk this week?" "What's our scrap rate on the Henderson account compared to last quarter?" "Show me architectural jobs behind schedule."

**Solution:** Chat interface wired to ERPNext data via Frappe's reporting API, mediated by LiteLLM. LLM generates the query, runs it against ERPNext, returns a narrative answer with supporting numbers. Chris and George get answers in seconds without needing to learn report-building.

### 6.3 Scrap & Variance Anomaly Detection

**Problem:** Scrap thresholds are static (10% or 25 pieces). A pattern of scrap events across multiple similar jobs might not trip any single threshold but indicates a real problem.

**Solution:** Scheduled analysis (daily or weekly via n8n) that looks at scrap patterns across recent jobs, parts, and work centers. LLM flags anomalies for QC review with context and hypothesis ("scrap on material XYZ is elevated on laser #3 this week — possible nozzle issue"). Complements the static threshold alerting.

### 6.4 NCR Drafting from Shop Floor Observations

**Problem:** Operators and inspectors observe non-conforming conditions but writing a proper NCR is time-consuming, so it often doesn't happen or happens late.

**Solution:** Shop floor user records an observation — typed, voice-to-text, or photo — and the AI drafts a structured NCR with part, operation, description, proposed disposition. QC reviews and finalizes. Lowers the activation energy for quality reporting.

### 6.5 AI Governance

- All requests via LiteLLM gateway
- Contractual no-training agreements with upstream providers (Anthropic, etc.)
- Local model fallback (Ollama) for the most sensitive workflows
- Full audit log of every LLM interaction
- Cost caps and rate limiting enforced at the gateway
- PII/sensitive data scanning (Llama Guard) before requests leave the gateway

---

## 7. Data Model (high-level)

Core entities (ERPNext DocTypes, some customized):

| Entity | Source | Notes |
|---|---|---|
| Customer | ERPNext + CRM | Master list, RID-55 |
| Item | ERPNext | Parts, assemblies, sub-assemblies, raw materials |
| BOM | ERPNext | Multi-level with operations (routing) |
| Sales Order | ERPNext | Customer PO representation |
| Purchase Order | ERPNext | JWM's outbound POs to suppliers |
| Work Order | ERPNext | The "job" — drives production |
| Job Card | ERPNext | Operation-level execution = traveler row equivalent |
| Workstation | ERPNext | Work center with capacity config |
| Stock Entry | ERPNext | All inventory movements (receipts, issues, transfers, manufacture) |
| Quality Inspection | ERPNext | In-process inspections |
| Non-Conformance (custom) | Extension | NCR / SNCR / CAR workflow |
| RMA (custom) | New DocType | Customer returns with disposition flow |
| Overrun Allocation (custom) | New DocType | Overrun parts queue and disposition |

Division handling (processing vs architectural) is a field on Work Order with conditional UI and workflow rules. Same schema, different behavior.

---

## 8. Integrations

### 8.1 Epicor — scenario-dependent (open question)

Three scenarios, each with different scope:

| Scenario | Scope Impact | Recommendation Basis |
|---|---|---|
| **A. Retire Epicor entirely** | Highest — migrate all historical data, rebuild everything JWM uses in Epicor today | If JWM uses few Epicor modules beyond production |
| **B. Keep Epicor for specific modules** | Medium — build integration for each kept module, scope and direction of data flow per module | If some Epicor workflows (e.g., quoting) are embedded and hard to move |
| **C. Parallel run during transition** | Medium-high — temporary bidirectional sync for 3–6 months, then decommission | Lowest-risk cutover for a live business; most work upfront |

**Recommendation:** Scenario C if the business cannot tolerate a hard cutover. Scenario A if Chris is willing to commit to a clean break. Scenario B is rarely the right answer — it usually stalls at "keep some things" and never fully commits.

### 8.2 Spectrum — outbound

Production data that needs to flow into Spectrum for cost accounting and financial reporting:
- Completed work order costs (labor + material)
- Shipped orders for invoicing
- Material usage for job costing
- RMA credit memos

Direction: outbound from ERPNext, inbound to Spectrum.
Method: nightly batch initially (simpler, adequate for financial reporting), move to real-time if needed.
Implementation: n8n workflow polling ERPNext, calling Spectrum API (or file drop if Spectrum's API is limited).

### 8.3 Paycor — inbound

Labor hours by employee, work order, and work center for job costing.

Direction: inbound to ERPNext.
Method: daily pull from Paycor API or export file.
Implementation: n8n scheduled workflow.

### 8.4 Email — outbound

- NCR notifications to QC and suppliers (SNCRs)
- Shipping notifications to customers
- Shift schedule change notifications to affected operators
- Approval requests (engineering gate, recut/rework decisions)

Standard SMTP via ERPNext email queue, optionally routed through n8n for complex triggers.

---

## 9. Delivery Plan

All dates approximate. Firm schedule set post-Monday meeting and contract signing.

### Weeks 1–4 (22 April – 20 May): MVP Build

**Goal:** Demo-ready system with core production loop working on seeded data.

- Stand up ERPNext + Frappe CRM + n8n + LiteLLM + Paperless-ngx + Authentik on chosen infrastructure
- Configure standard operation codes, work centers, divisions
- Build custom NCR/CAR, RMA, Overrun DocTypes
- Build traveler PDF template with QR placeholder
- Seed with realistic test data: 5 customers, 10 BOMs across both divisions, 20 active work orders
- First two AI use cases live: estimate PDF → BOM, NL dashboard queries
- Baseline executive dashboard
- Paul-equivalent admin user demo flow working end-to-end

**Deliverable:** Live demo environment for Chris + Paul to use.

### Weeks 5–8 (20 May – 17 June): Real Data & Connectors

**Goal:** Real JWM data flowing, integrations live, UAT with Paul and one work center.

- Epicor data extraction and migration (per chosen scenario)
- Spectrum connector live in one direction (cost data)
- Paycor connector live (time data inbound)
- Real customer master imported
- Real active POs entered (first 20, then 50, then 100+)
- UAT with Paul for admin flows
- UAT with one work center (suggest flat laser or CNC — pick highest-volume)
- Refinement pass on traveler layout, dashboards, shop floor views

**Deliverable:** System running JWM data, one work center using it in parallel with Epicor.

### Weeks 9–12 (17 June – 15 July): Parallel Run & Rollout

**Goal:** All work centers live in parallel with Epicor. Matt transitions to remote from AU.

- Onboard remaining work centers one by one
- Quality team onboarded for NCR/CAR workflow
- Shipping onboarded
- Epicor stays live as fallback
- Daily reconciliation between systems during parallel run
- Matt departs for Australia 26 June; Frappe dev stays onsite, Matt remote architect + safety net

**Deliverable:** All work centers operating in the new system alongside Epicor.

### Weeks 13–16 (15 July – 12 August): Cutover & Stabilization

**Goal:** Epicor decommissioned (per scenario), full production cutover, stabilization.

- Cut over all order intake to ERPNext
- Decommission or archive Epicor (per scenario)
- Final dashboard and reporting refinement with Chris + George input
- Operational runbook documentation
- Training materials for new users

**Deliverable:** Production cutover complete, Epicor retired or parallel run ended.

### Post-launch

- Support retainer for ongoing operations (separate from build budget)
- Phase 2 scoping: automated inventory, Nextcloud, HA architecture, passwordless auth rollout

---

## 10. Commercial Model

### Pricing principle

Pricing is fixed-cost for delivered outcomes, not time-and-materials. Market-rate effort estimates appear here as reference points to frame value, not as billing basis. sovereign.ai's delivery leverages modern tooling (Claude Code, pre-built stack, proven architecture patterns) to move faster than traditional consulting, and that efficiency passes through as fixed-price certainty for JWM. Maintenance is included in every option — the work is "stand up and support as JWM scales to $100M," not "build and walk away."

**Market reference point.** An equivalent engagement delivered at traditional consulting rates runs approximately 850–1,200 hours at $180–250/hr, landing between **$150K and $300K** for Year 1 (excluding hosting). sovereign.ai delivers the same scope at a materially lower fixed price because our delivery model is structurally different.

### Engagement options

All four options cover the same Year 1 scope (full PRD Sections 4, 6, 8, 9, 11). The difference is cash-flow shape, infrastructure ownership, and commitment structure. Net total for Year 1 is broadly similar across options — JWM chooses what fits their finance posture.

**Option 1 — Self-hosted, fixed build with first year included**
- **$55,000 fixed**, covers Phase 1 build plus 12 months of maintenance, updates, and AI gateway operations
- JWM pays AWS directly for infrastructure
- Year 2 renewal: $20,000/year for ongoing maintenance and support
- Best for: JWM wants direct infrastructure ownership and predictable single upfront cost

**Option 2 — SaaS, all-inclusive monthly**
- **$5,000/month**, includes everything: build, hosting on sovereign.ai AWS, maintenance, AI gateway, support
- Year 1 total: $60,000
- Standard 12-month commitment, month-to-month thereafter
- Best for: JWM wants zero operational burden and predictable monthly OpEx

**Option 3 — Hybrid, lower upfront plus monthly ongoing**
- **$25,000 at kickoff**, then **$3,500/month** (includes hosting on sovereign.ai AWS, maintenance, AI gateway)
- Year 1 total: $67,000
- Cash-flow friendlier, combines defined build milestone with ongoing service
- Best for: JWM prefers spreading cost across the year

**Option 4 — Self-hosted, build plus quarterly maintenance**
- **$40,000 fixed build** plus **$5,000/quarter** for maintenance and support
- Year 1 total: $60,000
- JWM pays AWS directly
- Best for: JWM wants clear separation between build and ongoing support

### What's included in every option

- Full Phase 1 scope per PRD Section 4
- Architecture, implementation, and integration to Spectrum (outbound) and Paycor (inbound)
- Epicor data migration (scope per scenario confirmed Monday)
- AI gateway setup and first-year operations (LiteLLM, guardrails, audit logging)
- Training for Paul Roberts and shop-floor leads
- Operational runbooks
- 12 months of maintenance, minor enhancements, incident response
- Anthropic API usage for Phase 1 use cases (pass-through at cost, bundled to standard volumes)

### What's excluded

- Cloud hosting fees in Options 1 and 4 (JWM pays AWS directly)
- On-prem hardware if JWM elects that path (~$15–25K one-time)
- Phase 2 scope (PRD Section 15)
- LLM API usage beyond standard volume envelope (defined in agreement; unlikely to be hit at Phase 1 scope)
- Major scope expansions mid-build (addressed via change order, same consultative approach)

### Phase 2 and beyond

Follow-on engagements — full Nextcloud / Teams replacement, passwordless and biometric auth rollout, on-prem HA architecture, customer portal, automated inventory — priced separately when triggered. Each builds on the Phase 1 foundation without disruption.

---

## 11. Open Questions for Monday

These drive final scope, pricing, and architecture decisions. Ordered by impact.

1. **Epicor scenario.** On-prem or hosted? What modules does JWM actually use today beyond production? Plan for Epicor post-go-live: retire, keep something, parallel run?

2. **October deadline.** What does October actually represent to Chris? Archer's build-to-test gate, a fiscal decision, or something else? This anchors our timeline messaging.

3. **Spectrum integration depth.** Real-time or nightly batch acceptable? Is there a Spectrum API we can call, or is it file-based? Who owns the Spectrum side — Caitlin Moi?

4. **Shop floor devices.** How many concurrent shop floor users? BYOD phones/tablets, shared work-center terminals, or dedicated rugged tablets? This drives whether we need a custom kiosk UI or if native ERPNext Desk on tablets is sufficient.

5. **Hosting engagement model.** Self-hosted on JWM's AWS (Option A in Section 5.7) or SaaS on sovereign.ai-managed AWS (Option B)? Both are ready on our side; the question is JWM's preference for infrastructure ownership vs operational simplicity. On-prem alternative available if preferred.

6. **Data migration scope.** How many years of historical Epicor data needs to migrate? Full history or active-only?

7. **Authentication environment.** Microsoft 365 / Entra ID the source of truth for users? SSO preferred?

8. **Phase 2 appetite.** Is there interest in Nextcloud replacing Teams, on-prem HA, or passwordless/biometric rollout as follow-on engagements? Affects how we position the roadmap in the response.

9. **Support model.** What level of ongoing support does Chris expect? Office hours, 24/7, critical-only? Sets the retainer shape.

10. **Decision timeline.** When does Chris want to sign a contract? This drives how we pace between demo and formal acceptance.

---

## 12. Assumptions

Things we're assuming true in this draft. Validate or correct at Monday's meeting.

- JWM wants to retire or substantially reduce Epicor, not augment it.
- ERPNext's Work Order + Job Card paradigm is acceptable; JWM doesn't require the "horizontal department sheet" model Archer proposed.
- Standard ERPNext role-based permissions + custom shop floor views are acceptable; a native kiosk app is nice-to-have, not must-have, for Phase 1.
- Chris's $40–60K budget is a real working range, not a ceiling that requires cutting critical scope.
- JWM can choose between self-hosted (JWM AWS account or on-prem) and SaaS (sovereign.ai-managed AWS); both are delivery-ready on our side.
- Paul Roberts is available for 2–4 hours/week during MVP, 8–10 hours/week during UAT and parallel run.
- One work center can be the UAT pilot before wider rollout.
- Matt remote from AU post-26 June is acceptable to JWM if a named onsite developer is the day-to-day presence.

---

## 13. Success Criteria

Phase 1 is successful if, by 12 August 2026:

- All active POs are being managed in ERPNext, not Epicor.
- Paul builds travelers in under half the time it takes today.
- Shop floor uses the new system for daily work; Epicor is not being opened.
- Chris has a live dashboard he checks in the morning with real-time data.
- The AI gateway is handling ≥50 estimate-to-BOM imports, ≥100 NL dashboard queries, and has flagged ≥5 scrap anomalies since go-live.
- Spectrum receives cost data on a reliable nightly cycle.
- Paycor time data is landing in ERPNext for job costing visibility.
- NCR/CAR workflow is being used by QC.
- Zero data loss incidents during cutover.
- JWM's IT team (or designee) can perform basic admin tasks without sovereign.ai involvement.

---

## 14. Risks

Honest risks of our approach, with mitigation.

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| ERPNext paradigm shift confuses users accustomed to Epicor | Medium | Medium | Training, Paul as internal champion, gradual rollout work center by work center |
| Architectural division's late-binding BOM doesn't fit cleanly | Medium | Medium | Progressive Work Order releases, partial BOM pattern, design review with estimators |
| One-month MVP slips | Medium | Low (MVP isn't production) | Scope MVP to a vertical slice, not breadth |
| Matt unavailable post-Australia for critical issues | Low | High | Named on-ground Frappe dev, support retainer, documented runbooks, 24h Zoom availability during cutover |
| Epicor data migration has unexpected complexity | Medium | High | Scope the migration early (week 2–3), flag issues to Chris immediately, have a scenario-C fallback (parallel run) |
| Spectrum API is limited or non-existent, only file-based integration | Medium | Low | File-based integration via SFTP/folder drop is workable for nightly batches |
| Budget runs short | Low-medium | Medium | Weekly burn tracking, scope adjustments with Chris at week 4 milestone, Phase 2 deferral discipline |
| Shop floor user resistance | Medium | Medium | Pilot with one work center first, iterate UX, build champions within each team |
| Scrap thresholds / NCR workflows don't match incoming quality manager's preferences | High | Low | Configurable by design, not hardcoded; final calibration after they start |

---

## 15. Out of Scope (Phase 1)

Explicitly not included, available as Phase 2 or separate engagements:

- Nextcloud / Microsoft Teams replacement
- Passwordless / biometric authentication rollout
- On-prem HA across multiple JWM sites
- Automated inventory (back-flushing, auto-consumption, auto-reorder)
- Dynamic production roster and capacity management
- Customer portal
- Mobile-native shop floor app (native iOS/Android)
- Multi-site production (if JWM adds facilities)
- Advanced BI / data warehouse (ERPNext reports + NL queries are Phase 1)
- Full Spectrum bidirectional sync
- Replacement of Paycor
- Biometric time clocks
