---
title: JWM's current Smartsheet system — reference + build gap map
date: 2026-04-19
source: 19 screenshots captured by Matt at /attachments neighbour `/screenshots/` during the 22:25 call
purpose: Every screen we demo Monday must feel like this to the JWM team — same data, same language, better surface.
---

# JWM's Smartsheet system — what they have today

Chris shared his screen for ~20 minutes and Matt took 19 screenshots (22:09–22:29 BST). The screenshots cover: Exec dashboards → PMO → per-project dashboard → project Gantt → ERF form → Production Schedule (kanban + grid + shop) → Drew's shipping spreadsheet → workspaces browser → our jwm-demo efficiency page for comparison. This doc maps each surface to what we're building so nothing surprises the team Monday.

---

## 1. Architectural Current Contracts Dashboard  *(Exec)*
**File:** `10.09.54 PM.png`, `10.09.58 PM.png`

JWM-branded header: "Architectural Current Contracts Dashboard". Four big KPI tiles across the top:

| KPI | Value shown |
|---|---|
| Sales | $453,658,000 Sum Pending + Active + Neg · $8,927,933 Total SF out there (not Lost) |
| Pipeline | $101,200,620.62 **Unbilled** |
| ACM | Project Remnant Margin % (placeholder) |
| Project Overview | **116 Total Active Projects** · $108,135,807.62 Backlog · 26.3% Combined Margin of active projects · **$72,731,964.67 Cost to come** |

Left rail = **Dashboard Links**: Panel Dashboard · 3D Production Schedule · Document Manager · Architectural Division Contract List · Scanner Calendar · Vendors · Machines. Then per-role sub-dashboards: **Precon + Estimating Leaders Dashboards** (Mike Noterra · Caleb Fanice · Kevin Florde), **Sales Precon & Estimating Manager Dashboards** (Stephen Daniels · Harrison Hardman), **Office Manager Dashboards** (Kim Sullivan).

Right rail = **Project Budget Overview**: Current CM Total $179,489,357.62 · Total Current Budget $132,219,636.55 · Total Backlog $61,664,182.25 · Total Actual Cost to Date $22,478,379.88 · Committed Cost $60,263,893.79 · Total Projected Built to Active Projects $47,269,670.77.

Bottom = **FM Dashboards** per FM (Cole Noterra, Laura Frami), **PM Quick Links** per PM (Cole Noterra, Mike McDougal, Carice Alls, Austin Van Den Meijers, Callum Van Morte), **FX Dashboards** per designer (Josh McPherson, Mare Silva, Leon Soares), then a **Projects** table.

### Our mapping
- **Executive → Arch** page must show these exact KPI tiles with our real Vanderlande/Ariens-sourced numbers.
- The "dashboard links" rail = sidebar entries we already have.
- The per-person dashboards = **/people/{role}/{name}** pattern — not yet built.
- **Gap:** role-based sub-dashboards (FM, PM, FX, Precon leaders, Office Managers). Each person on the team has "their" dashboard in the current system. Big pattern to replicate.

---

## 2. PMO Dashboard — My Projects  *(Per-PM home)*
**File:** `10.10.05 PM.png`

"Matt Rasmussen" header. Right tile: **Active Projects 8**. Below = Projects Prioritized table with columns: PROJECT · SHORT JOB ID · Project Links · Progress bar · % · VS · Start · End · Ship. 8 rows of real active projects (Iroquois AD181, Vanderlande Casablanca Sales Name, Nike Maryland, etc.).

Below that:
- **Dashboard Quick Links** (Panel Dashboard, Executive Portfolio Dashboard, Production Schedule, Engineering Production Schedule, 3D Production Schedule, Scanner Calendar, Electives, Restore Material, Architectural Division Contract List, Total Backlog, Procurement Log)
- **Forms** row: three buttons — **Job Info**, **3D Request**, **Schedule it** (these are Smartsheet form URLs)
- **Upcoming Tasks** table
- **Budget Overview** strip

### Our mapping
- This is the **PM's home page**. In our sidebar it sits under **Architectural → Project Managers** and **Processing → Ops Manager + Client Services**.
- **Gap:** we haven't built `/arch/pm/{user}` yet (just a stub). Must include: active projects table w/ progress bars, Quick Links rail, Forms buttons (launch ERF/3D Request/Schedule It modals), Upcoming Tasks, Budget summary.
- Forms buttons = big UX cue: each is a single CTA that opens a structured form. Mirror this — don't hide it in menus.

