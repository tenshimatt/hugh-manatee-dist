/**
 * LiteLLM gateway client.
 *
 * Thin, typed wrapper around LiteLLM's OpenAI-compatible /v1/chat/completions endpoint.
 * Supports streaming (SSE) and non-streaming calls.
 *
 * ENV:
 *   LITELLM_URL        e.g. https://jwm-ai.beyondpandora.com
 *   LITELLM_KEY        virtual key (sk-...)
 *   LITELLM_MODEL      default model slug, e.g. anthropic/claude-sonnet-4-6
 *
 * When LITELLM_URL is not set, `liteLLMConfigured()` returns false and callers
 * should fall back to canned responses (offline demo mode).
 */

export const LITELLM_URL = process.env.LITELLM_URL?.replace(/\/$/, "") || "";
export const LITELLM_KEY = process.env.LITELLM_KEY || "";
export const LITELLM_MODEL =
  process.env.LITELLM_MODEL || "anthropic/claude-sonnet-4-6";

export function liteLLMConfigured(): boolean {
  return Boolean(LITELLM_URL && LITELLM_KEY);
}

export type ChatRole = "system" | "user" | "assistant";

export interface ChatContentPartText {
  type: "text";
  text: string;
  // Anthropic prompt-caching hint (LiteLLM passes it through to the provider).
  // `{"type":"ephemeral"}` caches the block for ~5 min, cutting input tokens
  // ~50% on repeated queries that share the same system prompt.
  cache_control?: { type: "ephemeral" };
}
export interface ChatContentPartImage {
  type: "image_url";
  image_url: { url: string };
}
export type ChatContent =
  | string
  | Array<ChatContentPartText | ChatContentPartImage>;

export interface ChatMessage {
  role: ChatRole;
  content: ChatContent;
}

export interface ChatOptions {
  model?: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  response_format?: { type: "json_object" };
}

export interface ChatUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatResult {
  content: string;
  usage?: ChatUsage;
  model?: string;
}

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${LITELLM_KEY}`,
  };
}

/**
 * Non-streaming chat completion.
 */
export async function chat(opts: ChatOptions): Promise<ChatResult> {
  if (!liteLLMConfigured()) {
    throw new Error("LiteLLM not configured");
  }
  const res = await fetch(`${LITELLM_URL}/v1/chat/completions`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      model: opts.model || LITELLM_MODEL,
      messages: opts.messages,
      max_tokens: opts.max_tokens ?? 1024,
      temperature: opts.temperature ?? 0.3,
      ...(opts.response_format ? { response_format: opts.response_format } : {}),
      stream: false,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`LiteLLM error ${res.status}: ${body.slice(0, 500)}`);
  }
  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
    usage?: ChatUsage;
    model?: string;
  };
  return {
    content: data.choices?.[0]?.message?.content ?? "",
    usage: data.usage,
    model: data.model,
  };
}

/**
 * Streaming chat completion. Yields text deltas as they arrive.
 * Also yields a final `{done:true, usage}` event if the upstream provides usage.
 */
export async function* chatStream(
  opts: ChatOptions
): AsyncGenerator<{ delta?: string; done?: boolean; usage?: ChatUsage }> {
  if (!liteLLMConfigured()) {
    throw new Error("LiteLLM not configured");
  }
  const res = await fetch(`${LITELLM_URL}/v1/chat/completions`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      model: opts.model || LITELLM_MODEL,
      messages: opts.messages,
      max_tokens: opts.max_tokens ?? 1024,
      temperature: opts.temperature ?? 0.3,
      stream: true,
      stream_options: { include_usage: true },
    }),
  });
  if (!res.ok || !res.body) {
    const body = res.body ? "" : "(no body)";
    throw new Error(`LiteLLM stream error ${res.status} ${body}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let finalUsage: ChatUsage | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    // SSE frames separated by \n\n
    let idx: number;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const frame = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      for (const line of frame.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") {
          yield { done: true, usage: finalUsage };
          return;
        }
        try {
          const j = JSON.parse(payload) as {
            choices?: { delta?: { content?: string } }[];
            usage?: ChatUsage;
          };
          const delta = j.choices?.[0]?.delta?.content;
          if (delta) yield { delta };
          if (j.usage) finalUsage = j.usage;
        } catch {
          // skip malformed frame
        }
      }
    }
  }
  yield { done: true, usage: finalUsage };
}
