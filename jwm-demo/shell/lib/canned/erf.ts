/**
 * ERF — Engineering Release Form.
 *
 * In JWM's process, an ERF is the gate between engineering / estimating and
 * the shop floor. Once signed off it spawns Work Orders + routing. Until
 * then, work sits in the ERF queue waiting on drawings, material lead times,
 * or customer approval.
 *
 * This module keeps an in-memory store of ERFs seeded with a realistic
 * queue. A separate `/api/erf` route (also in-memory for Phase 1) lets the
 * UI create and release ERFs without persisting across server restarts.
 * Phase 2 points this at an ERPNext custom DocType.
 */

export type ErfStatus =
  | "Draft"
  | "Pending Drawings"
  | "Pending Material"
  | "Pending Approval"
  | "Ready to Release"
  | "Released";

export type ErfPriority = "low" | "normal" | "urgent";

export interface ErfLineItem {
  part: string;
  qty: number;
  uom: string;
  gauge?: string;
  material?: string;
  notes?: string;
}

export interface Erf {
  id: string;
  title: string;
  customer: string;
  project: string;
  division: "Architectural" | "Processing";
  status: ErfStatus;
  priority: ErfPriority;
  submitted_by: string;
  submitted_at: string;
  target_release: string;
  assigned_wo?: string;
  est_value?: number;
  notes?: string;
  line_items: ErfLineItem[];
  blockers: string[];
}

// Seed queue — 5 ERFs covering all the status states so the UI has
// something to render on first load.
export const ERF_SEED: Erf[] = [
  {
    id: "ERF-2026-0047",
    title: "Opryland Atrium Stair — East wing release",
    customer: "Ryman Hospitality Properties",
    project: "Opryland Resort — East Atrium Monumental Stair",
    division: "Architectural",
    status: "Ready to Release",
    priority: "urgent",
    submitted_by: "P. Travers",
    submitted_at: "2026-04-17T09:20:00Z",
    target_release: "2026-04-20",
    est_value: 341750,
    notes:
      "All drawings approved. Material confirmed in-stock. Ready for WO + routing. Stringer cuts to laser-1 (per anomaly hold on laser-2).",
    line_items: [
      { part: "Outer Stringer Plate", qty: 2, uom: "ea", gauge: "1/2\"", material: "A36" },
      { part: "Inner Stringer Plate", qty: 2, uom: "ea", gauge: "1/2\"", material: "A36" },
      { part: "Tread Pan (typ)", qty: 18, uom: "ea", gauge: "14ga", material: "CRS" },
      { part: "Handrail Pipe, 1.5\" sch40", qty: 120, uom: "lf", material: "A500" },
    ],
    blockers: [],
  },
  {
    id: "ERF-2026-0046",
    title: "Nissan HQ — 2nd phase baluster run",
    customer: "Nissan HQ",
    project: "Nissan HQ — Exterior Railing Retrofit",
    division: "Architectural",
    status: "Pending Material",
    priority: "normal",
    submitted_by: "J. McDougall",
    submitted_at: "2026-04-16T14:05:00Z",
    target_release: "2026-04-22",
    est_value: 48200,
    line_items: [
      { part: "Baluster, 5/8\" sq bar", qty: 320, uom: "ea", material: "A36" },
      { part: "Top Rail, 2x1 tube", qty: 180, uom: "lf", material: "A500" },
      { part: "Base Plate 4x4x3/8", qty: 40, uom: "ea", material: "A36" },
    ],
    blockers: ["Sq bar on 5-day lead from Nucor; ETA 2026-04-21"],
  },
  {
    id: "ERF-2026-0045",
    title: "Vanderbilt Medical — HVAC enclosure panels",
    customer: "Vanderbilt Medical",
    project: "VMC — Campus HVAC Rollout Phase 3",
    division: "Processing",
    status: "Pending Drawings",
    priority: "normal",
    submitted_by: "T. Henderson",
    submitted_at: "2026-04-15T10:30:00Z",
    target_release: "2026-04-25",
    est_value: 22400,
    line_items: [
      { part: "Enclosure Side Panel (L)", qty: 24, uom: "ea", gauge: "16ga", material: "CRS" },
      { part: "Enclosure Side Panel (R)", qty: 24, uom: "ea", gauge: "16ga", material: "CRS" },
      { part: "Top Cap w/ louvers", qty: 12, uom: "ea", gauge: "14ga", material: "CRS" },
    ],
    blockers: ["Waiting on Rev-C louver detail from engineering"],
  },
  {
    id: "ERF-2026-0044",
    title: "Music City Center — ACM sunshade batch",
    customer: "Music City Center",
    project: "MCC — Facade Refresh",
    division: "Architectural",
    status: "Pending Approval",
    priority: "normal",
    submitted_by: "P. Travers",
    submitted_at: "2026-04-14T16:45:00Z",
    target_release: "2026-04-28",
    est_value: 78650,
    line_items: [
      { part: "Sunshade Blade, ACM 3mm", qty: 64, uom: "ea", material: "ACM" },
      { part: "Attachment Bracket", qty: 128, uom: "ea", gauge: "3/16\"", material: "A36" },
    ],
    blockers: ["Customer sign-off on finish RAL-7016 pending"],
  },
  {
    id: "ERF-2026-0043",
    title: "BNA Concourse D — handrail spare stock",
    customer: "Metro Nashville Airport Authority",
    project: "BNA — Concourse D Refresh",
    division: "Architectural",
    status: "Released",
    priority: "low",
    submitted_by: "J. McDougall",
    submitted_at: "2026-04-11T08:15:00Z",
    target_release: "2026-04-13",
    assigned_wo: "WO-2026-00215",
    est_value: 14300,
    line_items: [{ part: "Handrail Pipe, 1.5\" sch40", qty: 60, uom: "lf", material: "A500" }],
    blockers: [],
  },
];

