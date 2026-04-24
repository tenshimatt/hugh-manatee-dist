# Sovrein Labs — Build Platform

**Live at**: https://labs.beyondpandora.com

Single-pane launchpad for every Sovrein project. Registry-driven — add a block of YAML, restart one service, project appears.

---

## Stack (as of 2026-04-24)

- **Runtime**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind v4 — Automagic design system (hex tokens, `am-card`, `am-gradient`, `am-pulse-dot`)
- **Theme**: Light/dark toggle, persisted in `localStorage('am-theme')`, OS-preference default, FOUC-free inline script
- **Icons**: lucide-react
- **Fonts**: Inter (via `next/font/google`)
- **Data**: single `registry.yml` read in a Server Component (force-dynamic, no cache)
- **Build output**: `standalone` — self-contained ~80 MB bundle, starts in ~1 s
- **Service**: systemd `sovrein-labs-next.service`, Node 20, port 3000

**Design system**: Shared with Automagic Console (`/opt/console-next/`). This is the standard theme for all Beyond Pandora built projects.
- Light: `#f7fafc` background, `#ffffff` surface, `#0f172a` foreground
- Dark: `#0b1420` background, `#111c2c` surface, `#e2e8f0` foreground
- Brand: `--am-sky: #61a5c2`, `--am-teal: #52b69a`, `--am-gold: #ffbf69`

**Previous stack** (retired 2026-04-18): Express + EJS. Disabled as `sovrein-labs.service`.

---

## Architecture

```
                    labs.beyondpandora.com
                              │
                       Cloudflare (DNS)
                              │
                      CT 113 cloudflared
                              │
                       CT 103 Traefik
                              │
                   CT 120  ─  Sovrein Labs :3000 (Next.js)
                    │         reads registry.yml
                    │
                    ├─ JWM demo
                    ├─ Automagic :3100 (legacy) / :3200 (new Next.js)
                    └─ (future built projects)
```

### Split of responsibilities

- **CT 120** = frontends (built user-facing projects). Sprawl cap: one CT.
- **CT 103** = Traefik routing `*.beyondpandora.com` → backend CTs.
- **CT 113** = Cloudflared tunnel (public access + TLS).
- **Backends** (Archon CT 111, Postgres CT 117, n8n CT 107, ERPNext etc.) stay where they are. Don't move for the sake of moving.

---

## Adding a new project — the repeatable pattern

1. **Deploy the app** somewhere (usually as a container or systemd service on CT 120, picking an unused port in the 3000–3999 range).

2. **Add a Traefik route** on CT 103 — copy `/etc/traefik/conf.d/proxy-labs.yml`, swap name + host + target port. Traefik auto-reloads.

3. **Point DNS** — `beyondpandora.com` has wildcard via Cloudflare; nothing to do for `<slug>.beyondpandora.com`.

4. **Register on Sovrein Labs** — append a block to `/opt/sovrein-labs-next/.next/standalone/registry.yml` on CT 120:
   ```yaml
   - name: My New Project
     slug: myproj
     tagline: One-line pitch (<80 chars).
     url: https://myproj.beyondpandora.com
     status: live            # live | staging | planned | offline
     category: tool          # tool | demo | experiment | infrastructure
     icon: 🚀
     docs: Obsidian/PLAUD/PROJECTS/MyProj/
     host: CT 120
   ```
   Then: `systemctl restart sovrein-labs-next` on CT 120.

5. **Write the PRD** — create `Obsidian/PLAUD/PROJECTS/<ProjectName>/PRD.md`. Path must match `docs:` field.

6. **Create a Plane project** with slug matching registry `slug`. Tasks live there.

7. **Done.** The project appears on `labs.beyondpandora.com`, is reachable at its subdomain, has docs in Obsidian, and tasks in Plane.

---

## Port allocation convention on CT 120

| Range | Use |
|---|---|
| 3000 | Sovrein Labs landing page |
| 3100 | Automagic Console (legacy Alpine.js) |
| 3200 | Automagic Console (new Next.js) |
| 3300–3999 | New built projects (allocate next free) |

Keep a `# port: 3xxx` comment against each project in `registry.yml` to avoid collisions.

---

## Files and services

### On CT 120 (`10.90.10.20`)

| Path | Purpose |
|---|---|
| `/opt/sovrein-labs-next/` | Next.js source (src/, registry.yml, next.config.ts, package.json) |
| `/opt/sovrein-labs-next/.next/standalone/` | Production bundle (what systemd runs) |
| `/opt/sovrein-labs-next/.next/standalone/registry.yml` | **The source of truth** — edit here to add/remove projects |
| `/etc/systemd/system/sovrein-labs-next.service` | Auto-start on boot, on-failure restart |

