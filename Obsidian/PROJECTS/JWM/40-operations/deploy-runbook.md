---
title: JWM Deploy Runbook (shell + ERP)
status: Built
updated: 2026-04-20
owner: sovereign.ai
---

## Tier 1 — jwm-demo shell (CT 120)

**Key rule:** CT 120 has `npm` + `node` only. **No Bun.** Always preserve `.env.local`.

### Standard deploy (tar + pct push)

```bash
# On Mac dev box:
cd /Users/mattwright/pandora/jwm-demo/shell
tar --exclude=node_modules --exclude=.next --exclude=.env.local --exclude=.env \
    --exclude=screenshots --exclude=.git --exclude=.turbo --exclude=out \
    -czf /tmp/jwm-shell-deploy.tgz .
scp -q /tmp/jwm-shell-deploy.tgz root@10.90.10.10:/tmp/

# Through Proxmox host → CT 120:
ssh root@10.90.10.10 "pct push 120 /tmp/jwm-shell-deploy.tgz /tmp/jwm-shell-deploy.tgz && \
    pct exec 120 -- bash -c 'cd /opt/jwm-demo && \
      cp .env.local /tmp/env-backup.txt && \
      tar -xzf /tmp/jwm-shell-deploy.tgz && \
      cp /tmp/env-backup.txt .env.local && \
      node_modules/.bin/next build && \
      systemctl restart jwm-demo'"
```

### Why

- `bun install` / `bun x` fail — no binary.
- `npm run build` works but generates `package-lock.json` conflicting with tracked `bun.lock`.
- `node_modules/.bin/next` skirts both and uses already-installed deps.
- Tar would overwrite `.env.local` and strand secrets (`ELEVENLABS_API_KEY`, `OPENAI_API_KEY`, `FRAPPE_API_KEY`, `FRAPPE_API_SECRET`, etc.).

### Dep bumps

- New package locally: `bun install` on Mac AND `pct exec 120 -- npm install` on CT 120, OR separate `pct push` of just the `node_modules` diff. Prefer zero-dep changes.

### Service facts

- unit: `jwm-demo.service` on CT 120, port `:3200`
- EnvironmentFile: `/opt/jwm-demo/.env.local`
- Public: `https://jwm-demo.beyondpandora.com` (Traefik)

### Verify

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://jwm-demo.beyondpandora.com/arch/projects
# Expect 200. If 500/502:
ssh root@10.90.10.10 "pct exec 120 -- journalctl -u jwm-demo -n 80"
```

## Tier 2 — ERPNext (CT 171, Docker Compose)

Stack lives at `/root/frappe_docker/` on CT 171. Site name: `frontend` (not a FQDN).

### bench commands

```bash
ssh root@10.90.10.10 'pct exec 171 -- docker exec frappe_docker-backend-1 bench --site frontend <command>'
```

### Common ops

```bash
# Migrate after DocType changes:
ssh root@10.90.10.10 'pct exec 171 -- docker exec frappe_docker-backend-1 bench --site frontend migrate'

# Clear cache:
ssh root@10.90.10.10 'pct exec 171 -- docker exec frappe_docker-backend-1 bench --site frontend clear-cache'

# REST data ops — use API token, don't shell in:
curl -H "Authorization: token c3132bc83582071:642ac0c571db51a" \
  https://jwm-erp.beyondpandora.com/api/resource/JWM%20Production%20Schedule%20Line?limit_page_length=5
```

### Containers

`backend-1`, `frontend-1`, `scheduler-1`, `queue-short-1`, `queue-long-1`, `websocket-1`, `redis-queue-1`, `redis-cache-1`, `db-1` (MariaDB 10.6). ERPNext `frappe/erpnext:v15.94.3`.

### CT 171 co-tenant warning

`komodo-core-1` runs on the same CT and leaks git zombies at ~25/day. Weekly restart cron mitigates (`/etc/cron.d/komodo-core-restart`, Sun 03:15). Don't confuse Komodo with Frappe.

### Never assume bare-metal

`/home/frappe/frappe-bench/` does NOT exist on CT 171 host. Bench is inside the container. An early import agent lost time on this — do not repeat.

## Tier 3 — async / workflow (ERPNext-native)

JWM does **not** use an external workflow orchestrator. All async work runs inside ERPNext:

- **Server Script** — trigger Python on DocType events (save / submit / cancel)
- **Scheduled Job** — cron-style recurrence (daily digests, nightly rollups)
- **Workflow** DocType — stock Frappe approval chains + state machines
- **Notification** DocType — email / Slack / webhook outbound on doc events
- **Webhook** DocType — inbound for third-party pushes

This stays inside the one system JWM admins log into. One audit log, one auth boundary, no cross-system token drift.

If a future need genuinely requires visual flow orchestration beyond Frappe's facilities, revisit. The bar for adding a second orchestrator is a concrete requirement we can't model in ERPNext natively — not a preference for a diagramming UX.

## Rollback

- Shell: previous tar backed up as `/tmp/jwm-shell-deploy.tgz.bak` on CT 120 before extract. Restore, `next build`, restart.
- ERPNext: DB snapshot via `bench --site frontend backup` before any migration.
- n8n: SQLite copy `database.sqlite.bak` before any DB patch.

## Related

- [[../20-architecture/deployment]]
- [[DEMO_RUNBOOK]]
