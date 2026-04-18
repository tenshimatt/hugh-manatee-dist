# Council Seat 3 — Epicor Replacement Scope Architect

**Author:** Seat 3
**Date:** 2026-04-17
**Status:** Decisive scope input for Seat 4 pricing
**Companion docs:** [[JWM_Production_System_PRD_v0.2]] · [[PRD_ADDENDUM_built_state]] · [[STACK_INVENTORY]]

---

## TL;DR

JWM runs Epicor as a full manufacturing ERP, not just a shop-floor tracker. Financials left (Spectrum) and payroll left (Paycor), but **everything else** — quoting, estimating, sales orders, BOMs, routings, jobs, purchasing, subcontracting, inventory, shipping, customer master, supplier master, job costing, quality — is still there, and poorly enough that the shop has spilled 40+ sheets of Excel around it to compensate (`1010 A shop Production Schedule.xlsx` has 20 tabs; `1040 T Shop Production Schedule.xlsx` has 42 tabs including Subcontract Status, Open PO, Scheduled Shipments, Inventory, and per-supplier tabs).

The Daily Efficiency Log literally contains the phrase **"information pulled from Epicor"** next to rows where Excel had to reconcile what Epicor couldn't report on. That's the tell: Epicor is the system of record, not the system of work.

**Recommended approach:** ERPNext can absorb the entire remaining Epicor footprint in **3 phases across 9 months post-Phase 1**, delivered as an extension of the Phase 1 engagement that's already built and demoable. Total incremental effort **~165–210 developer-days** beyond Phase 1 (Phase 1 production layer = ~60 days already committed). No module requires a platform change; all gaps are custom DocTypes, scripts, or integrations on the stack already standing.

Total JWM program (Phase 1 + full Epicor retirement): **~225–270 developer-days**, **$165K–$240K** at sovereign.ai fixed-price delivery, full cutover by **end of Q1 2027** (conservative) or **Q4 2026** (aggressive, if Phase 1 goes per plan).

---

## 1. JWM's Epicor footprint (inferred)

Evidence base: Drew Adams's title, email thread questions, Archer's RID list, the Excel spreadsheet tabs, JWM's business shape ($30M→$100M metal fabricator, dual division, subcontracting heavily, 100–200 POs concurrent).

| Epicor area | Evidence JWM uses it | Confirmed? |
|---|---|---|
| **Sales Management — Quoting & Estimating** | Archer D-02a references "estimate-to-traveler data flow", PRD §4.1 "import from estimate documents". Estimators are a named persona. No separate estimating tool mentioned. | **YES — Heavy** |
| **Sales Order / PO intake** | "100-200 active POs" (RID-30). Master customer list (RID-55). Sales orders are the project container in Archer's design. | **YES — Heavy** |
| **Customer Master (CRM-lite)** | RID-55, strategic customer flagging, addresses attached to jobs (TN Titans Stadium, RS Gass State Lab, Med Center Health visible in Excel). | **YES — Heavy** |
| **Supplier / Vendor Master** | Spreadsheet has dedicated tabs per supplier: AAA, AZZ, TGS, COLBERT, DACODA, GLC. Subcontract Status Report is supplier-organized. | **YES — Heavy** |
| **Production Management — Jobs, Routings, BOMs** | Archer's entire Phase 1 scope. 16–20K operation instances (RID-29). Multi-level BOM (RID-45). | **YES — Heavy** |
| **Material Management — Inventory** | RID-6, 14, 16, 17, 19, 24, 25, 38. Three categories (stock, order-specific, customer-provided). T-Shop spreadsheet has INVENTORY tab. | **YES — Heavy** |
| **Purchasing** | "Open PO Report" tab, "Purchasing and Receiving" (RID-17), job-specific procurement with allocation codes. | **YES — Heavy** |
| **Subcontracting / Outsourced Ops** | "SUBCONTRACT STATUS REPORT", "SHIPMENT TO SUBCONTRACTOR", "Missed Outsource Receipts" tabs. RID-52. | **YES — Heavy** (and currently painful — hence the tracking spreadsheet) |
| **Shipping & Manifest** | "SHIPPING SCHEDULE", "SCHEDULED SHIPMENTS REPORT", "Ship Schedule" tabs. RID-53. Crating plan columns. Shipping method field. | **YES — Medium** (shipping is logged but not manifested; no carrier integration visible) |
| **Quality Management** | RID-51 NCR/SNCR/CAR, RID-20/35 scrap. QA tab in T-Shop spreadsheet. | **YES — Medium** (thin usage — Archer notes the "incoming quality manager" will define) |
| **Job Costing** | Collin's email question: "Estimated v. actual for both material and labor" — they want this and Epicor clearly isn't delivering it well. Drew is "Master Scheduler / Inventory Control" — he owns the data, not Finance. | **YES — Heavy (need) / Light (actual Epicor use)** — big gap to close |
| **Project Management** | Josh McPherson is "Project Executive". Jobs organized by project (24051 Titans Stadium is a mega-project with dozens of releases FS200/FS201/FS205…). | **YES — Medium** — project hierarchy is implicit in Epicor job numbering but not managed as projects |
| **Engineering Change / Revision Control** | RID-7 Engineering Approval Gate, revision control on parts/BOMs. Mentioned in PRD §4.1. | **YES — Light** — revisions happen but there's no formal ECO workflow |
| **CRM — Leads, Opportunities, Pipeline** | Not mentioned anywhere. Growth to $100M implies they need this. | **PROBABLY NOT in Epicor** — likely outside the system entirely (Teams/email/tribal) |
| **Service Management / Field Service** | Not a service business — they ship metal to customer sites. | **NO** |
| **Fixed Assets** | Not in email/spreadsheet evidence. Belongs in Spectrum anyway. | **NO (in Spectrum)** |
| **Financials (GL, AP, AR, Bank)** | Already moved to Spectrum. | **NO — already out** |
| **Payroll / HR / Time** | Already moved to Paycor. Labor hours for job costing come FROM Paycor. | **NO — already out** |

