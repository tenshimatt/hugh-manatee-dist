export interface RoutingOp {
  seq: number;
  workstation: string;
  op: string;
  est_hours: number;
  status: "pending" | "in_progress" | "done";
}

export interface WorkOrderDetail {
  name: string;
  customer: string;
  project: string;
  division: "Architectural" | "Processing";
  status: "Draft" | "Released" | "In Progress" | "Complete";
  start_date: string;
  due_date: string;
  qty: number;
  bom_ref: string;
  total_value: number;
  routing: RoutingOp[];
  material_ready_pct: number;
}

const ORDERS: Record<string, WorkOrderDetail> = {
  "WO-2026-00218": {
    name: "WO-2026-00218",
    customer: "Ryman Hospitality Properties",
    project: "Opryland Resort — East Atrium Monumental Stair",
    division: "Architectural",
    status: "Draft",
    start_date: "2026-04-20",
    due_date: "2026-05-15",
    qty: 1,
    bom_ref: "EST-2026-0147",
    total_value: 341750,
    material_ready_pct: 72,
    routing: [
      { seq: 10, workstation: "flat-laser-1", op: "Flat laser cut stringers", est_hours: 8, status: "pending" },
      { seq: 20, workstation: "press-brake-1", op: "Form inner stringer curve", est_hours: 4, status: "pending" },
      { seq: 30, workstation: "cnc-1", op: "Machine base flanges", est_hours: 6, status: "pending" },
      { seq: 40, workstation: "weld-bay-a", op: "Tack + weld stringer assemblies", est_hours: 32, status: "pending" },
      { seq: 50, workstation: "weld-bay-a", op: "Install treads & risers", est_hours: 24, status: "pending" },
      { seq: 60, workstation: "assembly-1", op: "Handrail subassembly", est_hours: 18, status: "pending" },
      { seq: 70, workstation: "qc", op: "Final inspection + finish check", est_hours: 4, status: "pending" },
      { seq: 80, workstation: "shipping", op: "Crate & ship (2 crates)", est_hours: 6, status: "pending" },
    ],
  },
  "WO-2026-00217": {
    name: "WO-2026-00217",
    customer: "Nissan North America",
    project: "Nissan HQ — Exterior Railing Retrofit (Quote 14425)",
    division: "Architectural",
    status: "Released",
    start_date: "2026-04-15",
    due_date: "2026-05-01",
    qty: 48,
    bom_ref: "BOM-JWM-NSN-BRK-01-001",
    total_value: 10903.60,
    material_ready_pct: 100,
    routing: [
      { seq: 10, workstation: "flat-laser-2", op: "Cut balusters + brackets", est_hours: 6, status: "done" },
      { seq: 20, workstation: "press-brake-1", op: "Form brackets", est_hours: 4, status: "in_progress" },
      { seq: 30, workstation: "weld-bay-a", op: "Weld subassemblies", est_hours: 16, status: "pending" },
      { seq: 40, workstation: "qc", op: "Inspection", est_hours: 2, status: "pending" },
      { seq: 50, workstation: "shipping", op: "Palletize + ship", est_hours: 3, status: "pending" },
    ],
  },
  "WO-2026-00221": {
    name: "WO-2026-00221",
    customer: "Vanderlande Industries Inc.",
    project: "Vanderlande — Conveyor Brackets (Quote 14303)",
    division: "Processing",
    status: "Released",
    start_date: "2026-04-22",
    due_date: "2026-06-01",
    qty: 1800,
    bom_ref: "BOM-JWM-11646-A-001",
    total_value: 105597,
    material_ready_pct: 85,
    routing: [
      { seq: 10, workstation: "flat-laser-1", op: "FL — Laser cut 028765-057-00750BRG blanks", est_hours: 24, status: "in_progress" },
      { seq: 20, workstation: "press-brake-1", op: "FM — Form bracket profile", est_hours: 15, status: "pending" },
      { seq: 30, workstation: "qc", op: "QA — First article + batch inspection", est_hours: 3, status: "pending" },
    ],
  },
  // Ariens historical — actuals from Production Detail Report 4/15/2026
  "WO-2026-00224": {
    name: "WO-2026-00224",
    customer: "Ariens Company",
    project: "Ariens 30270901 — Job 152571 (7ga HRPO panel, 50 EA)",
    division: "Processing",
    status: "Complete",
    start_date: "2026-01-20",
    due_date: "2026-02-13",
    qty: 50,
    bom_ref: "BOM-JWM-ARN-30270901-001",
    total_value: 7187.50,
    material_ready_pct: 100,
    routing: [
      { seq: 20, workstation: "flat-laser-2", op: "FL — Laser cut (planned 5.81h, actual 11.98h)", est_hours: 5.81, status: "done" },
      { seq: 30, workstation: "press-brake-1", op: "FM — Form (planned 14.28h, actual 17.08h)", est_hours: 14.28, status: "done" },
      { seq: 40, workstation: "qc", op: "QA — Inspection", est_hours: 0.5, status: "done" },
    ],
  },
  "WO-2026-00225": {
    name: "WO-2026-00225",
    customer: "Ariens Company",
    project: "Ariens 30270901 — Job 152660 (worst eff 35%)",
    division: "Processing",
    status: "Complete",
    start_date: "2026-02-12",
    due_date: "2026-03-09",
    qty: 50,
    bom_ref: "BOM-JWM-ARN-30270901-001",
    total_value: 7187.50,
    material_ready_pct: 100,
    routing: [
      { seq: 20, workstation: "flat-laser-2", op: "FL — Laser cut (planned 5.81h, actual 11.57h)", est_hours: 5.81, status: "done" },
      { seq: 30, workstation: "press-brake-1", op: "FM — Form (planned 14.28h, actual 25.59h)", est_hours: 14.28, status: "done" },
      { seq: 40, workstation: "qc", op: "QA — Inspection", est_hours: 0.5, status: "done" },
    ],
  },
  "WO-2026-00227": {
    name: "WO-2026-00227",
    customer: "Ariens Company",
    project: "Ariens 30270901 — Job 152717 (in process, drifting over)",
    division: "Processing",
    status: "In Progress",
    start_date: "2026-03-01",
    due_date: "2026-03-30",
    qty: 50,
    bom_ref: "BOM-JWM-ARN-30270901-001",
    total_value: 7187.50,
    material_ready_pct: 100,
    routing: [
      { seq: 20, workstation: "flat-laser-2", op: "FL — Laser cut (planned 5.81h, actual 12.70h)", est_hours: 5.81, status: "done" },
      { seq: 30, workstation: "press-brake-1", op: "FM — Form (planned 14.28h, actual 26.97h)", est_hours: 14.28, status: "in_progress" },
      { seq: 40, workstation: "qc", op: "QA — Inspection", est_hours: 0.5, status: "pending" },
    ],
  },
  "WO-2026-00228": {
    name: "WO-2026-00228",
    customer: "Ariens Company",
    project: "Ariens 30270901 — Job 152768 (latest complete, shipped 4/15)",
    division: "Processing",
    status: "Complete",
    start_date: "2026-03-15",
    due_date: "2026-04-14",
    qty: 50,
    bom_ref: "BOM-JWM-ARN-30270901-001",
    total_value: 7187.50,
    material_ready_pct: 100,
    routing: [
      { seq: 20, workstation: "flat-laser-2", op: "FL — Laser cut (planned 5.81h, actual 4.91h)", est_hours: 5.81, status: "done" },
      { seq: 30, workstation: "press-brake-1", op: "FM — Form (planned 14.28h, actual 12.55h)", est_hours: 14.28, status: "done" },
      { seq: 40, workstation: "qc", op: "QA — Inspection", est_hours: 0.5, status: "done" },
    ],
  },
};

