import { getWorkOrder, type WorkOrderDetail } from "@/lib/canned/work-orders";
import { PlannerClient } from "./PlannerClient";
import { notFound } from "next/navigation";
import { getWorkOrderLive, isLive } from "@/lib/erpnext-live";

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

export default async function PlannerPage({ params }: { params: Promise<{ wo: string }> }) {
  const { wo } = await params;

  // Try live first if the name looks like an ERPNext WO name.
  if (isLive() && /^MFG-WO-/.test(wo)) {
    const live = await getWorkOrderLive(wo);
    if (live) {
      const mapped: WorkOrderDetail = {
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
        material_ready_pct: live.produced_qty && live.qty
          ? Math.round((Number(live.produced_qty) / Number(live.qty)) * 100)
          : 0,
        routing: [
          // Routing ops come from Work Order Operations child table; not exposed by
          // default via REST permission, so keep empty — UI handles [].
        ],
      };
      return <PlannerClient order={mapped} />;
    }
  }

  const order = getWorkOrder(wo);
  if (!order) return notFound();
  return <PlannerClient order={order} />;
}
