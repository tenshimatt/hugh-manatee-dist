# JWM — End-to-End Business Workflow

> How JWM actually runs, and where our demo + proposed program fits every step.
> Written so Chris, Paul, Drew, or a new team member can pick it up cold.
> Paired with: [[FEATURES_WORKING]] (what clicks today), [[council/SYNTHESIS_v2|SYNTHESIS v2]] (the commercial arc), [[council/06-reference-architecture|Reference Architecture]].

---

## 1. How the business actually works

**JWM makes metal.** Two divisions that share the same shop floor but run on very different economics:

### Processing — the predictable side
- Make-to-print metal fabrication: laser-cut brackets, welded frames, press-brake formed parts
- Customers are commercial / industrial accounts (HVAC, automotive, equipment OEMs) — often repeat orders
- BOMs + routing are **fully known at intake**. Paul's team can estimate in an hour and release to shop same day.
- Quantities typically 50–500 per part. Margins on volume.
- Jobs flow: RFQ → Quote → Customer PO → Traveler → laser/brake/weld → QC → ship. Predictable.

### Architectural — the engineering-to-order side
- ACM panels, rainscreens, column covers, sunshades, feature stairs, facade systems
- Customers are **general contractors** on named construction projects (Music City Center, BNA, Google DC, Fifth + Broadway, LSU stadium, and so on — 20 live names on the jwmcd.com portfolio)
- BOMs + routing are **not finalised until engineering releases layouts**, sometimes days before shop release
- Quantities small (4 panels, 12 columns) — margins on complexity + installation
- Progress-billed against **AIA G702/G703** (industry standard construction invoice)
- Retention (5–10%) withheld until project sign-off
- Jobs flow: RFQ → Quote → Customer PO → **Engineering** → Released Traveler → all the workstations → QC → ship → install → punch list → retention released

Both divisions share: the same operators, workstations, QC process, inventory pool, and accounting ledger. Most of the demo treats them identically; the `jwm_division` custom field on Work Order + Sales Order flags each record so reports and dashboards slice correctly.

### Scale snapshot

- Revenue trajectory: **$30M → $100M** (growth phase)
- Active POs: **100–200 at any time**
- Active items: **10,000–20,000**
- Operations: **16,000–20,000 per year**
- Parts through the shop: **1M+ per year**
- Workstations: **12** — Flat Laser 1/2, CNC 1/2, Press Brake 1/2, Weld Bay A/B, Assembly 1, QC, Paint, Shipping
- Active people in the system: Chris (COO), George (leadership), Paul (Engineering/Quality Exec + internal admin), Drew (Master Scheduler + Inventory Control), Josh (Project Exec), Caitlin (Accounting, Spectrum owner), plus estimators, planners, work-center leads, operators, QC, shipping.

### Current systems (today)

| Area | Today | Phase 1 goal | Full program goal |
|---|---|---|---|
| Production tracking | Epicor (being replaced) | ERPNext + jwm_mfg | Full Epicor exit by 2027-03 |
| Financial accounting | Viewpoint Spectrum (construction ERP) | Kept, outbound feed from ERPNext | **Kept** — replacement is optional Phase 5 |
| Time / payroll | Paycor | Kept, inbound to ERPNext | Kept |
| Collaboration | Microsoft Teams | Kept | Kept (out of scope) |
| **Hand-rolled MES** | **Excel** — 80 sheets, 177 max columns, 2.5 years of schedule data, baked-in Epicor workarounds | Gone — absorbed into ERPNext + shell | Gone |

The Excel sprawl is the hidden headline. JWM is already running a shadow MES on top of Epicor because Epicor can't give them what they need. Replacing Epicor is really replacing "Epicor plus Excel-on-Epicor" — the latter is 10× more operationally load-bearing than the former.

---

## 2. The end-to-end flow (lead → cash → retention released)

