---
title: HA / Active-Active Deployment Plan — JWM
status: Draft
updated: 2026-04-21
owner: sovereign.ai
plane: JWM1451-117
---

# HA / Active-Active Across JWM Locations

Chris's 2026-04-20 ask:

> "There really is no reason at all cost-wise that you could run two instances of this in two of your different locations. One production, one secondary. Active, active."

This doc describes a two-site (optionally three-site) active-active topology so JWM can keep operating if one plant loses network / power.

## Goals

1. **Zero shop-floor downtime** on single-site failure. Operators at Plant B keep using the kiosk even if Plant A is dark.
2. **Bounded data divergence** — when sites reconnect, conflicts are detectable and resolvable, not silently overwritten.
3. **Cost ≤ $2k/mo across all sites** (excluding the GPU investment separately budgeted).

## Non-goals (v1)

- Active-active on GL / finance data. Spectrum is the source of truth there; keep it centralised.
- Geo-distributed database (Galera / Postgres-XL). Overkill; we can solve JWM's scale with app-layer replication.

## Topology (v1 — two sites)

```
    Nashville HQ (primary)          Secondary plant
    ┌────────────────┐              ┌────────────────┐
    │  ERPNext       │◄───sync─────►│  ERPNext       │
    │  Next.js shell │              │  Next.js shell │
    │  LiteLLM + GPU │              │  LiteLLM (+GPU)│
    └───────┬────────┘              └───────┬────────┘
            │                                │
    ┌───────▼────────────────────────────────▼──────┐
    │  Shared object store (R2 / Backblaze / S3)     │
    │  — media, attached files, nightly DB dumps     │
    └────────────────────────────────────────────────┘
            │
       ┌────▼─────┐
       │ Starlink │  ← fallback internet at secondary plant
       └──────────┘
```

## Data layer

### Tier 1 — per-site local database

Each site runs its own full ERPNext + MariaDB. Writes go local-first. Bulk data (Items, BOMs, Workstations, Routings, historical schedule lines) is considered **mostly-immutable** — changes are rare and flow from HQ only.

### Tier 2 — bidirectional sync (eventually consistent)

For the records that change at both sites — Work Orders, Job Cards, Shop Floor Logs, Field Dailies, Daily Efficiency, Anomaly reports — we use a **per-site ID namespace** so there are no PK collisions, plus a lightweight **reconciliation worker**:

- Each record's natural key is prefixed: `nas-jc-2026-00123`, `sec-jc-2026-00123` — no Plant A writing a Plant B's ID space.
- A Frappe Scheduled Job every 60s pushes new rows to the peer site's ERPNext via REST.
- Conflict policy: **last-writer-wins per field** with a conflict log for human review. Critical fields (`status`, `completed_qty`, `scrapped_qty`) additionally require both sites to see the same value for a record to be considered "closed."

### Tier 3 — shared object store

Photos / attachments / PDF quotes / drawings go to a shared S3-compatible bucket (R2 or Backblaze). Both sites write directly; the URL embedded in ERPNext records is content-addressed so no collisions.

## Site-outage behaviour

| Condition | Behaviour |
|---|---|
| Primary internet down | Secondary keeps working. Writes queue locally. On reconnect, sync worker pushes delta. |
| Secondary internet down | Primary keeps working. Secondary ops continue. On reconnect, sync delta. |
| Primary CPU failure | Operator shell on each site still renders (client-side state + last-known ERP data). Users told "Primary site offline — read-only from your perspective, write queue on local." |
| Both sites up, DB row conflict | Conflict log entry created. Human reviewer resolves via `/admin/sync-conflicts`. |

## Network

- Site-to-site: **Wireguard tunnel** over public internet (primary path) + Starlink at secondary as backup. Failover via BGP or simple OS-level script.
- Edge: each site terminates TLS locally (Cloudflare Tunnel at HQ stays, secondary gets its own Cloudflare tunnel or Let's-Encrypt on a public IP).

## Deployment automation

- Ansible playbook or Docker Compose file checked into git. Both sites deploy from the same `feat/main` branch. `config.yml` per site captures the few site-specific things (hostname, tunnel credentials, GPU presence).
- `scripts/sync_worker.py` on each site — runs as a systemd service, logs to journal, Prometheus metrics for lag / conflict rate.

## Phased rollout (6 weeks post Phase-2 cutover to JWM infra)

| Week | Work |
|---|---|
| 1 | Audit secondary plant — internet, physical space for a mini-server, power |
| 2 | Provision second-site hardware (could be a mini-PC with 2× 1TB NVMe for ERPNext + 32 GB RAM). ~$1,500 one-time. |
| 3 | Deploy ERPNext + shell in parallel-run (shadow) mode. Wireguard tunnel up. |
| 4 | Bidirectional sync worker deployed. Internal users at secondary test read-only. |
| 5 | Flip secondary into active-active. Monitor conflict log daily. |
| 6 | Documented runbook + handoff to JWM IT. Disaster-recovery drill (disconnect primary for 30 min). |

## Costs

| Item | Capex | Opex/mo |
|---|---|---|
| Secondary mini-server | $1,500 | $20 (power) |
| Wireguard + Starlink | $0 | $120 (Starlink business) |
| Shared object store (R2, ~500 GB) | $0 | $8 |
| Two-site TLS (LE + Cloudflare) | $0 | $0 |

**Total**: ~$150/mo recurring + $1,500 one-time per added site.

## Open questions for Chris

1. Which secondary plant — final install plant (Chris mentioned) or a panel-shop location?
2. Does the secondary plant have a static public IP or do we Starlink-only?
3. Who authors conflict-resolution decisions at the secondary site — a local admin or the central ops team?
4. Is there a regulatory reason we can't put Smartsheet-equivalent data at a second physical location? (Usually no, but confirm.)
5. Primary-primary symmetric writes, or primary-always-wins on same-row conflict?

## Why not full-HA today

- Zero JWM workflows currently require it — single-site failure would be recoverable in <2h manual.
- The ERPNext footprint is small enough that nightly DB snapshots + off-site backup gets us RPO <24h / RTO <4h without the HA complexity.
- HA introduces conflict-resolution complexity that only starts paying for itself at ~20+ writes/second of mutable data. JWM is 2 orders of magnitude below that.

Recommend: phase-in after 3 months of production use on single-site JWM-owned infra. Use that time to observe real failure modes and size the HA layer accordingly.

## Related

- [[server-migration-plan]]
- [[deployment]]
- [[../30-decisions/006-canned-fallback-for-live-erpnext]]
