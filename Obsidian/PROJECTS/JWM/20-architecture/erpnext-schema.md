---
title: ERPNext Schema — Current State + Phase 2 Gaps
status: Built
updated: 2026-04-20
owner: sovereign.ai
---

## Current state (Phase 1 live)

### Frappe app

`jwm_manufacturing` — custom app on top of ERPNext Manufacturing.

### Core DocTypes in use

| DocType | Rows | Purpose |
|---|---|---|
| `JWM Production Schedule Line` | 3,948 | Headline — every job row |
| `JWM Daily Efficiency` | 430 | Drew's KPI source |
| `JWM NCR` / `JWM CAR` / `RMA` | seed | Quality |
| `JWM Overrun Allocation` | seed | Budget |
| `Project Traveler` | seed | Routing |
| `Work Order` (stock) | 28 | Skipped most — BOM blocker |
| `Workstation` | 12 | Seeded |

### Custom fields

Work Order: `jwm_division`, `jwm_baseline_date`, `jwm_revised_date`

Schedule Line: full `jwm_` prefix set (see [[data-model]])

## Phase 1 blockers hit

1. **Work Order requires `bom_no` + `fg_warehouse`** — JWM source has neither. Workaround: `JWM Production Schedule Line` DocType instead. Only 28 WOs created.
2. **Company LinkField value is `JWM`** not "John W. McDougall Co." — caused 1,272 LinkValidationErrors before fix.
3. **Status emojis preserved in `jwm_raw_status`** — never drop original cell text.

## Phase 2 gaps (plan)

- Auto-generate single-item BOMs per Item
- Default warehouse: `Stores - JWM`
- Backfill ~1,500 Work Orders, re-link Schedule Lines to WOs
- Missing backing data richer `jwm_pm`, `jwm_stage`, `jwm_priority` fields
- Six new DocTypes for Epicor parity (see [[data-model]])
- ~50 custom fields + ~40 Operation master records

## Related

- [[data-model]]
- [[../30-decisions/002-custom-schedule-line-doctype]]
- [[../50-research/council/02-data-model-analysis]]
- [[../50-research/council/03-epicor-scope]]
