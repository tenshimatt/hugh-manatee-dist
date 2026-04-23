/**
 * Thin client for the Hugh Manatee Cloudflare Worker.
 *
 * Endpoints:
 *   POST /agent/config     — ElevenLabs agent config + signed WS URL + first turn + context
 *   POST /collage/images   — Unsplash images + gradient colors
 *   POST /session/anchor   — Claude-extracted anchor + title + entities
 *
 * Worker source: /worker/src/index.ts
 * Architecture: Obsidian/PROJECTS/Hugh Manatee/20-architecture/ARCHITECTURE.md
 */

import Constants from "expo-constants";

const WORKER_URL =
  (Constants.expoConfig?.extra as { WORKER_URL?: string } | undefined)?.WORKER_URL ??
  process.env.EXPO_PUBLIC_WORKER_URL ??
  "http://localhost:8787";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${WORKER_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Worker ${path} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

export interface AgentConfigRequest {
  first_name: string;
  birth_year?: number | null;
  hometown?: string | null;
  voice_id: string;
  last_anchor?: string | null;
  preference?: "old" | "recent";
}

export interface AgentConfigResponse {
  agent_id: string;
  signed_url: string;
  first_turn: string;
  runtime_context: {
    seed_prompts: string[];
    era_hooks: string[];
  };
}

export const fetchAgentConfig = (req: AgentConfigRequest) =>
  post<AgentConfigResponse>("/agent/config", req);

export interface CollageRequest {
  birth_year?: number | null;
  hometown?: string | null;
  theme?: string;
}

export interface CollageResponse {
  images: { url: string; alt: string }[];
  gradient: { from: string; to: string };
}

export const fetchCollageImages = (req: CollageRequest) =>
  post<CollageResponse>("/collage/images", req);

export interface AnchorRequest {
  turns: { speaker: "user" | "hugh"; text: string }[];
}

export interface AnchorResponse {
  anchor_phrase: string;
  title_suggestion: string;
  entities: { kind: string; value: string }[];
}

export const fetchSessionAnchor = (req: AnchorRequest) =>
  post<AnchorResponse>("/session/anchor", req);
