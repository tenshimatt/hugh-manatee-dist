import { NextResponse } from "next/server";
import { listEvents } from "@/lib/efficiency-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/efficiency/list
 *   Optional filters:
 *     ?workstation=flat-laser-2
 *     ?operator=J.%20Park
 *     ?division=Processing
 *     ?from=2026-04-10&to=2026-04-17
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ws = url.searchParams.get("workstation");
  const op = url.searchParams.get("operator");
  const div = url.searchParams.get("division");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  let events = listEvents();
  if (ws) events = events.filter((e) => e.workstation === ws);
  if (op) events = events.filter((e) => e.operator === op);
  if (div) events = events.filter((e) => e.division === div);
  if (from) events = events.filter((e) => e.date >= from);
  if (to) events = events.filter((e) => e.date <= to);

  return NextResponse.json({
    count: events.length,
    source: "canned",
    events,
  });
}
