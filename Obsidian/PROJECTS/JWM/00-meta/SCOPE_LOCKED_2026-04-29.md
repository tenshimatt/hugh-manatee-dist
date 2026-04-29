---
title: JWM Scope — locked after Chris+Paul email thread 2026-04-29
status: Active
updated: 2026-04-29
owner: sovereign.ai
plane: JWM-scope
---

# JWM Scope — locked 2026-04-29

This supersedes the 2026-04-28 PRODUCTION_SCOPE.md which had a "3-week" framing. Real timeline per Chris + Paul email thread is below. PRODUCTION_SCOPE.md in https://github.com/tenshimatt/jwm has been updated to match.

---

## Timeline (binding)

| Phase | Scope | Target |
|---|---|---|
| **Phase 1** | Engineering → Shipped, **including Inventory + Quality** | **Live + in testing end August 2026** (~4 months) |
| **Phase 2** | PM operations (1010 + 1040), Fleet, Machine maintenance, Safety, Facilities | **All live by end November 2026** |

The 3-week framing from yesterday is **dead**. We have ~4 months for Phase 1 — enough time to do it right, no excuse to cut corners.

---

## Phase 1 flow (corrected from yesterday's draft per Paul's review)

```
ERF (Architectural OR Processing — possibly separate for ACM)
  ↓
Engineering — categorisation / coding / programming
  ↓
Router — auto-suggested, human-gated review
  ↓
Shop — work dispatched per machine
  ↓
Machine dissemination — operator start / stop / handoff
  ↓
QC — in-process + approval for inventory-bound product (NOT terminal)
  ↓
Shipping — FINAL sign-off for completed orders ← this is the close
```

**Key corrections from Paul's review (Chris agreed):**
1. **QC is NOT the terminal step.** Shipping signs off for completed orders. QC handles in-process checks + approval for product going to inventory.
2. **Inventory is IN Phase 1.** Paul builds the workflow assuming inventory is in the system and selectable at ERF entry.
3. **Quality dashboard is IN Phase 1**, baked in + tested as an integral part. Not bolted on later.
4. **Multiple report/form types are IN Phase 1**, not just "Field Daily Report". Specifically:
   - Operator processing check sheets
   - CNC set-up checks + documentation
   - Architectural panel checks + documentation
   - Architectural dailies
   - Other job-/customer-specific forms (ground rules being defined by Paul)
5. **Form builder for new traceability forms** is required. Paul wants admin-level form-builder so new forms can be added without dev support. Aim: keep all forms inside the same system.

---

## ERF input/output asymmetry (Paul's open work)

- **Inputs differ per division by design**: Processing primarily from **estimate** (already exists in Smartsheet + Epicor); Architectural primarily from **manual ERF entry**.
- **Outputs to shop floor MUST be standardised** — same operations input regardless of source. Paul focusing on this once he finishes outlining Architectural process from ERF → crating.
- **Possible split**: separate ERF for ACM vs rest of the work, because ACM fabrication needs heavier engineering (shop drawings + field dimensions). Open with Chris — proposal: one ERF DocType, division-specific child tables for ACM-only data.
- **Trickiest case**: flat-laser / punch parts that flow through Architectural fabrication. Paul specifically focusing here.

---

## Reporting + traceability scope (per Paul)

These are **NOT generic dashboards** — they are **traceability records** required for jobs / customer audits. Distinct from Collin's efficiency reporting (which is metrics).

| Form type | Purpose | Today |
|---|---|---|
| Operator processing check sheet | per-operator per-job verification | paper → scan → email to QC |
| CNC set-up check | tool / setup verification before run | paper |
| Architectural panel check | per-panel quality record | paper |
| Architectural daily | shift-level record | paper |
| Job-specific custom forms | customer/contract-specific | created ad-hoc |

**Phase 1 deliverable**: capture ALL of these in ERPNext + form builder for adding new ones admin-level. Paul + I to define the schema together.

---

## Infra spec from Matt's email

