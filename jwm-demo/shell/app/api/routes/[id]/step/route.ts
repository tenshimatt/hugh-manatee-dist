/**
 * POST /api/routes/[id]/step — update a single Route Step.
 * Body: { step_name: string, updates: Partial<RouteStep> }
 */
import { NextResponse } from "next/server";
import { updateRouteStep } from "@/lib/routes";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { step_name?: string; updates?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }
  if (!body.step_name || !body.updates) {
    return NextResponse.json({ ok: false, error: "missing-fields" }, { status: 400 });
  }
  const result = await updateRouteStep(id, body.step_name, body.updates);
  return NextResponse.json(result);
}
