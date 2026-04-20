---
title: Epicor → ERPNext Migration Plan
status: Draft
updated: 2026-04-20
owner: sovereign.ai
---

# Epicor → ERPNext Migration Plan

Analysis of the single Epicor export Chris provided (`Epicor Data.xlsx`, 220 KB) as a proxy for a future full database dump. This document is a **planning artefact only** — no ingestion is performed here.

## Source inventory

| Sheet | Rows × Cols | Content summary |
|---|---|---|
| Epicor Data | 3,153 × 17 | **Job-Assembly-Operation router rows.** One row per (Job, Assembly, Assembly Seq, Station). Every row is denormalised with Job header fields (customer, PM, sales rep, ship target, quantities) repeated. |
| Comments | 1 × 1 | Empty placeholder sheet. No content. |

### Columns (sheet 1)

`ID` (Job number, e.g. `152384-22-1`) · `Job Name` (=customer name, misleading header) · `Assy Part Number` · `Parent Assy` · `Assy Seq` · `Part Number` · `Station` (op code: QA/FM/OS/FL/WE/ASM/PEM/PU/TL/FIN/SHIP/ROLL/KIT/MA/GRINDING/ACCT/DRAFT/PGM/SHEAR) · `Ship Target` · `Epicor Calc Date` · `Job Qty` · `Oper Req Qty` · `Oper Completed Qty` · `PM` · `Sales Rep` · `Epicor Row ID` (GUID) · `Part Qty` · `Shipped?`

### Key cardinalities (computed)

- 627 unique Jobs
- 34 unique Customers (subset of the 92 already in ERPNext)
- 276 unique Assembly Part Numbers
- 423 unique Part Numbers (Items)
- 1,349 unique (Job, Assembly, Assy Seq) combinations — i.e. ~1,349 work-order candidates
- 19 distinct Station codes (Operations)
- 4 Project Managers (`ACARMICH` 2222, `LELLISON` 685, `OBUSMAN` 119, `HSADLOSK` 2) + 125 nulls
- 5 Sales Reps + 467 nulls
- Shipped flag: 2,761 True / 392 null — majority of rows are historical closed work

## Entity mapping

| Epicor entity (column/group) | ERPNext DocType | Dedup key | Notes |
|---|---|---|---|
| `ID` (Job number) | Work Order | `name` (= Epicor Job ID) | 627 jobs → ~1,349 WO rows once assembly-seq is factored. Blocked today because BOMs/routings missing. |
| `Job Name` | Customer | `customer_name` | All 34 already present among Phase-1 92 customers; no new customers from this export. |
| `Assy Part Number` + `Part Number` | Item | `item_code` | 423 new part codes. Overlap with the 2,197 per-job Items already loaded needs dedup — Epicor uses canonical part numbers (e.g. `1503010800`), not per-job suffixes. **This is the right source for a real Item master.** |
| (Assy Part Number → child Part Numbers via Assy Seq) | BOM | `item` + `is_default` | Flat BOM can be inferred from (Assy Part → Part) rollup. Multi-level structure implied by `Parent Assy` but all rows show `0.0` — likely single-level in this sample. **Unlocks Phase-2a Work Order creation.** |
| `Station` (19 codes) | Operation | `name` | Most already seeded (33 Operations). Verify codes like PEM, TL, FIN, ROLL, KIT, PGM, SHEAR exist; add missing. |
| (Station sequence per Assembly) | Routing / BOM Operations | `name` | Derive routing by ordering rows within `(Job, Assy Part, Assy Seq)` by `Epicor Row ID` or a dedicated sort field from a future dump. |
| `Oper Req Qty` / `Oper Completed Qty` | Work Order → Job Card (`total_completed_qty`) | composite | Per-operation progress — enables realistic in-flight WO hydration. |
| `Ship Target`, `Epicor Calc Date` | Work Order `expected_delivery_date`, `planned_start_date` | — | Use to populate schedule fields. |
| `PM`, `Sales Rep` | Employee / custom fields on Sales Order / Work Order | user id | Map Epicor user IDs (ACARMICH, TWOODWARD, etc.) to ERPNext User/Employee records. |
| `Shipped?` | Work Order `status` (Completed) + Delivery Note existence flag | boolean | Drives which WOs come in as Completed vs In-Progress. |
| `Epicor Row ID` (GUID) | custom field `custom_epicor_row_id` on Work Order Operation | GUID | Keep for audit lineage back to Epicor. |
| `Job Qty`, `Part Qty` | Work Order `qty` | — | Header qty vs component qty; reconcile before import. |

## Known gaps vs a full Epicor dump

This single export is **operational/scheduling only**. A real Epicor dump would also include, and this file **does not**:

- Item master (descriptions, UOM, valuation, lead time, safety stock)
- True multi-level BOMs (revisions, effective dates, scrap %, sub-assembly structure)
- Routing detail (setup/run times, resource groups, subcontracting)
- Inventory / Stock Ledger (on-hand, bin locations, lot/serial)
- Sales Orders, Quotations, Invoices
- Purchase Orders, Receipts, AP invoices, Supplier master
- GL / Chart of Accounts / Journal Entries
- AR / AP ledgers, payments, aging
- Customer contacts, addresses, credit terms
- Employee / Payroll / Labour tickets
- Time & attendance, actual shop-floor clock-ins
- Quality records, non-conformances, CAPA
- Shipping (BOLs, packing lists, tracking)

