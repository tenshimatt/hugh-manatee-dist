import { NextRequest } from "next/server";
import { stripForSpeech } from "@/lib/text-for-speech";

export const runtime = "nodejs";

/**
 * POST /api/ai/speak
 * Body: { text: string; voice_id?: string }
 *
 * Proxies to ElevenLabs streaming TTS. The API key stays server-side.
 *
 * Voice selection notes (for "John the shop foreman"):
 *   - 21m00Tcm4TlvDq8ikWAM = Rachel  (default free-tier sample, female, too light)
 *   - pNInz6obpgDQGcFmaJgB = Adam    (deep American male — good foreman energy)
 *   - TX3LPaxmHKxFdv7VOQHJ = Liam    (gravelly American male — also a good fit)
 * We default to ADAM because it tested best for "veteran Nashville shop
 * foreman" in the demo script. Override per-request via `voice_id`, or
 * globally via the ELEVENLABS_VOICE_ID env var.
 */
const DEFAULT_JOHN_VOICE = "pNInz6obpgDQGcFmaJgB"; // Adam

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "elevenlabs_not_configured" }), {
      status: 501,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { text?: string; voice_id?: string } = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cleaned = stripForSpeech(body.text || "");
  if (!cleaned) {
    return new Response(JSON.stringify({ error: "empty_text" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const voiceId =
    body.voice_id ||
    process.env.ELEVENLABS_VOICE_ID ||
    DEFAULT_JOHN_VOICE;

  // Budget logging — free tier cap is 10k chars/month
  console.log(
    `[tts] voice=${voiceId} chars=${cleaned.length} preview="${cleaned.slice(0, 60).replace(/\n/g, " ")}"`
  );

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`;
  const upstream = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: cleaned,
      model_id: "eleven_turbo_v2_5",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.2,
        use_speaker_boost: true,
      },
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => "");
    console.error("[tts] elevenlabs_error", upstream.status, errText);
    return new Response(
      JSON.stringify({ error: "elevenlabs_error", status: upstream.status, detail: errText }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  // Pipe MP3 chunks straight back to the client.
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
      "X-Chars-Billed": String(cleaned.length),
    },
  });
}