/**
 * In-memory store. Mutated by /api/erf POST + /api/erf/[id] PATCH.
 * Not persisted — Phase 2 swaps this for an ERPNext custom DocType.
 */
const store: Erf[] = ERF_SEED.map((e) => ({ ...e, line_items: [...e.line_items], blockers: [...e.blockers] }));

export function listErfs(): Erf[] {
  return store.slice().sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
}

export function getErf(id: string): Erf | null {
  return store.find((e) => e.id === id) || null;
}

export function createErf(input: Partial<Erf> & { title: string; customer: string }): Erf {
  const year = new Date().getFullYear();
  const nextNum = store.reduce((max, e) => {
    const m = e.id.match(/ERF-\d+-(\d+)/);
    return m ? Math.max(max, Number(m[1])) : max;
  }, 0) + 1;
  const id = `ERF-${year}-${String(nextNum).padStart(4, "0")}`;
  const erf: Erf = {
    id,
    title: input.title,
    customer: input.customer,
    project: input.project || input.title,
    division: input.division || "Architectural",
    status: input.status || "Draft",
    priority: input.priority || "normal",
    submitted_by: input.submitted_by || "Chris Ball",
    submitted_at: new Date().toISOString(),
    target_release: input.target_release || new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
    est_value: input.est_value,
    notes: input.notes,
    line_items: input.line_items || [],
    blockers: input.blockers || [],
  };
  store.unshift(erf);
  return erf;
}

export function updateErf(id: string, patch: Partial<Erf>): Erf | null {
  const idx = store.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  store[idx] = { ...store[idx], ...patch };
  return store[idx];
}

export function releaseErf(id: string): { erf: Erf; wo: string } | null {
  const erf = getErf(id);
  if (!erf) return null;
  const wo = `WO-${new Date().getFullYear()}-00${String(218 + Math.floor(Math.random() * 20)).padStart(3, "0")}`;
  updateErf(id, { status: "Released", assigned_wo: wo });
  return { erf: { ...erf, status: "Released", assigned_wo: wo }, wo };
}
