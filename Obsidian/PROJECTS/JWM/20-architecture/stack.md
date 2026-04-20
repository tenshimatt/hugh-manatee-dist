---
title: JWM Stack
status: Built
updated: 2026-04-20
owner: sovereign.ai
---

## Components and hosts

| Tier | Component | CT | URL | Notes |
|---|---|---|---|---|
| UX | Next.js shell (jwm-demo) | CT 120 | https://jwm-demo.beyondpandora.com | `:3200`, `systemctl status jwm-demo`, Bun local / npm+node in prod |
| ERP | ERPNext v15.94.3 (Frappe Docker) | CT 171 | https://jwm-erp.beyondpandora.com | Compose stack at `/root/frappe_docker/`, site `frontend` |
| AI | LiteLLM gateway | CT 123 | https://jwm-ai.beyondpandora.com | JWM virtual key `sk-vwrcwMBaJjdNI_Lbv9ZPbA` |
| SSO | Authentik | CT 105 | https://auth.beyondpandora.com | App slug `jwm` (OIDC issuer) |
| Edge | Traefik + Cloudflared | CT 103 + 113 | — | Wildcard TLS |

## Users (Authentik, created 2026-04-18)

- Chris Ball: `cball` / cball@jwmcd.com (pk=28)
- Mark Slingsby: `mslingsby` / markslingsby@gmail.com (pk=29)

## API credentials

- Frappe Administrator token: key `c3132bc83582071` / secret `642ac0c571db51a`
- Stored: CT 171 `/opt/jwm-import/.env`, CT 120 `/opt/jwm-demo/.env.local` as `FRAPPE_API_KEY` / `FRAPPE_API_SECRET`
- Auth header: `Authorization: token <key>:<secret>`

## Custom Frappe app

- `jwm_manufacturing` — DocTypes: `JWM Production Schedule Line`, `JWM Daily Efficiency`, `JWM NCR`, `JWM CAR`, `RMA`, `JWM Overrun Allocation`, `Project Traveler`
- Custom fields on Work Order: `jwm_division` (Processing / Architectural / Mixed), `jwm_baseline_date`, `jwm_revised_date`

## Related docs

- [[data-model]] · [[ai-assistant-john]] · [[deployment]] · [[erpnext-schema]]
- [[../30-decisions/001-headless-erpnext]]
