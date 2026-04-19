# JWM Demo Runbook — Monday Stakeholder Meeting

This runbook covers the Monday-morning narrative for Chris Ball (COO), with
the three new "source-of-truth" deliverables Matt committed to on Friday:
the Scheduler, the Efficiency Dashboard, and the Data-Entry Form.

## Opening (Minute 1-3)

The new opening sequence lands the "we understand your world" beat *first*,
before any generic ERP screens.

1. **`/shop`** — Shop Floor Overview.
   Start here. Large workstation tiles with queue counts, urgent flags, and
   the anomaly bell already live in the top bar.

2. **`/shop/scheduler`** — THE view Drew uses.
   Pitch: "This is the `1040 T Shop Production Schedule.xlsx` and `1010 A
   Shop Production Schedule.xlsx` that Drew maintains by hand — same row-per-
   job, columns in manufacturing sequence, same colour coding. Only now it's
   alive, filterable, and clickable."
   Filter to Processing, point at a red "Behind" cell, click the row to open
   the detail drawer. Say: "What Drew spends his morning updating in Excel,
   the system now updates from the shop floor."

3. **`/shop/efficiency`** — Drew's 6 KPIs live.
   Pitch: "Friday, Chris asked whether we could surface the 6 KPIs Drew
   tracks in Daily Efficiency Log.xlsx. Here they are." Walk the tabs:
   By Operation → By Material → By Operator → Est vs Actual Labour →
   Est vs Actual Material → Part History.
   Point at the Flat Laser #2 dip on the 14-day trend and on the "Worst
   Workstation Today" KPI — that ties to the existing anomaly / scrap story.

4. **`/shop/efficiency/new`** — The data entry form.
   Pitch: "And here's how the data gets in. Ten fields. Submit at end of
   shift. Feeds the dashboard immediately."
   Fill operator = Hannah R., workstation = Flat Laser #2, Actual Hours
   higher than Planned, click "AI-suggest cause" — show the heuristic
   stub — submit. Return to `/shop/efficiency` to show the new row at the
   top of Today's Entries.

## Mid-demo (Minute 3-12)

5. `/shop/flat-laser-2` — kiosk view (built Phase 1).
6. `/erf` — Engineering Release Form queue (built Phase 1).
7. `/planner/WO-2026-00218` — Work Order / routing.
8. `/estimator` — PDF-to-quote tool.
9. `/dashboard` — exec KPIs overlay.
10. "Ask John" AI chat — always accessible top right.

## Technical notes

- Efficiency store is canned (`lib/canned/efficiency-events.json`, 91
  records across 14 days, intentional Flat-Laser-#2 dip matching the scrap
  anomaly story).
- Scheduler grid is canned (`lib/canned/scheduler.json`, 24 jobs ×
  15 workstation columns).
- New records submitted via the form are held in a process-local array
  (`lib/efficiency-store.ts`); they persist across dev-server hot reload
  (globalThis) but reset on full restart. Intentional for demo.
- Phase 2: replace both canned stores with ERPNext DocTypes + REST client.

## Verification steps

Before the demo, verify locally:

```
cd /Users/mattwright/pandora/jwm-demo/shell
bun run build          # must end clean
bun run dev            # starts on :3100
open http://localhost:3100/shop/scheduler
open http://localhost:3100/shop/efficiency
open http://localhost:3100/shop/efficiency/new
bun scripts/shot-monday-3.ts    # regenerate screenshots
```

Screenshots live at `shell/screenshots/monday-3/`:
- `01-scheduler.png`
- `02-efficiency-dashboard.png`
- `03-efficiency-new-form.png`
