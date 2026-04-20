/**
 * GET /api/routes/[id] — fetch full route (with steps) by name.
 */
import { NextResponse } from "next/server";
import { getRoute } from "@/lib/routes";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, source } = await getRoute(id);
  if (!data) return NextResponse.json({ error: "not-found" }, { status: 404 });
  return NextResponse.json({ source, data });
}
