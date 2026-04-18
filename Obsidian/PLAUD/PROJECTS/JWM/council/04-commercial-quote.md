# JWM × sovereign.ai — Full Epicor Replacement Quote

**Prepared for:** Chris Ball, COO, John W. McDougall Co.
**Cc:** Paul Roberts, Drew Adams, Collin Phillips, Josh McPherson, Wylie McDougall, George Holland
**From:** Matt Wright, sovereign.ai
**Date:** 2026-04-19
**Status:** Working quote for the Monday 2026-04-20 meeting. Based on the Apr 17–18 team thread, the 1010 A-Shop, 1040 T-Shop, and Daily Efficiency Log workbooks, and the Archer Deliverables doc dated 2026-04-14.

---

## 1. What changed since Friday

The team spent Thursday and Friday putting concerns in writing before the "BUILD IT!!!" gate fired. We read Drew's five questions (Phase 2 timing, manual inventory burden, Epicor exit plan, the metrics list, and the review discipline itself), Collin's six specific KPIs, and pulled apart the three operational workbooks — 80 sheets, 177 columns on the widest tab, roughly 3,000 live job records and two and a half years of schedule history. What those spreadsheets show is not an Epicor problem; it's a **JWM-has-built-a-hand-rolled-MES-on-top-of-Epicor problem**, and Archer's Smartsheet plan rebuilds the spreadsheet without retiring the ERP underneath it. That's the gap this quote closes.

PRD v0.2 Section 10 priced only the Phase 1 production layer at $55K. This document replaces §10 with a full Epicor retirement plan at **$195K fixed over 11 months**, Phase 1 unchanged and already live.

---

## 2. What we'd replace vs. what Archer stops at

| Epicor area JWM uses today | Intensity | Archer / Smartsheet | sovereign.ai / ERPNext |
|---|---|---|---|
| Quoting & Estimating | Heavy | Out of scope | **Included (Phase 2)** |
| Sales Orders, Releases, Customer Master | Heavy | Partial (displays them) | **Included (Phase 2)** |
| Supplier Master (AAA, AZZ, POWDERWORX, TGS, COLBERT, DACODA, GLC) | Heavy | Tracks as rows | **Included (Phase 3)** |
| BOM / Routing / Work Orders | Heavy | Rebuilt as sheets | **Live today (Phase 1)** |
| Job Card / Labor Capture | Heavy | Rebuilt as sheets | **Live today (Phase 1)** |
| Purchasing (MR → PO → Receipt) | Heavy | Out of scope | **Included (Phase 3)** |
| Subcontracting with outsourced op receipts | Heavy | Out of scope | **Included (Phase 3)** |
| Perpetual Inventory (three categories: stock / order / customer-provided) | Heavy | Out of scope — Archer D-06 confirms manual | **Included (Phase 3)** |
| Shipping / Manifest / Crating | Medium | Partial | **Included (Phase 3)** with EasyPost |
| Quality — NCR, CAR, RMA, SNCR | Medium | Out of scope | **Live today (Phase 1)** |
| Job Costing — Est vs Actual labor & material | Heavy need | Out of scope | **Included (Phase 2–3)** |
| Project Management (multi-release jobs like Titans 24051) | Medium | Sheets | **Included (Phase 2)** |
| Engineering Change / Revision | Light | Out of scope | **Included (Phase 2)** |
| Integration with Spectrum (AP, job cost postings) | Required | Manual | **Included (Phase 4)** |
| Integration with Paycor (labor hours) | Required | Manual | **Live skeleton today, hardened Phase 2** |
| CAD/CAM file drop (AXYZ / laser nesting programs) | Medium | Out of scope | **Included (Phase 3)** |
| Avalara tax engine | Required at $100M | Out of scope | **Included (Phase 2)** |
| Barcode / QR scanning on shop floor | Phase 2 per Archer | Placeholder | **Included (Phase 3)** |

Archer stops at the production visibility layer. Epicor stays. **sovereign.ai ends Epicor by end of Q1 2027.**