### On CT 103 (Traefik)

| Path | Purpose |
|---|---|
| `/etc/traefik/conf.d/proxy-labs.yml` | Route for `labs.beyondpandora.com` → `10.90.10.20:3000` |
| `/etc/traefik/conf.d/proxy-<slug>.yml` | One file per project (copy the labs one as template) |

### Key source files

| Path | Purpose |
|---|---|
| `src/app/page.tsx` | Homepage Server Component, renders the grouped grid |
| `src/app/layout.tsx` | Root layout, FOUC-free theme init script, Inter font |
| `src/app/globals.css` | Automagic design system: hex palette, light/dark vars, am-card/am-gradient utilities |
| `src/components/chrome/ThemeToggle.tsx` | Client component — Sun/Moon toggle, localStorage persistence |
| `src/app/api/registry/route.ts` | `GET /api/registry` JSON endpoint |
| `src/lib/registry.ts` | YAML loader with TypeScript types |
| `src/lib/utils.ts` | shadcn `cn()` helper |
| `src/components/ui/card.tsx` | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| `src/components/ui/badge.tsx` | Badge with `live`/`staging`/`planned`/`offline` variants |

### Commands

```bash
# Edit registry
ssh root@10.90.10.10
pct exec 120 -- nano /opt/sovrein-labs-next/.next/standalone/registry.yml
pct exec 120 -- systemctl restart sovrein-labs-next

# Rebuild after code changes
pct exec 120 -- bash -c 'cd /opt/sovrein-labs-next && npm run build && cp registry.yml .next/standalone/ && cp -r .next/static .next/standalone/.next/ && systemctl restart sovrein-labs-next'

# Logs
pct exec 120 -- journalctl -u sovrein-labs-next -f

# Health
curl https://labs.beyondpandora.com/
curl https://labs.beyondpandora.com/api/registry | jq
```

---

## Design choices (and why)

- **Registry-driven, not hand-coded HTML.** Adding project #20 is the same effort as project #2. The YAML is more readable than any UI would be for this scale.
- **No database.** Registry is a file. Diff-able, git-able, survives all restarts.
- **Next.js App Router + Server Component.** Zero client JS for the page (just hover CSS). File-read happens on the server; no API call, no hydration overhead.
- **Standalone output.** Bundle includes a minimal `server.js` + trimmed `node_modules` — no need to keep the full dev tree on CT 120 at runtime. The `.next/standalone` folder is what systemd points at.
- **Force-dynamic on `/` and `/api/registry`.** We want registry changes to reflect on restart without needing a rebuild.
- **Automagic design system.** Shared token set (hex, not oklch — better DevTools readability) across all Beyond Pandora projects. Light + dark mode with a `ThemeToggle` button; OS-preference default; FOUC-free inline script in `<head>`. Same CSS classes (`am-card`, `am-gradient`, `am-pulse-dot`) as Automagic Console so future projects can copy-paste without thinking.
- **shadcn-style but self-contained.** Skipped the `shadcn` CLI — hand-copied the two components we actually need (Card, Badge). Zero external component dependency to vendor.
- **Graceful handling of `planned` projects.** Cards without a URL render as non-clickable placeholders — they belong in the launchpad as a public commitment, not hidden until they're live.

---

## Trade-off: single point of failure

CT 120 hosts multiple frontends now. If CT 120 is down, the launchpad and every frontend on it are down. That's fine for a lab. If a project graduates to paying users or needs SLA:

1. Move that project to its own CT.
2. Update its Traefik route target.
3. Update `host:` field in registry.yml.

The registry makes promotion mechanical — no other code changes.

---

## Roadmap (tiny)

- [ ] Favicon + proper OG image (right now it's just the title).
- [ ] Health-check each `url` server-side, flip `status` to `offline` automatically when a live project is down. Cron every 60 s.
- [ ] Optional: `secret: true` flag on projects behind Authentik — show them only when SSO'd in.
- [ ] Optional: pull icons/screenshots from repo via GitHub API instead of emoji.

Nothing here is blocking. The platform works without any of it.

---

## Related

- **Source**: [github.com/tenshimatt/sovrein-labs](https://github.com/tenshimatt/sovrein-labs)
- **Archon (v1 + v2)**: `Obsidian/PLAUD/PROJECTS/Archon/README.md`
- **JWM demo**: `Obsidian/PROJECTS/JWM/README.md`
