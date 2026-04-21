---
title: Historical Data Ingestion Plan — JWM
status: Draft
updated: 2026-04-21
owner: sovereign.ai
plane: JWM1451-113
---

# Historical Data Ingestion Plan

Chris's 2026-04-20 demo ask:

> "Wherever you started capturing digital records we would aim to keep in here... run algorithms that can look into the data and see trends, anomalies."

This doc enumerates JWM's known digital systems, the proposed capture order, and the policies that govern what we keep vs. summarise vs. discard.

## Inventory of known digital sources

| System | Era | Record volume (est.) | Notes |
|---|---|---|---|
| **Epicor** (legacy ERP) | 2015→present | ~50k Work Orders, ~200k Stock Ledger entries, full GL | Currently the system of record for finance. Partial dump received 2026-04-20 (3,153 ops rows). Full dump pending IT export approval. |
| **Spectrum** (accounting) | 2018→present | Full GL + AR/AP + Payroll | Primary for finance. `Spectrum CV` column in PMO rollup shows drift vs Smartsheet. |
| **Smartsheet** (operational) | 2020→present | ~116 active project workbooks, ~4-year sales pipeline (1,998 opps, 18k comments) | **Already ingested** (Phase 1): 3,948 Production Schedule Lines, 1,998 Opportunities, 6,010 Comments. |
| **Excel / Drew's workbooks** | 2020→present | Shop schedule, efficiency log, Tshop estimator (R18) | **Already ingested** (Phase 1): 430 Daily Efficiency rows, Tshop estimator materials. |
| **Panel Tracker** (CNC vendor freeware) | 2018→present | Per-cutlist run history, scrap rate | Low fidelity; we replace this tool (JWM1451-114). |
| **Field office (paper → scans)** | 1940s→~2015 | Unknown — likely thousands of drawings, submittals, POs | Out of scope for initial ingestion. Candidate for a "document vault" in Phase 3. |
| **Photos (phones + DSLRs)** | ~2010→present | Tens of thousands of install/fab photos | Partial — Matt has already wired photo capture on the shop kiosk (JWM1451-108). Historical photo backfill = Phase 2. |
| **Emails + calendars** | 1998→present | High volume, most not useful; specific threads are gold (Chris's Gmail has context on every won deal) | Opt-in per-project extraction only. |

## Phased plan

### Phase 1 — DONE
Captured on 2026-04-20/21:
- PMO Rollup (116 active projects) → ERPNext Project DocType + 39 custom fields
- Arch Sales Pipeline (1,998 opps + 6,010 comments) → ERPNext Opportunity + Comment DocType
- Production Schedule (3,948 lines) → JWM Production Schedule Line custom DocType
- Daily Efficiency (430 rows) → JWM Daily Efficiency custom DocType
- Engineering roster (15 employees)

### Phase 2 — Epicor full dump (weeks 1–4 post-contract)

**Trigger:** IT sign-off on Epicor database export.

1. **Items & BOMs** — unblocks ~1,500 Work Orders currently blocked by missing BOMs (JWM1451-55). First priority — it's on the critical path to shop-floor integration.
2. **Routings** — ordered operations per item → feeds our Route DocType.
3. **Stock Ledger** — opening balances + ~5-year movement history. Enables WIP tracking and ageing.
4. **Historical Work Orders** — closed WOs back to 2020 so we have cycle-time baselines per operation.
5. **Sales Orders + Quotations (won side)** — matches our Opportunity data; gives us unit pricing history.
6. **Purchase Orders + Receipts** — vendor spend history, lead-time analytics.

### Phase 3 — Spectrum finance (weeks 5–10)

1. Chart of Accounts + mapping to ERPNext ledger.
2. Customer + Supplier master (cross-check against current 93 Customers).
3. AR aging + AP aging. Invoice history.
4. GL transactions — summarise by month for older data, keep full detail for last 24 months.

### Phase 4 — Photos + field data (ongoing)

1. Tag + ingest existing install photos (Dropbox / phone backups).
2. Historical Field Dailies from paper backfill (where feasible).
3. Drawing archive — OCR + tag + link to Projects.

## Keep / summarise / discard policy

- **Keep full detail**: last 24 months of transactional data + all data for currently-active projects + all won-opportunity closing details.
- **Summarise**: monthly rollups for older-than-24-months GL, AR/AP, inventory movements.
- **Discard**: nothing. Cold-storage S3-compatible bucket on JWM infra for anything we can't justify indexing.

## Data quality guards

- Idempotent imports keyed on deterministic natural keys (job number, opportunity project name + received date, invoice number, etc.)
- Per-import `jwm_raw_data` JSON blob on every Frappe record — preserves the source row exactly, even if we mis-map columns initially.
- Script logs checkpoint to `scripts/erp-import/logs/` for resume-after-failure.

## Open questions for Chris

1. Who owns Epicor export authority? IT? Finance?
2. Does Spectrum have a standard export format (CSV / CSV+XML), or do we need an ODBC/API extract?
3. Is there a retention regulation we need to honour (e.g. 7 years for tax records)?
4. Any sensitive data (payroll, SSN) needs to stay out of ERPNext? Separate vault?
5. Photo volume estimate?

## Related

- [[epicor-migration-plan]] — Phase-1 Epicor-specific breakdown
- [[data-model]] — current ERPNext schema
- [[../30-decisions/001-headless-erpnext]]
