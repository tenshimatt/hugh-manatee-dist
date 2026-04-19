/**
 * Canned PDR data — verbatim from the 4/15/2026 Epicor Production Detail
 * Report PDF Chris shared. These are historical Ariens jobs that are already
 * referenced (with thinner actuals) in lib/canned/work-orders.ts under the
 * WO-2026-002xx series.
 *
 * Keyed by both the JWM/Epicor job number (e.g. "152571-1-1") and the
 * demo-shell WO name (e.g. "WO-2026-00224", "MFG-WO-2026-00024") so lookups
 * work from either side.
 */

import type { PDRReport } from "./types";

const ariens_152571: PDRReport = {
  header: {
    job: "152571-1-1",
    part: "30270901",
    rev: "B",
    product_group: "None",
    required_due_dt: "2/13/2026",
    completed_dt: "2/28/2026",
    closed_dt: "2/28/2026",
    status: "CLOSED",
    description: "7ga HRPO A1011 x 5.37 x 74.48 x 36.47",
    customer: "ARIENS COMPANY",
  },
  production_quantities: {
    for_stock: 0,
    for_jobs: 0,
    for_order: 50,
    total_req: 50,
    rec_stock: 0,
    rec_jobs: 0,
    shipped: 50,
    completed: 50,
    uom: "EA",
  },
  shipping_schedule: [
    {
      req_date: "2/13/2026",
      so_line_rel: "152571 / 1 / 1",
      order_qty: 50,
      job_qty: 50,
      shipped_qty: 50,
      remain_qty: 0,
      order_value: 7187.5,
      stat: "CLOS",
      ship_to: "ARIENS COMPANY",
    },
  ],
  shipping_activity: [
    {
      pack: "5,729",
      line: 1,
      date: "2/19/2026",
      job_qty: 50,
      stock_qty: 0,
      order_line_rel: "152571 / 1 / 1",
      ship_to: "ARIENS COMPANY",
      shipped: true,
      invoiced: true,
      legal_number: "5729",
    },
  ],
  invoice_activity: [
    {
      invoice_type: "14878",
      date: "2/19/2026",
      quantity: 50,
      gross_amount: 7187.5,
      misc_charges: 0,
      discounts: 0,
      adv_bill: 0,
      net_amount: 7187.5,
      pack_ln: "5729 / 1",
      order_line_rel: "152571 / 1 / 1",
      legal_number: "14878",
    },
  ],
  raw_materials: [
    {
      seq: 10,
      mtl_part: "HRPOSH7GAA1011",
      description: "HR P&O SHEET 7GA 48X76 A1011 CS B",
      est_qty: 50,
      est_cost: 4460,
      est_mtl_burden: 0,
      act_qty: 50,
      act_cost: 4460,
      act_salvage: 0,
      act_mtl_burden: 0,
      req_date: "2/5/2026",
      uom: "EA",
    },
    {
      seq: 20,
      mtl_part: "CRATING",
      description: "CRATING",
      est_qty: 50,
      est_cost: 150,
      est_mtl_burden: 0,
      act_qty: 0,
      act_cost: 0,
      act_salvage: 0,
      act_mtl_burden: 0,
      req_date: "2/10/2026",
      uom: "EA",
    },
  ],
  operations: [
    {
      opr: 20,
      oper_code: "FL",
      est_run: 50,
      completed: 50,
      setup_est: 1.33,
      setup_act: 5.95,
      pct_cmp: 100,
      prod_est: 5.81,
      prod_act: 11.98,
      rework_hours: 0,
      labor_burden_cost: 806.85,
      eff_pct: 39.8,
      prod_std: 8.6,
      prod_std_uom: "PH",
      attained_std: 4.17,
      resource_group: "FL/FLAT LASER",
    },
    {
      opr: 30,
      oper_code: "FM",
      est_run: 50,
      completed: 50,
      setup_est: 0.5,
      setup_act: 0,
      pct_cmp: 0,
      prod_est: 14.28,
      prod_act: 17.08,
      rework_hours: 0,
      labor_burden_cost: 768.6,
      eff_pct: 41.8,
      prod_std: 7.0,
      prod_std_uom: "PH",
      attained_std: 2.93,
      resource_group: "FM/FORMING",
    },
    {
      opr: 40,
      oper_code: "QA",
      est_run: 50,
      completed: 50,
      setup_est: 0,
      setup_act: 0,
      pct_cmp: 0,
      prod_est: 0,
      prod_act: 0,
      rework_hours: 0,
      labor_burden_cost: 0,
      eff_pct: 0,
      prod_std: 0,
      prod_std_uom: "PH",
      attained_std: 0,
      resource_group: "QA/QUALITY ASSURANCE",
    },
  ],
  totals: {
    hours: {
      setup_est: 1.83,
      setup_act: 5.95,
      prod_est: 20.09,
      prod_act: 29.06,
      eff_pct: 40.99,
    },
    costs: {
      labor_est: 1271.36,
      labor_act: 1575.45,
      burden_est: 0,
      burden_act: 0,
      material_est: 4610,
      material_act: 4460,
      subcontract_est: 0,
      subcontract_act: 0,
      mtl_burden_est: 0,
      mtl_burden_act: 0,
      total_est: 5881.36,
      total_act: 6035.45,
    },
    unit: { est: 117.63, act: 120.71 },
    profitability: {
      actual_gross: 7187.5,
      cost: 6035.45,
      net: 1152.05,
      pl_pct: 16.03,
    },
  },
  data_sources: {
    header: "canned",
    production_quantities: "canned",
    shipping_schedule: "canned",
    shipping_activity: "canned",
    invoice_activity: "canned",
    raw_materials: "canned",
    operations: "canned",
    totals: "canned",
  },
};

