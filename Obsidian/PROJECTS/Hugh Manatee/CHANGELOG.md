# Hugh Manatee — Changelog

## 2026-04-23 — voice loop landed

Wired the real ElevenLabs Conversational AI integration end-to-end in `conversation.tsx`:

- Worker `/agent/config` now returns a short-lived `conversation_token` (via ElevenLabs `GET /v1/convai/conversation/token`) instead of a raw signed URL. RN SDK uses WebRTC + LiveKit under the hood.
- App wraps the router in `ConversationProvider` (the RN re-export of `@elevenlabs/react`'s provider).
- Conversation screen uses `useConversation`:
  - Fetches config + creates a local SQLite session before opening the mic
  - Delivers the deterministic opener via `sendContextualUpdate` so Hugh speaks it verbatim (agent's "first message" is configured empty server-side)
  - Passes six dynamic variables (`first_name`, `birth_year`, `hometown`, `last_memory_topic`, `suggested_seeds`, `era_hooks`) to the agent
  - Captures every `onMessage` turn into the `turns` table live
  - On end / app background / unmount: calls `/session/anchor`, persists title + anchor phrase
- Haptic tick on connect. Large "End" button, alert confirms before closing.

Plane: VOICE-01, -02, -03, -05, -06, -07 → Done. VOICE-04 (barge-in/VAD listening tests) → Backlog — needs real ElevenLabs agents + elderly-user testing.

Type errors found during integration (documented for ADR-candidate pool):
- RN SDK's `onMessage` role is `"user" | "agent"`, not `"user" | "assistant"` as some web examples show.
- Provider export is `ConversationProvider`, not `ElevenLabsProvider`.
- `startSession` is synchronous-return (fire and forget); hook transitions state.
- Private WebRTC session config: `{ conversationToken, connectionType: "webrtc" }` with `agentId?: never`.

## 2026-04-23 — inception

Project inception. Rewriting from native Swift (Aurora/MemoirGuide) to Expo (React Native). Agent prompt library established at `lifebook/agent/`. PRD, ADRs 001–003, roadmap, architecture docs written.