```
     ┌──────────────────── LEAD ────────────────────┐
     │ GC inquiry · direct customer · repeat order   │
     └──────────────────────┬────────────────────────┘
                            │
              ┌─────────────▼─────────────┐
              │  1. RFQ + estimate intake │ ← estimator receives PDFs/drawings
              └──────────────┬────────────┘
                             │
                ┌────────────▼────────────┐
                │ 2. BOM extraction + draft│ ← **AI Estimator (LIVE NOW)**
                │    traveler (Paul)       │   PDF drop → Claude → BOM tree
                └────────────┬────────────┘
                             │
                    ┌────────▼────────┐
                    │ 3. Quotation    │ ← Phase 3 — Frappe CRM / ERPNext Quotation
                    │    to customer  │
                    └────────┬────────┘
                             │
                             ▼ WON
                    ┌─────────────────┐
                    │ 4. Sales Order  │ ← ERPNext Sales Order (+ jwm_division)
                    │ (customer PO)   │
                    └────────┬────────┘
                             │
               ┌─────────────▼─────────────┐
               │ 5. Engineering gate       │ ← **Architectural only**
               │    (finalise BOM/routing) │    Paul's approval on shortened dates
               └─────────────┬─────────────┘
                             │
              ┌──────────────▼──────────────┐
              │ 6. Work Order release       │ ← ERPNext Work Order (LIVE NOW)
              │    (scheduler + Drew)       │   jwm_baseline_date + jwm_revised_date
              └──────────────┬──────────────┘
                             │
            ┌────────────────▼───────────────┐
            │ 7. Material planning           │ ← Phase 2: Material Request,
            │    + Purchase Orders           │   Purchase Order, Subcontract Order
            │    + Subcontract Orders        │
            └────────────────┬───────────────┘
                             │
                    ┌────────▼────────┐
                    │ 8. Receiving    │ ← Phase 2: Purchase Receipt + QA inspection
                    └────────┬────────┘
                             │
       ┌─────────────────────▼─────────────────────┐
       │ 9. Production across 12 workstations      │
       │   Laser 1/2 → Brake 1/2 → Weld A/B →      │
       │   Assembly 1 → QC → Paint → Shipping      │
       │   Each op = ERPNext Job Card (LIVE NOW)   │
       │   Shop Floor kiosk UI (LIVE NOW)          │
       │   + voice NCR (LIVE NOW)                  │
       └─────────────────────┬─────────────────────┘
                             │
                  ┌──────────▼──────────┐
                  │ 10. Quality events  │ ← LIVE NOW
                  │   scrap tracking    │   AI anomaly detection
                  │   NCR / CAR / RMA   │   QC inbox
                  │   overrun alloc     │
                  └──────────┬──────────┘
                             │
                    ┌────────▼────────┐
                    │ 11. Shipping    │ ← ERPNext Delivery Note + Pack List
                    │   dispatch      │   Phase 3: EasyPost carrier integration
                    └────────┬────────┘
                             │
          ┌──────────────────▼──────────────────┐
          │ 12. Invoicing                       │ ← ERPNext Sales Invoice
          │   • Processing: normal invoice      │   Phase 3: Avalara tax
          │   • Architectural: AIA G702/G703    │   Custom print format
          │     + retention hold                │
          └──────────────────┬──────────────────┘
                             │
                 ┌───────────▼───────────┐
                 │ 13. Customer payment  │ ← ERPNext Payment Entry
                 │    receipt            │
                 └───────────┬───────────┘
                             │
               ┌─────────────▼─────────────┐
               │ 14. Accounting            │ ← **SPECTRUM** (Year 1)
               │    GL / AR / AP / month   │   nightly outbound feed from ERPNext
               │    close                  │   Phase 5 optional: move to ERPNext Accounting
               └─────────────┬─────────────┘
                             │
                    ┌────────▼────────┐ Architectural only
                    │ 15. Retention   │ ← Phase 3 — Payment Entry with retention hold
                    │    released on  │
                    │    punch list   │
                    └─────────────────┘
```

---

## 3. Step-by-step mapping to what we've built + what's coming

### Step 1 — Lead / RFQ intake

| | |
|---|---|
| What happens | Estimator receives a customer RFQ — PDF, drawings, email attachments |
| System | Email today + Paperless-ngx for OCR archival (Phase 1) |
| Who | Paul / estimators |
| Built? | Paperless-ngx already at Beyond Pandora (CT not fully wired yet for JWM) |
| Phase | Phase 1 complete for storage; Phase 3 adds Frappe CRM Opportunity record |

### Step 2 — BOM extraction + draft traveler (the hero moment of the demo)

