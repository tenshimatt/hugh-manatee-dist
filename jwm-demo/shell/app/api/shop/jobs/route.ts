import { NextResponse } from "next/server";
import { JOB_CARDS, type JobCard } from "@/lib/canned/work-orders";
import { isLive, listJobCards } from "@/lib/erpnext-live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// URL slug ↔ ERPNext Workstation name
const SLUG_TO_ERP: Record<string, string> = {
  "flat-laser-1": "Flat Laser 1",
  "flat-laser-2": "Flat Laser 2",
  "cnc-1": "CNC 1",
  "cnc-2": "CNC 2",
  "press-brake-1": "Press Brake 1",
  "press-brake-2": "Press Brake 2",
  "weld-bay-a": "Weld Bay A",
  "weld-bay-b": "Weld Bay B",
  "assembly-1": "Assembly 1",
  qc: "QC",
  paint: "Paint",
  shipping: "Shipping",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("workstation") || "";
  const cannedCards = JOB_CARDS.filter((c) => c.workstation === slug);

  if (!isLive() || !SLUG_TO_ERP[slug]) {
    return NextResponse.json({ cards: cannedCards, source: "canned" });
  }

  try {
    const wsName = SLUG_TO_ERP[slug];
    const jobs = await listJobCards(wsName, 50);
    if (!jobs.length) {
      return NextResponse.json({ cards: cannedCards, source: "canned", note: "no_live_jobs" });
    }
    const cards: JobCard[] = jobs.map((j) => ({
      id: j.name,
      wo: "-",
      op_seq: 0,
      part: j.name,
      customer: "-",
      qty: 0,
      workstation: slug,
      priority: j.status === "Work In Progress" ? "urgent" : "normal",
      est_hours: 0,
      instructions: `ERPNext Job Card ${j.name} (${j.status || "Open"})`,
    }));
    return NextResponse.json({ cards, source: "live" });
  } catch (e) {
    console.error("[shop/jobs] fallback:", e);
    return NextResponse.json({ cards: cannedCards, source: "canned", error: String(e) });
  }
}
