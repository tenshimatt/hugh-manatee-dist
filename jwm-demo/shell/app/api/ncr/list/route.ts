import { NextResponse } from "next/server";
import { NCRS } from "@/lib/canned/work-orders";
import { isLive, getNCRsHydrated } from "@/lib/erpnext-live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UINcr = {
  id: string;
  raised_at: string;
  raised_by: string;
  wo?: string;
  part: string;
  workstation: string;
  status: "Draft from Floor" | "Under Review" | "CA Open" | "Closed";
  defect_type: string;
  description: string;
  qty_affected: number;
  disposition?: string;
  root_cause?: string;
  corrective_action?: string;
};

function mapStatus(s?: string): UINcr["status"] {
  const v = (s || "").toLowerCase();
  if (v === "closed") return "Closed";
  if (v === "dispositioned") return "CA Open";
  if (v === "under review") return "Under Review";
  if (v === "open") return "Draft from Floor";
  return "Under Review";
}

export async function GET() {
  if (!isLive()) {
    return NextResponse.json({ items: NCRS, source: "canned" });
  }
  try {
    const live = await getNCRsHydrated(30);
    if (!live.length) {
      return NextResponse.json({ items: NCRS, source: "canned" });
    }
    const items: UINcr[] = live.map((n) => ({
      id: n.name,
      raised_at: (n.ncr_date || n.modified || "").replace(" ", "T"),
      raised_by: n.reported_by || "ERPNext",
      wo: n.work_order,
      part: n.item || "-",
      workstation: "-", // not modeled on NCR doctype in this instance
      status: mapStatus(n.status),
      defect_type: n.severity || "-",
      description: n.defect_description || "",
      qty_affected: Number(n.qty_affected || 0),
      disposition: n.disposition || undefined,
      root_cause: n.root_cause || undefined,
      corrective_action: n.corrective_action || undefined,
    }));
    return NextResponse.json({ items, source: "live" });
  } catch (e) {
    console.error("[ncr/list] fallback:", e);
    return NextResponse.json({ items: NCRS, source: "canned", error: String(e) });
  }
}
