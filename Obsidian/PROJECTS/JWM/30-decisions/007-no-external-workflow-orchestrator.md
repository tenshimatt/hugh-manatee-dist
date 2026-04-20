---
title: "ADR-007: No external workflow orchestrator for JWM"
status: Accepted
date: 2026-04-20
---

# ADR-007: No external workflow orchestrator for JWM

## Context

n8n runs on CT 107 as part of the Beyond Pandora home-lab. Through early 2026-04-19/20 documentation drafts, n8n was listed as part of JWM's stack "for async workflows and router orchestration" — inherited from Matt's personal PLAUD pipeline use rather than any JWM-specific requirement.

On 2026-04-20 Matt audited the claim vs reality:

- **Zero JWM workflows exist in n8n.**
- Every async need we've scoped (ERF submission fan-out, ship-bottleneck digest, anomaly escalation, Sales→Engineering→Shop approval, router/route orchestration) maps cleanly onto ERPNext-native facilities.
- Chris Ball's interest in "visual workflow" from the 2026-04-19 deep-dive was delivered by the **Route DocType + embedded cradle-to-grave pipeline viz on the Project Dashboard** — inside the product, better than an admin-only backend.

## Decision

**JWM will not use n8n (or any external workflow orchestrator).**

All async / scheduled / webhook / approval work runs on ERPNext-native facilities:

| Need | ERPNext facility |
|---|---|
| Event triggers on doc save / submit / cancel | Server Script |
| Cron / schedule | Scheduled Job |
| Approval chains & state machines | Workflow DocType |
| Outbound email / Slack / webhook | Notification DocType |
| Inbound webhooks | Webhook DocType |
| Per-doc visual pipeline | Custom DocType + React component (e.g. Route) |

## Consequences

**Positive**

- One system, one audit log, one auth boundary. Cleaner data-sovereignty story for Chris.
- JWM admins only learn one system (ERPNext Desk). No n8n expertise needed.
- No cross-system token / session / permission drift.
- Less infrastructure to monitor, upgrade, back up.

**Negative**

- If a future need genuinely requires visual flow orchestration beyond Frappe's facilities, we'd need to revisit. The bar is a concrete, non-modelable requirement — not a diagramming preference.
- ERPNext Server Scripts are Python, not a visual DSL. Non-developer admins can't author them.

## Scope

- Applies to **JWM** only. n8n continues running on CT 107 for Matt's personal PLAUD note pipeline — that's unrelated to JWM and stays untouched.
- Supersedes ADR-005 (archived) which documented Authentik-bypass-for-n8n as if it were a JWM concern. It isn't.

## References

- `Obsidian/PROJECTS/JWM/20-architecture/stack.md` — n8n removed from stack table
- `Obsidian/PROJECTS/JWM/10-product/00-overview.md` — "no external workflow orchestrator" note
- `Obsidian/PROJECTS/JWM/40-operations/deploy-runbook.md` — Tier 3 rewritten to describe Frappe-native async
- `Obsidian/PROJECTS/JWM/99-archive/ADR-005-n8n-not-part-of-jwm.md` — archived predecessor
