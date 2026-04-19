import { NextRequest, NextResponse } from "next/server";
import { createErf, listErfs } from "@/lib/canned/erf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/erf          — list all ERFs (in-memory canned store)
 * POST /api/erf         — create a new ERF, body = Partial<Erf>
 *
 * Phase 2 swaps the in-memory store for an ERPNext custom DocType.
 */
export async function GET() {
  return NextResponse.json({ erfs: listErfs() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!body.title || !body.customer) {
    return NextResponse.json(
      { error: "title and customer required" },
      { status: 400 }
    );
  }
  const erf = createErf(body);
  return NextResponse.json({ erf });
}
