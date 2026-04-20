---
title: Deployment Topology
status: Built
updated: 2026-04-20
owner: sovereign.ai
---

## Three tiers

### CT 120 — jwm-demo shell

- Service: `jwm-demo.service` listening `:3200`
- EnvFile: `/opt/jwm-demo/.env.local` (ELEVENLABS_API_KEY, OPENAI_API_KEY, FRAPPE_API_KEY, FRAPPE_API_SECRET, ...)
- Public URL: https://jwm-demo.beyondpandora.com (fronted by Traefik)
- Runtime: **npm + node only** — no Bun on CT 120. Bun is local-dev-only.
- Build command in prod: `node_modules/.bin/next build` (skirts both package managers)
- Deploy: tar + scp to Proxmox host, `pct push` to CT, always preserve `.env.local` across the extract

### CT 171 — ERPNext (Frappe Docker)

- Compose stack at `/root/frappe_docker/`
- Site name: `frontend` (not a FQDN). Path in container: `/home/frappe/frappe-bench/sites/frontend/`
- bench commands: `ssh root@10.90.10.10 'pct exec 171 -- docker exec frappe_docker-backend-1 bench --site frontend <cmd>'`
- Containers: `backend-1`, `frontend-1`, `scheduler-1`, `queue-short-1`, `queue-long-1`, `websocket-1`, `redis-queue-1`, `redis-cache-1`, `db-1` (MariaDB 10.6)
- Co-tenant on CT 171: `komodo-core-1` (weekly restart cron mitigates zombie leak)
- Two sites aware: `jwm-erp.beyondpandora.com` alongside original `frontend` — nginx `FRAPPE_SITE_NAME_HEADER=$host` fix critical

## Verification

```
curl -s -o /dev/null -w "%{http_code}\n" https://jwm-demo.beyondpandora.com/arch/projects
```

Expect 200. If 500/502: `journalctl -u jwm-demo -n 80` on CT 120.

## Full deploy steps

See [[../40-operations/deploy-runbook]].

## Related

- [[../30-decisions/001-headless-erpnext]]
