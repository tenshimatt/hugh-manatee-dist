/**
 * GET /api/routes — list routes (proxies to ERPNext, falls back to canned).
 */
import { NextResponse } from "next/server";
import { listRoutes } from "@/lib/routes";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, source } = await listRoutes();
  return NextResponse.json({ source, data });
}
