import { NextResponse } from "next/server";
import { addEvent, EfficiencyEvent } from "@/lib/efficiency-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/efficiency/new
 * Body: partial EfficiencyEvent (id + efficiency_pct auto-derived).
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<EfficiencyEvent>;

    if (!body.date || !body.workstation || !body.operator) {
      return NextResponse.json(
        { error: "date, workstation, operator required" },
        { status: 400 }
      );
    }

    const planned_qty = Number(body.planned_qty || 0);
    const actual_qty = Number(body.actual_qty || 0);
    const planned_hours = Number(body.planned_hours || 0);
    const actual_hours = Number(body.actual_hours || 0);

    if (planned_hours <= 0 || actual_hours <= 0) {
      return NextResponse.json(
        { error: "planned_hours and actual_hours must be > 0" },
        { status: 400 }
      );
    }

    const record = addEvent({
      date: body.date!,
      shift: (body.shift as EfficiencyEvent["shift"]) || "Day",
      workstation: body.workstation!,
      workstation_label: body.workstation_label || body.workstation!,
      division: (body.division as EfficiencyEvent["division"]) || "Processing",
      operation: body.operation || "",
      operator: body.operator!,
      material: body.material || "",
      part: body.part || "",
      job: body.job || "",
      planned_qty,
      actual_qty,
      planned_hours,
      actual_hours,
      scrap_qty: Number(body.scrap_qty || 0),
      notes: body.notes || "",
    });

    return NextResponse.json({ ok: true, event: record });
  } catch (e) {
    return NextResponse.json(
      { error: "invalid JSON body: " + String(e) },
      { status: 400 }
    );
  }
}