**Modules JWM uses in Epicor today (the replacement target):**
Sales (Quote/Estimate/SO), Customer Master, Supplier Master, BOM, Routing, Job/WO, Job Card/Labor Entry, Purchasing, Subcontracting, Receiving, Inventory, Shipping, Quality (thin), Job Costing (thin).

---

## 2. Module-by-module replacement map

"Effort" is sovereign.ai delivery days (blended senior dev + Matt architecture). Traditional consulting equivalent is ~2–3× these numbers at $180–250/hr.

| Epicor module | JWM intensity | ERPNext native fit | Gap / custom work | Risk | Effort (days) |
|---|---|---|---|---|---|
| **Quoting / Estimating** | Heavy | **Partial** — ERPNext has `Quotation` DocType with items, pricing, tax, validity. Missing: multi-level estimated BOMs with routing at quote time, yield/nesting, scrap allowance. | Extend `Quotation` with `Estimated BOM` child table and operation estimates. Wire the Phase 1 AI estimate-extract flow directly into `Quotation` creation. Custom print format. | **M** — JWM's estimators have tribal Excel templates we'll need to mine. | 10–14 |
| **Sales Order** | Heavy | **Strong** — `Sales Order` native. Delivery schedule, partial shipments, SO→WO conversion all standard. | Custom fields: `jwm_division`, release structure (one SO = multiple releases = multiple WOs, per Titans Stadium pattern). Custom linkage SO→Project→multiple WOs. Already partially built in Phase 1 demo. | **L** | 5–8 |
| **Customer Master** | Heavy | **Strong** — already seeded in demo with 8 real customers + `jwm_customer_tier`. | Migration + cleanup (dedup Epicor customer list; standardize naming per RID-55). | **L** | 4–6 (mostly migration) |
| **Supplier Master** | Heavy | **Strong** — `Supplier` native with address, contacts, item defaults, tax. | Migration. Add `jwm_supplier_type` (raw material / subcontract / services). Subcontract operations link. | **L** | 4–6 |
| **BOM / Routing** | Heavy | **Strong** — `BOM` native, multi-level, with operations, scrap %, workstation rates. Already demoed. | Custom field for customer-provided vs JWM stock material flag per line. Revision workflow. Template/copy-from-previous-BOM helpers. | **L** — Phase 1 already covers | 6–10 |
| **Work Order / Job** | Heavy | **Strong** — `Work Order` + `Job Card`. Fully demoed. | Division handling, baseline/revised dates, release-level linkage. Already in `jwm_manufacturing` app. | **L** — Phase 1 complete | (in Phase 1) |
| **Shop Floor Execution / Labor** | Heavy | **Strong** — `Job Card` with time logs, operator assignment, scrap. | Role-based kiosk view per workstation (built). Voice NCR (built). Paycor time data flows into Job Cards via n8n. | **L** — Phase 1 covers | (in Phase 1) |
| **Purchasing** | Heavy | **Strong** — `Material Request → Purchase Order → Purchase Receipt → Purchase Invoice` chain. Job-linked POs native. | `jwm_allocation_code` custom field (dept/customer/project per RID-25). Auto-reorder rules (Phase 2 per Archer exclusion — we include in Phase 3 here). | **L** | 8–12 |
| **Subcontracting** | Heavy | **Strong** — ERPNext has full `Subcontracting Order` with outsourced BOM operations, "Supplied Items" tracking, and return receipt. This is a gap Archer handwaves. | Tie to Work Order operations flagged as outsourced. Custom "Missed Outsource Receipts" exception report. Notification workflow for overdue returns. | **M** — subcontracting accounting interplay with Spectrum needs design | 10–14 |
| **Receiving** | Heavy | **Strong** — `Purchase Receipt` native with QC inspection gate. | Source-flag (vendor / stock / customer-provided) on receipt. Cross-contamination rule enforcement. | **L** | 5–7 |
| **Inventory (perpetual)** | Heavy | **Strong** — `Stock Entry`, `Stock Ledger`, `Bin` per warehouse. Phase 1 is visibility-only per Archer; we commit to **perpetual** in Phase 3. | Three-category inventory (stock / order-specific / customer-provided) via warehouse hierarchy or custom `inventory_category` field. Back-flushing from Job Card completions. Min/max reorder triggers. Cycle count workflow. | **M** — this is where Archer punted. Real perpetual inventory on ~10–20K SKUs needs discipline, barcode scanning, physical process change. | 20–30 |
| **Shipping & Manifest** | Medium | **Moderate** — `Delivery Note` native with packing, multi-box, shipping rule, tracking #. | Crating plan (multi-crate per shipment, skid counts — spreadsheet has these columns). Carrier integration (see §3). Ready-to-Ship queue dashboard. Partial shipment handling. | **M** — carrier integration is net-new (Epicor doesn't seem to be integrated either; they ship "Hot Shot" and "Customer Pick Up" per the data). | 8–12 |
| **Quality — NCR/CAR/SNCR** | Medium | **Partial** — ERPNext has `Quality Inspection`, `Quality Goal`, `Quality Procedure`, `Quality Action`. We already built custom `JWM NCR`, `JWM CAR`, `RMA` in Phase 1. | Extend to SNCR (supplier-directed), link to Subcontracting PO. Customer NCR intake flow. Scrap threshold notifications per RID-20. Overrun allocation (built). | **L** — Phase 1 foundation | 4–6 (incremental over Phase 1) |
| **Job Costing** | Heavy need / Light current use | **Strong** — ERPNext auto-rolls Job Card labor + Stock Entry material into Work Order cost. Estimated-vs-actual variance is native. | Pull Paycor hours into Job Card actual time (n8n, Phase 1 skeleton). Rate tables per workstation/shift. Division-level cost rollup. Post cost to Spectrum GL via job-cost summary. Part performance history report (Collin's ask). | **M** — the "estimated vs actual" that Collin asked for is real work and real value. Current Epicor delivery on this is weak per the Daily Efficiency Log evidence. | 12–18 |
| **Project Management** | Medium | **Strong** — `Project` native with tasks, timesheets, cost tracking. Multiple Work Orders link to one Project. | Custom `project_type` (Processing vs Architectural). Release tracking (Titans 24051 has 30+ releases as sub-projects). PM dashboard per Josh McPherson. | **L** | 6–10 |
| **Engineering Change / Revision** | Light | **Partial** — ERPNext has `BOM` versioning. No formal ECO DocType. | Custom `Engineering Change Order` DocType with approval workflow (feeds RID-7 gate). Versioned drawing attachments. | **L** | 6–8 |
| **Master Data Mgmt / Item Master** | Heavy | **Strong** — `Item`, `UOM`, `Item Group` native. 15 items seeded in demo. | Migration of 10–20K items. Item naming standards. Item-supplier cross reference. | **M** — item master migration is always the biggest pain in any ERP cutover. | 15–25 (migration heavy) |

**Total incremental effort beyond Phase 1 production layer: 123–186 days + 20–30 days for item master migration + 20–25 days for integration/cutover orchestration = ~165–240 days.**

---

## 3. Integration touchpoints

Scoped:
- **Spectrum** — outbound: invoice lines from Delivery Notes, job cost summaries, RMA credit memos. **New in this expanded scope:** AP invoice feed from Purchase Invoices (currently Spectrum-only; we need to decide if AP moves to ERPNext and posts to Spectrum, or stays in Spectrum entered manually). **Recommendation: ERPNext owns Purchase Invoice, posts summary AP journal to Spectrum nightly.** ~8 days.
- **Paycor** — inbound: hours by employee/work order/cost center to Job Card actuals. Phase 1 skeleton. Production-hardened here. ~4 days.

Not yet scoped, surfaced by this exercise:

| Integration | Evidence / Need | Recommendation | Effort |
|---|---|---|---|
| **Shipping carriers (UPS/FedEx/LTL/Hot Shot)** | Spreadsheet "Shipping Method" column has "Hot Shot", "Customer Pick Up", "In House". Big architectural shipments to sites are LTL/flatbed. No carrier label printing visible. | EasyPost or ShipStation integration for small parcel. Manual BOL generation + rate shop for LTL (EasyPost covers this too). Customer pickup workflow (no carrier). | 8–10 |
| **Tax engine (Avalara)** | Construction-adjacent customer base means exemption certs, multi-state jobs. Spectrum probably handles final tax but ERPNext invoices need to be right. | Avalara AvaTax via Frappe's tax plugin (exists in community). Pull exemption cert from customer record. | 5–7 |
| **Credit card / ACH processing** | Likely not — B2B, net 30/60. Spectrum owns payment receipts. | **Skip.** Let Spectrum own AR receipts. | 0 |
| **Bank reconciliation feeds** | Spectrum's job. | **Skip — in Spectrum.** | 0 |
| **EDI with customers (ASN, PO, Invoice)** | Strategic customers (Disney, LSU, Vanderbilt, Titans) — some likely want EDI for POs and ASNs. Not visible in spreadsheets yet but at $100M scale this WILL come up. | Scope as Phase 4 optional — OpenEDI or SPS Commerce integration via n8n. Not in base quote. | +10–15 (optional) |
| **EDI with suppliers** | No evidence. Skip. | **Skip.** | 0 |
| **CAD/CAM (SolidWorks / Inventor / AXYZ / laser nesters)** | AXYZ machines visible in spreadsheet sheets (AXYZ Titans CNC Schedule, AXYZ CNC Schedule). "Prog By" columns (AXYZ Prog By, Laser Prog By, Punch Prog By). Nesting is an explicit requirement (RID-8 batching/splitting for yield). | **In-scope:** one-way file drop integration — CAD/CAM outputs a part list + program file → ERPNext Item Master via n8n watcher. Nesting stays in the dedicated nesting software but nest IDs round-trip to Work Order for traceability. | 8–12 |
| **Customer portal (NCR submission, order status)** | Not scoped Phase 1. $100M scale will need it. | **Phase 5 / separate engagement.** Frappe has portal framework built-in. | 15–20 (future) |
| **Scanning / label printing (Zebra, etc.)** | QR placeholder on traveler. Future barcode scanning on shop floor for job card updates and inventory moves. | **Include in Phase 3 inventory cutover** — Zebra ZPL templates + scan-to-Job-Card web handler. | 6–8 |

---

## 4. Data migration scope

### Master data volumes (inferred from Archer discovery)

| Entity | Estimated count | Approach |
|---|---|---|
| Customers | ~500–2,000 active | CSV export from Epicor, dedup/clean, import via Frappe DMT (Data Import Tool). Standardize naming per RID-55 during migration. |
| Suppliers | ~200–500 | Same — CSV + clean + DMT. |
| Items (parts + raw mat + subassemblies) | **~15,000–30,000** (RID-29 says 16–20K operational instances, so item master likely 2–3× that given variants and historical) | Largest lift. Epicor REST API or direct DB extract (Epicor is on SQL Server). Staged import: active items first, historical archive-only. Manual curation of duplicates. **This is 15–25 days on its own.** |
| BOMs | ~3,000–8,000 active | Epicor API extract of BOM headers + lines + operations. Custom ETL to ERPNext BOM format. Revision history preserved as `is_default=0` versions. |
| Workstations | 12–20 | Already seeded (12). Trivial. |
| Open Sales Orders | ~100–200 | Freeze Epicor, snapshot, import as open SOs at cutover. **Cutover weekend work.** |
| Open Purchase Orders | ~100–300 | Same pattern. Subcontracting POs need special handling (link back to WO operations). |
| Open Work Orders | ~200–500 | Cutover snapshot. In-flight operations get current status imported; completed operations come in as closed for history. |
| Inventory on-hand | ~10–20K SKU × locations | Physical count weekend + import. Classic ERP cutover pain. **This is the bottleneck — recommend a 3-day shop shutdown (Fri PM through Mon AM) for inventory cutover.** |

### Historical data

- **Closed jobs / historical POs / shipping history:** do **not** migrate into ERPNext. Load into a read-only archive DB (Postgres with a Metabase front-end, or Frappe's `Archived Document` pattern). Rationale: historical data pollutes searches and reports; rarely queried; migration cost explodes with volume. **5 years of operational history archived, 12 months migrated as live.**
- **Financial history:** stays in Spectrum (already out of scope).
- **GL entries:** Spectrum's. Not touched.

### Approach

- **Epicor REST API** if JWM is on Epicor Kinetic (2022+). Query each business entity, paginate, transform to ERPNext DocType JSON, post via `/api/resource`.
- **Epicor DMT (Data Management Tool) export** if on older Epicor (9 / 10). CSV export → ETL script → DMT-compatible CSVs for ERPNext Data Import Tool.
- **Direct SQL** as fallback for bulk items and BOMs where API is too slow (Epicor on SQL Server; read-only credentials are typically available from JWM IT).
- **Scripting stack:** Python + pandas + Frappe REST client. Iterable, re-runnable, logged.

**Total migration effort: 25–35 days across item master, BOMs, open transactions, historical archive setup, reconciliation.**

---

## 5. Phasing proposal

### Phase 1 — Production Layer (already built, demo Monday)
Production WO/BOM/Routing/Job Card/Quality/RMA/Overrun + AI + Spectrum outbound skeleton + Paycor inbound skeleton. Go-live late July / early August 2026. **60 days effort, committed.**

### Phase 2 — Sales & Customer Lifecycle (Aug–Oct 2026)
**Goal: replace Epicor's front-office — all new business enters ERPNext, not Epicor.**
- Quoting / Estimating with AI BOM extract wired to `Quotation`
- Customer Master migration + cleanup
- Sales Order full-featured (releases, partial shipments)
- Project Management rollup for multi-release jobs (Titans pattern)
- Avalara tax integration
- Spectrum outbound hardened (invoice + cost summary nightly)

**Rationale:** Front office is contained — only estimators and sales touch it, Paul Roberts is already trained as admin, nothing on the shop floor changes. Clean boundary to prove stability.

**Effort: 35–50 days. Cutover: soft — run parallel quoting in both systems for 4 weeks, then Epicor quote module read-only.**

### Phase 3 — Supply Chain & Inventory (Oct 2026–Jan 2027)
**Goal: full purchasing, subcontracting, receiving, perpetual inventory, shipping.**
- Purchasing + MR→PO→Receipt chain
- Subcontracting with outsource operations linked to WO
- Supplier Master migration
- **Perpetual inventory** (three categories, back-flushing, min/max) — the hard one
- Physical count cutover weekend (3-day shutdown)
- Shipping + carrier integration (EasyPost) + crating plan
- CAD/CAM file drop integration
- Scanning / label printing on shop floor

**Rationale:** Inventory is the high-risk cutover. Doing it after sales stabilizes means Paul is experienced, shop floor is comfortable, and we've got muscle memory. This is the "big bang" weekend but the risk is contained because Phase 1 and Phase 2 are stable.

**Effort: 70–95 days. Cutover: hard — 3-day shop shutdown for physical count + Epicor freeze + ERPNext go-live.**

### Phase 4 — Financial Integration Hardening + Epicor Decommission (Jan–Mar 2027)
**Goal: cut the last Epicor cord.**
- AP invoice flow — ERPNext Purchase Invoices post to Spectrum GL (summary-level)
- Job cost posting to Spectrum per job close
- Historical archive read-only database stood up
- Final reconciliation and 90 days parallel read-only on Epicor
- Epicor license cancelled at end of Q1 2027

**Effort: 20–30 days. Cutover: none — just turning off Epicor access.**

### Phase 5 (deferred, separate engagement)
EDI with strategic customers, customer portal, advanced BI / data warehouse, passwordless rollout org-wide, Nextcloud Teams replacement.

---

## 6. What Archer's Smartsheet proposal CAN'T do for Epicor replacement

Archer scoped only Phase 1 production visibility. Here's what's concretely impossible or absurd on Smartsheet + Control Center + Work Apps + Data Shuttle + Data Mesh:

1. **Quoting with pricing rules, tax, discounts, margin analysis.** Smartsheet has no concept of a priced document; quotes would be free-form sheets with no validation. No customer credit check, no margin guardrail, no conversion-to-SO with integrity.
2. **Perpetual inventory with transactional integrity.** Smartsheet is an append-mostly row store — concurrent stock moves race each other. There is no stock ledger, no bin-level atomic decrement. You cannot build "quantity on hand at this warehouse at this instant" reliably. Archer explicitly punted this to Phase 2 and called it a platform risk in their §4.
3. **Multi-level BOM with cost rollup.** Smartsheet cross-sheet formulas at 10–20K items × multi-level BOMs will not compute at any reasonable speed. Archer flagged this as a §4 platform risk.
4. **Subcontracting accounting — raw material issued to supplier, finished part returned, inventory reconciled, cost posted.** This is four coupled transactions with referential integrity. Smartsheet has none.
5. **Purchase Invoice → GL journal to Spectrum.** Smartsheet has no accounting primitive; you'd be faking journals with Data Shuttle exports to CSV to Spectrum imports. Error-prone, not auditable.
6. **Serial / batch / lot traceability.** Customer-provided material tracked per customer per job — Smartsheet can mark a row "customer-provided" but cannot enforce cross-contamination at transaction time (Archer's own D-06a admits this is manual discipline).
7. **Multi-warehouse stock valuation (FIFO / moving average).** Not a Smartsheet primitive.
8. **Revision control for parts and BOMs with engineering approval gates.** Smartsheet row history is shallow; no named revisions, no parallel drafts, no approval routing beyond simple comments.
9. **Job costing estimated-vs-actual (Collin's explicit question).** Requires joining labor time (Paycor), material stock moves (perpetual inventory), and subcontract costs against original estimate. Four data domains. Smartsheet can't join reliably at scale.
10. **Customer NCR intake + corrective action workflow with SLA tracking and supplier CAR routing.** Smartsheet Work Apps can display; they can't route work based on role + due date + escalation. No SLA engine.
11. **EDI (future).** Impossible on Smartsheet. Would require an entirely external stack.
12. **Carrier rate shopping + label printing + tracking number callbacks.** No integration surface in Smartsheet for real-time carrier APIs.
13. **Audit-quality financial handoff to Spectrum.** Construction accounting (progress billing, retention) needs daily defensible cost cuts from production. Smartsheet's data model doesn't produce auditable cost records.

**Bluntly:** Smartsheet is a project-collaboration spreadsheet. The scope Archer wrote IS the ceiling. JWM would still be in Epicor for quoting, purchasing, inventory, shipping, and costing after the Smartsheet build. At $100M JWM needs to close all of those. They cannot on Smartsheet.

---

## 7. Risks specific to this scope expansion

| Risk | Severity | Mitigation |
|---|---|---|
| **Hosting scale-up from Phase 1 baseline.** Phase 1 was 20 WOs and seed data. Real JWM is 10–20K items, 100–200 POs, ~M parts/year. | **M** | Bump from Option 1's $300–600/mo AWS to roughly **$800–1,500/mo** by Phase 3. Primary drivers: Postgres (10 vCPU / 32GB, ~$400/mo), Frappe workers (4× t3.large, ~$200/mo), backups + Paperless OCR + LiteLLM + Authentik ($200–400/mo). On-prem alternative with a single 32-core / 128GB box + ZFS is ~$18–25K one-time and cheaper from year 2. **Recommend on-prem for Phase 3+** given JWM has physical facilities. |
| **Spectrum absorption of AP/invoice load.** If ERPNext becomes the Purchase Invoice system of entry, Spectrum needs to ingest summary journals cleanly. Spectrum is construction accounting — it may not love manufacturing cost structures. | **M** | Early-phase 2 spike: build one journal end-to-end and sit with Caitlin Moi to validate. If Spectrum's API is file-drop only (likely), n8n handles nightly batch. Retention / progress-billing logic stays in Spectrum untouched. |
| **Item master migration data quality.** Epicor likely has 20K items with 30% duplicates, ambiguous descriptions, no normalized UOM. | **H** | Allocate a dedicated 2-week data cleansing sprint led by Paul Roberts + a data analyst on sovereign.ai side. AI-assisted dedup and description normalization (Phase 1 LLM stack already running). Accept that cleanup quality defines post-cutover experience more than anything. |
| **Subcontracting cutover.** Open subcontract POs with material already at supplier cross the cutover boundary. | **H** | Freeze new subcontract dispatches 2 weeks before cutover. Let the in-flight ones complete receipt in Epicor. New subcontracts in ERPNext only. Reconcile manually. |
| **User training scale — 50+ users across shop floor + office.** | **M** | Train-the-trainer (Paul + one per work center). Sovereign.ai delivers 2 recorded tracks (admin + shop floor), onsite week during each phase cutover. Runbooks documented per DocType. |
| **Epicor license / data extraction lock-in.** Epicor contractually allows data extraction via their API or DMT; in practice vendors slow-walk it. If JWM is on hosted Epicor SaaS, DB access may be denied. | **M** | Get extraction rights explicit in writing from Epicor account rep **week 1** of Phase 2. If denied, fall back to Epicor REST API + DMT exports (slower but contractually guaranteed). Build migration scripts with API as primary path. |
| **Parallel operation cost.** Running Epicor + ERPNext simultaneously for 6 months doubles maintenance attention. | **L** | Staged by module — users only touch one system per function (Phase 2: sales in ERPNext, everything else in Epicor; Phase 3: inventory in ERPNext, sales in ERPNext, etc.). Minimizes dual-entry. |
| **Shop floor resistance to perpetual inventory discipline.** Back-flushing requires accurate Job Card completions. | **M** | Phase 3 opens with 4 weeks of parallel manual + perpetual; reports expose the variance; leadership course-corrects. Scanning hardware arrives Phase 3 week 1. |
| **Go-live during Matt's AU residence.** Phase 3 cutover Jan 2027 — Matt is remote. | **M** | Named on-ground Frappe engineer (already planned for Phase 1). Sovereign.ai extends engagement to include a Nashville-based consultant 50% during Phase 3 cutover week. |

---

## 8. Pricing input for Seat 4

### Effort and dollar anchors

Using the same sovereign.ai fixed-price delivery model as Phase 1 (target blended rate ~$700–900/day inclusive, vs. $1,440–2,000/day traditional).

| Phase | Effort (dev-days) | Fixed-price anchor (sovereign.ai) | Traditional consulting equivalent |
|---|---|---|---|
| **Phase 1** (already scoped / committed) | ~60 | **$55K** (per existing PRD §10 Option 1) | $150–300K |
| **Phase 2 — Sales & Customer** | 35–50 | **$35–45K** | $90–150K |
| **Phase 3 — Supply Chain & Inventory** | 70–95 | **$70–90K** | $200–300K |
| **Phase 4 — Financial hardening + Epicor decommission** | 20–30 | **$20–28K** | $50–80K |
| **Optional migration buffer** (contingency for data cleansing, unexpected Epicor extraction friction) | 15–25 | **$15–20K** | — |
| **Total full program** | **200–260 days** | **$195–238K fixed** | **$490–830K** traditional |

### Recommended team shape

- **Matt Wright** — architect, client-facing, Phase-boundary owner. ~30% across the full program.
- **Senior Frappe / Python developer** (named, onsite Nashville preferred for cutover weeks) — 100% allocation. This is the delivery spine.
- **Data migration specialist** (contract, 6 weeks total across Phase 2 + 3) — item master, BOM, historical archive.
- **Integration specialist** (contract, 4 weeks) — Spectrum AP flow, EasyPost, Avalara.
- **Change management / training lead** (contract, 4 weeks during Phase 3 cutover) — runbooks, recorded training, onsite week.

### Timeline to full cutover

- **Phase 1 go-live:** late July 2026 (committed).
- **Phase 2 go-live:** end of October 2026.
- **Phase 3 go-live (the big one):** mid-January 2027 — cutover weekend Fri–Mon, inventory count shutdown.
- **Phase 4 / Epicor off:** end of March 2027.

**Full cutover in 11 months from Phase 1 kickoff. Epicor contract cancelled end of Q1 2027.**

### Recommended quote posture for Seat 4

1. **Do not bundle everything into one fixed price.** JWM should sign Phase 1 at $55K now and see it deliver. Quote Phase 2 at Phase 1 completion. Quote Phase 3 at Phase 2 completion. This preserves JWM trust (they see delivery before committing the next tranche) and lets sovereign.ai adjust scope with learning.
2. **But show the full program anchor:** "Full Epicor retirement: $195–238K over 11 months, vs. Smartsheet's $150K+ Phase 1 that doesn't retire anything and is a dead end at $100M." This is the competitive kill shot.
3. **Offer a pre-commit option:** "Sign all 4 phases today at $185K fixed (8% discount)" for a buyer who wants cost certainty over optionality. Chris may want this; it's a clean finance story.
4. **Hosting separate:** on-prem recommended from Phase 3. ~$18–25K hardware. Self-managed. This eliminates $10–18K/year of AWS creep.

### The bottom line for Seat 4

**Anchor price: $195K fixed, 11-month program, full Epicor retirement, on-prem hosting by Phase 3, named team, staged payment aligned to phase gates.** This is a credible, defensible number that collapses Epicor + Archer's Smartsheet ceiling into one line item JWM can sign.

Compared to Archer's Smartsheet path that:
- Costs ~$150–250K+ for Phase 1 alone (discovery done, build still quoted)
- Locks JWM into Smartsheet licensing in perpetuity
- **Does not retire Epicor** — JWM keeps paying Epicor licenses forever
- Ceiling-limits JWM at ~$60–80M revenue before the platform buckles

Sovereign.ai's expanded scope ends Epicor and ends Archer in one program, on JWM-owned infrastructure, for less total cost than Archer's path plus ongoing Epicor + Smartsheet licensing combined.

---

## File paths

- **This document:** `/Users/mattwright/pandora/Obsidian/PLAUD/PROJECTS/JWM/council/03-epicor-scope.md`
- **Source PRD:** `/Users/mattwright/pandora/Obsidian/PLAUD/PROJECTS/JWM/JWM_Production_System_PRD_v0.2.md`
- **Built-state addendum:** `/Users/mattwright/pandora/Obsidian/PLAUD/PROJECTS/JWM/PRD_ADDENDUM_built_state.md`
- **Stack inventory:** `/Users/mattwright/pandora/Obsidian/PLAUD/PROJECTS/JWM/STACK_INVENTORY.md`
- **Evidence — spreadsheet tabs:** `/tmp/jwm-council/1040_T_Shop_Production_Schedule.txt` (42 tabs), `/tmp/jwm-council/1010_A_shop_Production_Schedule.txt` (20 tabs), `/tmp/jwm-council/Daily_Efficiency_Log.txt` ("information pulled from Epicor")
- **Archer deliverables:** `/tmp/jwm.txt`
