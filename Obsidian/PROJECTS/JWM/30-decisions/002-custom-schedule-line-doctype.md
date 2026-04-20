---
title: ADR-002 — Custom Production Schedule Line DocType
status: Built
updated: 2026-04-20
owner: sovereign.ai
---

# ADR-002: `JWM Production Schedule Line` over stock `Work Order`

## Context

Phase 1 import attempted to load 3,948 job rows into stock ERPNext `Work Order`. ERPNext Work Order has hard validation: requires `bom_no` + `fg_warehouse`. JWM's source data has **neither** — Items are per-job (`24060-BM01`), no BOM history, no warehouse mapping. Attempting full WO creation produced 1,272+ LinkValidationErrors and blocked the import.

## Decision

Create a custom DocType `JWM Production Schedule Line` in the `jwm_manufacturing` app. Push all 3,948 rows there with a `jwm_raw_data` JSON blob for the full 177-column original. Only 28 Work Orders created (pre-seeded). Schedule Lines are the headline object for Phase 1; Work Orders remain an edge case.

## Consequences

- Phase 1 demo works — shop scheduler + efficiency grids bind cleanly to Schedule Line.
- Phase 2 unlock plan: auto-generate single-item BOMs per Item + default `Stores - JWM` warehouse, then backfill ~1,500 Work Orders and re-link Schedule Lines.
- Reports / dashboards query Schedule Line, not WO, until Phase 2.
- Extra DocType to maintain in migrations.

## Date

2026-04-19

## Status

Accepted (revisit at Phase 2 unlock)
