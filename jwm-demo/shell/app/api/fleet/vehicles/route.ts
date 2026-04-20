import { NextResponse } from "next/server";
import { listVehicles } from "@/lib/fleet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { items, source } = await listVehicles();
  return NextResponse.json({ items, source });
}