export function getWorkOrder(name: string): WorkOrderDetail | null {
  if (ORDERS[name]) return ORDERS[name];
  // Generic fallback for any WO-xxxx shape (e.g. freshly created from estimator)
  return {
    name,
    customer: "Ryman Hospitality Properties",
    project: "Opryland Resort — East Atrium Monumental Stair",
    division: "Architectural",
    status: "Draft",
    start_date: "2026-04-20",
    due_date: "2026-05-15",
    qty: 1,
    bom_ref: "EST-2026-0147",
    total_value: 341750,
    material_ready_pct: 72,
    routing: ORDERS["WO-2026-00218"].routing,
  };
}

export function listWorkOrders(): WorkOrderDetail[] {
  return Object.values(ORDERS);
}

export interface JobCard {
  id: string;
  wo: string;
  op_seq: number;
  part: string;
  customer: string;
  qty: number;
  workstation: string;
  priority: "normal" | "urgent" | "hold";
  est_hours: number;
  instructions: string;
  photo?: string;
}

export const JOB_CARDS: JobCard[] = [
  {
    id: "JC-00451",
    wo: "WO-2026-00217",
    op_seq: 20,
    part: "Railing Bracket L-Form",
    customer: "Nissan HQ",
    qty: 48,
    workstation: "press-brake-1",
    priority: "urgent",
    est_hours: 4,
    instructions:
      "Form 90° leg with 0.5\" inside radius. Use tooling set PB-04. Verify first piece against PRT-RB-048 template before running batch.",
  },
  {
    id: "JC-00452",
    wo: "WO-2026-00217",
    op_seq: 30,
    part: "Railing Bracket weld-up",
    customer: "Nissan HQ",
    qty: 48,
    workstation: "weld-bay-a",
    priority: "normal",
    est_hours: 16,
    instructions: "TIG weld per WPS-SS-304-03. 1/8\" fillet all around. Post-weld: hand blend to #4 finish.",
  },
  {
    id: "JC-00453",
    wo: "WO-2026-00218",
    op_seq: 10,
    part: "Outer Stringer Plate",
    customer: "Ryman",
    qty: 2,
    workstation: "flat-laser-1",
    priority: "hold",
    est_hours: 8,
    instructions: "HOLD: QC verification required on Laser #2 nozzle before cut. See anomaly ANOM-2026-0042.",
  },
  {
    id: "JC-00454",
    wo: "WO-2026-00209",
    op_seq: 40,
    part: "Stringer rework — weld repair",
    customer: "Opryland",
    qty: 2,
    workstation: "weld-bay-a",
    priority: "urgent",
    est_hours: 6,
    instructions: "Rework per NCR-2026-018 disposition. Grind back original weld, re-prep, re-weld per WPS-A36-02.",
  },
];