| Tier | VMs | Per-VM specs |
|---|---|---|
| HA cluster (recommended) | **4 VMs**: 2 frontend + 2 ERP&DB | 16GB / 4 CPU / 100GB |
| Minimum (no HA) | **2 VMs**: 1 frontend + 1 ERP&DB | 16GB / 4 CPU / 100GB |

- Ubuntu or Debian
- Backups at night
- Dedicated hardware unlocks: separate Backup server, separate DB server, LiteLLM AI gateway, Authentication
- Admin permissions required during build (revocable post go-live)

---

## What stays IN scope (no change from PRODUCTION_SCOPE.md)

- ERF DocType (with division-specific extensions)
- Shop Router DocType + Router Step child table
- Work Order + Job Card (ERPNext native)
- Stock Entry + Inventory (ERPNext native; in Phase 1 now)
- Quality Inspection (ERPNext native + JWM-extended for the form types above)
- Shipping / Delivery Note (ERPNext native; **closes the loop**, not QC)
- Authentik OIDC SSO (already wired)
- Resend SMTP (already wired)
- All Frappe Fixture JSON committed to git (no writable-layer state)
- The 10 hard rules from PRODUCTION_SCOPE.md §6

---

## What stays OUT of Phase 1 (defer to Phase 2)

- PM operations (1010 + 1040 PM dashboards) — Phase 2
- Fleet — Phase 2
- Machine maintenance — Phase 2
- Safety — Phase 2
- Facilities — Phase 2
- Sales pipeline, opportunity tracking, quick-quote AI — defer further (no commitment)
- Spectrum drift comparison UI — defer further (Spectrum credentials still pending)

---

## Open questions for Chris / Paul

1. **One ERF DocType with division-specific child tables, or two separate ERFs (ACM + non-ACM)?** Recommend the former; open to discussion.
2. **Form builder scope** — do we accept ERPNext's built-in Customize Form / DocType builder as the admin-level form builder, or build a JWM-specific simpler tool? My pick: standard Frappe Customize Form + a JWM "Forms gallery" wrapper page so non-technical admins don't see the full ERPNext customise UI.
3. **Inventory granularity** — at what level? SKU (individual item) or assembly-component (BOM line)? Drives how ERF references inventory.
4. **Shipping sign-off authority** — single user role, or multi-step (foreman + driver, etc.)?
5. **Job number normalisation** — keep `1010-25051` / `1040-135568` as-is (different lengths but unambiguous via prefix), or pad architectural to 6 digits? Yesterday's recommendation: keep different lengths.

---

## Related

- [[../../PRODUCTION_SCOPE]] — primary engineering scope doc (in https://github.com/tenshimatt/jwm)
- [[../50-research/2026-04-28-erf-shop-router-audio]] — Chris's audio
- [[../40-operations/AWAITING_JWM]] — dated checklist of items needed from JWM
- The 2026-04-29 email thread (this file's source) is captured below for reference.

---

## Email thread excerpt (2026-04-29)

**Chris → Paul → Matt** — Phase 1: Engineering→Shipped, incl. Inventory + QC, **live + testing end August 2026**. Phase 2: PM ops/Fleet/Maintenance/Safety/Facilities, **all live end November 2026**.

**Paul's red-line on the scope:**
- "QC – sign off, close" too broad → final sign-off should be **Shipping**, not QC.
- "Standardised output schema will take time" → Paul focusing on it after current Architectural ERF→crating outline. Different inputs OK; outputs must be standardised.
- "Inventory not explicitly mentioned" → must be in Phase 1, selectable at ERF entry.
- "Multiple paper traceability forms today" → operator / CNC / panel / dailies / job-specific. Need form-builder. Multiple forms keep traceability granular; "more is not necessarily better" but adaptive when required.
- "Quality dashboard in Phase 1" — agreed by Chris.

**Chris's confirmations (red on red, all agreed):**
- Phase 1 includes Inventory + QC dashboard + standardised shop outputs.
- Different ERF inputs OK; **possibly separate ERF for ACM vs rest** to handle the engineering-heavy ACM workflow.
- Form definition needed up-front; addable later but easier to plan for.

**Incident reference**: 2026-04-28 ERPNext data-loss event — recovered, root cause documented in PRODUCTION_SCOPE.md §9.