---

## 3. Project Dashboard  *(Per-job page — the one Chris cares about most)*
**File:** `10.10.20 PM.png`, `10.10.40 PM.png`

Huge JWM logo banner. Header shows **Job Name: IAD181 Fitout · Job Number: 25071 · PM: Matt Rasmussen · mrasmussen@jwmcd.com**.

**Project Information** panel — 4 health gauges:
- Project Health: 🟢 green dot
- **% Complete: 61%** (big number)
- Project Task Status: **donut** chart (~54% done, slice legend: Not Started · In Progress · Complete)
- Budget Health: 🟢 green dot · **Budget's % Spent: 2%**

**Project Links** rail (vertical list):
- Budget · Change Order Request Log · Forecast · Production · Project Charter · ROM · Field Daily Report · ... (truncated)

**Budget Overview** tile:
- Contract Budget $1,553,000.00
- Current Budget $1,553,000.00
- Total Cost $27,254.34
- Projected Spend $417,215.00
- Committed Cost $1,109,852.66
- Budget Remaining $1,852.00

**Margin** tile: Initial 24%, Current 24%, **Current Budget at Completion 0%**.

**Margin Increase %**: 0% (Decrease/Increase toggles), 0.0% (Change Orders).

**Field Install** table (right column, 15–20 rows):
- Mat'l Manhours
- APM Mark Haram
- ACM Hours
- Post Op Coating
- Plastic Wrap
- Layout
- Layout Install
- Single Skin Install
- Panel Install
- MH Install
- MH Install Hours
- QC Shipping
- Crating
- Shipped
- QC Final
- Rolled Up
- Sealed
- Corrugated Panel

**Billings** column (left, under Budget):
- Billed $
- Amount Received to Date $0
- Recognised Revenue $
- Retainage $
- Bill+AC $
- Actual: $1,550,992,68

**Change Order Budget** summary:
- Total Value of Submitted Change Orders $0.00
- Total Value of Approved Change Orders $0.00
- Total Value of Rejected Change Orders $0.00
- Total Value of Voided Change Orders $0.00

Bottom of page: **Project Schedule** Gantt (see §4).

### Our mapping
- **This is the single most important page to land Monday.** Chris explicitly described a "cradle-to-grave" pipeline on each project — this IS that screen in their current system.
- **Gap:** we have a project detail view but not at this fidelity. Needs:
  - Health-dot pattern (🟢🔴) + % gauges
  - Task-status donut
  - Project Links rail (link each to our internal route — Budget, COR Log, Forecast, Production, Charter, ROM, Field Daily Report)
  - Budget Overview tile with the 6 figures
  - Margin tile with Initial/Current/BAC
  - **Field Install progression table** — this is the real build-out tracker; 18 rows of install/shipping stages with counts. Needs its own DocType.
  - Billings tile
  - Change Order Budget summary (even if zero — structure must be there)
  - Gantt embedded below
