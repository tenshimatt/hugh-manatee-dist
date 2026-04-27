---
date: 2026-04-27
status: shipped
type: ui-improvement
---

# Service-card logos on go. and portal.

Both `go.beyondpandora.com` (CT 120) and `portal.beyondpandora.com` (CT 119) are static-HTML launchers served by `python3 -m http.server`. Cards previously had only text — now each card carries a 40px logo, sky/teal/gold-tinted Lucide fallback for custom services.

## Source: dashboard-icons CDN

Used [homarr-labs/dashboard-icons](https://github.com/homarr-labs/dashboard-icons) via jsDelivr — ~3,000 self-hosted-app logos in one consistent flat style, MIT-licensed:

```
https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/<slug>.png
```

No local hosting; CDN-cached worldwide.

## Implementation

### go. (CT 120 `/opt/go/index.html`)

Direct edit. Each `.card` now contains:
```html
<a class="card" href="...">
  <span class="logo"><img src="...cdn.../<slug>.png" alt="" loading="lazy"></span>
  <div class="content"><div class="name">…</div><div class="desc">…</div></div>
</a>
```

For custom services without a dashboard-icon (Hermes Portal, Sovrein Labs, Automagic Console, Jake Portal, Archon, JWM Demo, JWM AI, Web-Check, LiteLLM, JWM ERPNext), I dropped in inline Lucide SVGs tinted with the section accent (sky / teal / gold).

Mirror at `/Users/mattwright/pandora/go_beyondpandora/index.html`.

### portal. (CT 119 `/root/web-dashboard/index.html`)

The Portal HTML is also static but has a different card markup. Rather than rewrite all 50 cards, I injected:
1. A `<style>` block at the end of the existing `<style>` for logo CSS
2. A `<script>` block before `</body>` that runs at DOMContentLoaded, walks every `a.service-card`, derives the logo URL from the card's hostname, and prepends a logo `<span>` plus wraps the existing name/url in an info span.

Idempotent (re-injection no-ops). Reversible — remove the two blocks and revert to `_old.html`.

The injector script lives in `/Users/mattwright/pandora/portal_beyondpandora/icons-patch.py` so it can be re-run on future updates of the portal HTML.

## Mapping

Most subdomains match dashboard-icons slugs directly (`plane.beyondpandora.com` → `plane.png`). A handful needed overrides:

| Hostname | dashboard-icons slug |
|---|---|
| `openwebui` | `open-webui` |
| `comfy` | `comfyui` |
| `draw` | `excalidraw` |
| `project` | `plane` |
| `search` | `searxng` |
| `wiki` | `bookstack` |
| `kumo`, `supercloud` | `nextcloud` |
| `stream` | `plex` |
| `signin` | `authentik` |
| `collabora` | `collabora-online` |
| `wordpress-yld` | `wordpress` |
| `code` | `code-server` |
| All `n8n*` variants | `n8n` |

## Slugs that DON'T exist (use Lucide fallback)

- `litellm` (model gateway) → Lucide `Plug` icon, teal
- `erpnext` / `frappe` (JWM ERPNext) → Lucide `Briefcase`, teal
- Anything else returning 403 from jsDelivr triggers an `onerror` handler that swaps to a generic Lucide `Box` icon.

## What stays for later

- **Portal data-driven cards** still update from JSON files (`status.json`, `gpu_status.json` etc.) — the icon injection runs on every page load and works regardless of whether the cards are static or dynamically rendered, so this keeps working when those JSONs change.
- The Cloudflare-tunnel filtering in `/etc/traefik/conf.d/proxy-go.yml` is still inert — the `go.` site is publicly reachable despite the comment intent.
