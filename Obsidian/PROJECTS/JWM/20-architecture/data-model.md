---
title: JWM Data Model
status: Built
updated: 2026-04-20
owner: sovereign.ai
---

## Custom DocTypes (`jwm_manufacturing` app)

### JWM Production Schedule Line (headline — 3,948 rows)

Chosen over stock `Work Order` because WO requires `bom_no` + `fg_warehouse` (blocker — JWM source data has neither).

Fields (`jwm_` prefix convention):
- `jwm_job_id`, `jwm_job_name`
- `jwm_pm` — project manager
- `jwm_department` (1010 = A Shop / Architectural, 1040 = T Shop / Processing)
- `jwm_stage`, `jwm_priority`
- `jwm_ship_target`
- `jwm_raw_data` — full 177-col JSON blob from source spreadsheet
- `jwm_raw_status` — original cell text preserved
- Status emojis: 🟢 On Track · 🔴 Overdue · 🟡 Warning · ❌ Not Found

### JWM Daily Efficiency (430 rows)

Backs Drew's 6 KPIs on `/shop/efficiency`.

Fields: `jwm_operator`, `jwm_workstation`, `jwm_operation`, `jwm_shift`, `jwm_plan_qty`, `jwm_act_qty`, `jwm_plan_hours`, `jwm_act_hours`, `jwm_efficiency`

### Others (pre-existing)

- `JWM NCR`, `JWM CAR`, `RMA` — quality control
- `JWM Overrun Allocation` — budget overrun tracking
- `Project Traveler` — job routing

## Work Order custom fields

- `jwm_division` (Processing / Architectural / Mixed)
- `jwm_baseline_date`
- `jwm_revised_date`

## Company

- Display: "John W. McDougall Co."
- **LinkField value everywhere: `JWM`** — hard-code this in every script. Do not rename; add an alias if needed.

## Phase 2 gaps

- BOM-required-for-WO workaround: auto-generate single-item BOMs + default warehouse (`Stores - JWM`), backfill ~1,500 WOs, re-link Schedule Lines
- Missing custom fields: richer `jwm_pm`, `jwm_stage`, `jwm_priority` backing data
- Six new DocTypes needed for Epicor parity: Job Release, Production Hold, Efficiency Event, Machine Downtime, Engineering Assignment, Scheduling Override
- ~50 custom fields + ~40 Operation master records
- Preserve "Uses Workaround" flag logic until Phase 3 replaces scheduling engine

## Related

- [[erpnext-schema]]
- [[../30-decisions/002-custom-schedule-line-doctype]]
- [[../50-research/council/02-data-model-analysis]]
