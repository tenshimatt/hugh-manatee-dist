# JWM Menu Order — authoritative

> **Source:** Chris Ball (JWM COO), 2026-04-19
> **Status:** Canonical — all demo UI must reflect this structure
> **Use:** refactor shell sidebar + ERPNext workspace to match exactly

The app's primary navigation is **persona-driven**, not feature-driven. Each division's people see their own section; shop-floor concerns are shared cross-cutters.

---

## Top-level menu (in order)

### 1. Executive
- Arch (Architectural division dashboards)
- Processing (Processing division dashboards)

### 2. Architectural
- Project Managers
- Estimating
- Sales and Precon
- ERF (Release to Eng / Shop)

### 3. Processing
- Ops Manager + Client Services
- Estimating
- Sales
- Release to Eng / Shop

### 4. Engineering

### 5. Shop Floor

### 6. Quality Control

### 7. Safety

### 8. Maintenance

### 9. Fleet

---

## Update from 2026-04-19 22:25 call (PLAUD `4e9bf9d…`)

Chris clarified live on the call:

- **Engineering** is **shared** between Architectural (1010 / A Shop) and Processing (1040 / T Shop).
- **Shop Floor** is **shared** between both divisions.
- **Inventory is also shared** — he corrected himself mid-call ("I need to tweak that because inventory is shared"). **Currently missing from the list above — add it as shared cross-cutter.**
- Schedule per workstation (Flat Laser 1, Flat Laser 2, Tube Laser 1, Tube Laser 2 — combined/separate toggle) + a **master schedule** that rolls up.
- **Dashboard** at the top is confirmed.
- **Router / Route** = the per-job path through stations, defined at estimate time. Bespoke per project. **Must be editable and must have a "cradle-to-grave" visual pipeline** (lines and balls, clickable, current position highlighted) on every work package screen.
- **NCR (non-conformance)** flows: (a) send back upstream, or (b) side-branch (e.g. laser → burrs → finishing → rejoin press brake). Must visualise both.
- Free text = "evil". **Dropdowns everywhere possible.**

### Additional top-level item to slot in

**10. Inventory** (shared — sits alongside Engineering, Shop Floor, QC, Safety, Maintenance, Fleet as cross-cutting ops sections)

### Mental model confirmed

```
Top:            Dashboard (global)
Division-split: Executive (Arch | Processing)
                Architectural (PM, Estimating, Sales & Precon, ERF)
                Processing    (Ops+CS, Estimating, Sales, Release to Eng/Shop)
Shared cross-cutters (order per Chris):
                Engineering · Shop Floor · Quality Control · Safety · Maintenance · Fleet · Inventory
```

> **Pending:** Chris is texting the final nesting. The above is his verbal intent from the 37-min screen-share. **Treat this as the working baseline; apply his text verbatim the moment it arrives.**

---

## Mapping to current demo surfaces

| Chris's menu | Current demo surface | Gap / action |
|---|---|---|
| Executive · Arch | subset of `/dashboard` | Split dashboard into `/exec/arch` + `/exec/processing` |
| Executive · Processing | subset of `/dashboard` | (as above) |
| Architectural · Project Managers | not built | New `/arch/pm` screen |
| Architectural · Estimating | part of `/estimator` | Scope `/estimator` to Arch side; rename |
| Architectural · Sales and Precon | not built | New `/arch/sales` |
| Architectural · ERF | `/erf` already exists | Move under Architectural parent in sidebar |
| Processing · Ops Manager + Client Services | subset of `/shop` | New `/processing/ops` |
| Processing · Estimating | `/estimator/quick-quote` (built today) | Move under Processing parent — this IS Allen Duke's replacement |
| Processing · Sales | not built | New `/processing/sales` |
| Processing · Release to Eng/Shop | partial in `/erf` | Mirror ERF for Processing flow |
| Engineering | not built | New `/engineering` — drafting workbench, BOM builder, drawings |
| Shop Floor | `/shop`, `/shop/[workstation]`, `/shop/scheduler`, `/shop/efficiency` | Keep — already rich |
| Quality Control | `/qc` | Keep |
| Safety | not built | New `/safety` — incident log, training, audits |
| Maintenance | not built | New `/maintenance` — equipment log, PM schedule |
| Fleet | not built | New `/fleet` — vehicle roster, service schedule, driver assignments |

---

## Refactor plan (apply when Chris's project schedule arrives)

1. Restructure `components/chrome/Sidebar.tsx` to use nested groups in the order above
2. Move existing routes to new paths (keep redirects from old paths for a week)
3. Stub the not-built sections with empty state + "coming in Phase 2/3"
4. Update `DEMO_RUNBOOK.md` minute-by-minute narration to match new menu
5. Re-capture Playwright screenshots
6. Rename `/estimator/quick-quote` → `/processing/estimating/quick-quote`

## Not refactoring until

- Chris's project schedule arrives (user flagged it's coming)
- Incoming PLAUD note is processed (captures additional nuance)
- We verify every division's ERF flow vs current `/erf`

---

Linked: [[PRIMER]] · [[JWM_Production_System_PRD_v0.2]] · [[DEMO_RUNBOOK]]
