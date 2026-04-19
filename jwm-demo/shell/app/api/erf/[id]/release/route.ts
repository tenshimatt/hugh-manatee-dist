import { NextRequest, NextResponse } from "next/server";
import { releaseErf } from "@/lib/canned/erf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/erf/:id/release — mark ERF as Released + stub a WO id.
 *
 * Phase 2: trigger a real ERPNext Work Order creation via /api/wo/create
 * with the ERF's line items as BOM children, then echo the WO name back.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = releaseErf(id);
  if (!result) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ erf: result.erf, wo: result.wo });
}