Only the thinnest operational slice (which job, which part, which station, how much shipped) is represented.

## Ingestion plan (phased)

### Phase 2a — foundational (unblocks Work Orders)

Goal: turn the 28 partial Work Orders into ~1,349 creatable Work Orders by filling the BOM + Routing gap.

1. **Item reconciliation.** Compare 423 Epicor part numbers against 2,197 existing Items. Create the canonical ones; flag the per-job-suffixed duplicates for future cleanup. Do **not** delete; just deprecate.
2. **Flat BOM import.** One BOM per unique `Assy Part Number`; children = `Part Number`s on rows with that assembly. Qty from `Part Qty`.
3. **Routing import.** Per-assembly sequence of Operations derived from `Station` values, ordered by row appearance. Placeholder setup/run times (0) until real Epicor routing data arrives.
4. **Work Order backfill.** For each `(Job, Assy, Assy Seq)`, create a Work Order linked to the new BOM and Routing; status = Completed if `Shipped? == True`, else In-Progress with `produced_qty = Oper Completed Qty`.
5. **Operation status hydration.** Populate Job Cards per Work Order Operation using `Oper Req Qty` / `Oper Completed Qty`.

### Phase 2b — historical context

Not achievable from this export; requires a second Epicor pull.

1. Stock Ledger entries (on-hand positions + historical movements)
2. Past Sales Orders and closed Quotations (with line items)
3. Purchase History (POs, Receipts, AP invoices)
4. Shipping history → Delivery Notes

### Phase 3 — finance

Requires finance tables from Epicor **and** a reconciliation with Spectrum/QuickBooks (whichever is the current books-of-record).

1. Chart of Accounts with Spectrum/QB mapping
2. AR/AP ledgers + open balances
3. GL summary + opening balances
4. Fiscal year cut-over plan

## Data quality risks

- **Emoji statuses in JWM Production Schedule (🟢🔴🟡❌)** vs Epicor's terse text codes → build a normalisation dictionary before any cross-join.
- **UOM inconsistencies** (EA vs PC vs SF) — not visible in this export but will hit immediately with a real Item master.
- **Customer name canonicalisation** — `Job Name` field contains customer names with varying punctuation ("AKG North American Ops - NC" vs "AKG North American Operations, Inc. - SD"). Fuzzy-match against the 92 Phase-1 Customers.
- **Part number conflicts** — existing ERPNext Items use per-job codes (`24060-BM01`); Epicor uses canonical (`1503010800`). Expect many-to-one mappings.
- **Numeric part numbers stored as floats** (`1503010800.0`) — cast to string before keying.
- **Null PM / Sales Rep** (125 / 467 rows) — decide fill strategy (inherit from Job header? leave blank?).
- **`Parent Assy` all zero** in this sample — real multi-level structure may exist in full dump; do not hard-code single-level assumption.
- **`Epicor Row ID` GUID** is per-operation, not per-job. Not a natural dedup key for Work Orders.
- **"Shipped?" only True/null** — no False. Cannot distinguish "cancelled" from "in progress" without more fields.

## Scripts to write (Phase 2a)

| Script | Purpose | Dependencies |
|---|---|---|
| `10_epicor_item_reconcile.py` | Diff 423 Epicor parts vs existing 2,197 Items; emit merge plan CSV for human review | openpyxl, requests, _frappe.py |
| `11_bom_import.py` | For each Assy Part Number, create BOM with children + qty | 10 |
| `12_routing_import.py` | Derive operation sequence per assembly, create Routing, link to BOM | 11 |
| `13_work_order_backfill.py` | Create Work Order per (Job, Assy, Assy Seq); set status by `Shipped?`; populate Job Cards from op qty | 11, 12 |
| `14_customer_fuzzy_merge.py` | Fuzzy-match 34 Epicor customer strings against 92 ERPNext Customers; emit proposed merges | rapidfuzz |

All scripts follow the Field Daily pattern (openpyxl → Frappe REST, dry-run first, idempotent via natural keys).

## Effort estimate

- **Phase 2a:** ~1 day (5 scripts + dry-run validation + human review of Item/Customer merge CSVs)
- **Phase 2b:** not executable from this export — blocked until Chris provides a second Epicor pull
- **Phase 3:** ~5 days once finance tables arrive, plus a finance SME session with Chris

## Open questions for Chris

1. Is `Assy Part Number` the canonical part (item master key) or a job-specific assembly instance?
2. Can you pull a second export covering **Item master + Stock + open SO/PO** from Epicor? Same format is fine.
3. Why is `Parent Assy` always 0 here — does Epicor actually have multi-level BOMs in production, or is JWM's work genuinely single-level?
4. Is "Shipped?" authoritative or just a convenience flag? What's the real "job closed" signal in Epicor?
5. PM/Sales Rep user codes (ACARMICH, TWOODWARD, etc.) — do you want these as ERPNext Users/Employees, or just string tags?
6. Which system is the current books-of-record for finance — Spectrum, QuickBooks, or still Epicor for some modules? (Drives Phase 3 cut-over direction.)
7. Any per-operation standard times (setup/run minutes) available separately? Current export has qty but no time.
8. Do you want historical closed Work Orders imported as Completed, or should we only bring in currently-open jobs to keep the system clean?