---

## 3. The headline

- **Program cost:** $195,000 fixed across four phases.
- **Timeline:** Kickoff 2026-04-22, full Epicor cutover 2027-03-31. Eleven months.
- **Risk frame:** Phase 1 is already live at `jwm-erp.beyondpandora.com` — Chris can click it today. Every subsequent phase is stage-gated, with the next phase not invoiced until the prior phase is accepted. If we miss a gate, JWM walks with a working Phase 1 and the data already exports as standard SQL.

---

## 4. Phase breakdown

### Phase 1 — Production Layer (**committed, live now**)

- **Scope:** Work Order, Job Card, BOM, Routing, Workstation, Operation, Stock Entry, Sales Order, Quality (JWM NCR / CAR / RMA / Overrun Allocation), AI gateway, voice NCR, Project Traveler with QR, executive dashboards, Spectrum outbound skeleton, Paycor inbound skeleton.
- **Already added at no change to price** (from Seat 2 data-model reverse-engineering):
  - 6 new DocTypes to match the spreadsheet reality: `JWM Job Release`, `JWM Production Hold`, `JWM Efficiency Event`, `JWM Machine Downtime`, `JWM Engineering Assignment`, `JWM Scheduling Override`.
  - ~50 custom fields on existing DocTypes (job-issue identity, paired target/actual date fields, material type, customer part, staged qty, etc.).
  - ~40 Operation master records seeded to match the shops' actual op codes (FM, OS, QA, WE, ASM, FIN, PGM, PWX, TL, FL, PU, MA, PEM, ROLL, SHEAR, KIT, SHIP, ACCT, GRINDING, LO, Sketch, AXYZ Titans, AXYZ 34, TruLaser 3040, 7000 TruMatic, 7000 TubeLaser 20/28, TruPunch 5000, Clean and Brake, Fab, Cidan, Brake, Roll, Extrusion Saw, Tube Bender, Band Saw, Metal Finish, 1st/2nd Manual, Level, Robot Weld, Titus Weld, MacGyver Weld).
  - **All six of Drew's and Collin's missing KPIs** wired to the new `JWM Efficiency Event` DocType: Efficiency % by operation, by material type, by operator; Job performance; Estimated vs Actual labor and material; Part performance history ("we've run this part 5 times — how has it performed?").
- **Price:** **$55,000 fixed**, includes Year 1 maintenance and AI gateway operations.
- **Go-live:** Pre-Australia late July / early August 2026.
- **Acceptance:** Paul Roberts + Drew Adams sign off that travelers, job cards, dashboards, and the six KPIs are usable on the shop floor for one full production week.

### Phase 2 — Sales, Customer, Quoting, Projects (Aug–Oct 2026)

- **Scope:**
  - `Quotation` DocType extended with estimated BOM + routing at quote time; AI-driven extract from estimate PDFs wired in.
  - Customer Master migration (~500–2,000 customers from Epicor, deduped and standardised per Archer RID-55).
  - Sales Order full-featured with the multi-release pattern JWM actually uses (Titans 24051 → FS200/FS201/FS205/FS206/... as Job Releases).
  - Project rollup so multi-release mega-jobs report cleanly to Josh McPherson.
  - Avalara tax engine.
  - Spectrum outbound hardened — invoice lines and nightly job-cost summaries.
  - Paycor inbound hardened — labor hours posted to Job Card actuals feeding the estimated-vs-actual KPIs the team asked for.
  - Engineering Change Order workflow with approval gate (Archer RID-7).
- **Effort:** 35–50 dev-days.
- **Price:** **$40,000 fixed**, includes Year 1 maintenance for Phase 2 scope.
- **Go-live:** End of October 2026. Front-office soft cutover — all new quotes and sales orders enter ERPNext; Epicor quote module goes read-only after 4-week parallel.
- **Acceptance:** One full week of new quotes and new sales orders created only in ERPNext, with Avalara computing tax correctly and Spectrum receiving nightly feeds without manual touch.

