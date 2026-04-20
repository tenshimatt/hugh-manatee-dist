---
title: ADR-004 — LiteLLM as single AI gateway
status: Built
updated: 2026-04-20
owner: sovereign.ai
---

# ADR-004: Route all JWM AI through LiteLLM

## Context

JWM's AI features (John chat, estimator, NCR assistant, anomaly analysis, PLAUD transcription/summarize) span OpenAI (whisper/gpt-4o-transcribe) + Anthropic (Claude Opus 4.7 / haiku). Direct-to-provider SDK use would mean key sprawl, per-workload budget enforcement headaches, no visibility.

## Decision

Single **LiteLLM gateway on CT 123** (`https://jwm-ai.beyondpandora.com`). All JWM workloads use a dedicated virtual key `sk-vwrcwMBaJjdNI_Lbv9ZPbA`. Separate virtual key `plaud-pipeline` ($50 / 30d budget) for the n8n transcription pipeline.

## Consequences

- One place to rotate credentials, enforce budgets, switch providers.
- Model swaps are config, not code (whisper-1 → gpt-4o-transcribe, haiku → opus-4-7 done this way 2026-04-19).
- Single point of failure — mitigated by canned fallback ([[006-canned-fallback-for-live-erpnext]]).
- Cost observability centralised.

## Date

2026-04-19

## Status

Accepted
