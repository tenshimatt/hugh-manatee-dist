/**
 * POST   /api/engineering/assign   — create a session-local engineering assignment.
 * GET    /api/engineering/assign   — list all assignments.
 * DELETE /api/engineering/assign?id=<id> — drop an assignment.
 *
 * Stores assignments in a module-level Map (session-local, demo-only). Real
 * ERPNext persistence lives in Phase 2.5 (tracked separately). Clients also
 * mirror to localStorage for cross-tab / refresh continuity.
 */
import { NextRequest, NextResponse } from "next/server";
import type { EngineeringAssignment } from "@/lib/engineering-schedule";

export const runtime = "nodejs";

// Module-level store (survives HMR-less reloads within one server process).
const STORE: Map<string, EngineeringAssignment> = new Map();

function nextId(): string {
  return `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: Array.from(STORE.values()),
    count: STORE.size,
  });
}

export async function POST(req: NextRequest) {
  let body: Partial<EngineeringAssignment>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_json" }, { status: 400 });
  }
  const { engineer_id, card_id, date, hours, stage } = body;
  if (!engineer_id || !card_id || !date) {
    return NextResponse.json({ ok: false, reason: "missing_fields" }, { status: 400 });
  }
  const h = typeof hours === "number" && hours > 0 ? hours : 4;
  const a: EngineeringAssignment = {
    id: body.id ?? nextId(),
    engineer_id,
    card_id,
    date,
    hours: h,
    stage: stage || "uncategorized",
  };
  STORE.set(a.id, a);
  return NextResponse.json({ ok: true, mode: "session", assignment: a });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, reason: "missing_id" }, { status: 400 });
  const existed = STORE.delete(id);
  return NextResponse.json({ ok: true, deleted: existed });
}
