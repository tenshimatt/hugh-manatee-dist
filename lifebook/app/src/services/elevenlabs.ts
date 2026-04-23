/**
 * ElevenLabs Conversational AI client wrapper.
 *
 * Hugh's voice loop runs entirely through ElevenLabs CAI — streaming STT + LLM
 * + TTS + VAD + barge-in all handled server-side. We get a signed WebSocket URL
 * from the Worker and hand it to the @elevenlabs/react-native SDK.
 *
 * This file is a thin facade. The real client wiring uses the SDK's hooks
 * inside the conversation screen — the class below exposes a simple
 * start/stop/onTurn API for non-React callers and tests.
 *
 * See ADR-002 in Obsidian for why we're using this, not a DIY voice loop.
 */

export type TurnEvent =
  | { speaker: "user"; text: string; final: boolean }
  | { speaker: "hugh"; text: string; final: boolean };

export interface HughStartConfig {
  signed_url: string;
  agent_id: string;
  first_turn: string;
  dynamic_variables: Record<string, string | number | string[]>;
}

type TurnCb = (turn: TurnEvent) => void;
type StatusCb = (status: HughStatus) => void;

export type HughStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "speaking"
  | "thinking"
  | "ended"
  | "error";

/**
 * Stub implementation. Wire to `@elevenlabs/react-native` in the real
 * conversation screen. This class exists so non-UI callers (session
 * post-processors, tests) can depend on a stable interface.
 */
export class HughConversation {
  private turnCbs: TurnCb[] = [];
  private statusCbs: StatusCb[] = [];
  private status: HughStatus = "idle";

  async start(_config: HughStartConfig): Promise<void> {
    this.setStatus("connecting");
    // TODO: open WS to signed_url, attach mic, pipe audio frames, listen for
    // message events (user_transcript, agent_response, agent_response_audio).
    throw new Error(
      "HughConversation.start: not implemented. Use the @elevenlabs/react-native " +
        "hooks directly from conversation.tsx for now.",
    );
  }

  async stop(): Promise<void> {
    this.setStatus("ended");
  }

  onTurn(cb: TurnCb): () => void {
    this.turnCbs.push(cb);
    return () => {
      this.turnCbs = this.turnCbs.filter((x) => x !== cb);
    };
  }

  onStatus(cb: StatusCb): () => void {
    this.statusCbs.push(cb);
    return () => {
      this.statusCbs = this.statusCbs.filter((x) => x !== cb);
    };
  }

  getStatus(): HughStatus {
    return this.status;
  }

  private setStatus(s: HughStatus) {
    this.status = s;
    for (const cb of this.statusCbs) cb(s);
  }

  // Exposed for the real WS handler to push events into the stub API.
  _emitTurn(turn: TurnEvent) {
    for (const cb of this.turnCbs) cb(turn);
  }
}