### Phase 3 — Supply Chain & Inventory (the Epicor retirement pivot — Oct 2026–Jan 2027)

- **Scope:**
  - Purchasing: Material Request → PO → Receipt chain, with the `jwm_allocation_code` custom field (dept / customer / project per Archer RID-25) and auto-reorder rules.
  - Subcontracting: every outsourced operation tied to a Subcontracting PO; Supplier masters for AAA, AZZ, POWDERWORX, TGS, COLBERT, DACODA, GLC; `Missed Outsource Receipts` exception report replacing the current 1040 spreadsheet tab; overdue-return notifications.
  - Item Master migration — 10–20K items from Epicor, AI-assisted dedup.
  - BOM migration — 3,000–8,000 active BOMs.
  - **Perpetual inventory**: three categories (stock / order-specific / customer-provided) via warehouse hierarchy, back-flushing from Job Card completions, min/max reorder triggers, cycle count workflow.
  - Shipping: Delivery Note with crating plan, skid counts, EasyPost integration for parcel + LTL rate shop, Ready-to-Ship queue dashboard.
  - CAD/CAM file drop integration for AXYZ and laser nesting programs → Item Master via n8n watcher.
  - Barcode / QR scanning on the shop floor for job card updates and inventory moves (Zebra ZPL).
- **Effort:** 70–95 dev-days.
- **Price:** **$80,000 fixed**, includes Year 1 maintenance for Phase 3 scope.
- **Go-live:** Mid-January 2027. Hard cutover — 3-day shop shutdown (Fri PM → Mon AM) for physical inventory count and Epicor freeze.
- **Acceptance:** One full month of shop operations — purchasing, subcontracting, receiving, inventory moves, and shipping — conducted entirely in ERPNext with Epicor read-only. Inventory variance < 2% at the first cycle count after go-live.

### Phase 4 — Hardening, Financial Integration, Epicor Decommission (Jan–Mar 2027)

- **Scope:**
  - Purchase Invoice in ERPNext posting summary AP journals to Spectrum (validated end-to-end with Caitlin Moi).
  - Job cost posting to Spectrum per job close, defensible for construction accounting audits.
  - Historical archive read-only database for pre-cutover Epicor data (Postgres + Metabase).
  - 90-day parallel read-only on Epicor.
  - Epicor licence cancelled end of Q1 2027.
- **Effort:** 20–30 dev-days.
- **Price:** **$20,000 fixed**, includes Year 1 maintenance for Phase 4 scope.
- **Go-live:** 2027-03-31. Epicor off.
- **Acceptance:** JWM finance signs off on one full month-end close with ERPNext-to-Spectrum feeds; Caitlin Moi confirms AP and job cost journals match construction-accounting expectations.

---

## 5. Investment summary

| Phase | Fixed price | Duration | Kickoff | Go-live | Year-1 maintenance? |
|---|---|---|---|---|---|
| Phase 1 — Production Layer | **$55,000** | 3 months | committed (live now) | Jul–Aug 2026 | Included |
| Phase 2 — Sales, Customer, Quoting | **$40,000** | 10 weeks | Aug 2026 | Oct 2026 | Included |
| Phase 3 — Supply Chain & Inventory | **$80,000** | 14 weeks | Oct 2026 | Jan 2027 | Included |
| Phase 4 — Hardening & Decommission | **$20,000** | 8 weeks | Jan 2027 | Mar 2027 | Included |
| **Program total Year 1** | **$195,000** | **11 months** | 2026-04-22 | 2027-03-31 | Included |

**Year 2 onward, quoted separately at Phase 4 close:**
- Ongoing maintenance + AI gateway ops: **$35,000/year** (covers all four phases, incident response, minor enhancements, platform upgrades).
- Hosting: if JWM self-hosts on AWS, cloud is JWM's direct bill (~$800–1,500/mo at full scale). If JWM elects on-prem by Phase 3 (recommended), hardware is ~$18–25K one-time and Year 2+ hosting is effectively zero beyond power.

