// Client-side proxy for the Express API.
// Client components hit /proxy/stats etc., which forwards to AUTOMAGIC_API_URL.
// Keeps AUTOMAGIC_API_URL server-only and avoids CORS hassles.

import { NextRequest } from "next/server";

const API_URL = process.env.AUTOMAGIC_API_URL || "http://127.0.0.1:3100";

async function forward(req: NextRequest, segments: string[]) {
  const target = `${API_URL}/api/${segments.join("/")}${req.nextUrl.search || ""}`;
  const init: RequestInit = {
    method: req.method,
    headers: { "content-type": "application/json" },
    cache: "no-store",
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    const body = await req.text();
    if (body) init.body = body;
  }
  try {
    const r = await fetch(target, init);
    const body = await r.text();
    return new Response(body, {
      status: r.status,
      headers: { "content-type": r.headers.get("content-type") || "application/json" },
    });
  } catch (e) {
    return Response.json(
      { error: "backend unreachable", target, detail: String(e) },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}
