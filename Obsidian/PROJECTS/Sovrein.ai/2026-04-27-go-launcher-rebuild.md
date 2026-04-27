---
date: 2026-04-27
status: shipped
type: ui-improvement
---

# go.beyondpandora.com — auto-generated against Traefik truth

Replaced the hand-maintained `go.` HTML with a generator that builds it from two inputs:

1. **`traefik-domains.txt`** — snapshot of every routed subdomain on CT 103
2. **`services.yml`** — curated metadata: section, name, description, icon

Anything in Traefik but not in `services.yml` gets dropped into "Uncategorized" so we never lose a route. Anything in `services.yml` but not in Traefik is skipped (with a warning) — keeps dead links out of the launcher.

## What changed

- Deleted 18 dead links (subdomains in the old `go.` that had no Traefik route — `litellm`, `flowise`, `jupyter`, `office`, `paperless`, `excalidraw`, `limesurvey`, `git`, `overseerr`, `tautulli`, `webcheck`, `pdf`, `alpine-it`, `grafana`, `prometheus`, `kuma`, `wazuh`, `pbs` — most of those replaced by their real hostnames)
- Added 22 routes that exist in Traefik but were missing from `go.` (`chat`, `download`, `files`, `homeassistant`, `komodo`, `mail`, `webmail`, `mcpmon`, `pandomagic`, `portainer`, `pve-cluster`, `pvedash`, `request` (Overseerr), `supercrm`, `syncthing`, `surthrival`, `n8n-ops-mcp`, `auth`, `archon-v1`, `pbs`, `wazuh`, `adguard`/`adguard-2` after wiring)
- New section: **Home** (Surthrival/Nomad + Home Assistant)
- New section: **Websites** (Rawgle, WordPress YLD)
- Archon split into `archon` (v2 :5173) and `archon-v1` (v1 :3737) cards
- All 66 cards open in a new tab

## New Traefik routes added

Files staged in `/Users/mattwright/pandora/go_beyondpandora/traefik-pending/` and deployed to CT 103 `/etc/traefik/conf.d/`:

| Subdomain | Backend | Notes |
|---|---|---|
| `pbs.beyondpandora.com` | `https://10.90.10.2:8007` | PBS, self-signed cert → `insecureSkipVerify` |
| `archon-v1.beyondpandora.com` | `http://10.90.10.11:3737` | Archon v1 UI |
| `wazuh.beyondpandora.com` | `https://10.90.10.9:5601` | Wazuh dashboard, self-signed |
| `adguard.beyondpandora.com` | `http://10.90.10.14:80` | Primary cluster node |
| `adguard-2.beyondpandora.com` | `http://10.90.10.49:80` | Secondary cluster node |

All chained behind Authentik SSO (`chain-auth@file`).

## Why the daily-job was missing CTs

`/root/.hermes/scripts/daily_health_check.py` on CT 119 has `discover_traefik_domains()` — discovery only sees subdomains that already have a Traefik config. CTs without a config (PBS, Wazuh, AdGuard, Archon v1) are invisible to it. The fix is upstream: **every CT with a UI should have a Traefik proxy file**. Five gaps closed this session.

## Generator usage

```bash
# Edit services.yml (curated metadata).
vim generator/services.yml

# Regenerate services.json (yaml→json so the runtime is stdlib-only):
/tmp/yvenv/bin/python3 -c "import yaml,json; json.dump(yaml.safe_load(open('generator/services.yml')), open('generator/services.json','w'), indent=2)"

# Refresh Traefik snapshot (every time a new proxy-X.yml lands):
ssh root@10.90.10.10 "pct exec 103 -- bash -c \\
  \"grep -hoE '[a-z0-9-]+\\.beyondpandora\\.com' /etc/traefik/conf.d/*.yml | sort -u\"" \\
  > generator/traefik-domains.txt

# Regenerate index.html:
cd generator && python3 generate.py

# Deploy:
scp ../index.html root@10.90.10.10:/tmp/go-index.html && \\
ssh root@10.90.10.10 "pct push 120 /tmp/go-index.html /tmp/go-index.html && \\
  pct exec 120 -- cp /tmp/go-index.html /opt/go/index.html"
```

## Files

| Path | Purpose |
|---|---|
| `generator/services.yml` | Source of truth — sections, per-host metadata. **Edit this.** |
| `generator/services.json` | Stdlib-readable conversion of services.yml. **Don't edit by hand.** |
| `generator/traefik-domains.txt` | Live Traefik subdomain list (refresh after route changes). |
| `generator/head.html` / `foot.html` | Page chrome templates. |
| `generator/generate.py` | Builds index.html. |
| `index.html` | Generated output. Synced to CT 120 `/opt/go/index.html`. |
| `traefik-pending/proxy-*.yml` | Per-service Traefik configs deployed to CT 103. |

## Future improvements

- The Hermes Portal (`portal.beyondpandora.com`) still uses its own dynamic generator. Worth converging onto the same `services.yml` source eventually — single launcher, two render modes (static for `go.`, dynamic for Portal with live status).
- The `discover_traefik_domains()` job on CT 119 could be hooked to auto-regen `go.` whenever a new proxy file appears — closes the loop entirely.
