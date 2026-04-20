---
title: JWM Production System — Overview
status: Draft
updated: 2026-04-20
owner: sovereign.ai
---

## Problem

JWM runs a hand-rolled MES inside Excel + Smartsheet on top of Epicor. Processing division has lost $500K/month for 3 months due to visibility gaps. Archer Consulting proposed a $430K–$550K 2-year Smartsheet Control Center build with a Jan 2027 go-live.

## Solution

Sovereign stack: ERPNext (Frappe v15) backbone + `jwm_manufacturing` custom app + Next.js shell (the everyday UI) + LiteLLM gateway + n8n + Authentik SSO, all on JWM-owned Proxmox infra. Total $165K + $25K contingency over 11 months, Epicor retired 2027-03-31.

## Who

- **Chris Ball** — COO, champion (trusts Matt, bought in)
- **Drew Adams** — Master Scheduler + Inventory Control (hidden decision-maker)
- **Hannah** — Ops Mgr, Processing (oversees Lisa/Autumn/Owen)
- **John McDougall** — Owner (insists on full company name)

## Why

Two-plane sovereignty, collapses sales cycle by showing a working system vs 20 pages of "TBD." Matt-orchestrated build pattern replaces $90K of Archer's padding.

## Success

- Monday 2026-04-20 demo: team sees their world reflected accurately
- Phase 1 live, Phase 2 (Inventory + Subcontracting) commits by end of meeting
- Drew's 6 KPIs visible in /shop/efficiency

## Division pages

[[10-executive]] · [[20-architectural]] · [[30-processing]] · [[40-engineering]] · [[50-shop-floor]] · [[60-quality]] · [[70-safety]] · [[80-maintenance]] · [[90-fleet]] · [[95-inventory]]
