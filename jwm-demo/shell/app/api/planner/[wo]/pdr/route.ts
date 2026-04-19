import { NextResponse } from "next/server";
import { buildPDR } from "@/lib/pdr/build";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ wo: string }> }
) {
  const { wo } = await params;
  const report = await buildPDR(wo);
  return NextResponse.json(report);
}
