/**
 * Assemble a PDR from live ERPNext + canned fallback.
 *
 * Strategy:
 *   1. Fetch the Work Order (with required_items + operations).
 *   2. Attempt Job Card list for operation actuals.
 *   3. Attempt Delivery Note / Sales Invoice / Stock Entry for the remaining
 *      sections. Any 403/empty response → fall back to canned block.
 *
 * Each section independently records "live" vs "canned" in
 * report.data_sources so the UI can badge real-vs-canned per block.
 */

import { ERPNEXT_URL, ERPNEXT_API_KEY, ERPNEXT_API_SECRET, erpnextConfigured } from "../erpnext";
import { getCannedPDR, synthesisePDR } from "./canned";
import type { PDRReport } from "./types";

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (ERPNEXT_API_KEY && ERPNEXT_API_SECRET) {
    h["Authorization"] = `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`;
  }
  return h;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: authHeaders(), cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso.replace(" ", "T"));
  if (isNaN(d.getTime())) return iso;
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function mapStatus(s?: string): PDRReport["header"]["status"] {
  switch (s) {
    case "Completed": return "COMPLETE";
    case "In Process": return "IN PROCESS";
    case "Closed": return "CLOSED";
    default: return "OPEN";
  }
}

interface LiveWorkOrderFull {
  name: string;
  status?: string;
  production_item?: string;
  item_name?: string;
  qty?: number;
  produced_qty?: number;
  material_transferred_for_manufacturing?: number;
  planned_start_date?: string;
  expected_delivery_date?: string;
  jwm_baseline_date?: string;
  jwm_revised_date?: string;
  sales_order?: string;
  bom_no?: string;
  required_items?: Array<{
    idx: number;
    item_code?: string;
    item_name?: string;
    description?: string;
    required_qty?: number;
    consumed_qty?: number;
    rate?: number;
    amount?: number;
  }>;
  operations?: Array<{
    idx: number;
    operation?: string;
    workstation?: string;
    time_in_mins?: number;
    completed_qty?: number;
    actual_operation_time?: number;
    actual_operating_cost?: number;
    planned_operating_cost?: number;
    hour_rate?: number;
    status?: string;
  }>;
}

/**
 * Primary entrypoint used by the API route. Accepts any WO name and returns
 * a PDRReport. Prefers canned for the demo-seed Ariens jobs (they were the
 * authoritative source for the PDF snapshot), otherwise overlays whatever
 * live ERPNext data we can fetch on top of a synthesised skeleton.
 */
export async function buildPDR(name: string): Promise<PDRReport> {
  const canned = getCannedPDR(name);
  // If ERPNext isn't configured, canned is our only option.
  if (!erpnextConfigured()) {
    return canned ?? synthesisePDR(name);
  }

  const wo = await fetchJson<{ data: LiveWorkOrderFull }>(
    `${ERPNEXT_URL}/api/resource/Work%20Order/${encodeURIComponent(name)}`
  );
  const live = wo?.data;

  // No live record → return canned / synth.
  if (!live) return canned ?? synthesisePDR(name);

  // Base report: use canned as a rich starting skeleton when we have one
  // (this keeps the PDF-accurate numbers for the Ariens demo jobs even
  // though ERPNext doesn't yet hold them). Otherwise synthesise minimal.
  const report: PDRReport = canned ?? synthesisePDR(name, Number(live.qty ?? 1));

  // --- Header: overlay live fields ---
  report.header = {
    ...report.header,
    job: live.name,
    part: live.production_item || report.header.part,
    required_due_dt: fmtDate(live.expected_delivery_date || live.jwm_revised_date),
    status: mapStatus(live.status),
    description: live.item_name || report.header.description,
  };
  report.data_sources.header = "live";

  // --- Production Quantities: overlay live qty/produced ---
  if (typeof live.qty === "number") {
    report.production_quantities = {
      ...report.production_quantities,
      for_order: live.qty,
      total_req: live.qty,
      completed: Number(live.produced_qty ?? 0),
      shipped: Number(live.produced_qty ?? 0),
    };
    report.data_sources.production_quantities = "live";
  }

  // --- Raw Materials: use required_items when available ---
  if (live.required_items && live.required_items.length) {
    report.raw_materials = live.required_items.map((it) => ({
      seq: (it.idx ?? 1) * 10,
      mtl_part: it.item_code || "—",
      description: it.item_name || it.description || "",
      est_qty: Number(it.required_qty ?? 0),
      est_cost: Number(it.amount ?? 0),
      est_mtl_burden: 0,
      act_qty: Number(it.consumed_qty ?? 0),
      act_cost: Number(it.consumed_qty ?? 0) * Number(it.rate ?? 0),
      act_salvage: 0,
      act_mtl_burden: 0,
      req_date: fmtDate(live.planned_start_date),
      uom: "EA",
    }));
    report.data_sources.raw_materials = "live";
  }

  // --- Operations: use Work Order.operations child table when present ---
  if (live.operations && live.operations.length) {
    report.operations = live.operations.map((o) => {
      const estHours = (Number(o.time_in_mins ?? 0)) / 60;
      const actHours = Number(o.actual_operation_time ?? 0) / 60;
      const eff = actHours > 0 ? (estHours / actHours) * 100 : 0;
      return {
        opr: (o.idx ?? 1) * 10,
        oper_code: (o.operation || "OP").slice(0, 4).toUpperCase(),
        est_run: Number(live.qty ?? 0),
        completed: Number(o.completed_qty ?? 0),
        setup_est: 0,
        setup_act: 0,
        pct_cmp: live.qty ? Math.round((Number(o.completed_qty ?? 0) / Number(live.qty)) * 100) : 0,
        prod_est: estHours,
        prod_act: actHours,
        rework_hours: 0,
        labor_burden_cost: Number(o.actual_operating_cost ?? 0),
        eff_pct: Math.round(eff * 10) / 10,
        prod_std: 0,
        prod_std_uom: "PH",
        attained_std: 0,
        resource_group: o.workstation || "—",
      };
    });
    report.data_sources.operations = "live";
  }

  // --- Shipping schedule (from Sales Order ref) ---
  if (live.sales_order) {
    const so = await fetchJson<{ data: { items?: Array<{ delivery_date?: string; qty?: number; delivered_qty?: number; amount?: number }> } }>(
      `${ERPNEXT_URL}/api/resource/Sales%20Order/${encodeURIComponent(live.sales_order)}`
    );
    const firstItem = so?.data?.items?.[0];
    if (firstItem) {
      report.shipping_schedule = [
        {
          req_date: fmtDate(firstItem.delivery_date),
          so_line_rel: `${live.sales_order} / 1 / 1`,
          order_qty: Number(firstItem.qty ?? 0),
          job_qty: Number(live.qty ?? 0),
          shipped_qty: Number(firstItem.delivered_qty ?? 0),
          remain_qty: Number(firstItem.qty ?? 0) - Number(firstItem.delivered_qty ?? 0),
          order_value: Number(firstItem.amount ?? 0),
          stat: mapStatus(live.status) === "CLOSED" ? "CLOS" : "OPEN",
          ship_to: report.header.customer || "—",
        },
      ];
      report.data_sources.shipping_schedule = "live";
    }
  }

  return report;
}
