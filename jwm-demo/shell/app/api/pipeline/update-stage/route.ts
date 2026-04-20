/**
 * POST /api/pipeline/update-stage
 *
 * Body: { cardId: string, stage: string }
 *
 * Patches `jwm_stage` on the matching JWM Production Schedule Line. `cardId`
 * is the UI card id which we map back to the ERPNext `name` via the imported
 * production-schedule.json. Server-side proxy keeps the admin token off the
 * browser.
 */
import { NextRequest, NextResponse } from "next/server";
import productionSchedule from "@/lib/canned/production-schedule.json";

export const runtime = "nodejs";

const ERPNEXT_URL = process.env.ERPNEXT_URL || "";
const ERPNEXT_API_KEY = process.env.ERPNEXT_API_KEY || "";
const ERPNEXT_API_SECRET = process.env.ERPNEXT_API_SECRET || "";

type CannedRow = { id: string; name?: string; jwm_raw_data?: unknown };

function lookupScheduleLineName(cardId: string): string | null {
  const rows = productionSchedule as CannedRow[];
  const match = rows.find((r) => r.id === cardId);
  if (!match) return null;
  return match.name ?? null;
}

export async function POST(req: NextRequest) {
  let body: { cardId?: string; stage?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_json" }, { status: 400 });
  }
  const { cardId, stage } = body;
  if (!cardId || !stage) {
    return NextResponse.json({ ok: false, reason: "missing_fields" }, { status: 400 });
  }

  if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
    return NextResponse.json({ ok: true, mode: "canned", cardId, stage });
  }

  const lineName = lookupScheduleLineName(cardId);
  if (!lineName) {
    return NextResponse.json({ ok: true, mode: "canned", cardId, stage, note: "no_erp_name" });
  }

  const url = `${ERPNEXT_URL.replace(/\/$/, "")}/api/method/frappe.client.set_value`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
      },
      body: JSON.stringify({
        doctype: "JWM Production Schedule Line",
        name: lineName,
        fieldname: "jwm_stage",
        value: stage,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, reason: `erpnext_${res.status}` },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, mode: "live", cardId, stage, lineName });
  } catch (e) {
    return NextResponse.json(
      { ok: false, reason: (e as Error).message },
      { status: 502 },
    );
  }
}
