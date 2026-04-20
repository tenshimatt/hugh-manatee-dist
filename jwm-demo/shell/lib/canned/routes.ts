/**
 * Canned Route data — fallback for when ERPNext is unavailable.
 * Mirrors the shape returned by jwm_manufacturing.routes_api.list_routes / get_route.
 */

export type RouteStepStatus = "Pending" | "In Progress" | "Complete" | "Skipped" | "NCR Loopback";
export type RouteStatus = "Draft" | "Active" | "Complete" | "On Hold";

export interface RouteStep {
  name?: string;
  step_no: number;
  operation: string;
  workstation: string;
  is_optional: 0 | 1 | boolean;
  branch_from_step: number | null;
  planned_hours: number;
  status: RouteStepStatus;
  completed_at?: string | null;
  idx?: number;
}

export interface RouteSummary {
  name: string;
  route_name: string;
  job_id: string;
  description?: string;
  status: RouteStatus;
  notes?: string;
  modified?: string;
}

export interface RouteFull extends RouteSummary {
  jwm_raw_data?: string;
  creation?: string;
  steps: RouteStep[];
}

export const CANNED_ROUTES: RouteFull[] = [
  {
    name: "ROUTE-25071-IAD181",
    route_name: "ROUTE-25071-IAD181",
    job_id: "25071-IAD181",
    description: "Architectural panel run - IAD181",
    status: "Active",
    notes: "On schedule. Weld Bay A active.",
    steps: [
      { step_no: 1, operation: "Layout",        workstation: "Layout",        planned_hours: 2.0, status: "Complete",    is_optional: 0, branch_from_step: null, completed_at: "2026-04-17 08:30:00" },
      { step_no: 2, operation: "Laser 1",       workstation: "Flat Laser 1",  planned_hours: 4.5, status: "Complete",    is_optional: 0, branch_from_step: null, completed_at: "2026-04-18 11:00:00" },
      { step_no: 3, operation: "Press Brake 1", workstation: "Press Brake 1", planned_hours: 3.0, status: "Complete",    is_optional: 0, branch_from_step: null, completed_at: "2026-04-18 16:20:00" },
      { step_no: 4, operation: "Weld Bay A",    workstation: "Weld Bay A",    planned_hours: 6.0, status: "In Progress", is_optional: 0, branch_from_step: null },
      { step_no: 5, operation: "QC",            workstation: "QC",            planned_hours: 1.0, status: "Pending",     is_optional: 0, branch_from_step: null },
      { step_no: 6, operation: "Shipping",      workstation: "Shipping",      planned_hours: 0.5, status: "Pending",     is_optional: 0, branch_from_step: null },
    ],
  },
  {
    name: "ROUTE-24060-BM01",
    route_name: "ROUTE-24060-BM01",
    job_id: "24060-BM01",
    description: "Processing BM01 - includes finishing NCR loopback",
    status: "Active",
    notes: "NCR-0042 triggered Finishing loopback between Laser 2 and Press Brake.",
    steps: [
      { step_no: 1,  operation: "Layout",        workstation: "Layout",        planned_hours: 1.5, status: "Complete",     is_optional: 0, branch_from_step: null, completed_at: "2026-04-16 09:00:00" },
      { step_no: 2,  operation: "Flat Laser 2",  workstation: "Flat Laser 2",  planned_hours: 5.0, status: "Complete",     is_optional: 0, branch_from_step: null, completed_at: "2026-04-17 14:30:00" },
      { step_no: 99, operation: "Finishing",    workstation: "Finishing",     planned_hours: 2.0, status: "NCR Loopback", is_optional: 1, branch_from_step: 2 },
      { step_no: 3,  operation: "Press Brake 1", workstation: "Press Brake 1", planned_hours: 2.5, status: "In Progress",  is_optional: 0, branch_from_step: null },
      { step_no: 4,  operation: "QC",            workstation: "QC",            planned_hours: 1.0, status: "Pending",      is_optional: 0, branch_from_step: null },
      { step_no: 5,  operation: "Shipping",      workstation: "Shipping",      planned_hours: 0.5, status: "Pending",      is_optional: 0, branch_from_step: null },
    ],
  },
  {
    name: "ROUTE-25067-FS02",
    route_name: "ROUTE-25067-FS02",
    job_id: "25067-FS02",
    description: "Fabrication frame FS02 - draft route",
    status: "Draft",
    notes: "Awaiting engineering release.",
    steps: [
      { step_no: 1, operation: "Layout",          workstation: "Layout",         planned_hours: 2.0, status: "Pending", is_optional: 0, branch_from_step: null },
      { step_no: 2, operation: "CNC Programming", workstation: "CNC Programming", planned_hours: 3.0, status: "Pending", is_optional: 0, branch_from_step: null },
      { step_no: 3, operation: "Tube Laser 1",    workstation: "Tube Laser 1",   planned_hours: 4.0, status: "Pending", is_optional: 0, branch_from_step: null },
      { step_no: 4, operation: "Press Brake 1",   workstation: "Press Brake 1",  planned_hours: 2.0, status: "Pending", is_optional: 0, branch_from_step: null },
      { step_no: 5, operation: "Weld Bay A",      workstation: "Weld Bay A",     planned_hours: 5.0, status: "Pending", is_optional: 0, branch_from_step: null },
      { step_no: 6, operation: "Assembly 1",      workstation: "Assembly 1",     planned_hours: 4.0, status: "Pending", is_optional: 0, branch_from_step: null },
      { step_no: 7, operation: "Shipping",        workstation: "Shipping",       planned_hours: 0.5, status: "Pending", is_optional: 0, branch_from_step: null },
    ],
  },
];

export function getCannedRoute(id: string): RouteFull | undefined {
  return CANNED_ROUTES.find((r) => r.name === id || r.job_id === id);
}

export function listCannedRoutes(): RouteSummary[] {
  return CANNED_ROUTES.map((r) => {
    const { name, route_name, job_id, description, status, notes, modified } = r;
    return { name, route_name, job_id, description, status, notes, modified };
  });
}
