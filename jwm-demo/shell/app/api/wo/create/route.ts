import { NextRequest, NextResponse } from "next/server";
import { createDoc, erpnextConfigured } from "@/lib/erpnext";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  if (erpnextConfigured()) {
    try {
      const doc = await createDoc<{ name: string }>("Work Order", body);
      return NextResponse.json({ ok: true, name: doc.name });
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: String(err) },
        { status: 502 }
      );
    }
  }

  // Canned: synthesize a plausible WO number
  const n = 218 + Math.floor(Math.random() * 5);
  const name = `WO-2026-00${String(n).padStart(3, "0")}`;
  return NextResponse.json({ ok: true, name, stubbed: true });
}