---

## 6. Commercial options

**Option A — All phases fixed-price, stage-gated (recommended).**
- Pay each phase on its kickoff: $55K now (Phase 1, already committed); $40K at Phase 2 kickoff (Aug 2026); $80K at Phase 3 kickoff (Oct 2026); $20K at Phase 4 kickoff (Jan 2027).
- No commitment to Phase N+1 until Phase N is accepted.
- Total Year 1: **$195,000**.

**Option B — Monthly SaaS including all phases + sovereign.ai-managed hosting.**
- **$17,500/month** for 12 months covering all four phases, hosting on sovereign.ai AWS, maintenance, AI gateway, support.
- Year 1 total: **$210,000** (13% premium over Option A in exchange for zero infrastructure burden on JWM).
- Month-to-month after Year 1 at **$4,000/month** for maintenance + hosting + AI.

**Option C — Hybrid.**
- **$35,000 at kickoff** (Phase 1 true-up + Phase 2 deposit), then **$14,500/month** for 12 months covering Phases 2–4 + hosting.
- Year 1 total: **$209,000**.

**Recommended: Option A.** Stage-gating is the right frame when a team has been burned by a $18K discovery that didn't land. Chris pays only for what's been accepted; sovereign.ai earns the next phase by delivering the current one. Phase 1 at $55K is already the demonstrated floor of risk — extending that pattern through Phase 4 is the lowest-risk posture for JWM.

---

## 7. What's included in the program price

- All Phase 1 scope in PRD v0.2 §4, plus the six new DocTypes and ~50 custom fields reverse-engineered from the shops' spreadsheets.
- Drew's and Collin's six missing KPIs, delivered in Phase 1, wired through Phase 2 (Paycor hours) and Phase 3 (material variance from Stock Entry).
- Full Epicor migration: customers, suppliers, items, BOMs, open sales orders, open purchase orders, open work orders, open subcontract POs, opening inventory.
- Subcontracting module with all seven existing vendor workflows.
- EasyPost shipping integration (parcel + LTL rate shop + label printing).
- Avalara tax engine.
- CAD/CAM file drop (AXYZ, laser nesting, punch programs).
- Barcode / QR scanning on the shop floor.
- Spectrum outbound (invoice lines, job cost summaries, AP journals) hardened to audit quality.
- Paycor inbound hardened for job costing.
- Engineering Change Order workflow.
- Training: 2 recorded tracks (admin for Paul / Drew; shop floor for operators), plus one onsite week per phase cutover.
- Runbooks and admin documentation per DocType.
- 12 months of maintenance on every phase's scope from that phase's go-live date.
- AI gateway operations (voice NCR, estimate extract, dashboard NL query) for 12 months.
- Data sovereignty guarantees: no LLM training on JWM data, full audit logging, encrypted at rest and in transit.

---

## 8. What's excluded or priced separately

- **On-prem hardware** if JWM elects that path at Phase 3 (~$18–25K one-time). Recommended — eliminates ongoing cloud spend from Year 2.
- **AWS cloud fees** in Option A (JWM pays AWS directly, ~$300–600/mo early, ~$800–1,500/mo at full scale).
- **EDI with individual customer or supplier endpoints** (Disney, LSU, Vanderbilt, Titans, etc.) — scoped as a Phase 5 follow-on at +$10–15K per endpoint via n8n or SPS Commerce.
- **LLM API overage** beyond the standard envelope included (Phase 1 demo envelope covers expected production load; heavy use priced at cost pass-through).
- **Customer portal** for external NCR intake and order status (Phase 5, ~$15–20K).
- **Nextcloud / Teams replacement, passwordless / biometric auth rollout, on-prem HA architecture** — separate follow-on engagements.
- **Post-cutover scope additions** handled as change orders at sovereign.ai rate (~$800/dev-day blended).

---

## 9. What you'd pay Archer vs. what you'd pay us

