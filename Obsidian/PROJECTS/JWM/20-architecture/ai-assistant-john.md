---
title: John — AI Assistant
status: Built
updated: 2026-04-20
owner: sovereign.ai
---

## Persona

"John" is the embedded AI assistant in the jwm-demo shell. Named after John McDougall (owner) — the voice the team expects to hear.

## Behavior

- Voice I/O: Web Speech API for STT + ElevenLabs for TTS
- LLM path: routed through LiteLLM gateway (CT 123) using JWM virtual key `sk-vwrcwMBaJjdNI_Lbv9ZPbA`
- Active flows: **chat**, **estimator**, **NCR assistant**, **anomaly analysis** — all wired to real Claude (Anthropic)
- Transcription for PLAUD pipeline: `openai/gpt-4o-transcribe` (upgraded from whisper-1)
- Summarize / classify / title passes: `claude-opus-4-7` (upgraded from haiku)

## Fallback

- **Canned fallback always-on** — the demo never shows a blank screen. If ERPNext or LiteLLM are down, pre-baked responses render so the UX stays live.
- See [[../30-decisions/006-canned-fallback-for-live-erpnext]].

## Voice gotchas

- Whisper consistently mishears "T Shop" → "T-Sharp" and "A Shop" → "A-Sharp". Canonical: **T Shop / A Shop** (codes 1040 / 1010).
- Fix at transcript boundary; never let the mishearing leak into DocType names or UI labels.

## Related

- [[stack]]
- [[../30-decisions/004-litellm-gateway]]
- [[../50-research/2026-04-19-voice-recorder-costs]]
