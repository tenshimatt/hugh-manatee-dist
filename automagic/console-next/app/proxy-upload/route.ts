// Streaming multipart proxy for audio drop uploads.
// Client POSTs /proxy-upload → this route forwards the raw body to Express /api/upload.
// Kept separate from /proxy/* so multipart streams aren't clobbered by the JSON-text forwarder.

import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const API_URL = process.env.AUTOMAGIC_API_URL || "http://127.0.0.1:3100";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "application/octet-stream";
  const contentLength = req.headers.get("content-length") || undefined;

  try {
    const r = await fetch(`${API_URL}/api/upload`, {
      method: "POST",
      // @ts-expect-error — undici supports duplex/body streaming
      duplex: "half",
      headers: {
        "content-type": contentType,
        ...(contentLength ? { "content-length": contentLength } : {}),
      },
      body: req.body,
    });
    const text = await r.text();
    return new Response(text, {
      status: r.status,
      headers: { "content-type": r.headers.get("content-type") || "application/json" },
    });
  } catch (e) {
    return Response.json(
      { error: "upload proxy failed", detail: String(e) },
      { status: 502 }
    );
  }
}