export interface NCR {
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
}

export const NCRS: NCR[] = [
  {
    id: "NCR-2026-019",
    raised_at: "2026-04-17T15:12:00Z",
    raised_by: "T. Henderson",
    wo: "WO-2026-00203",
    part: "Stair Stringer (curved) — Vanderbilt",
    workstation: "flat-laser-2",
    status: "Under Review",
    defect_type: "Dimensional (kerf drift)",
    description:
      "Laser cut edge measured 0.014\" oversize on last 3 of 4 parts. Parts flagged before weld-up. Suspect nozzle wear.",
    qty_affected: 3,
  },
  {
    id: "NCR-2026-018",
    raised_at: "2026-04-16T09:40:00Z",
    raised_by: "M. Ortiz",
    wo: "WO-2026-00209",
    part: "Stringer End Cap",
    workstation: "weld-bay-a",
    status: "CA Open",
    defect_type: "Weld porosity",
    description: "Porosity observed on 2 end-cap welds during post-weld inspection. Hand-ground and re-welded; root cause investigation open.",
    qty_affected: 2,
    disposition: "Rework (complete)",
    root_cause: "Under investigation — possible shielding gas flow issue on station W-A-3.",
  },
  {
    id: "NCR-2026-017",
    raised_at: "2026-04-15T14:22:00Z",
    raised_by: "QC",
    wo: "WO-2026-00198",
    part: "HVAC Enclosure panel",
    workstation: "press-brake-1",
    status: "Closed",
    defect_type: "Form angle out of tolerance",
    description: "Form angle 88.2° (spec 90° ±0.5°) on 2 panels. Re-formed on press brake; dispositioned use-as-is after customer review.",
    qty_affected: 2,
    disposition: "Use-as-is (customer accepted)",
    root_cause: "Tooling wear on PB-02 lower die.",
    corrective_action: "Lower die replaced 4/16. Added monthly tooling inspection to PM schedule.",
  },
  {
    id: "NCR-2026-016",
    raised_at: "2026-04-14T11:05:00Z",
    raised_by: "K. Daniels",
    part: "Baluster, 5/8\" sq bar",
    workstation: "cnc-1",
    status: "Draft from Floor",
    defect_type: "Surface finish",
    description: "Machining marks on 2 balusters after CNC cut. Outside of visible area per drawing note 4, but flagging for review.",
    qty_affected: 2,
  },
];
