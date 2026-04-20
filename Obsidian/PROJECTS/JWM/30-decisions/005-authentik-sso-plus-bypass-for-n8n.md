---
title: ADR-005 — Authentik SSO with n8n bypass
status: Built
updated: 2026-04-20
owner: sovereign.ai
---

# ADR-005: Authentik SSO for user surfaces; bypass for n8n

## Context

JWM stack uses Authentik (CT 105) for SSO across user-facing surfaces — jwm-demo shell, ERPNext, portals. Initially n8n was behind Authentik too. But n8n has two traffic classes that break under SSO: (1) webhook receivers called by external services (PLAUD pipeline, ERPNext scheduler, Claude tool calls), and (2) API clients authenticating with API keys. Both return 302-to-Authentik-login instead of operating.

## Decision

- **In SSO**: jwm-demo, ERPNext desk/UI, auth.beyondpandora.com
- **Out of SSO (direct)**: n8n, any service with webhook receivers or API-only clients
- Rule of thumb: if the primary caller is a human browser, SSO it. If the primary caller is a service or script, don't.

## Consequences

- n8n endpoints exposed directly (still behind Cloudflared tunnel); protect by API key + allowlist.
- Consistent with global skill `103_traefik_authentik_sso_rollout.md` decision matrix.
- Chris's login flow unchanged — he only sees shell + ERPNext.
- Future service adds must be classified against this rule.

## Date

2026-04-18

## Status

Accepted