- Use the Field Install column list as a **canonical install-progression checklist** (our equivalent of Chris's engineering-stage list).

---

## 4. Project Schedule (Gantt)
**File:** `10.11.10 PM.png`

Full-width Smartsheet Gantt view. Hierarchical WBS structure:
- **Project Schedule** (100%)
- **Pre-Con Jobs** (100%) — rolled up
- **Notice to Proceed** (100%)
- **Scheduling Turnover** (100%)
- **Project Charter** (100%)
- **Construction Schedule**
- **Project 360 Review**
- **Project Phase Gate** (100%)
- **Post Project Phase Gate** (100%)
- **Post Project Report** (100%)
- **Engineering** (0%) — under it: Submit Submitted, Design Document Complete, Engineering 3 Week Submittal, Engineering Review of Customer Final, Comment and Review, Project Initiation, Phase Gate Complete
- **Architectural** — under it: Project Turnover Meeting (100%), Preconstruction (0%)
- **6D — By GC** — Precon Meeting, Drawings, Pre-Con Schedule, Takeoff, Estimate, Review, Pricing Checkoff, Proposal

Each row: dates, % Complete, Predecessors, then a horizontal bar on the timeline grid (colored by discipline, with dependency lines).

### Our mapping
- **Gap:** no Gantt today. Options: (a) embed a JS Gantt lib (frappe-gantt, bryntum, dhx, wx-gantt); (b) use ERPNext's built-in Gantt view for Project/Task; (c) roll a simple SVG Gantt from Work Order dates.
- **Recommend:** ERPNext has `Project` + `Task` DocTypes with a usable Gantt. Wire our Gantt view to pull from there. Sufficient for Monday.
- WBS hierarchy = **Task parent/child** in ERPNext. Phases (Pre-Con, Engineering, Architectural, Post Project) = top-level tasks with sub-tasks.

---

## 5. Architectural ERF Form
**Files:** `10.12.23`, `10.12.32`, `10.12.35`, `10.12.37 PM.png`

Smartsheet web form. Sections + fields:

**ISSUE INFORMATION**
- Short Job ID (dropdown — IAD181, IAD181A, IAD181B, IAD181C, …)
- Release Type (dropdown)
- Release Number (text)
- Release Notes (long text)
- Description (long text)

**MATERIAL INFORMATION**
- Material in Stock (Yes/No radio)
- Post Production Coating (Yes/No radio)

**TIMING INFORMATION**
- Ship Target (date)
- Drafting Hours (number)
- Shop Hours (number)
- **Misc Materials** (long text, multi-line — sample content shows parts list like `12 TUBE 16 PLR CALKS / 16 PLR 21.25 / 16 PLR CLIP 2X3.125 / 16 PLR 21.25 TBE TRM CUT 2X3.5 / 16 PLR 21.25 TBE TRM CUT 2X3.125…` — this is basically a freeform BOM line)
- Shipping Method (dropdown)
- Crating Plan (long text)

**FILE UPLOAD**
- Drop zone for attachments

Bottom: "Send me a copy of my responses" checkbox + **Submit** button.

### Our mapping
- We have `/erf` (now `/arch/erf` via redirect). Go field-by-field and reconcile. Our version must accept the same field names so imports of real ERFs map cleanly.
- **Misc Materials** freeform text is the "Notes = evil" anti-pattern Chris wants to remove — but for parity with what they have today, keep the textarea and offer a structured-BOM-builder toggle next to it. Long-term: convert to Item picker.
- **File Upload** — we have File DocType in ERPNext; surface the same drop-zone UX.

---

## 6. Production Schedule — Kanban (engineering stages)
**Files:** `10.13.04 PM.png`, `10.13.41 PM.png`

Smartsheet Card View of the Production Schedule. Columns = engineering stages (matches the canonical list from the transcript):
Uncategorized · Evaluation · Float · LO · LO Check · Sketch · Sketch Check · Correction · CNC Programming · Laser Programming · Punch Programming · Program Complete

Each card shows:
- **Job ID** (e.g., `24079-BM02`, `25006-FS01`)
- Customer / short description line
- **Priority color bar** on left edge (red/orange/yellow/green/blue)
- Assignee avatars (circles)
- Small tags at bottom (maybe discipline / material)
- Comment count / attachment indicator

Cards are packed tight — looks like 80-120 cards visible. Drew's "100 cards, what the fuck do I do first" problem is visible at a glance.

### Our mapping
- **Gap:** we have a shop kanban but not an **Engineering kanban**. Build one with these 12 columns + cards driven by Work Order `custom_stage` field.
- Card must include: Job ID, customer, priority bar (derive from soft-prioritisation signals per transcript), assignee avatars, tag strip.
- **Critical for demo:** Chris said Drew will be protective of the schedule. This view IS the schedule — get it right.

---

## 7. Production Schedule — Grid View
**Files:** `10.13.17 PM.png`, `10.13.26 PM.png`

Same data, table form. Columns visible: Unique Tag · ID · Job Name · Job Address · PM · PM Phone · System · (no Release Notes) · Description · Included with this issue · Misc Materials · Production Folder (Q:\Jobs\…) · Release Status · Total Hours · Status (emoji) · Current Step · Pct Complete · (177 columns total per the xlsx).

### Our mapping
- This is the grid of truth — every row = a Work Order. We already have a table view; extend it to support **column picker** (177 cols is too many; let users pick sets).
- **Production Folder** column = `Q:\Jobs\{job_id}` — render as clickable UNC link. They open these in Windows Explorer; we should preserve the link.

---

## 8. Production Schedule — Shop Kanban
**File:** `10.15.00 PM.png`

Further right in the flow. Columns: Punch Programming · Program Complete · Released to Shop · AXYZ Titans One · AXYZ Titans CNC · AXYZ 34 (Led Well) · AXYZ 34 (Gigi Well) · AXYZ 34 SR · Titan (Well 36) · WXS1 · Trashack 01 · Trashack (Brand).

Fewer, longer cards per column. Cards are the same shape, different stage.

### Our mapping
- Same kanban component, different stage set. Driven by a `stage_group` filter.
- The column labels are **real station names** Drew uses — these must match the Workstation master data we're importing into ERPNext (currently AXYZ 34, AXYZ Titans, Cidan, Clean and Brake, etc. from the 1010 A Shop workbook).

---

## 9. Drew's Shipping Schedule (Excel)
**File:** `10.26.01 PM.png`

Fullscreen Excel with JWM logo. Title: **"SHIPPING SCHEDULE — Jobs All or Coming to Shipping"**. Columns: Job Number · Customer · Customer Part · Description · Size · Qty · Config · Due Date · Start Date · Est. Finish Hours · Shipping · Job Req · By Date · Qty Required · Qty Complete · Qty Shipped · Date · **Notes · Scheduling Notes · Check-off Notes**.

Sample row: `21204-1-1 · AMERICAN FABRICATE · ADS · DOOR FRAME VERTICAL NYCAL · … · 5/2/2026 · 3/22/2026 · …`.

**Bottom tabs** (=sheet names, each a different workstation queue):
Missed Outsource Receipts · MX · PXL · PBM · **FAB** · WM · **GRINDING** · **QC** · AL (laser?) · SLAB · SHRK · PROB · ARM · **ASM** · A22 · PDS · FOLBERT · **ENGSM** · **ACCT** · **SHIP**.

This is Drew's personal tool — he extracts data from the Smartsheet production schedule manually and re-schedules in Excel. It's the pain point we're replacing.

### Our mapping
- **Gap:** we don't have a dedicated **Shop Schedule** view per workstation yet (we have `/shop/{workstation}` stubs). Populate each with this grid shape, driven by Work Order + Operation data.
- The bottom-tabs list = our workstation list. Every one needs a view.
- The three `Notes` columns (Notes, Scheduling Notes, Check-off Notes) are free-form — preserve as fields but recommend a comment thread in the long-term version.
- **This is Drew's Monday-morning killer demo.** If he can do in 2 minutes in our UI what takes him an hour in Excel, we win him.

---

## 10. Smartsheet Workspaces Browser
**File:** `10.28.08 PM.png`, `10.28.14 PM.png`

Side panel lists ~40 JWM workspaces: JWM 1 Architectural · JWM Current Contracts · JWM Financial · JWM Field Reports · JWM Pre-Con Dashboards · JWM Precon · JWM Fabrication Workspace · JWM Internal Communication Management · JWM Cable Joint · JWM Executive · JWM Archive · JWM Fabrication Dashboards · JWM Scanners Workspace · JWM Equipment Dashboards · JWM Facilities and Maintenance · JWM Field · JWM Fleet · JWM Manning/Staffing · JWM Planning (Manning) · JWM Manufacturing · JWM Marketing/LinkedIn · JWM PM/HO Dashboard · JWM PM/HO Subscribers · JWM PM/HO Training · JWM PMO · JWM Precon · **JWM Programming Schedule** · **JWM Quality** · **JWM Safety** · **JWM Shop Schedule** · JWM Sprinter · JWM Training · JWM TSales · JWM Vendors/Offers.

The Quality workspace expanded shows **Inspection Check Sheets** etc.

### Our mapping
- This is the chaos we replace with **one** app. The sidebar we just built has **all** of this modeled under 10 sections.
- Cross-reference: our menu should have an entry (or link within a section) for every item that maps to a real division function. Notable gaps:
  - **Fleet** ✅ sidebar stub exists
  - **Safety** ✅ sidebar stub exists
  - **Facilities and Maintenance** ✅ (Maintenance)
  - **Equipment Dashboards** → should live under Shop Floor (per machine)
  - **Manning/Staffing / Planning** → HR-adjacent, currently missing — Phase 2
  - **Marketing/LinkedIn** → out of scope
  - **Training** → missing, Phase 2
  - **Vendors/Offers** → should live under Processing · Sales, or its own section
  - **Scanners Workspace** → maps to /arch/scanner (not yet built)
  - **Precon Dashboards** → under Architectural · Sales and Precon
  - **PM/HO Training / Subscribers** → under PM home

---

## 11. Our jwm-demo Efficiency Page (for comparison)
**File:** `10.29.22 PM.png`

Our actual build at `jwm-demo.beyondpandora.com/shop/efficiency`. Chris's reaction verbatim: "I think you got it handled because efficiency, I think I did a great job because it's very efficient... the kind of stuff that the AI tools are very good at because by that stage in the stack, there's so much data in the system that it's just pretty graphs and looking for patterns."

Shows: bar chart of operations by % efficiency (AL 60W plate 1/4 · AL 60W plate 2/14 · ASH FL · ASH FL 2+14 · ACM 8 · OCM 6 · OCM 5 · ANGLE 2+14), below = operator-level table (Operator · Workstation · Operation · Shift · Plan Qty · Act Qty · Plan Hrs · Act Hrs · Eff %).

### Our mapping
- **✅ Already built + Chris-approved.** Keep as is.

---

# Build gap summary (priority order)

| # | Gap | Priority | Where | Status |
|---|---|---|---|---|
| 1 | **Per-project Dashboard** (the IAD181-style page) — health gauges, budget/margin/billings tiles, Field Install progression table, project links rail, Gantt | **P0 for Monday** | `/arch/projects/[id]`, `/processing/work-orders/[id]` | Not built; stub only |
| 2 | **Engineering kanban** (12 engineering stages as columns) | **P0** | `/arch/erf` or `/engineering/pipeline` | Not built |
| 3 | **PMO My Projects** page (per-PM home) | **P0** | `/arch/pm/{user}`, `/people/pms/{user}` | Stub exists |
| 4 | **Exec Current Contracts** dashboard w/ real Sales/Pipeline/Backlog KPI tiles + role sub-dashboard index | **P1** | `/exec/arch`, `/exec/processing` | Stubs exist |
| 5 | **Shop Schedule per workstation** — Drew's Excel replacement w/ Notes/Scheduling Notes/Check-off Notes | **P1** | `/shop/{workstation}` | Stubs exist; populate real data |
| 6 | **ERF form field-parity** audit vs the Smartsheet form | **P1** | `/arch/erf`, `/processing/erf` | Partial |
| 7 | **Gantt view** on Project Dashboard | **P2** | reuse ERPNext Project Gantt | Not built |
| 8 | **Role-based sub-dashboards** (FM, FX, Precon, Office Mgr) | **P2** | `/people/{role}/{name}` | Not built |
| 9 | **Scanner Calendar** | P2 | `/arch/scanner` | Not built |
| 10 | **Vendors directory** | P2 | `/vendors` | Not built |
| 11 | **Document Manager** | P3 | reuse ERPNext File + tagging | Not built |
| 12 | **Production Folder link handler** (Q:\Jobs\…) | P3 | config toggle on Work Order table | Not built |

---

# What Monday looks like if we build #1–#3 tonight

**Landing:** Exec Current Contracts (#4 — stub OK with placeholder KPIs) → click "Architectural → Project Managers → Cole Noterra" → **PMO My Projects** (#3) → pick `25071 IAD181 Fitout` → **Project Dashboard** (#1) → scroll to see the Field Install progression, budget tiles, Change Order summary, Gantt → click "Production" link → **Engineering Kanban** (#2) filter to this job → see all its cards across the 12 stages.

That narrative is the demo. Everything else is colour.

---

Linked:
- [[MENU_ORDER]]
- [[2026-04-19 22-25 JWM Deep Dive Menu Routers and Demo Scope]]
- [[PRIMER]]
- [[DEMO_RUNBOOK]]

Attachments: `../screenshots/Screenshot 2026-04-19 at 10.09.54 PM.png` … `10.29.22 PM.png` (19 total).
