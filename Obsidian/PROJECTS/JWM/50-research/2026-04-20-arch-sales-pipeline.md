---
title: JWM Architectural Sales Pipeline — 2026-04-20 drop
date: 2026-04-20
source: Obsidian/PROJECTS/JWM/assets/2026-04-20/Arch Sales/JWMCD Arch Sales (3).xlsx
status: Draft — feature intake captured, tickets filed
owner: sovereign.ai
---

# JWMCD Architectural Sales Pipeline — feature intake

JWM's Arch Sales pipeline export: **1,998 opportunities × 48 columns** + **18,381 per-row comments**. This is the full sales funnel going back to 2021 — the "Sales and Precon" surface Chris already has a slot for in the menu but we haven't populated.

## Headline pipeline numbers

| Metric | Value |
|---|---|
| Total opportunities | **1,952** |
| Won | **322** ($279.76M value) |
| Lost | 1,276 ($1.38B of losses) |
| Active (in-flight) | 27 |
| Submitted (awaiting decision) | 213 |
| No-bid | 82 |
| **Win rate** | **18.8%** |
| Sum of active/submitted bids | **$460.89M** |
| Total NSF out there (not lost) | 7,107,861 sf |
| Genesis-system jobs | 46 |
| Average markup | 45.3% |
| Avg Supply markup | 49.6% |
| Avg Install markup | 42.4% |

## Per-estimator leaderboard (from Summary sheet)

Summary sheet rolls up per-estimator. Notable (from first sampling):

- **Milos Radovic**: 44 active, 39 submitted, 116 won, 442 lost — 18.0% win rate, 5 currently active
- Summary sheet has 117 rows — likely one block per estimator × stage. Real per-person stats live.

## 48 columns — UI mapping

| Group | Columns | UI surface |
|---|---|---|
| Identity | Project Name, Stage, Received Date, Bid Date, Follow-up Date, City, State | `/arch/sales` pipeline view |
| Who | Estimator/Sales, Ball-in-court, Contact Name, Contact Phone #, Company, Company Helper, Customer Code, NDA | Opportunity detail |
| $ | Total Bid Value, Metal Bid Value, Glazing Bid Value, Markup, Margin, Actual Close Value, Forecast Close Value | Money panel |
| Scope | Job Type, Install Type, Est Vendor, Onsite Schedule, Total NSF, Scope | Scope tab |
| Competitive | Bid 1, Bid 2, Bid 3, Bid 4 | Competing quotes panel |
| Follow-up | Close Probability, Tasks, Follow up Date, Third Follow up, Second Follow up, Latest Comment | Follow-up workflow |
| GP analytics | Avg Sold GP%, Sum Avg Sold GP%, Avg Closed GP%, Sum Avg Closed GP%, Avg WIP GP%, Sum Avg WIP GP%, Avg Payment Days | Exec-side GP dashboard |
| Meta | Year, Date of Contract, Won/Lost Date, Comments (+ 18,381-row comment thread) | Audit trail |

## Comments thread

**18,381 rows** of per-opportunity notes spanning 2021 → 2024. Columns: `Row N · Comment · Author · Timestamp`. This is the deep context for every bid — sales conversations, follow-ups, reasons-lost. Ingest + search = killer feature for the next estimator onboarding.

## Stages observed

Sampling shows: `Lost`, `Won`, `Submitted`, `Active`, `No Bid`. Plus `Scope` content includes per-bid technicals (Curtain Wall / Storefront / ACM / Canopy / etc.). Phase-2: derive canonical stage enum + validate.

## Build gaps surfaced

1. **`/arch/sales` pipeline board** — new. Kanban-style columns by Stage (Active · Submitted · Won · Lost · No-bid) with 27 active + 213 submitted surfaced prominently; older closed rows paginated/filterable. Click → opportunity detail.
2. **Opportunity detail page** — `/arch/sales/[opportunityId]` with money panel · contact panel · follow-up log · comments thread (18K rows — reuse a lazy-scroll / search pattern). Deep link to a customer master (once we have one).
3. **Sales & Precon Leaders dashboards** — Chris's original menu had "Mike Noterra · Caleb Fanice · Kevin Florde" leader boards; now we have real per-estimator data. Auto-build from the Summary sheet shape.
4. **Estimator → PM handoff** — a won opportunity has a linkable outcome (becomes a project). Build the handoff link: Won opp → "Create Project" CTA → pre-fills the PMO new-project workflow from the Sales row (Contract Value = Actual Close Value, PM assignment, contact copy).
5. **Sales GP analytics tile** — Avg Sold GP%, Avg Closed GP%, Avg WIP GP% rolled up on the Exec dashboard so the Sales → Delivered profitability gap is visible.
6. **Seed ERPNext Opportunity records** from this 1,998-row export. ERPNext has a stock `Opportunity` DocType; wire it.

## Out-of-scope-for-now

- Genesis-system tagging (46 jobs) — a specific product line. Filter chip, not a module.
- Third/Second follow-up columns suggest a scheduled follow-up cadence exists. Captures a workflow ticket.

## Tickets filed

| Title | Priority |
|---|---|
| Build /arch/sales opportunity pipeline board | high |
| Build /arch/sales/[id] opportunity detail + comments | high |
| Seed ERPNext Opportunity records from Arch Sales xlsx (1,998 rows) | high |
| Sales & Precon Leaders dashboards (per-estimator) | medium |
| Won-opportunity → "Create Project" handoff to PMO | medium |
| Sales GP analytics tile on /exec/arch | medium |
| Follow-up cadence workflow (Second / Third Follow-up columns) | low |

Linked: [[2026-04-19-deep-dive]] · [[2026-04-20-demo-day]] · [[2026-04-20-pmo-summary]]
