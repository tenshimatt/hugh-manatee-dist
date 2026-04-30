# Archon Workflow — Hugh Manatee

> Pandomagic conversion completed 2026-04-27. This document is the operations reference for the Archon-driven dev process on Hugh Manatee.

## How to trigger a workflow run

1. File a Plane ticket in the **Hugh Manatee** project (workspace: `beyond-pandora`)
2. Include a PRD anchor in the description, e.g. `§6.1` or `§8.2`
3. Apply the `archon-ready` label
4. The poller on CT 111 fires within 5 minutes, starts the 25-node DAG, and posts a comment

## Three human gates

| Gate | What you approve | Reply in Plane comment |
|------|-----------------|----------------------|
| PRD gate | AI-generated PRD matches intent | `:approve:` or `:reject: <reason>` |
| Plan gate | Implementation plan is sound | `:approve:` or `:reject: <reason>` |
| PR gate | Final PR is mergeable | `:approve:` or `:reject: <reason>` |

## IDs

| Thing | ID |
|-------|----|
| Plane project | `a0855ada-7e70-494d-99dd-07c2598924d3` |
| Archon v2 codebase | `1b7396e5-3453-4881-b4c0-02ef23a718ea` |
| Archon v1 RAG project | `b096ff1c-b752-4818-91c5-617c9cd0932b` |
| GitHub dist repo | `tenshimatt/hugh-manatee-dist` |

## Plane label UUIDs

| Label | UUID |
|-------|------|
| archon-ready | `a1cdc1dd-cf58-46a3-a6b6-17c876821f3d` |
| archon-running | `45554f58-a5dd-449e-902e-06ff2b714bc8` |
| archon-done | `bd48f0bc-989e-4969-85c5-efc861a17056` |
| archon-failed | `f5a565dc-d117-4ed3-afb7-3609473e7233` |

## CT 111 infrastructure

- **Poller env**: `/etc/archon/poller-hugh-manatee.env`
- **Service**: `archon-plane-poller-hm.service`
- **Timer**: `archon-plane-poller-hm.timer` (every 5 min)
- **Log**: `/var/log/archon/plane-poller-hm.log`
- **Workspace source**: `/root/.archon/workspaces/tenshimatt/hugh-manatee-dist/source/`
- **Workflow YAML**: `.archon/workflows/hugh-manatee-feature.yaml` (25 nodes)

## Checking workflow status

```bash
# Tail the poller log
ssh root@10.90.10.10 "pct exec 111 -- tail -f /var/log/archon/plane-poller-hm.log"

# Check timer next fire
ssh root@10.90.10.10 "pct exec 111 -- systemctl status archon-plane-poller-hm.timer"

# View a specific run log
ssh root@10.90.10.10 "pct exec 111 -- ls /var/log/archon/hugh-manatee-*.log"
```

## Watching a workflow in Archon UI

Open `https://archon.beyondpandora.com` (Archon v2) → Codebases → `tenshimatt/hugh-manatee-dist` → Workflows.

## Model tier

| Tier | Model | Used for |
|------|-------|---------|
| Worker (all nodes) | DeepSeek-V4-Pro / Flash | All 25 worker nodes including `architect-review` |

> **Note (2026-04-30):** `architect-review` was originally Claude Opus 4.7 but caused a consistent 60s `first_event_timeout` on CT 111 (Bug HM-D). Switched to `deepseek-v4-pro` in commit `1576d6c`.

## PRD anchor rule

Every Plane ticket description MUST include a `§X.Y` citation to a section in `Obsidian/PROJECTS/Hugh Manatee/10-product/PRD.md`. No anchor = workflow halts at `mission-triage` node.

## Governance files (in dist repo)

| File | Purpose |
|------|---------|
| `mission.md` | Product scope + triage rules for `mission-triage` node |
| `factory-rules.md` | Hard process rules (citation requirement, gates, stop conditions) |
| `CLAUDE.md` | Tech stack + architecture contracts for code agent context |
| `docs/architecture/levels.md` | L1–L5 pyramid + 7 L4 contract specs |
| `.archon/config.yaml` | All IDs (Plane, RAG, GitHub) |

---

## Run history

| Run | Date | Ticket | Result | Notes |
|-----|------|--------|--------|-------|
| HUGH-35 run 1 | 2026-04-28 | A11Y-01 | Failed at validate | Wrong feature (Next.js instead of RN), wrong Playwright API, stale gate approval. Bugs HM-A/B/C found. |
| HUGH-35 run 2 | 2026-04-29 | A11Y-01 | Failed at architect-review | Claude Opus 4.7 subprocess `first_event_timeout` × 3 retries. Bug HM-D found. |
| HUGH-35 run 3 | 2026-04-30 | A11Y-01 | Failed at architect-review | Removing `[1m]` extended thinking did not fix HM-D. |
| HUGH-35 run 4 | 2026-04-30 | A11Y-01 | **In progress** | All 4 bugs fixed. architect-review on DeepSeek. Awaiting gate-prd. |
