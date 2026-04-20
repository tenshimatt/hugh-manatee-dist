import { NextRequest, NextResponse } from "next/server";
import { createDoc, erpnextConfigured } from "@/lib/erpnext";
import { CANNED_REPORTS, type FieldDailyReport } from "@/lib/canned/field-daily";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/field-daily/submit
 *
 * Accepts the Field Daily Report form payload and creates it in ERPNext.
 * Falls back to appending to the in-memory canned list if ERPNext is
 * unreachable (so the demo flow always completes). 5s timeout on live call.
 *
 * Returns `{ ok, id, source }`.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Partial<FieldDailyReport>;

  // Basic server-side required-field validation (mirrors schema spec).
  const required: (keyof FieldDailyReport)[] = [
    "job_number",
    "date",
    "submitter_name",
    "notes",
    "crew_type",
    "project_manager",
    "has_delays",
    "needs_material",
    "weather",
    "total_men_onsite",
    "daily_work_hours",
    "has_deliveries",
    "has_injuries",
    "layout_done_prior",
  ];
  for (const f of required) {
    if (body[f] === undefined || body[f] === null || body[f] === "") {
      return NextResponse.json(
        { ok: false, error: `Missing required field: ${f}` },
        { status: 400 }
      );
    }
  }
  // Conditional-reveal validation
  if (body.has_delays === "Yes" && !body.delay_description) {
    return NextResponse.json({ ok: false, error: "delay_description required" }, { status: 400 });
  }
  if (body.needs_material === "Yes" && !body.material_needed_description) {
    return NextResponse.json({ ok: false, error: "material_needed_description required" }, { status: 400 });
  }
  if (body.has_deliveries === "Yes" && !body.delivery_description) {
    return NextResponse.json({ ok: false, error: "delivery_description required" }, { status: 400 });
  }
  if (body.has_injuries === "Yes" && (!body.injured_employee || !body.injury_description)) {
    return NextResponse.json(
      { ok: false, error: "injured_employee + injury_description required" },
      { status: 400 }
    );
  }

  if (erpnextConfigured()) {
    try {
      const created = (await Promise.race([
        createDoc<{ name: string }>("Field Daily Report", body as Record<string, unknown>),
        new Promise<{ name: string }>((_, rej) =>
          setTimeout(() => rej(new Error("timeout")), 5000)
        ),
      ])) as { name: string };
      return NextResponse.json({ ok: true, id: created.name, source: "live" });
    } catch (e) {
      console.warn("[api/field-daily/submit] live failed, canned:", e);
    }
  }

  // Canned fallback: synthesise id + append in-memory (non-persistent, demo only)
  const id = `FDR-${body.job_number}-T-${String(CANNED_REPORTS.length + 1).padStart(4, "0")}`;
  const report: FieldDailyReport = {
    ...(body as FieldDailyReport),
    id,
  };
  CANNED_REPORTS.unshift(report);
  return NextResponse.json({ ok: true, id, source: "canned" });
}
