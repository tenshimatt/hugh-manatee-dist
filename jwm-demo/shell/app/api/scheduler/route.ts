import { NextResponse } from "next/server";
import scheduler from "@/lib/canned/scheduler.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/scheduler
 *   Optional: ?division=Processing|Architectural
 *             ?status=on_track|at_risk|behind|complete
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const div = url.searchParams.get("division");
  const status = url.searchParams.get("status");

  let jobs = scheduler.jobs as unknown as Array<Record<string, unknown>>;
  if (div) jobs = jobs.filter((j) => j.division === div);
  if (status) jobs = jobs.filter((j) => j.status === status);

  return NextResponse.json({
    columns: scheduler.columns,
    jobs,
    count: jobs.length,
    source: "canned",
  });
}
