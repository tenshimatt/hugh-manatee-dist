/**
 * Production Detail Report (PDR) data shape.
 *
 * Mirrors the Epicor "Production Detail Report" PDF layout. Each section
 * maps 1:1 to a block in the report so the UI can render row-for-row.
 *
 * Source: /Users/mattwright/pandora/Obsidian/PLAUD/PROJECTS/JWM/attachments/5afa7414-b152-4c44-92db-db476c614c13.pdf
 */

export type PDRStatus = "CLOSED" | "IN PROCESS" | "COMPLETE" | "OPEN";

export interface PDRHeader {
  job: string;                // e.g. "152571-1-1"
  part: string;               // e.g. "30270901"
  rev: string;                // "B"
  product_group: string;      // "None"
  required_due_dt: string;    // display string e.g. "2/13/2026"
  completed_dt: string;
  closed_dt: string;
  status: PDRStatus;
  description?: string;       // "7ga HRPO A1011 x 5.37 x 74.48 x 36.47"
  customer?: string;
}

export interface PDRProductionQuantities {
  for_stock: number;
  for_jobs: number;
  for_order: number;
  total_req: number;
  rec_stock: number;
  rec_jobs: number;
  shipped: number;
  completed: number;
  uom: string;                // "EA"
}

export interface PDRShippingScheduleRow {
  req_date: string;
  so_line_rel: string;        // "152571 / 1 / 1"
  order_qty: number;
  job_qty: number;
  shipped_qty: number;
  remain_qty: number;
  order_value: number;
  stat: string;               // "CLOS"
  ship_to: string;            // "ARIENS COMPANY"
}

export interface PDRShippingActivityRow {
  pack: string;
  line: number;
  date: string;
  job_qty: number;
  stock_qty: number;
  order_line_rel: string;
  ship_to: string;
  shipped: boolean;
  invoiced: boolean;
  legal_number: string;
}

export interface PDRInvoiceActivityRow {
  invoice_type: string;       // "14878"
  date: string;
  quantity: number;
  gross_amount: number;
  misc_charges: number;
  discounts: number;
  adv_bill: number;
  net_amount: number;
  pack_ln: string;            // "5729 / 1"
  order_line_rel: string;
  legal_number?: string;
}

export interface PDRRawMaterialRow {
  mtl_part: string;           // "10  HRPOSH7GAA1011"
  seq: number;
  description: string;
  est_qty: number;
  est_cost: number;
  est_mtl_burden: number;
  act_qty: number;
  act_cost: number;
  act_salvage: number;
  act_mtl_burden: number;
  req_date: string;
  uom: string;
}

export interface PDROperationRow {
  opr: number;                // 20
  oper_code: string;          // "FL"
  est_run: number;
  completed: number;
  setup_est: number;
  setup_act: number;
  pct_cmp: number;
  prod_est: number;
  prod_act: number;
  rework_hours: number;
  labor_burden_cost: number;
  eff_pct: number;            // 39.8
  prod_std: number;           // 8.60 (PH)
  prod_std_uom: string;       // "PH"
  attained_std: number;
  resource_group: string;
}

export interface PDRTotals {
  hours: {
    setup_est: number;
    setup_act: number;
    prod_est: number;
    prod_act: number;
    eff_pct: number;
  };
  costs: {
    labor_est: number;
    labor_act: number;
    burden_est: number;
    burden_act: number;
    material_est: number;
    material_act: number;
    subcontract_est: number;
    subcontract_act: number;
    mtl_burden_est: number;
    mtl_burden_act: number;
    total_est: number;
    total_act: number;
  };
  unit: {
    est: number;
    act: number;
  };
  profitability: {
    actual_gross: number;
    cost: number;
    net: number;
    pl_pct: number;
  };
}

export interface PDRReport {
  header: PDRHeader;
  production_quantities: PDRProductionQuantities;
  shipping_schedule: PDRShippingScheduleRow[];
  shipping_activity: PDRShippingActivityRow[];
  invoice_activity: PDRInvoiceActivityRow[];
  raw_materials: PDRRawMaterialRow[];
  operations: PDROperationRow[];
  totals: PDRTotals;
  /** Which sections were sourced from live ERPNext vs. canned fallback. */
  data_sources: {
    header: "live" | "canned";
    production_quantities: "live" | "canned";
    shipping_schedule: "live" | "canned";
    shipping_activity: "live" | "canned";
    invoice_activity: "live" | "canned";
    raw_materials: "live" | "canned";
    operations: "live" | "canned";
    totals: "live" | "canned";
  };
}
