import { NextRequest, NextResponse } from "next/server";
import { getList, erpnextConfigured } from "@/lib/erpnext";
import {
  CANNED_REPORTS,
  filterReports,
  type FieldDailyReport,
} from "@/lib/canned/field-daily";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/field-daily/list?project=<jobNumber>&since=<yyyy-mm-dd>
 *
 * Proxies to ERPNext `Field Daily Report` DocType with a 5s timeout.
 * On any failure or empty result, falls back to canned seed.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const project = searchParams.get("project") || undefined;
  const since = searchParams.get("since") || undefined;

  // Try live ERPNext, with 5s budget. Fall back on any error.
  if (erpnextConfigured()) {
    try {
      const filters: Array<[string, string, unknown]> = [];
      if (project) filters.push(["job_number", "=", project]);
      if (since) filters.push(["date", ">=", since]);
      const live = (await Promise.race([
        getList<FieldDailyReport>("Field Daily Report", {
          fields: ["*"],
          filters,
          order_by: "date desc",
          limit_page_length: 200,
        }),
        new Promise<FieldDailyReport[]>((_, rej) =>
          setTimeout(() => rej(new Error("timeout")), 5000)
        ),
      ])) as FieldDailyReport[];
      if (live && live.length > 0) {
        return NextResponse.json({ reports: live, source: "live" });
      }
    } catch (e) {
      console.warn("[api/field-daily/list] live fetch failed, canned:", e);
    }
  }

  const reports = filterReports(CANNED_REPORTS, { project, since });
  return NextResponse.json({ reports, source: "canned" });
}