| | |
|---|---|
| What happens | PDF estimate dropped onto the Estimator screen. AI extracts 20–30 line-items, assemblies, quantities, materials, finishes, pricing, grand total. Reviewer edits and releases. |
| System | **Next.js shell `/estimator`** + **LiteLLM → Claude Sonnet 4.6** + **pdf-parse** |
| Who | Paul / estimators |
| Built? | **LIVE NOW at `https://jwm-demo.beyondpandora.com/estimator`.** All 3 sample PDFs extract to exact grand totals (~$115K, $26K, $140K respectively). |
| Latency | 30–45 seconds per PDF |
| Today at JWM | 3+ hours of manual re-keying per estimate into Epicor |
| Phase | Phase 1 (done) |

### Step 3 — Quotation to customer

| | |
|---|---|
| What happens | Estimator sends formal quote (with terms, lead time, acceptance window) |
| System | **Phase 3**: ERPNext Quotation DocType + custom JWM-branded print format + Frappe CRM opportunity tracking |
| Who | Estimators / planners |
| Built? | Not yet — Phase 3 work |
| Interim | JWM continues current quoting process (likely Excel + email) |

### Step 4 — Sales Order

| | |
|---|---|
| What happens | Customer PO received. Creates a Sales Order with division flag (Processing / Architectural / Mixed), baseline + revised dates, line items. |
| System | **ERPNext Sales Order** DocType, with custom fields: `jwm_division`, `jwm_project_traveler` |
| Built? | Custom fields live in Phase 1 site. Full Sales Order UI = Phase 3. |
| Phase | Phase 3 (Sales + Customer + Quoting) |

### Step 5 — Engineering gate (architectural only)

| | |
|---|---|
| What happens | For architectural jobs, engineering finalises BOM + routing **after** Sales Order is booked. If customer shortens dates, engineering approval is required before reschedule. |
| System | Custom workflow on Work Order (approval required when `jwm_revised_date < jwm_baseline_date` by more than X days) |
| Who | Paul |
| Built? | Workflow skeleton live; full approval gate = Phase 2 tune-up |
| Why it matters | This is the ETO late-binding pattern that Archer's Smartsheet design can't handle cleanly |

### Step 6 — Work Order release

| | |
|---|---|
| What happens | Scheduler (Drew) releases the Work Order. All downstream Job Cards generated across workstations based on BOM routing. |
| System | **ERPNext Work Order** DocType triggering **Job Card** creation per Operation |
| Who | Drew Adams |
| Built? | **LIVE NOW.** 20 Work Orders seeded, 7 Job Cards flowing, routing timeline renders in planner UI at `/planner/[wo]`. |
| Traveler PDF | Custom JWM-branded print format with logo + QR placeholder + signature boxes — **LIVE NOW.** |

### Step 7 — Material planning + Purchase Orders (including Subcontracting)