const ariens_152615: PDRReport = {
  ...ariens_152571,
  header: {
    ...ariens_152571.header,
    job: "152615-1-1",
    required_due_dt: "2/23/2026",
    completed_dt: "2/28/2026",
    closed_dt: "2/28/2026",
  },
  shipping_schedule: [
    { ...ariens_152571.shipping_schedule[0], req_date: "2/23/2026", so_line_rel: "152615 / 1 / 1" },
  ],
  shipping_activity: [
    { ...ariens_152571.shipping_activity[0], pack: "5,747", date: "2/23/2026", order_line_rel: "152615 / 1 / 1", legal_number: "5747" },
  ],
  invoice_activity: [
    {
      invoice_type: "14892",
      date: "2/23/2026",
      quantity: 50,
      gross_amount: 7187.5,
      misc_charges: 0,
      discounts: 0,
      adv_bill: 0,
      net_amount: 7187.5,
      pack_ln: "5747 / 1",
      order_line_rel: "152615 / 1 / 1",
      legal_number: "14892",
    },
    {
      invoice_type: "14995",
      date: "3/11/2026",
      quantity: -1,
      gross_amount: -143.75,
      misc_charges: 0,
      discounts: 0,
      adv_bill: 0,
      net_amount: -143.75,
      pack_ln: "5747 / 1",
      order_line_rel: "152615 / 1 / 1",
      legal_number: "14995",
    },
  ],
  raw_materials: ariens_152571.raw_materials.map((r) =>
    r.seq === 10 ? { ...r, req_date: "2/17/2026" } : { ...r, req_date: "2/23/2026" }
  ),
  operations: [
    { ...ariens_152571.operations[0], setup_act: 1.18, prod_act: 15.3, labor_burden_cost: 764.1, eff_pct: 43.3, attained_std: 3.27 },
    { ...ariens_152571.operations[1], setup_act: 0, prod_act: 15.2, labor_burden_cost: 684.0, eff_pct: 47.0, attained_std: 3.29 },
    { ...ariens_152571.operations[2] },
  ],
  totals: {
    hours: { setup_est: 1.83, setup_act: 1.18, prod_est: 20.09, prod_act: 30.5, eff_pct: 45.14 },
    costs: {
      labor_est: 1271.36, labor_act: 1448.1,
      burden_est: 0, burden_act: 0,
      material_est: 4610, material_act: 4460,
      subcontract_est: 0, subcontract_act: 0,
      mtl_burden_est: 0, mtl_burden_act: 0,
      total_est: 5881.36, total_act: 5908.1,
    },
    unit: { est: 117.63, act: 118.16 },
    profitability: { actual_gross: 7043.75, cost: 5908.1, net: 1135.65, pl_pct: 16.12 },
  },
};

