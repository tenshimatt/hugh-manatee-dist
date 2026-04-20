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
 *   - nPczCjzI2devNBz1zQrb = Brian   (deep, warm, podcast-host — DEFAULT)
 *   - N2lVS1w4EtoT3dr4eOWO = Callum  (gruff/edgy — try if Brian is too smooth)
 *   - iP95p4xoKVk53GoZ742B = Chris   (casual conversational — younger)
 *   - 5Q0t7uMcjvnagumLfvZi = Paul    (warm newsman)
 *   - pNInz6obpgDQGcFmaJgB = Adam    (deep but a bit robotic — previous default)
 *   - TX3LPaxmHKxFdv7VOQHJ = Liam    (gravelly American male)
 * Default is BRIAN — less "alien", more podcast / Joe Rogan-ish. Override per
 * request via `voice_id`, or globally via ELEVENLABS_VOICE_ID.
 */
const DEFAULT_JOHN_VOICE = "nPczCjzI2devNBz1zQrb"; // Brian

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
        // Lower stability = more natural prosody variation (less robotic).
        // Higher style = more personality/emotion (keeps it conversational).
        // Tuned for "podcast-host" feel rather than "announcement".
        stability: 0.35,
        similarity_boost: 0.8,
        style: 0.45,
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
