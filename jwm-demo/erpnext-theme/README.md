# JWM ERPNext Theme

JWM brand layer for the ERPNext site at `jwm-erp.beyondpandora.com`.

## What's in here

| | |
|---|---|
| `jwm_brand.css` | The CSS that paints Desk, portal, and login in JWM navy + gold |
| `deploy.sh` | Pushes the CSS into CT 171 (both backend + frontend containers), registers `app_include_css` / `web_include_css` in the custom app's `hooks.py`, applies logo/favicon/app-name settings, clears cache. Idempotent — safe to rerun. |

## Apply / re-apply

```bash
./deploy.sh
```

Then hard-refresh the browser (⇧⌘R).

## What it styles

- **Desk** (`/app/*`): navy gradient navbar with gold accent strip, cream body wash, JWM-gold primary buttons, gold-accented sidebar selection, logo injected left of breadcrumbs when sidebar collapsed
- **Portal** (`/me`, `/contact`, etc.): full navy top bar, gold "JWM" brand text, white sidebar with gold hover/active accents, card-style content panels
- **Login page** (`/login`): navy gradient backdrop with gold radial highlights, elevated white login card, navy sign-in button → gold on hover, tagline "A Better Way to Build Since 1938." pinned bottom-left
- **Search dropdown**: white background, navy text, subtle gold highlighter on matched letters, gold left-border on hover
- **Other dropdowns** (user menu, notifications): scoped so navbar text rules don't bleed into them
- **Login title**: "Login to JWM" (not "Login to Frappe")

## Brand constants

```css
--jwm-navy: #064162;
--jwm-navy-dark: #052f47;
--jwm-gold: #e69b40;
--jwm-gold-dark: #c7842f;
--jwm-cream: #f8f5ef;
```

Matches the Next.js demo shell palette so the two UIs feel like one product.

## Where it lives in production

| | Path |
|---|---|
| Source in app | `/home/frappe/frappe-bench/apps/jwm_manufacturing/jwm_manufacturing/public/css/jwm_brand.css` (inside `frappe_docker-backend-1`) |
| Served from | `/home/frappe/frappe-bench/sites/assets/jwm_manufacturing/css/jwm_brand.css` (inside `frappe_docker-frontend-1`) |
| Public URL | https://jwm-erp.beyondpandora.com/assets/jwm_manufacturing/css/jwm_brand.css |
| Registered via | `hooks.py` — `app_include_css` (Desk) + `web_include_css` (portal/login) |

## Reverting

If branding needs to come off quickly:

```bash
ssh root@10.90.10.10 "pct exec 171 -- docker exec -u frappe frappe_docker-backend-1 bash -c '
  sed -i \"/JWM brand theme/,+2d\" /home/frappe/frappe-bench/apps/jwm_manufacturing/jwm_manufacturing/hooks.py
  bench --site jwm-erp.beyondpandora.com clear-cache
'"
```

The CSS file stays on disk but no longer loads. Re-run `deploy.sh` to turn it back on.

## Gotcha captured

In `frappe_docker`, the backend and frontend containers have **separate anonymous volumes mounted at `/home/frappe/frappe-bench/sites/assets`**. Writing to the backend's copy does NOT make a file visible to the nginx frontend. The deploy script handles both.
