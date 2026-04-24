---
date: 2026-04-25
status: shipped
type: site-rebuild
---

# Sovrein website rebuild — Fundely-inspired, sky/teal/gold theme

## What shipped

Replaced the old single-file Pages Router site at `sovrein.ai` with a Next.js 16 App Router app, taking visual cues from the [Fundely template](https://www.framer.com/marketplace/templates/fundely/) on Framer Marketplace.

**Live:** `sovrein.ai` (promoted from `rebuild/phase-1` branch).

## Stack

- Next.js 16 (App Router) + React 19 + Tailwind v4 + framer-motion + lucide-react
- TypeScript strict
- Hosted on Vercel (team `beyondpandora`, project `sovrein`)
- Source: `tenshimatt/sovrein_website`

## Brand palette (matches Automagic Console)

- `#61a5c2` — sky (primary buttons, hero gradient, nav active)
- `#52b69a` — teal (success, "Listen" step accent, healthy pills)
- `#ffbf69` — gold (warm accent, "Ship" step, hover glows)

Light + dark mode, toggle persisted in `localStorage` with inline-script FOUC prevention.

## Page structure

1. **Nav** — sticky with backdrop blur once scrolled, brand mark + 3 links + theme toggle + primary CTA
2. **Hero** — 84px Inter display, gradient-clipped "safe AI" emphasis, aurora + dot-grid background, two CTAs, signal row
3. **Trust row** — six pill-shaped stack marks (Anthropic / Ollama / n8n / Plane / LiteLLM / Proxmox); marquee on mobile
4. **Services** — 3-card grid (Custom Dev / AI Safety / AI Automation), per-card accent, hover glow, end-to-end gradient banner below
5. **Approach** — "Listen → Design → Ship" 3-step flow, gradient numeric badges, connector line
6. **Principles** — 6-card operating principles grid with quote-mark accents
7. **Contact** — gradient-mesh CTA card, primary email button
8. **Footer** — minimal, brand mark + nav + email

## Background tuning

Light-mode page background was originally `#fafbfd` (near-white) — too low contrast against white surface cards. Dropped to `#dde4ed` (~20% darker), with `--surface-alt` and `--surface-inset` stepped down proportionally so layered sections still distinguish. Borders strengthened to match. Dark mode untouched.

## Motion language

- All sections use `framer-motion` with `whileInView` + `once: true` reveals
- Easing: `[0.22, 1, 0.36, 1]` (ease-out-expo) for that confident snap
- Staggered children with `delay: i * 0.1`
- `useReducedMotion` short-circuit for accessibility

## Vercel preview protection

Project has Vercel Deployment Protection enabled — preview branches return 401 to anonymous traffic. Only the team can view. Prod (`sovrein.ai`) is open. This is the right setup: live marketing site is public, in-progress branches are not.

Preview URL pattern: `<project>-git-<branch-with-dashes>-<team>.vercel.app`. For this repo: `sovrein-git-rebuild-phase-1-beyondpandora.vercel.app`.

## Commits on `rebuild/phase-1` (later promoted to main)

- `4fae7ff` Phase 1: Next.js 16 App Router + design system + Hero + chrome
- `191a59b` Phase 2: Services / Approach / Principles / Contact sections
- `43d77b9` Background ~20% darker for card contrast

## Assets / files

| Path | Purpose |
|---|---|
| `app/globals.css` | Design tokens, light + dark, keyframes, card-base, hero-aurora |
| `app/layout.tsx` | Root layout, Inter font load, FOUC-prevention script |
| `app/page.tsx` | Composes all six sections |
| `components/chrome/{Nav,Footer,Logo,ThemeToggle}.tsx` | Sticky header chrome |
| `components/sections/{Hero,TrustRow,Services,Approach,Principles,Contact}.tsx` | Page sections |
| `components/ui/{Button,Container,Eyebrow}.tsx` | Primitives |
| `components/motion/Reveal.tsx` | Reusable motion wrapper |
| `lib/utils.ts` | `cn()` helper |
| `_pages_legacy/` | Old Pages Router site, untracked, kept locally |

## What's *not* shipped

- No analytics yet
- No OG image (`metadataBase` set; needs `/public/og-sovrein.png`)
- Principles section uses generic operating-principles copy — replace with real testimonials when available
- No blog / no pricing / no integrations grid (intentional — not on the original site either)

## Why these design choices

- **Fundely as reference, not template** — we own clean Next.js code, not Framer-generated spaghetti. No ongoing Framer dependency.
- **Built-on stack as proof** — instead of fake client logos, the trust row shows the real tech stack we run. Honest, distinctive, unfakeable.
- **Sky/teal/gold over Fundely's orange** — keeps the brand consistent with the Automagic Console (same three hex values).
- **One-team-three-services framing preserved** — the existing copy was already strong; the rebuild was about feel, not message.
