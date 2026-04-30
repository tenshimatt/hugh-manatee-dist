---
title: JWM Production System — Overview
status: Active
updated: 2026-04-30
owner: sovereign.ai
---

## Problem

JWM runs a hand-rolled MES inside Excel + Smartsheet on top of Epicor. Processing division lost $500K/month for 3 months due to visibility gaps. Archer Consulting proposed a $430–550K / 2-year Smartsheet Control Center build with Jan 2027 go-live.

## Solution

Sovereign stack: ERPNext (Frappe v15) backbone + `jwm_manufacturing` custom app + Next.js 15 shell (everyday UI) + LiteLLM AI gateway + Authentik SSO. Async work on ERPNext-native Server Script / Scheduled Job / Workflow — no external orchestrator. Total $165K + $25K contingency over 11 months, Epicor retired 2027-03-31.

## Status (2026-04-30, late session)

**Phase 1 core flow is complete.** The full ERF→Shipping pipeline is now live:

- ERF entry (Architectural + Processing) writing to ERPNext
- Auto-routing Server Script fires on ERF submit (8 default ops)
- **Engineering ERF review queue** — submitted ERFs pending engineering categorisation
- **Router Review Gate** — engineer confirms 8-op Routing (Confirm button in UI)
- **Operator start/stop/handoff** — writes to ERPNext Job Card (live, fire-and-forget)
- **NCR submission from kiosk** — creates Quality Inspection in ERPNext
- **QC in-process gate** at `/qc/review` — completed Job Cards pending sign-off
- **Quality dashboard** at `/qc/quality` — live pass/fail metrics
- **Shipping Delivery Note** — terminal step creates + submits DN in ERPNext
- 116 projects, 81 customers, 795 items all live
- Authentik OIDC SSO — env vars confirmed on CT 120
- Remaining: Traceability forms (blocked JWM-222)

**Phase 1 target:** end August 2026 (engineering target 2026-05-19).

## Who

| Name | Role |
|---|---|
| **Chris Ball** | COO, executive sponsor |
| **Paul Roberts** | VP Operations — ERF schema, traceability forms owner |
| **Drew Adams** | Master Scheduler + Inventory Control |
| **Collin** | Production Manager, Arch |
| **John McDougall** | Owner (insists on full company name) |

## Why

Two-plane sovereignty — collapses sales cycle by showing a working system vs 20 pages of "TBD." Matt-orchestrated build pattern replaces $90K of Archer's padding. JWM owns the infrastructure; no vendor lock-in.

## Production Flow

```
ERF (1010-Arch / 1040-Processing)
  ↓ Engineering → Router Review
  ↓ Shop Floor → QC in-process
  ↓ Shipping (closes the job)
```

QC is NOT terminal. Shipping signs off.

## Section Docs

[[PRD]] · [[10-executive]] · [[20-architectural]] · [[30-processing]] · [[40-engineering]] · [[50-shop-floor]] · [[60-quality]] · [[70-safety]] · [[80-maintenance]] · [[90-fleet]] · [[95-inventory]]

## Links

- Shell: `jwm-demo.beyondpandora.com`
- ERPNext: `jwm-erp.beyondpandora.com`
- Plane: `plane.beyondpandora.com/jwm/`
- Repo: `github.com/tenshimatt/jwm`