// Job 152660 — worst efficiency (~35%) — canned to match efficiency-events
const ariens_152660: PDRReport = {
  ...ariens_152571,
  header: { ...ariens_152571.header, job: "152660-1-1", required_due_dt: "3/9/2026", completed_dt: "3/15/2026", closed_dt: "3/15/2026" },
  shipping_schedule: [{ ...ariens_152571.shipping_schedule[0], req_date: "3/9/2026", so_line_rel: "152660 / 1 / 1" }],
  shipping_activity: [{ ...ariens_152571.shipping_activity[0], pack: "5,812", date: "3/11/2026", order_line_rel: "152660 / 1 / 1", legal_number: "5812" }],
  invoice_activity: [{ ...ariens_152571.invoice_activity[0], invoice_type: "14930", date: "3/11/2026", pack_ln: "5812 / 1", order_line_rel: "152660 / 1 / 1", legal_number: "14930" }],
  operations: [
    { ...ariens_152571.operations[0], setup_act: 1.5, prod_act: 11.57, labor_burden_cost: 689.4, eff_pct: 35.2, attained_std: 4.32 },
    { ...ariens_152571.operations[1], setup_act: 0.25, prod_act: 25.59, labor_burden_cost: 1151.55, eff_pct: 34.9, attained_std: 1.95 },
    { ...ariens_152571.operations[2] },
  ],
  totals: {
    hours: { setup_est: 1.83, setup_act: 1.75, prod_est: 20.09, prod_act: 37.16, eff_pct: 35.07 },
    costs: {
      labor_est: 1271.36, labor_act: 1840.95,
      burden_est: 0, burden_act: 0,
      material_est: 4610, material_act: 4460,
      subcontract_est: 0, subcontract_act: 0,
      mtl_burden_est: 0, mtl_burden_act: 0,
      total_est: 5881.36, total_act: 6300.95,
    },
    unit: { est: 117.63, act: 126.02 },
    profitability: { actual_gross: 7187.5, cost: 6300.95, net: 886.55, pl_pct: 12.33 },
  },
};

const ariens_152717: PDRReport = {
  ...ariens_152571,
  header: { ...ariens_152571.header, job: "152717-1-1", required_due_dt: "3/30/2026", completed_dt: "", closed_dt: "", status: "IN PROCESS" },
  production_quantities: { ...ariens_152571.production_quantities, shipped: 0, completed: 0 },
  shipping_schedule: [{ ...ariens_152571.shipping_schedule[0], req_date: "3/30/2026", so_line_rel: "152717 / 1 / 1", shipped_qty: 0, remain_qty: 50, stat: "OPEN" }],
  shipping_activity: [],
  invoice_activity: [],
  operations: [
    { ...ariens_152571.operations[0], setup_act: 2.05, prod_act: 12.70, labor_burden_cost: 744.35, eff_pct: 38.5, attained_std: 3.94 },
    { ...ariens_152571.operations[1], pct_cmp: 80, setup_act: 0.5, prod_act: 26.97, labor_burden_cost: 1213.65, eff_pct: 33.7, attained_std: 1.85 },
    { ...ariens_152571.operations[2], pct_cmp: 0 },
  ],
  totals: {
    hours: { setup_est: 1.83, setup_act: 2.55, prod_est: 20.09, prod_act: 39.67, eff_pct: 33.72 },
    costs: {
      labor_est: 1271.36, labor_act: 1958.0,
      burden_est: 0, burden_act: 0,
      material_est: 4610, material_act: 4460,
      subcontract_est: 0, subcontract_act: 0,
      mtl_burden_est: 0, mtl_burden_act: 0,
      total_est: 5881.36, total_act: 6418.0,
    },
    unit: { est: 117.63, act: 128.36 },
    profitability: { actual_gross: 7187.5, cost: 6418.0, net: 769.5, pl_pct: 10.71 },
  },
};

