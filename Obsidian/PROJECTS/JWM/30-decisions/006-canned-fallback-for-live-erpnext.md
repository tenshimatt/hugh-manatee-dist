---
title: ADR-006 — Canned fallback for live ERPNext calls
status: Built
updated: 2026-04-20
owner: sovereign.ai
---

# ADR-006: Always-on canned fallback when ERPNext / LiteLLM are down

## Context

The jwm-demo shell binds to ERPNext (CT 171) and LiteLLM (CT 123) over HTTP. Transient failures — backend restarts, network blips, SSO hiccups — produced blank screens during testing. A blank screen in front of Chris or his team is worse than slightly stale data: it signals "the new system doesn't work." The demo must never show empty state.

## Decision

Every data-fetching screen renders **pre-baked canned fallback** data if the live call fails or times out. The UX stays live; a subtle indicator shows we're in fallback mode. Same pattern for AI flows — if LiteLLM is unreachable, John returns a canned plausible response.

## Consequences

- Seed data must stay synced to the canned fallback so they don't diverge visibly.
- Fallback layer is a permanent feature, not a demo-only crutch — production JWM team needs the same resilience.
- Testing must cover both live and fallback paths.
- Linked to [[004-litellm-gateway]] (single point of failure) and [[../20-architecture/ai-assistant-john]].

## Date

2026-04-19

## Status

Accepted
