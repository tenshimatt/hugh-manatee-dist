import { NextRequest, NextResponse } from "next/server";
import { getErf, updateErf } from "@/lib/canned/erf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const erf = getErf(id);
  if (!erf) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ erf });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const patch = await req.json().catch(() => ({}));
  const erf = updateErf(id, patch);
  if (!erf) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ erf });
}
