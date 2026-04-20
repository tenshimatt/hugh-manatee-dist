import { NextRequest, NextResponse } from "next/server";
import { listBookings } from "@/lib/fleet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from") || undefined;
  const to = req.nextUrl.searchParams.get("to") || undefined;
  const vehicle = req.nextUrl.searchParams.get("vehicle") || undefined;
  const { items, source } = await listBookings({ from, to, vehicle });
  return NextResponse.json({ items, source });
}