const ariens_152768: PDRReport = {
  ...ariens_152571,
  header: { ...ariens_152571.header, job: "152768-1-1", required_due_dt: "4/14/2026", completed_dt: "4/14/2026", closed_dt: "4/15/2026" },
  shipping_schedule: [{ ...ariens_152571.shipping_schedule[0], req_date: "4/14/2026", so_line_rel: "152768 / 1 / 1" }],
  shipping_activity: [{ ...ariens_152571.shipping_activity[0], pack: "5,901", date: "4/15/2026", order_line_rel: "152768 / 1 / 1", legal_number: "5901" }],
  invoice_activity: [{ ...ariens_152571.invoice_activity[0], invoice_type: "15042", date: "4/15/2026", pack_ln: "5901 / 1", order_line_rel: "152768 / 1 / 1", legal_number: "15042" }],
  operations: [
    { ...ariens_152571.operations[0], setup_act: 0.95, prod_act: 4.91, labor_burden_cost: 351.9, eff_pct: 105.4, attained_std: 10.18 },
    { ...ariens_152571.operations[1], setup_act: 0, prod_act: 12.55, labor_burden_cost: 564.75, eff_pct: 108.5, attained_std: 3.98 },
    { ...ariens_152571.operations[2] },
  ],
  totals: {
    hours: { setup_est: 1.83, setup_act: 0.95, prod_est: 20.09, prod_act: 17.46, eff_pct: 107.09 },
    costs: {
      labor_est: 1271.36, labor_act: 916.65,
      burden_est: 0, burden_act: 0,
      material_est: 4610, material_act: 4460,
      subcontract_est: 0, subcontract_act: 0,
      mtl_burden_est: 0, mtl_burden_act: 0,
      total_est: 5881.36, total_act: 5376.65,
    },
    unit: { est: 117.63, act: 107.53 },
    profitability: { actual_gross: 7187.5, cost: 5376.65, net: 1810.85, pl_pct: 25.19 },
  },
};

/**
 * Map WO name → canned PDR. Supports both JWM/Epicor job IDs (152571-1-1),
 * demo shell WO names (WO-2026-00224), and live ERPNext names (MFG-WO-2026-00024).
 */
const CANNED_MAP: Record<string, PDRReport> = {
  "152571-1-1": ariens_152571,
  "WO-2026-00224": ariens_152571,
  "MFG-WO-2026-00024": ariens_152571,

  "152615-1-1": ariens_152615,
  "MFG-WO-2026-00025": ariens_152615,

  "152660-1-1": ariens_152660,
  "WO-2026-00225": ariens_152660,
  "MFG-WO-2026-00026": ariens_152660,

  "152717-1-1": ariens_152717,
  "WO-2026-00227": ariens_152717,
  "MFG-WO-2026-00027": ariens_152717,

  "152768-1-1": ariens_152768,
  "WO-2026-00228": ariens_152768,
  "MFG-WO-2026-00028": ariens_152768,
};

export function getCannedPDR(name: string): PDRReport | null {
  return CANNED_MAP[name] ? structuredClone(CANNED_MAP[name]) : null;
}

/**
 * Synthesise a best-effort PDR when we have neither a canned match nor
 * enough live data. Used so the view never 404s on a random WO.
 */
export function synthesisePDR(name: string, qty = 1): PDRReport {
  const base = structuredClone(ariens_152571);
  base.header = {
    ...base.header,
    job: name,
    part: "—",
    rev: "—",
    required_due_dt: "—",
    completed_dt: "—",
    closed_dt: "—",
    status: "OPEN",
    description: "(insufficient data — live ERPNext returned partial record)",
    customer: "—",
  };
  base.production_quantities = {
    for_stock: 0, for_jobs: 0, for_order: qty, total_req: qty,
    rec_stock: 0, rec_jobs: 0, shipped: 0, completed: 0, uom: "EA",
  };
  base.shipping_schedule = [];
  base.shipping_activity = [];
  base.invoice_activity = [];
  base.raw_materials = [];
  base.operations = [];
  base.totals = {
    hours: { setup_est: 0, setup_act: 0, prod_est: 0, prod_act: 0, eff_pct: 0 },
    costs: {
      labor_est: 0, labor_act: 0, burden_est: 0, burden_act: 0,
      material_est: 0, material_act: 0, subcontract_est: 0, subcontract_act: 0,
      mtl_burden_est: 0, mtl_burden_act: 0, total_est: 0, total_act: 0,
    },
    unit: { est: 0, act: 0 },
    profitability: { actual_gross: 0, cost: 0, net: 0, pl_pct: 0 },
  };
  return base;
}