Public pricing, 100-user JWM shape, 2-year horizon:

| Line item | Archer / Smartsheet path | sovereign.ai path |
|---|---|---|
| Smartsheet Business licence | $29/user/mo × 100 × 24 = **$69,600** | — |
| Smartsheet Control Center | per-licence premium, ~$15K/yr | **$30,000** | — |
| Smartsheet Work Apps | per-user add-on, ~$10/user/mo × 100 × 24 = **$24,000** | — |
| Smartsheet Data Shuttle + Data Mesh | add-ons, ~$5K/yr each = **$20,000** | — |
| Smartsheet premium API tier | ~$3K/yr = **$6,000** | — |
| Archer consulting — Phase 1 build (not yet quoted; $18K was discovery only) | estimated **$120K–180K** at typical Archer rates | — |
| **Archer / Smartsheet 2-year licence + Phase 1 build** | **~$270K–330K** | — |
| **Epicor licensing continuing (Archer does not retire it)** | **~$60K–120K over 2 years** (typical mid-market Epicor SaaS) | **$0 — Epicor cancelled Q1 2027** |
| **Archer Phase 2 (inventory, shipping, purchasing) — not yet scoped** | estimated **$100K+** | Included above |
| sovereign.ai full program Year 1 | — | **$195,000** |
| sovereign.ai Year 2 maintenance | — | **$35,000** |
| **2-year total** | **$430K–550K+, Epicor still running** | **$230K, Epicor off** |

sovereign.ai is approximately **$200K–320K cheaper over 2 years** and ends Epicor. Archer's path is cheaper only if you count Phase 1 in isolation and pretend Epicor goes away for free.

---

## 10. Answers to the team's specific concerns

**Drew's five questions (Apr 17 12:25pm):**

1. *When does Phase 2 kick off?* — Phase 2 kicks off the week Phase 1 is accepted, no gap. Target: Aug 2026. If Phase 1 slips, Phase 2 slips with it; JWM is not paying for idle time. Dates are in §4 above, in writing.
2. *Are we ready to manually handle inventory during Phase 1?* — You don't have to. Phase 1 already contains Stock Entry and the new `JWM Efficiency Event` DocType that captures material variance. Phase 3 (Oct 2026) is perpetual inventory with back-flushing; the manual window is ~8 weeks between Phase 2 go-live and Phase 3 go-live, not 6+ months the way Archer frames it.
3. *Epicor replacement or integration?* — **Full replacement. Epicor off by 2027-03-31.** This is a commitment, not a TBD. Phase 4 specifically exists to cut that cord.
4. *KPIs — efficiency by op / material / operator, est vs actual labor and material, part performance history?* — All six live in Phase 1 dashboards, drawing from the `JWM Efficiency Event` DocType. The Daily Efficiency Log spreadsheet already captures the raw fields at row level — we're giving them a relational home and real-time rollup instead of a monthly aggregate that tops out at 250 rows per station.
5. *Is the review gate discipline holding?* — Yes. This document exists because you insisted on it. That's the right instinct and it's how we'd run the rest of the program too.

**Collin's concerns (Apr 17 11:36am):**

Same ground as Drew with the added KPI specificity. Worth re-stating: the part performance history question ("we've run this part 5 times, how has it performed?") is a single report grouping `JWM Efficiency Event` rows by Item with a trend chart. It's on the Phase 1 deliverables list. Collin gets it by late July.

**Chris's framing of Jan 2027:**

Chris set a Jan 2027 go-live in the Feb 23 kickoff; Archer's schedule fits inside that. Our schedule delivers Phase 1 five months earlier (pre-Australia July/August 2026) and full Epicor cutover by end of Q1 2027 — same ultimate date, but JWM gets five months of operational KPI benefit earlier. At $30M→$100M, five months of on-time-delivery and scrap-rate visibility is worth materially more than the entire $55K Phase 1 fee.

---

## 11. Why this isn't a bigger number

