---
title: Awaiting-JWM Checklist
status: Open
updated: 2026-04-21
owner: sovereign.ai
---

# Awaiting JWM — what we need from Chris to flip screens live

Every item here corresponds to a screen in the shell currently tagged
`awaiting_jwm` in `shell/lib/data-sources.ts`. As each item lands, flip the
state in that file to `seeded` (point-in-time snapshot) or `live` (ERPNext
write path wired), and remove from this list.

Live dashboard mirroring this file: <https://jwm-demo.beyondpandora.com/admin/data-sources>

## Blocking asks (in priority order)

### 1. Spectrum GL export — Job cost actuals
- **Why**: unblocks `/exec/spectrum-drift` (Smartsheet vs Spectrum divergence). Chris's whole "why is Smartsheet wrong on 40% of jobs" thesis lives here.
- **Format**: point-in-time snapshot; CSV or xlsx fine. Columns minimum: job#, phase, labor $ to date, material $ to date, burden $ to date, last posting date.
- **Effort for Chris**: ~30 min in Spectrum report writer.

### 2. Panel Tracker sheet export
- **Why**: unblocks `/arch/panel-dashboard`; defines columns for the CNC-cutlist replacement (JWM1451-114). Chris demoed this 2026-04-20.
- **Format**: current Smartsheet / xlsx as-is.
- **Effort**: 5 min export.

### 3. Current Schedule of Values sample (one live job)
- **Why**: unblocks `/arch/projects/:id/sov` schema modeling.
- **Format**: any signed SOV PDF, or row export.
- **Effort**: 2 min.

### 4. Procurement log export
- **Why**: unblocks `/arch/procurement-log`.
- **Format**: current Smartsheet/xlsx. Columns needed: PO#, Vendor, Job#, ETA, status.
- **Effort**: 5 min.

### 5. Contracts register
- **Why**: unblocks `/exec/arch/contracts`.
- **Format**: even a list of job# → contract date + value is enough.
- **Effort**: 10 min.

### 6. Shipping schedule
- **Why**: unblocks `/shop/ship-schedule`.
- **Format**: current shipping Smartsheet export.
- **Effort**: 5 min.

### 7. NCR / rework / quality log
- **Why**: unblocks historical quality trend on `/qc`.
- **Format**: any format; even a PDF.
- **Effort**: 10 min.

### 8. Safety log / OSHA 300
- **Why**: unblocks `/safety`. Also answers: does JWM already use Safesite / SafetyCulture / other? If so, we bridge, not replace.
- **Format**: any.
- **Effort**: 10 min + one yes/no answer on the tool.

### 9. Maintenance / PM schedule
- **Why**: unblocks `/maintenance`.
- **Format**: whiteboard photo acceptable. Need equipment list + PM interval.
- **Effort**: 15 min walk-through, one photo.

### 10. Fleet roster
- **Why**: unblocks `/fleet/*` fully (~20 vehicles per Chris 2026-04-20).
- **Format**: plate #, type, home plant, driver.
- **Effort**: 30 min.

### 11. Historical workstation runtime (for scheduler calibration)
- **Why**: calibrates `/shop/scheduler` capacity model.
- **Format**: any Epicor export with Operation start/end timestamps over last ~6 months.
- **Effort**: Epicor report writer; ~1 hour.

### 12. Full Epicor export (optional, staged)
- **Why**: unblocks ~1,500 historical BOMs (JWM1451-55).
- **Format**: Chris's preference is point-in-time xlsx now, full production migration later after tailoring.
- **Effort**: coordinated with IT; ~half-day.

## Non-data asks

### A. Second-plant details (for HA plan)
See [[../20-architecture/ha-active-active-plan]] open questions 1–5.

### B. 130TB server specs
See [[../20-architecture/server-migration-plan]] open questions 1–5.

### C. GPU approval
RTX 6000 Ada ~$7k. See server-migration-plan § AI GPU.

## How to close an item

1. When data lands, drop the file into `Obsidian/PROJECTS/JWM/assets/<date>/`.
2. Write/extend the Python seeder in `jwm-demo/scripts/erp-import/`.
3. Flip the matching entry in `shell/lib/data-sources.ts` from `awaiting_jwm` → `seeded` (or `live` if write-path wired).
4. Remove or cross out the section here.
5. Commit with `JWM1451-<n>: close AWAITING_JWM / <item>` message.