| | |
|---|---|
| What happens | Drew's world. What's in stock? What needs buying? What needs subcontracting (plating, specialty coatings, operations JWM doesn't do in-house)? |
| System | **Phase 2**: ERPNext Material Request + Purchase Order + **Subcontracting Order** + Supplier Quotation |
| Who | Drew + Paul + Caitlin (vendor invoices) |
| Built? | **Not yet — biggest Phase 2 workstream.** |
| Today at JWM | Excel supplier tabs (AAA / AZZ / TGS / COLBERT / DACODA / GLC) + "Missed Outsource Receipts" tab — because Epicor's subcontracting module is not meeting their needs. |
| Why this is Phase 2 (not 3) | Drew owns this. Drew is the hidden decision-maker. Phase 2 = Drew's win = political lock-in before Archer re-competes. |

### Step 8 — Receiving

| | |
|---|---|
| What happens | Material or subcontracted parts arrive. QA inspection on arrival. Receipt into stock. |
| System | **Phase 2**: ERPNext Purchase Receipt + Quality Inspection (Incoming). |
| Built? | Phase 2. |
| Today | Drew / receiving clerk manually reconciles against PO — "Missed Outsource Receipts" tab proves this is error-prone. |

### Step 9 — Production across 12 workstations (the shop floor)

| | |
|---|---|
| What happens | Operator sees their queue, picks a Job Card, starts it, records completed quantity + scrap, submits. |
| System | **Next.js shell `/shop/[workstation]`** kiosk UI per workstation + **ERPNext Job Card** backend |
| Who | Operators at Flat Laser 1/2, CNC 1/2, Press Brake 1/2, Weld Bay A/B, Assembly, QC, Paint, Shipping |
| Built? | **LIVE NOW.** Tablet-sized buttons, big Start/Complete/Report Issue, live data from ERPNext. |
| AI | **Voice NCR composer** embedded — operator speaks a defect observation, Claude drafts a structured NCR (title, severity, category, disposition, quarantine qty, hypothesis). |

### Step 10 — Quality, scrap, NCR / CAR / RMA / overrun

| | |
|---|---|
| What happens | Scrap events, non-conformance reports, corrective actions, returns from customers, overruns allocated to future orders or stock. |
| System | **Custom DocTypes in `jwm_manufacturing` app** — NCR, JWM CAR, RMA, JWM Overrun Allocation. All linked back to Work Order / Job Card / Item. |
| Built? | **LIVE NOW.** 3 seeded NCRs, 3 CARs, 2 RMAs, 4 overruns, 26 scrap Stock Entries with Flat Laser 2 pattern cluster. |
| AI | **Scrap anomaly detection** — scheduled job analyses recent Stock Entries tagged with `jwm_workstation`, passes to Claude, returns pattern alerts (e.g. "kerf drift on Flat Laser 2, 3 parts affected this week — nozzle wear hypothesis"). Card shows on executive dashboard. |
| Drew's 6 KPIs | Efficiency by operation / material / operator, est-vs-actual, part performance history — all derivable from this layer. **Bundled into Phase 1 at no price change** via new `Efficiency Event` DocType + 3 Frappe Insights charts + 1 report. |

### Step 11 — Shipping

| | |
|---|---|
| What happens | Completed goods packed, manifested, shipped or ready for customer pickup. |
| System | **ERPNext Delivery Note + Packing Slip.** **Phase 3: EasyPost integration** for carrier labels (UPS / FedEx / LTL rate shop). |
| Built? | Core Delivery Note = Phase 3. Custom print format = Phase 3. EasyPost = Phase 3. |
| On-time measure | Compares actual ready-to-ship date to `jwm_baseline_date` (the locked promise date) — **not** to customer pickup. If customer is late collecting, JWM is not penalised. |

### Step 12 — Invoicing (the construction nuance)

| | |
|---|---|
| What happens | Sales Invoice generated. Processing jobs = normal invoice. Architectural jobs = AIA G702/G703 progress billing with Schedule of Values + retention percentage withheld. |
| System | **ERPNext Sales Invoice** + custom AIA print format + retention tracking fields |
| Who | Caitlin Moi (Accounting) |
| Built? | Not yet. **Phase 3** for normal invoicing; AIA + retention is custom print format on top (~10–15 dev-days). |
| Tax | **Phase 3: Avalara or TaxJar** for multi-state sales tax calculation. $1.5–5K/yr SaaS depending on vendor. |
| Year 1 financial truth | Spectrum is still the system of record. ERPNext ships the invoice data via nightly feed (or file drop) to Spectrum. Caitlin's month-close stays in Spectrum. |

### Step 13 — Customer payment

| | |
|---|---|
| What happens | Customer pays. Processing jobs usually Net 30. Architectural jobs often partial against progress bills + 5–10% retention withheld. |
| System | **ERPNext Payment Entry** (+ retention hold pattern for architectural). Or directly in Spectrum during Year 1 with ERPNext receiving the reconciled status. |
| Built? | Phase 3 base + Phase 4 reconciliation against Spectrum. |

### Step 14 — Accounting (Spectrum, Year 1)

| | |
|---|---|
| What happens | GL entries, month close, financial reports, tax returns, bank reconciliation. Caitlin Moi's shop. |
| System | **Viewpoint Spectrum stays through Year 1.** ERPNext feeds it nightly (or real-time in Phase 4). |
| Built? | Nightly feed from ERPNext = Phase 3/4 work. |
| Phase 5 option | Migrate entirely to ERPNext Accounting. ~$60–100K fixed. Recurring savings $150–300K/yr Spectrum license + simpler single audit trail. Chris decides at Phase 4 close based on Caitlin's comfort. |

### Step 15 — Retention released (architectural only)

| | |
|---|---|
| What happens | After project punch list sign-off, customer releases the 5–10% retention held since progress billing. |
| System | ERPNext Payment Entry referencing the held retention balance on the original Sales Invoice. |
| Built? | Phase 3 (retention tracking) + Phase 4 (release workflow + Spectrum reconciliation). |

---

## 4. Cross-cutting layers (not in the linear flow)

### Executive dashboards
- **Chris's morning dashboard:** on-time delivery %, active WOs, scrap rate 30d, open NCRs — all live from ERPNext via the shell's `/api/kpis` endpoint.
- **Division mix donut** — Processing vs Architectural by active WO value.
- **Weekly completed vs scheduled** — burn-down chart.
- **Anomaly card** — red/amber alert surfacing AI-detected patterns.
- **Recent activity feed** — WO released, NCR raised, WO complete, RMA created, etc.
- Built? **LIVE NOW** on `/dashboard`.
- Phase 3 adds: Frappe Insights for deeper exec analytics + Chris-configurable reports.

### Ask John (AI chat)
- Anywhere in the shell: "Which architectural jobs are at risk this week?" → Claude reads live context (KPIs, top 10 WOs, NCRs) → streams back narrative answer + tables + spoken response via ElevenLabs.
- Used by Chris for daily check-ins, by Paul for exception investigation.
- Built? **LIVE NOW.** Chris can type or speak; John answers back in voice.

### Anomaly detection
- Scheduled n8n job pulls recent scrap Stock Entries, passes to Claude, gets back pattern analysis.
- Currently catches the Flat Laser 2 kerf-drift cluster (seeded for demo).
- Built? **LIVE NOW.**

### Identity / SSO
- Authentik OIDC across everything. Demo users provisioned: Chris Ball, Mark Slingsby, Asaf Shaked.
- Passkey enrolment flow available at `auth.beyondpandora.com/if/user/#/settings`.
- Built? **LIVE NOW.**

### Document management
- Paperless-ngx for OCR on inbound PDFs (estimates, drawings, customer POs, supplier receipts).
- Feeds into the AI estimator pipeline.
- Built? Paperless exists in Beyond Pandora infra; JWM-specific wiring = Phase 2.

---

## 5. What this means for Monday

**What Chris will see** in the 12-minute demo covers Steps 2 + 6 + 9 + 10 + (cross-cutting) Dashboard + John + Anomaly. Those are the screens he'll remember.

**What Chris won't see** yet — and where the $165K program spends its dollars:
- **Phase 2** (Steps 7 + 8) — Inventory + Subcontracting + Purchasing. The single biggest workstream because it's where Epicor + Excel are failing JWM hardest.
- **Phase 3** (Steps 3 + 4 + 11 + 12) — Sales + Customer + Quoting + Shipping + Invoicing. Includes Frappe CRM + Frappe Insights.
- **Phase 4** (Steps 13 + 14 reconciliation) — Parallel-run validation + Epicor decommission + Paul's admin handoff.
- **Phase 5 optional** (Step 14 full) — Spectrum replacement.

---

## 6. One-page mental model

- **JWM makes metal for two customer types** (GC construction customers + commercial/industrial direct).
- **Their production system lives in Epicor + 80 sheets of Excel** — we replace both.
- **Spectrum stays for accounting** Year 1; replacement is a Phase 5 option.
- **Paycor stays for payroll** — out of scope.
- **Microsoft Teams stays for collaboration** — out of scope.
- **The everyday UI is the Next.js shell we built** — Dashboard, Estimator, Planner, Shop Floor, QC.
- **ERPNext Desk is for admins** — Paul does daily admin, Caitlin handles finance once Phase 5 triggers.
- **AI (Claude via LiteLLM) is embedded** at 4 specific moments: estimate extraction, anomaly detection, NCR drafting, exec chat.
- **Identity is Authentik SSO** — ready for passwordless rollout in Phase 2.
- **The program is $165K + $25K contingency over 11 months** — full Epicor retirement by 2027-03.

---

Linked: [[FEATURES_WORKING]] · [[DEMO_GUIDE]] · [[JWM_Production_System_PRD_v0.2]] · [[PRD_ADDENDUM_built_state]] · [[STACK_INVENTORY]] · [[council/SYNTHESIS_v2]] · [[council/06-reference-architecture]]
