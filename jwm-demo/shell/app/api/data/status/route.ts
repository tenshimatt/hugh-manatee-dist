import { NextResponse } from "next/server";
import { isLive } from "@/lib/erpnext-live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Probes ERPNext for a small, fast list call so we report "live" only if
 * the backend is actually reachable (not just configured).
 */
export async function GET() {
  if (!isLive()) {
    return NextResponse.json({ live: false, reason: "not_configured" });
  }
  try {
    const url = `${process.env.ERPNEXT_URL?.replace(/\/$/, "")}/api/resource/Work%20Order?limit_page_length=1`;
    const res = await fetch(url, {
      headers: {
        Authorization: `token ${process.env.ERPNEXT_API_KEY}:${process.env.ERPNEXT_API_SECRET}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      return NextResponse.json({ live: false, reason: `http_${res.status}` });
    }
    return NextResponse.json({ live: true, backend: "ERPNext" });
  } catch (e) {
    return NextResponse.json({ live: false, reason: String(e) });
  }
}
