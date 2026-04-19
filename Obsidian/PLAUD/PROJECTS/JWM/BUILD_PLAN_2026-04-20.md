---
title: JWM Demo — Build plan incorporating transcript + Smartsheet reference
date: 2026-04-20
status: ACTIVE — implementation in progress
demo: Monday 2026-04-20 08:30 CT (approx T−14h)
---

# Build plan — incorporating 2026-04-19 transcript + Smartsheet screenshots

## Goal for Monday

Land three flagship screens that make the JWM team instantly recognise their current Smartsheet system in our UI:

1. **Project Dashboard** — the IAD181-style per-project page with Field Install progression, budget/margin/billings tiles, change-order summary, project links rail, and (if time) Gantt.
2. **Engineering Kanban** — 12-column card board matching the real Production Schedule kanban (Uncategorized → Release to Shop).
3. **PMO My Projects** — per-PM home page with active projects + progress bars + Forms buttons (ERF / 3D Request / Schedule It) + Upcoming Tasks + Budget Overview.

Everything else is supporting colour. If we're tight, cut features within a screen before cutting screens.

## Narrative flow for the demo

```
Landing:  /exec/arch  (KPI tiles populated with real data)
    ↓ click: Architectural → Project Managers → Cole Noterra
PMO home: /arch/pm/cole-noterra  (My Projects table)
    ↓ click a project row
Project:  /arch/projects/25071  (the IAD181 replica — health, budget, Field Install, Gantt)
    ↓ click Project Links → Production
Kanban:   /engineering/pipeline  (filtered to this job, 12 stages)
    ↓ click Shop Floor → Flat Laser 1
Shop:     /shop/flat-laser-1  (Drew's replacement)
```

## Workstream allocation (parallel tonight)

| # | Workstream | Agent | Priority | Target |
|---|---|---|---|---|
| A | Project Dashboard page | frontend-developer | P0 | `/arch/projects/[id]`, shared component lib |
| B | Engineering Kanban | frontend-developer | P0 | `/engineering/pipeline` |
| C | PMO My Projects | frontend-developer | P0 | `/arch/pm/[user]` |
| D | Exec Current Contracts KPI tiles | frontend-developer | P1 | `/exec/arch` |
| E | ERPNext data import (already running) | data-engineer | P0 (data) | backend |

D depends on real data being in ERPNext; may cut to hardcoded KPIs.

## Source-of-truth docs for every agent

- `/Users/mattwright/pandora/Obsidian/PLAUD/PROJECTS/JWM/MENU_ORDER.md`
- `/Users/mattwright/pandora/Obsidian/PLAUD/PROJECTS/JWM/SMARTSHEET_REFERENCE.md`  ← screenshot-by-screenshot map
- `/Users/mattwright/pandora/Obsidian/PLAUD/PROJECTS/JWM/2026-04-19 22-25 JWM Deep Dive Menu Routers and Demo Scope.md`  ← transcript + build deltas
- `/Users/mattwright/pandora/Obsidian/PLAUD/PROJECTS/JWM/attachments/Production Schedule_new.xlsx`  ← real Arch data (317 rows × 177 cols)
- `/Users/mattwright/pandora/Obsidian/PLAUD/PROJECTS/JWM/screenshots/`  ← Chris's actual UI

## Hard rules (carry from prior CLAUDE.md + feedback)

- **Use A Shop / T Shop** — never A-Sharp / T-Sharp.
- **Run ERPNext headless** — the custom Next.js UI is the demo.
- **Real data over placeholder.** Pull from ERPNext when import lands; fall back to canned only if API times out.
- **No new deps** unless essential. Lucide icons, Tailwind, recharts (already in), shadcn if already present.
- **Don't restart the dev server** — Matt has it running.
- **Free text → dropdowns where possible.**
- **Status emojis:** 🟢 On Track · 🔴 Overdue · 🟡 Warning · ❌ Not Found. Preserve raw in `jwm_raw_status`.

## Post-demo backlog (not tonight)

- Router/Route DocType + editor + cradle-to-grave pipeline viz on every Work Order
- NCR branching visualisation (loop-back vs side-path)
- Approval workflow on Sales → Engineering → Shop handover (email+button)
- Soft prioritisation assistant (LD + material + machine + profitability + lateness signals)
- Assembly BOM tree (parts → sub-assembly → final)
- Meleta panel releases DocType + view
- Ship Schedule bottleneck view (🔴 5+, 🟡 3–4, ⚪ 1–2)
- Role-based sub-dashboards (FM, FX, Precon, Office Manager)
- Scanner Calendar, Vendors directory, Document Manager
- Production Folder link handler (`Q:\Jobs\...`)
- Physical `git mv` of `/estimator` + `/erf` into their canonical parents
- Split Dashboard content between `/exec/arch` and `/exec/processing`

## Exit criteria for tonight

- [ ] All 3 P0 pages render with either live or canned data
- [ ] Sidebar nav reaches each P0 page in ≤2 clicks
- [ ] `bunx tsc --noEmit` clean
- [ ] `bun run lint` no new errors
- [ ] At least 3 real projects visible end-to-end (e.g., 24060-BM01 Loves Blacksburg, 25067-FS02 Harison Bend, 24051-FS225 TN Titans Stadium)
- [ ] Commit pushed to github.com/tenshimatt/jwm
