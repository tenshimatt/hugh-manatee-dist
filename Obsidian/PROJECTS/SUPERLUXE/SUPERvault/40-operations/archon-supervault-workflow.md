# Archon SUPERvault Workflow — Ops Guide

> Pandomagic conversion: 2026-04-28
> Modelled on: [[../../Pandomagic/40-operations/rawgle-workflow|rawgle-workflow]]

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| 1 Discovery | ✅ Done | Repo cloned, PRD verified |
| 2 Governance files | ✅ Done | mission.md, factory-rules.md, CLAUDE.md |
| 3 PRD anchoring | ✅ Done | §1–§13 anchors present |
| 4 .archon scaffold | ✅ Done | Workflow, scripts, levels.md, test pyramid, .superdesign |
| 5 Out-of-tree registration | ✅ Done (2026-04-28) | Labels, RAG d411880a, codebase, poller-sv.timer live |
| 6 Memory + docs | ✅ Done | archon_supervault_workflow.md in memory |
| 7 Smoke test | ✅ Done (2026-04-28) | SVAULT-15 triggered → DAG ran 26 nodes, gate-prd approved, all BDATSI parallel nodes running |
| 8 P1 implementation | ✅ Done (2026-04-29) | Full stack built and deployed (see below) |
| 9 Session 2026-04-30 | ✅ Done | Dashboard stats fixed; light mode CSS (loans + settings); theme toggle; correct deploy path confirmed |

## Implementation status (2026-04-30)

### Deployed services

| Service | Port | URL |
|---------|------|-----|
| Next.js web | 3204 | https://supervault.beyondpandora.com |
| Fastify API | 3205 | https://supervault-api.beyondpandora.com |
| API health | — | https://supervault-api.beyondpandora.com/health |
| DB | CT 117:5432 | `postgresql://postgres:ARChon@10.90.10.17:5432/supervault` |

### What was built

- PostgreSQL schema: organisations, sv_artists, artworks (FTS tsvector), valuations, condition_reports, loans, sv_audit_log
- Seed: "The Pemberton Collection" — Bacon/Riley/Hirst/Hockney, 8 works £45k–£2.8M
- Fastify API: dashboard CTE stats, artworks CRUD, artists, reports, demo mode bypass
- Next.js 14: dashboard stats, collection grid/detail/new wizard, reports, artists

### Session 2026-04-30 changes

| Change | Status |
|--------|--------|
| Dashboard stats fixed (wrong route + field mapping) | ✅ `/api/v1/dashboard` returns correctly |
| Deploy path confirmed: `/opt/supervault/apps/web/.next/standalone/` | ✅ (old `/opt/supervault-web/` is stale, ignore) |
| Light mode: loans page + settings page CSS | ✅ 99 hardcoded `rgba(255,255,255,…)` → CSS custom properties |
| Theme toggle visible | ✅ Fixed |
| Dark mode foreground contrast bumped | ✅ `--foreground-muted` #a8a29e→#c8c4c0, `--foreground-subtle` #57534e→#908a84 |
| Cloudflare Access bypass (supervault + supervault-api) | ✅ Public access confirmed |

### Remaining stubs

| Item | Notes |
|------|-------|
| R2 image storage | Local FS only until `R2_*` env vars set |
| Auth | `SUPERVAULT_DEMO_MODE=true` bypasses auth — no Authentik for now |
| Stripe billing | Stub — PRD §8 |
| SUPERtag cert link | Schema has `supertag_cert_id` column, UI doesn't surface it yet (SVLT-10 In Progress) |
| Public artwork search page | Collection filter built; standalone `/search` page TBD (SVLT-9 In Progress) |

## Key IDs

| Resource | ID |
|---|---|
| Plane workspace | `superluxe` |
| Plane project | `15cd7b8e-a618-43e3-916f-1aae304bb4a0` |
| GitHub repo | `tenshimatt/supervault` |
| Archon RAG project | TBD Phase 5 |
| Archon codebase ID | TBD Phase 5 |
| Plane labels (4) | TBD Phase 5 |

## Plane label UUIDs (populated in Phase 5)

| Label | UUID |
|-------|------|
| `archon-ready` | `4f40b240-9bc0-41df-9c7f-077904841628` |
| `archon-running` | `c76e0cff-069a-4f6e-8221-adc0e539c3d1` |
| `archon-done` | `42e2a93c-0c90-405a-9ea3-494ad9cffd84` |
| `archon-failed` | `7f408ebb-115f-4642-aef4-f13a82520589` |

## How to trigger a workflow run

1. File a Plane ticket in workspace `superluxe` / project `15cd7b8e...`
2. Add `PRD: §X.Y` at the top of the description
3. Apply the `archon-ready` label
4. CT 111 poller fires within 5 minutes
5. Watch run at `archon.beyondpandora.com/runs`
6. Respond to gates by commenting `:approve:` or `:reject: <reason>` on the Plane ticket

## Design system reference

- Base CSS: `supervault/.superdesign/design_iterations/default_ui_darkmode.css`
- SUPERLUXE override: `supervault/.superdesign/superluxe-tokens.css`
- Gradient: `linear-gradient(90deg, rgb(255,106,0), rgb(238,9,121))`
- Fonts: Poppins (headings) + Montserrat (body)
- Buttons: `border-radius: 0`, uppercase, `letter-spacing: 2px`

## L4 contracts (must stay green on every L2+ change)

| Contract | Test file |
|----------|-----------|
| VaultLayout wraps every authed page | `tests/contracts/vault-layout-shell.spec.ts` |
| Every DB query has `organisation_id` | `tests/contracts/org-id-scope.spec.ts` |
| Financial fields absent from public routes | `tests/contracts/financial-pii-exposure.spec.ts` |
| Images served as signed R2 URLs only | `tests/contracts/image-signed-url.spec.ts` |
| Artwork records are soft-delete only | `tests/contracts/soft-delete-only.spec.ts` |
| Brand tokens in CSS vars (no inline hex) | `tests/contracts/brand-tokens.spec.ts` |
| Mobile-first: no overflow at 375px | `tests/contracts/no-horizontal-overflow.spec.ts` |
| SUPERtag integration is optional | `tests/contracts/supertag-optional.spec.ts` |

## Common run commands

```bash
# From ~/pandora/supervault:
cd ~/pandora/supervault

# Run smoke tests
npx playwright test tests/smoke/

# Run all contract tests
npx playwright test tests/contracts/

# Check workflow YAML
cat .archon/workflows/supervault-feature.yaml

# Check config
cat .archon/config.yaml
```

## Phase 5 checklist (pending :approve:)

- [ ] Create 4 Plane labels in `superluxe` workspace
- [ ] Register Archon RAG project at archon.beyondpandora.com
- [ ] POST `/api/codebases` on CT 111 for supervault repo
- [ ] Add `15cd7b8e-a618-43e3-916f-1aae304bb4a0` to CT 111 poller.env
- [ ] Reload + restart archon-plane-poller.timer
- [ ] Confirm CLAUDE_API_KEY + DEEPSEEK_API_KEY present in CT 111 .env
- [ ] Write all 4 label UUIDs into `.archon/config.yaml` + `poller.env`
