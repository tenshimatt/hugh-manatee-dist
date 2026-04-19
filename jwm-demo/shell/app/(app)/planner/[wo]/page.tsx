import { getWorkOrder, type WorkOrderDetail } from "@/lib/canned/work-orders";
import { PlannerClient } from "./PlannerClient";
import { notFound } from "next/navigation";
import { getWorkOrderLive, isLive } from "@/lib/erpnext-live";
import { buildPDR } from "@/lib/pdr/build";
import { ProductionDetailReport } from "@/components/planner/ProductionDetailReport";
import Link from "next/link";
import { FileText, LayoutDashboard } from "lucide-react";

export const dynamic = "force-dynamic";

function mapLiveStatus(s?: string): WorkOrderDetail["status"] {
  switch (s) {
    case "Completed":
      return "Complete";
    case "In Process":
      return "In Progress";
    case "Not Started":
    case "Draft":
      return "Draft";
    default:
      return "Released";
  }
}

function mapLiveDivision(d?: string): WorkOrderDetail["division"] {
  return d === "Processing" ? "Processing" : "Architectural";
}

/**
 * View toggle. "modern" = existing React planner UI; "pdr" = Epicor-style
 * Production Detail Report (mirrors Chris's current print-shop workflow).
 */
function ViewToggle({ wo, view }: { wo: string; view: "modern" | "pdr" }) {
  const base = `/planner/${encodeURIComponent(wo)}`;
  return (
    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit print:hidden">
      <Link
        href={base}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md transition ${
          view === "modern"
            ? "bg-white text-[#064162] shadow-sm"
            : "text-slate-500 hover:text-slate-800"
        }`}
      >
        <LayoutDashboard className="w-4 h-4" /> Modern
      </Link>
      <Link
        href={`${base}?view=pdr`}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md transition ${
          view === "pdr"
            ? "bg-white text-[#064162] shadow-sm"
            : "text-slate-500 hover:text-slate-800"
        }`}
      >
        <FileText className="w-4 h-4" /> Production Detail Report
      </Link>
    </div>
  );
}

export default async function PlannerPage({
  params,
  searchParams,
}: {
  params: Promise<{ wo: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { wo } = await params;
  const sp = await searchParams;
  const view: "modern" | "pdr" = sp.view === "pdr" ? "pdr" : "modern";

  // PDR view: assemble live+canned and render Epicor-style report.
  if (view === "pdr") {
    const report = await buildPDR(wo);
    return (
      <div className="space-y-4">
        <ViewToggle wo={wo} view={view} />
        <ProductionDetailReport report={report} />
      </div>
    );
  }

  // Modern view (default) — unchanged existing behaviour.
  let order: WorkOrderDetail | null = null;

  if (isLive() && /^MFG-WO-/.test(wo)) {
    const live = await getWorkOrderLive(wo);
    if (live) {
      order = {
        name: live.name,
        customer: "(ERPNext customer field restricted)",
        project: live.item_name || live.production_item || live.name,
        division: mapLiveDivision(live.jwm_division),
        status: mapLiveStatus(live.status),
        start_date: live.planned_start_date?.slice(0, 10) || live.jwm_baseline_date || "",
        due_date: live.expected_delivery_date || live.jwm_revised_date || "",
        qty: Number(live.qty || 0),
        bom_ref: live.bom_no || "-",
        total_value: 0,
        material_ready_pct:
          live.produced_qty && live.qty
            ? Math.round((Number(live.produced_qty) / Number(live.qty)) * 100)
            : 0,
        routing: [],
      };
    }
  }

  if (!order) order = getWorkOrder(wo);
  if (!order) return notFound();

  return (
    <div className="space-y-4">
      <ViewToggle wo={wo} view={view} />
      <PlannerClient order={order} />
    </div>
  );
}
