# Archon SUPERtag Workflow — Ops Guide

> Pandomagic conversion: 2026-04-28
> Modelled on: [[../../Pandomagic/40-operations/rawgle-workflow|rawgle-workflow]]

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| 1 Discovery | ✅ Done | Repo initialised, PRD verified (§1–§13 anchored) |
| 2 Governance files | ✅ Done | mission.md, factory-rules.md, CLAUDE.md |
| 3 PRD anchoring | ✅ Done | §1–§13 + sub-sections all anchored |
| 4 .archon scaffold | ✅ Done | Workflow, 8 scripts, levels.md, 8 contract tests, .superdesign |
| 5 Out-of-tree registration | ✅ Done (2026-04-28) | RAG 5b44f239, poller-st.timer live |
| 6 Memory + docs | ✅ Done | archon_supertag_workflow.md in memory |
| 7 Smoke test | ✅ Done (2026-04-28) | STAG-16 ran 15/16 nodes (architect-review fails: Claude SDK root restriction — known, non-blocking) |
| 8 P1 implementation | ✅ Done (2026-04-29) | STAG-17–22 implemented and merged (see below) |
| 9 P2 implementation | ✅ Done (2026-04-29) | STAG-23–26 implemented and merged |
| 10 Deployed | ✅ Done (2026-04-29) | CT 120 running supertag-web:3202 + supertag-api:3203 |

## Implementation status (2026-04-29)

### Tickets completed

| Ticket | Description | PR | Status |
|--------|-------------|-----|--------|
| STAG-17 | PostgreSQL schema + migrations | #1 | ✅ |
| STAG-18 | Next.js 14 + Fastify scaffold + OIDC stub | #2 | ✅ |
| STAG-19 | ERC-721 smart contract (Polygon Amoy) | #3 | ✅ |
| STAG-20 | Artwork onboarding wizard (7-step) | #4 | ✅ |
| STAG-21 | Certificate PDF generator (Puppeteer A4) | #5 | ✅ |
| STAG-22 | Public verify page + provenance timeline | #6 | ✅ |
| DB wiring | Real postgres.js queries in all routes | #7 | ✅ |
| STAG-23 | Artist portal (artwork confirm + image upload) | #8 | ✅ |
| STAG-24 | Ownership transfer admin UI | #9 | ✅ |
| STAG-25 | Lost/stolen reporting + replacement flow | #9 | ✅ |
| STAG-26 | Public search page (FTS + filters) | #8,#10 | ✅ |

### Remaining stubs (wiring needed)

| Item | Notes |
|------|-------|
| Authentik OIDC JWT verify | `packages/api/src/plugins/auth.ts` — parse only, no verify |
| R2 image upload | Stub in artwork wizard step 3 — STAG-28 |
| PDF endpoint wiring | `GET /certificates/:id/pdf` returns 501 — STAG-21 wired but not connected to DB |
| Smart contract deploy | `packages/contracts/` ready, needs DEPLOYER_PRIVATE_KEY from Proxmox vault |
| CT 120 git pull deploy | Manual tar push — automate with `git pull` on CT 120 or CI webhook |

### Deployment (2026-04-29)

| Service | Port | URL |
|---------|------|-----|
| Next.js web | 3202 | https://supertag.beyondpandora.com |
| Fastify API | 3203 | https://supertag-api.beyondpandora.com |
| API health | — | https://supertag-api.beyondpandora.com/health |
| DB | CT 117:5432 | `postgresql://postgres:ARChon@10.90.10.17:5432/postgres` |

## Key IDs

| Resource | ID |
|---|---|
| Plane workspace | `superluxe` |
| Plane project | `916c1d0a-6c5d-4364-9f40-53c7b3b49410` (SUPERTAG) |
| Plane `archon-ready` label | `c04a1401-6512-45e5-b1e3-967ac0861cbc` |
| Plane `archon-running` label | `24c86550-177a-449f-9af3-050820dfa4de` |
| Plane `archon-done` label | `84a50a6c-5a03-4215-b8d3-e4b03a403539` |
| Plane `archon-failed` label | `78dae2c8-aca6-49b9-8825-d27d0b5718cc` |
| Archon RAG project UUID | `5b44f239-4a30-49d5-843d-1ee0b2c5cf94` |
| Archon workspace path | `/root/.archon/workspaces/tenshimatt/supertag/source` |
| CT 111 poller env | `/etc/archon/poller-supertag.env` |
| CT 111 poller timer | `archon-plane-poller-st.timer` (active, every 5 min) |
| GitHub repo | `tenshimatt/supertag` |
| Obsidian docs path | `Obsidian/PROJECTS/SUPERLUXE/SUPERtag/` |
| PRD anchor | `Obsidian/PROJECTS/SUPERLUXE/SUPERtag/PRD.md` |
| Workflow file | `.archon/workflows/supertag-feature.yaml` |
| Config file | `.archon/config.yaml` |

## How to trigger a workflow run

1. File a Plane ticket in workspace `superluxe` / project `916c1d0a...`
2. Add `PRD: §X.Y` at the top of the description
3. Apply the `archon-ready` label
4. CT 111 poller fires within 5 minutes
5. Watch run at `archon.beyondpandora.com/runs`
6. Respond to gates by commenting `:approve:` or `:reject: <reason>` on the Plane ticket

## Design system reference

- Base CSS: `supertag/.superdesign/design_iterations/default_ui_darkmode.css`
- SUPERLUXE override: `supertag/.superdesign/superluxe-tokens.css`
- Gradient: `linear-gradient(90deg, rgb(255,106,0), rgb(238,9,121))`
- Fonts: Poppins (headings) + Montserrat (body)
- Buttons: `border-radius: 0`, uppercase, `letter-spacing: 2px`

## L4 contracts (must stay green on every L2+ change)

| Contract | Test file |
|----------|-----------|
| Public routes never expose collector PII | `tests/contracts/public-pii-exposure.spec.ts` |
| Artwork records are soft-delete only | `tests/contracts/soft-delete-only.spec.ts` |
| Mint requires explicit approval gate | `tests/contracts/mint-requires-approval.spec.ts` |
| NFT tokenURI is always `ipfs://` CID | `tests/contracts/ipfs-token-uri.spec.ts` |
| Certificate ID format `XXXX-XXXX-XXXX-XXXX-XXXX` | `tests/contracts/cert-id-format.spec.ts` |
| Brand tokens in CSS vars (no inline hex) | `tests/contracts/brand-tokens.spec.ts` |
| Mobile-first: no overflow at 375px | `tests/contracts/no-horizontal-overflow.spec.ts` |
| SUPERvault API requires service-to-service key | `tests/contracts/supervault-api-auth.spec.ts` |

## Common run commands

```bash
# From ~/pandora/supertag:
cd ~/pandora/supertag

# Run smoke tests
npx playwright test tests/smoke/

# Run all contract tests
npx playwright test tests/contracts/

# Check workflow YAML
cat .archon/workflows/supertag-feature.yaml

# Check config
cat .archon/config.yaml
```
