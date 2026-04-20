---
title: JWM PMO Summary Rollup — 2026-04-20 drop
date: 2026-04-20
source: Obsidian/PROJECTS/JWM/assets/2026-04-20/PMO summary/PMO Summary Rollup (11).xlsx
status: Draft — feature intake captured, tickets filed
owner: sovereign.ai
---

# PMO Summary Rollup — feature intake

Chris dropped the full PMO rollup (116 active projects × 46 cols) + a Summary sheet rolling headline financials. This is the system-of-record **cross-project view** that Chris uses to sweep health across the whole book without opening each project dashboard.

## Headline numbers (live as of export)

| Metric | Value |
|---|---|
| Total active projects | **116** |
| Total contract value | **$179.54M** |
| Total initial budget | $122.66M |
| Change order budget | $11.16M |
| Current budget | $132.24M |
| Actual cost | $51.56M |
| Projected spend | $49.22M |
| Budget remaining | $8.97M |
| Total billed to date | $78.29M |
| Total recognised revenue | $71.35M |
| **Profit** | **$47.30M** |
| **Average margin** | **26.3%** |
| Install jobs / Supply jobs | 86 / 29 |
| Cost to come | $71.7M |
| **Budget health (aggregate)** | **Red** |

## Columns map to build

The 46 columns fall into 6 groups — each maps to a UI surface we already have or need:

| Group | Cols | Where it lands |
|---|---|---|
| Project identity | Job Name, Short Job No, Job Number, Job Number 2, Type (Supply+Install / AMI), Archive flag, PM | `/arch/projects` list + filters |
| Health | Job Health, Budget Health, % Complete, Budget % Spent | Tiles + sortable columns |
| Schedule | Start Date, Finish Date | Gantt / ship target |
| Contract & budget | Contract Value, Initial Budget, Change Order Budget, Current CV, Current Budget, Budget To Be Allocated | `/arch/projects/[id]/budget` (Phase-2 ERPNext wire) |
| Actuals | Actual Cost, Committed Cost, Projected Spend, Budget Remaining | Same sub-tab |
| Billings | Cash Received, Recognized Revenue, Amount Billed, Last Billing Date, Left to Bill, Backlog, Billing Positive, Received - Actual Cost | `/arch/projects/[id]/billings` (new) |
| Margin / COR | Profit, Current Margin, Initial Margin, Markup Initial %, Markup CO %, Change Order Sell, Total Value of Executed/Submitted/Rejected/Voided CORs | `/arch/projects/[id]/cor-budget` + exec tiles |
| Spectrum reconciliation | Spectrum CV, Spectrum minus Smartsheet | `/exec/arch/spectrum-drift` (NEW — big value) |

## Highlights from the data (row sampling)

- **5 of first 10 projects** ≥ 95% complete with **Budget % Spent > 95%** — billing wind-down. Good test data for a near-close dashboard.
- **QTS-NAL1-DC1 (24018)** — Budget Health = Red despite Job Health = Green. That's the kind of row Chris wants surfaced on day one.
- **Dillon Bowman**, **Marc Ribar**, **Joe Hoyle**, **Laura Forero** are the heaviest PMs in this rollup. We had 4 PMs in the earlier demo; the real roster is bigger and includes Joe + Laura.

## Build gaps surfaced by this drop

1. **Exec PMO Rollup page** (new) — 116 rows × 46 cols as a sortable/filterable table at `/exec/pmo`. Headline totals tile strip above. **This is the screen Chris looks at to scan the whole book.**
2. **Spectrum vs Smartsheet reconciliation tile** — the "Spectrum minus Smartsheet" col is a drift indicator; render as a signed dollar badge per project + an aggregate "Spectrum drift" line on Exec. Direct demo of why this system replaces Spectrum long-term.
3. **Budget Health aggregate "Red"** surface — today the top-line Exec tile shows a green number; it should inherit the rollup health (red when >N% of projects are red).
4. **Seed live ERPNext Project records** from this export (116 Project docs + per-project budget/billings). Currently Projects are mostly inferred from Schedule Lines.
5. **Per-PM rollup** — each PM (incl. new ones: Joe Hoyle, Laura Forero) gets a named dashboard. Existing `/arch/pm/[user]` extends naturally.
6. **Archive flag** on projects — row 45 has a literal "Archive Project" column. Filter toggle on `/arch/projects`.

## Out-of-scope-for-now (captured here for later)

- Full PMO Comments sheet is empty in this export (single row). Suggests comments live per-row on the source Smartsheet — needs another pull.
- Spectrum linkage is canonical (has Spectrum CV + delta col). When we wire the Accounting module, this is the integration seam.

## Tickets filed

| Ticket | Title | Priority |
|---|---|---|
| TBD | Exec PMO Rollup page (116 projects × sortable table) | high |
| TBD | Spectrum vs Smartsheet reconciliation surface | medium |
| TBD | Seed live ERPNext Project records from PMO rollup | high |
| TBD | Per-PM rollup — add Joe Hoyle + Laura Forero; update canonical roster | medium |
| TBD | Archive flag + filter on /arch/projects | low |

Linked: [[2026-04-19-deep-dive]] · [[2026-04-20-demo-day]] · [[SMARTSHEET_REFERENCE]] · [[../40-operations/DEMO_RUNBOOK]]
