import { NextRequest, NextResponse } from "next/server";
import { listDrivers } from "@/lib/fleet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all") === "1";
  const { items, source } = await listDrivers({ activeOnly: !all });
  return NextResponse.json({ items, source });
}
