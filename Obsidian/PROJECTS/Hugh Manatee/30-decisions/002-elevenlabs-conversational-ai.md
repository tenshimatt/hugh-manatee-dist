# ADR-002: Use ElevenLabs Conversational AI for the voice loop

**Status:** Accepted
**Date:** 2026-04-23

## Context

The product's defining interaction is an unhurried, low-latency voice conversation between the user and Hugh. This requires:

- Streaming TTS (Hugh's voice)
- Streaming STT (user's words)
- Voice activity detection (when is the user speaking / finished)
- Barge-in (user can interrupt Hugh mid-sentence)
- Endpointing (know when the user has stopped, without being trigger-happy on elderly pauses)
- An LLM turn-taker that holds the conversation to Hugh's rules

The existing codebase attempts to build this stack piecemeal: custom silence detection, custom conversation manager, TTS via OpenAI, speech-to-text on-device. The result is mechanical and doesn't handle barge-in or real streaming.

## Options considered

1. **Build our own voice loop** — OpenAI Realtime or Gemini Live API + custom VAD + custom conversation state.
2. **ElevenLabs Conversational AI** — one API that packages TTS+STT+VAD+LLM+turn-taking, configurable per-agent.
3. **Daily.co / Pipecat + ElevenLabs TTS** — voice orchestration framework that gives flexibility but adds complexity.

## Decision

**Option 2: ElevenLabs Conversational AI.**

## Rationale

- **It's the single highest-leverage decision in the build.** Latency is the product. ElevenLabs CAI is purpose-built for < 800ms round-trip voice with barge-in. Matching that with a DIY stack is weeks of tuning.
- **Voice is also an ElevenLabs strength.** We were going to use them for TTS regardless; using CAI collapses four services (STT, TTS, VAD, turn-taker) into one vendor with one billing line.
- **Agent per voice.** We create one CAI agent per curated voice. System prompt is the same across agents; voice ID differs. Clean model.
- **Dynamic variables** let us pass per-session context (name, birth year, anchor phrase, seed prompts, era hooks) into the agent's prompt template at session open. No custom context-injection layer needed.
- **Pipecat** adds a layer we don't need. We're not doing multi-provider fallback, not orchestrating multiple AI tools mid-call, not handling group calls. Skip.

## Consequences

**Gained:**
- Production-quality voice loop on day one
- Barge-in, endpointing, and turn-taking are solved problems
- Per-session prompt injection via dynamic variables
- Single vendor for the voice layer

**Given up:**
- Vendor lock-in to ElevenLabs (including their pricing changes)
- Less granular control over turn-taking heuristics — we configure, we don't code
- Transcripts come from ElevenLabs' STT, not a model we pick. Quality is very good but we don't get to swap Whisper in.

**Mitigations:**
- The `agent/` directory holds prompts provider-agnostically. If we ever need to move providers, the rewrite is in the app layer and Worker; the prompts port.
- Pricing risk is real (~$0.10/min). We have a pricing decision ([[PRD#10-open-questions]]) to make before public launch. Beta phase lets us measure real per-user minutes.
- Transcripts are stored verbatim in SQLite; we're never locked to ElevenLabs for downstream analysis.

## Configuration notes

- **Retention:** set to zero-retention on the CAI agent where supported. User content must not persist at the vendor.
- **Voice IDs:** placeholders now, finalized after week 5 listening tests.
- **System prompt:** loaded from `agent/system-prompt.md` + merged follow-up rules. Updated via CAI agent config, not in-app.
- **First turn:** always client-rendered from `opening-scripts.md`. Never generated. First impressions can't vary.