The instinct when looking at $195K for full Epicor retirement is that it should be bigger. Traditional consulting math: Phases 2–4 alone are ~165–210 dev-days, which at $200–250/hr × 8 hrs = $260K–420K. Big-ERP integrator quotes for the same work land $400K–800K.

Two reasons ours is $140K for Phases 2–4:

1. **Modern tooling compresses the delivery.** Phase 1 is already running; the same Frappe / ERPNext framework + n8n + LiteLLM stack extends cleanly into Phases 2–4 without re-platforming. We're not billing for re-discovery or re-architecture because we already did it.
2. **ERPNext is MIT-licensed.** There is no licence margin for sovereign.ai to protect. Every dollar you pay buys delivery effort, not royalty.

If anyone wants a $400K quote for the same scope we can introduce you to three firms who will happily provide one. We don't think that's the better deal for JWM.

---

## 12. Why this isn't a bigger risk

Three fast exits if Phase 1 or any subsequent phase underperforms:

1. **Phase 1 is live already.** `jwm-erp.beyondpandora.com` is not a slide deck. Chris can click it Monday. If it doesn't land on the shop floor in July, nothing past $55K has been spent.
2. **Data export is standard SQL.** ERPNext is Postgres underneath. A full database dump is a `pg_dump` command. There is no proprietary format, no vendor-controlled export tool, no licence gate on your own data. You can migrate to another ERPNext partner, or self-host in perpetuity, at any time.
3. **On-prem option means JWM can terminate sovereign.ai and keep running.** If Phase 3 elects on-prem hardware at JWM, the stack runs independently of our infrastructure. We provide runbooks and admin training. A single mid-level sysadmin can operate the system after handoff; a Frappe-literate developer (freely available, global talent pool) can extend it.

In contrast, the Smartsheet path keeps you on Smartsheet's licensing + Control Center + Work Apps + Data Shuttle + Data Mesh forever, and keeps Epicor running alongside. There is no symmetric exit.

---

## 13. Signing

**What to sign Monday (2026-04-20):**

A one-page engagement letter committing JWM to **Phases 1 and 2 combined — $95,000** — with Phases 3 and 4 optioned in at prior-phase completion. Phase 1's $55K is structured as acknowledged (Phase 1 is already live); Phase 2's $40K kickoff payment is due at Phase 2 start, targeted Aug 2026.

**Kickoff:** 2026-04-22 (Tuesday after Monday's meeting). We begin Phase 2 discovery calls with Paul (admin), Drew (scheduling / inventory), Collin (metrics), and Caitlin Moi (Spectrum).

**Full-program target:** Epicor cutover 2027-03-31, with a one-quarter extension option (to 2027-06-30) if Phase 3 inventory migration surfaces surprises — exercised only by mutual agreement, at no additional fixed fee.

**What it costs JWM to say no on Monday:** nothing. Phase 1 is a paid-for demo-environment build at this point; there is no exit fee, no cancellation clause, no data held hostage. sovereign.ai would rather JWM make a deliberate decision with all three data points (our proposal, Archer's proposal, the team's concerns in writing) than rush a signature.

---

## Appendix A: Phase deliverables (detailed)

**Phase 1 delivered — acceptance artefacts available now:**
- Live URLs: `jwm-demo.beyondpandora.com`, `jwm-erp.beyondpandora.com`.
- 20 Work Orders, 7 Job Cards, 11 BOMs, 12 Workstations, 5 Operations, 29 Stock Entries, 6 Sales Orders seeded.
- Custom DocTypes in place: Project Traveler, JWM NCR, JWM CAR, RMA, JWM Overrun Allocation — plus the six new from Seat 2's reverse-engineering.
- Voice NCR via AI gateway, executive dashboards, exec NL query, AI estimate extract skeleton, Spectrum outbound skeleton, Paycor inbound skeleton.
- `STACK_INVENTORY.md` and `PRD_ADDENDUM_built_state.md` in the JWM project folder document exactly what is built.

**Phase 2 deliverables (contractual):** Quotation (extended), Customer Master migrated, Sales Order with Releases, Project rollup, Avalara live, Spectrum outbound hardened, Paycor inbound hardened, ECO workflow, 2 training recordings + 1 onsite week.

**Phase 3 deliverables (contractual):** Purchasing chain, Subcontracting module with 7 vendors, Item Master migrated (10–20K items), BOMs migrated, Perpetual inventory (3 categories + back-flush + cycle count), Shipping + EasyPost + crating, CAD/CAM file drop, barcode / QR scanning, 3-day cutover weekend, 1 onsite week.

**Phase 4 deliverables (contractual):** Purchase Invoice → Spectrum AP journal, Job cost posting to Spectrum, Historical archive DB, 90-day Epicor parallel read-only, Epicor decommission.

## Appendix B: Team roster for JWM engagement

- **Matt Wright** — architect, client-facing, phase-boundary owner (~30% across program).
- **Senior Frappe / Python developer** — named, onsite Nashville preferred for cutover weeks, 100% allocation, delivery spine.
- **Data migration specialist** — contract, 6 weeks across Phase 2–3, owns item master + BOM + historical archive.
- **Integration specialist** — contract, 4 weeks, owns Spectrum AP, EasyPost, Avalara.
- **Change management / training lead** — contract, 4 weeks around Phase 3 cutover, owns runbooks + recorded training + onsite week.

## Appendix C: Data migration plan summary

- **Master data migrated live:** Customers (~500–2K), Suppliers (~200–500), Items (~15–30K active, AI-assisted dedup), BOMs (~3–8K), Workstations (12–20).
- **Open transactions migrated at cutover:** Sales Orders (~100–200), Purchase Orders (~100–300), Work Orders (~200–500), Subcontract POs (~188 currently open), Inventory snapshot (~10–20K SKUs).
- **Historical data:** 5 years of closed jobs / POs / shipments loaded into read-only Postgres archive with Metabase front-end. 12 months migrated as live records for trailing-year reporting.
- **Extraction method:** Epicor REST API primary; DMT CSV export as fallback; direct SQL Server read for bulk items/BOMs.
- **Cutover event:** 3-day shop shutdown Friday PM → Monday AM in mid-January 2027 for physical inventory count and Epicor freeze.

## Appendix D: Risk register (top 10)

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | Item master migration data quality (likely 30% duplicates in Epicor) | H | 2-week data-cleansing sprint with Paul; AI-assisted dedup |
| 2 | Subcontracting cutover with material already at supplier | H | 2-week dispatch freeze pre-cutover; in-flight completes in Epicor |
| 3 | Epicor data extraction friction (hosted SaaS may limit DB access) | M | Get extraction rights in writing from Epicor account rep Week 1 |
| 4 | Spectrum AP/job-cost journal shape mismatch with construction accounting | M | Week-1 spike with Caitlin Moi; validate end-to-end before building |
| 5 | Shop floor resistance to perpetual inventory discipline | M | 4-week parallel manual + perpetual; leadership course-corrects on variance reports |
| 6 | Hosting scale-up beyond Phase 1 baseline | M | Bump to $800–1,500/mo AWS by Phase 3, or elect on-prem at ~$18–25K one-time |
| 7 | User training at 50+ users across shop + office | M | Train-the-trainer with Paul + workcenter leads; 2 recorded tracks; onsite weeks |
| 8 | Parallel-operation cost running Epicor + ERPNext 6 months | L | Staged by module — users only touch one system per function at a time |
| 9 | Go-live during Matt's AU residence (Phase 3 cutover Jan 2027) | M | Named onsite Frappe dev + Nashville-based consultant at 50% during cutover week |
| 10 | Scope creep from change orders during Phase 2–3 | M | Change orders priced at $800/dev-day, approved by Chris individually; no silent expansion |

---

**End of quote. Questions and redlines welcome ahead of Monday — or in the room.**

— Matt Wright, sovereign.ai
