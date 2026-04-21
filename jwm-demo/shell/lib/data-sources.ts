/**
 * data-sources.ts — single source of truth for "where does the data on this
 * screen come from?" Every page/route in the shell is inventoried here with
 * its current SourceState and, where applicable, the specific ask we're
 * waiting on from Chris / JWM.
 *
 * The /admin/data-sources dashboard reads from this file. When you ship a
 * screen from canned → seeded → live, flip the state here. When a screen is
 * blocked on data from Chris, set state to "awaiting_jwm" and fill `ask`.
 *
 * Keep this list flat — tree-ing it adds no value, and flat is greppable.
 */
import type { SourceState } from "@/components/chrome/DataSourceBadge";

export type Plane =
  | "exec"
  | "architectural"
  | "processing"
  | "engineering"
  | "shop-floor"
  | "qc"
  | "safety"
  | "maintenance"
  | "fleet"
  | "inventory"
  | "admin";

export interface DataSourceEntry {
  /** Route pattern (can include :params for dynamic segments). */
  route: string;
  /** Human-readable label for the dashboard. */
  label: string;
  plane: Plane;
  state: SourceState;
  /** One-line description of WHERE the data on this page comes from today. */
  source: string;
  /** If state === "awaiting_jwm" — what we need from Chris to go live. */
  ask?: string;
  /** Freeform notes (e.g. "will move to seeded when xlsx drop lands"). */
  note?: string;
}

export const DATA_SOURCES: DataSourceEntry[] = [
  // ───────────────────────── EXEC ─────────────────────────
  {
    route: "/dashboard",
    label: "Exec landing / KPI tiles",
    plane: "exec",
    state: "seeded",
    source: "Mixed — reads Projects + Work Orders from ERPNext, canned KPI cards where seed is thin",
    note: "Tiles referencing Spectrum GL are canned until Spectrum connector lands",
  },
  {
    route: "/exec/pmo",
    label: "PMO Summary Rollup (116 projects)",
    plane: "exec",
    state: "seeded",
    source: "JSON seeded from 2026-04-20 PMO Summary.xlsx; one-time snapshot not live",
    note: "Will flip to 'live' once we wire Smartsheet → ERPNext nightly sync",
  },
  {
    route: "/exec/spectrum-drift",
    label: "Smartsheet vs Spectrum drift",
    plane: "exec",
    state: "awaiting_jwm",
    source: "Canned drift rows — no Spectrum export yet",
    ask: "Point-in-time Spectrum export of Job cost actuals (any format — CSV/xlsx/PDF) so we can compute real drift vs Smartsheet",
  },
  {
    route: "/exec/arch",
    label: "Exec: Architectural plane summary",
    plane: "exec",
    state: "seeded",
    source: "Derived from Arch Sales + PMO rollup seeds",
  },
  {
    route: "/exec/arch/contracts",
    label: "Exec: contracts register",
    plane: "exec",
    state: "awaiting_jwm",
    source: "Canned 3 rows",
    ask: "Export of signed contracts (PDF bundle or Smartsheet row export). Even a list of job# → contract date + value is enough to seed",
  },
  {
    route: "/exec/processing",
    label: "Exec: Processing plane summary",
    plane: "exec",
    state: "canned",
    source: "In-code placeholder",
    note: "Unblocks once Processing KPIs are wired",
  },

  // ───────────────────────── ARCHITECTURAL ─────────────────────────
  {
    route: "/arch/sales",
    label: "Sales pipeline (1,952 opps)",
    plane: "architectural",
    state: "seeded",
    source: "JSON seeded from 2026-04-20 Arch Sales xlsx (1,998 rows, 1,952 after dedup)",
  },
  {
    route: "/arch/sales/:id",
    label: "Opportunity detail",
    plane: "architectural",
    state: "seeded",
    source: "Reads from arch-sales.json seed",
  },
  {
    route: "/arch/sales/leaders",
    label: "Estimator leaderboard",
    plane: "architectural",
    state: "seeded",
    source: "Derived from arch-sales.json seed",
  },
  {
    route: "/arch/sales/leaders/:slug",
    label: "Per-estimator dashboard",
    plane: "architectural",
    state: "seeded",
    source: "Derived from arch-sales.json seed",
  },
  {
    route: "/arch/people",
    label: "People directory",
    plane: "architectural",
    state: "canned",
    source: "11 hand-coded roster entries in lib/canned/people.ts",
    note: "Replace with ERPNext Employee DocType once HR data drops",
  },
  {
    route: "/arch/people/:role/:slug",
    label: "Person detail",
    plane: "architectural",
    state: "canned",
    source: "Derived from canned people roster",
  },
  {
    route: "/arch/projects",
    label: "Projects list",
    plane: "architectural",
    state: "live",
    source: "ERPNext Project DocType",
  },
  {
    route: "/arch/projects/:id",
    label: "Project overview",
    plane: "architectural",
    state: "live",
    source: "ERPNext Project + Task + custom JWM fields",
  },
  {
    route: "/arch/projects/:id/project-schedule",
    label: "Project Gantt",
    plane: "architectural",
    state: "live",
    source: "ERPNext Task rows under Project",
  },
  {
    route: "/arch/projects/:id/budget",
    label: "Project budget",
    plane: "architectural",
    state: "seeded",
    source: "canned/project-subtabs/budget.ts; PM-reported figures",
    note: "Wire to Spectrum WBS once export available",
  },
  {
    route: "/arch/projects/:id/cors",
    label: "Change orders register",
    plane: "architectural",
    state: "seeded",
    source: "canned/project-subtabs/cors.ts",
  },
  {
    route: "/arch/projects/:id/cor-budget",
    label: "COR budget impact",
    plane: "architectural",
    state: "seeded",
    source: "Derived from canned CORs",
  },
  {
    route: "/arch/projects/:id/forecast",
    label: "Project forecast",
    plane: "architectural",
    state: "seeded",
    source: "canned/project-subtabs/forecast.ts",
  },
  {
    route: "/arch/projects/:id/production",
    label: "Production snapshot",
    plane: "architectural",
    state: "seeded",
    source: "canned/project-subtabs/production.ts",
  },
  {
    route: "/arch/projects/:id/charter",
    label: "Project charter",
    plane: "architectural",
    state: "seeded",
    source: "canned/project-subtabs/charter.ts",
  },
  {
    route: "/arch/projects/:id/sov",
    label: "Schedule of Values",
    plane: "architectural",
    state: "awaiting_jwm",
    source: "Canned SOV demo rows",
    ask: "Sample signed SOV for one live job so we can model the schema. Any PDF is enough",
  },
  {
    route: "/arch/projects/:id/rom",
    label: "ROM estimate",
    plane: "architectural",
    state: "canned",
    source: "Canned ROM calc",
  },
  {
    route: "/arch/projects/:id/field-daily",
    label: "Project field dailies",
    plane: "architectural",
    state: "seeded",
    source: "canned/field-daily.ts",
  },
  {
    route: "/arch/pm",
    label: "PM workload board",
    plane: "architectural",
    state: "seeded",
    source: "Derived from PMO rollup seed",
  },
  {
    route: "/arch/pm/:user",
    label: "Per-PM dashboard",
    plane: "architectural",
    state: "seeded",
    source: "Derived from PMO rollup + canned PMs",
  },
  {
    route: "/arch/estimating",
    label: "Estimating workbench",
    plane: "architectural",
    state: "canned",
    source: "In-code placeholder",
  },
  {
    route: "/arch/erf",
    label: "Engineering Request Forms register",
    plane: "architectural",
    state: "seeded",
    source: "canned/erf.ts",
  },
  {
    route: "/arch/erf/new",
    label: "New ERF",
    plane: "architectural",
    state: "live",
    source: "Writes to ERPNext JWM ERF DocType",
  },
  {
    route: "/arch/erf/:id",
    label: "ERF detail",
    plane: "architectural",
    state: "live",
    source: "ERPNext JWM ERF DocType",
  },
  {
    route: "/arch/field-daily",
    label: "Field daily register",
    plane: "architectural",
    state: "seeded",
    source: "canned/field-daily.ts",
  },
  {
    route: "/arch/field-daily/new",
    label: "New field daily",
    plane: "architectural",
    state: "canned",
    source: "Client-side form; not persisted to ERPNext yet",
    note: "Need Field Daily DocType schema finalized",
  },
  {
    route: "/arch/field-daily/:id",
    label: "Field daily detail",
    plane: "architectural",
    state: "seeded",
    source: "canned/field-daily.ts",
  },
  {
    route: "/arch/panel-dashboard",
    label: "Panel tracker",
    plane: "architectural",
    state: "awaiting_jwm",
    source: "Canned demo panels",
    ask: "Current Panel Tracker sheet export (per Chris 2026-04-20 demo); defines columns for CNC cutlist replacement",
  },
  {
    route: "/arch/3d-schedule",
    label: "3D schedule",
    plane: "architectural",
    state: "canned",
    source: "In-code placeholder",
  },
  {
    route: "/arch/scanner-calendar",
    label: "Scanner calendar",
    plane: "architectural",
    state: "canned",
    source: "In-code placeholder",
  },
  {
    route: "/arch/electives",
    label: "Electives tracker",
    plane: "architectural",
    state: "canned",
    source: "In-code placeholder",
  },
  {
    route: "/arch/restore-material",
    label: "Restore material log",
    plane: "architectural",
    state: "canned",
    source: "In-code placeholder",
  },
  {
    route: "/arch/procurement-log",
    label: "Procurement log",
    plane: "architectural",
    state: "awaiting_jwm",
    source: "Canned rows",
    ask: "Export of current procurement log (Smartsheet likely). We need PO# → Vendor → Job# → ETA columns",
  },
  {
    route: "/arch/forms/job-info",
    label: "Job Info form",
    plane: "architectural",
    state: "live",
    source: "Writes to ERPNext Project + custom fields",
  },
  {
    route: "/arch/forms/3d-request",
    label: "3D request form",
    plane: "architectural",
    state: "canned",
    source: "Client-side form, not persisted",
  },
  {
    route: "/arch/forms/schedule-it",
    label: "Schedule-It form",
    plane: "architectural",
    state: "canned",
    source: "Client-side form, not persisted",
  },

  // ───────────────────────── PROCESSING ─────────────────────────
  {
    route: "/processing/estimating/quick-quote",
    label: "Quick-quote estimator",
    plane: "processing",
    state: "live",
    source: "LiteLLM + AI route/BOM extraction; saves to ERPNext BOM",
  },
  {
    route: "/processing/estimating/quick-quote/preview/:name",
    label: "Quick-quote preview",
    plane: "processing",
    state: "live",
    source: "ERPNext BOM read",
  },
  {
    route: "/processing/ops",
    label: "Processing ops dashboard",
    plane: "processing",
    state: "seeded",
    source: "Derived from ERPNext Work Orders + canned ops KPIs",
  },
  {
    route: "/processing/sales",
    label: "Processing sales",
    plane: "processing",
    state: "canned",
    source: "In-code placeholder",
  },
  {
    route: "/processing/erf",
    label: "Processing ERF register",
    plane: "processing",
    state: "seeded",
    source: "canned/erf.ts subset",
  },

  // ───────────────────────── ENGINEERING ─────────────────────────
  {
    route: "/engineering",
    label: "Engineering landing",
    plane: "engineering",
    state: "seeded",
    source: "Derived from engineering-pipeline.ts seed",
  },
  {
    route: "/engineering/pipeline",
    label: "Engineering pipeline",
    plane: "engineering",
    state: "seeded",
    source: "engineering-pipeline.ts (PDR-seeded)",
  },
  {
    route: "/engineering/routes",
    label: "Routings list",
    plane: "engineering",
    state: "live",
    source: "ERPNext Routing / Operation DocTypes",
  },
  {
    route: "/engineering/routes/:id",
    label: "Routing detail",
    plane: "engineering",
    state: "live",
    source: "ERPNext Routing",
  },
  {
    route: "/engineering/schedule",
    label: "Engineering schedule",
    plane: "engineering",
    state: "seeded",
    source: "engineering-schedule.ts",
  },
  {
    route: "/engineering/acm-flow",
    label: "ACM flow diagram",
    plane: "engineering",
    state: "canned",
    source: "Hard-coded process flow",
  },
  {
    route: "/engineering/pt-flow",
    label: "Plate/Trim flow diagram",
    plane: "engineering",
    state: "canned",
    source: "Hard-coded process flow",
  },
  {
    route: "/engineering/cost-calc",
    label: "Cost calculator",
    plane: "engineering",
    state: "seeded",
    source: "cost-calc.ts; rates from 2026-04-20 demo",
    note: "Labor rates from Chris demo; material rates from Aprilmeans canned",
  },

  // ───────────────────────── SHOP FLOOR ─────────────────────────
  {
    route: "/shop",
    label: "Shop landing",
    plane: "shop-floor",
    state: "live",
    source: "ERPNext Workstation + Work Order reads",
  },
  {
    route: "/shop/:workstation",
    label: "Workstation kiosk (A/T/X/Y/Z/M/F)",
    plane: "shop-floor",
    state: "live",
    source: "ERPNext Work Order + Job Card + Shop Floor Log (writes)",
  },
  {
    route: "/shop/lead",
    label: "Shop lead dashboard",
    plane: "shop-floor",
    state: "live",
    source: "ERPNext Work Order aggregation",
  },
  {
    route: "/shop/scheduler",
    label: "Shop scheduler",
    plane: "shop-floor",
    state: "seeded",
    source: "ERPNext Work Orders + canned daily-capacity overlay",
    ask: "Real historical workstation runtime data for capacity calibration (any Epicor export with Operation start/end timestamps)",
  },
  {
    route: "/shop/efficiency",
    label: "Daily Efficiency log",
    plane: "shop-floor",
    state: "live",
    source: "ERPNext JWM Daily Efficiency DocType",
  },
  {
    route: "/shop/efficiency/new",
    label: "New efficiency entry",
    plane: "shop-floor",
    state: "live",
    source: "Writes to ERPNext JWM Daily Efficiency",
  },
  {
    route: "/shop/ship-schedule",
    label: "Ship schedule",
    plane: "shop-floor",
    state: "canned",
    source: "Canned outbound rows",
    ask: "Current shipping schedule Smartsheet export so we can seed real ship dates",
  },
  {
    route: "/shop/shipping",
    label: "Shipping log",
    plane: "shop-floor",
    state: "canned",
    source: "In-code placeholder",
  },
  {
    route: "/planner/:wo",
    label: "Work Order planner",
    plane: "shop-floor",
    state: "live",
    source: "ERPNext Work Order + Job Card",
  },

  // ───────────────────────── QC ─────────────────────────
  {
    route: "/qc",
    label: "QC log",
    plane: "qc",
    state: "seeded",
    source: "Mix of ERPNext Quality Inspection + canned NCR rows",
    ask: "Current NCR / rework log export to seed historical quality trend",
  },

  // ───────────────────────── SAFETY ─────────────────────────
  {
    route: "/safety",
    label: "Safety log",
    plane: "safety",
    state: "awaiting_jwm",
    source: "Canned incident rows",
    ask: "Existing safety log / OSHA 300 data (any format). Also: does JWM use a specific safety tool (Safesite, SafetyCulture)? We can bridge instead of replace",
  },

  // ───────────────────────── MAINTENANCE ─────────────────────────
  {
    route: "/maintenance",
    label: "Maintenance board",
    plane: "maintenance",
    state: "awaiting_jwm",
    source: "Canned PM schedule",
    ask: "List of shop equipment + PM intervals. Even a whiteboard photo is enough to seed",
  },

  // ───────────────────────── FLEET ─────────────────────────
  {
    route: "/fleet",
    label: "Fleet landing",
    plane: "fleet",
    state: "seeded",
    source: "fleet.ts canned roster",
    ask: "Vehicle list with plate # + type + home plant. ~20 vehicles per Chris; 30 min from Chris to export",
  },
  {
    route: "/fleet/pool",
    label: "Vehicle pool",
    plane: "fleet",
    state: "seeded",
    source: "fleet.ts",
  },
  {
    route: "/fleet/drivers",
    label: "Drivers",
    plane: "fleet",
    state: "seeded",
    source: "fleet.ts",
  },
  {
    route: "/fleet/bookings",
    label: "Vehicle bookings",
    plane: "fleet",
    state: "canned",
    source: "Client-side state only",
  },
  {
    route: "/fleet/bookings/new",
    label: "New booking",
    plane: "fleet",
    state: "canned",
    source: "Client-side form, not persisted",
  },

  // ───────────────────────── INVENTORY ─────────────────────────
  {
    route: "/inventory",
    label: "Inventory & BOMs",
    plane: "inventory",
    state: "live",
    source: "ERPNext Item + BOM + Stock Entry",
    ask: "Full Epicor export would unlock ~1,500 historical BOMs (JWM1451-55). Point-in-time xlsx/CSV is fine for now",
  },

  // ───────────────────────── ADMIN ─────────────────────────
  {
    route: "/admin",
    label: "Admin tools",
    plane: "admin",
    state: "live",
    source: "Direct ERPNext admin links",
  },
  {
    route: "/admin/data-sources",
    label: "Data Source Dashboard (this page)",
    plane: "admin",
    state: "live",
    source: "Inventory from lib/data-sources.ts",
  },
];

export function sourceCounts(entries: DataSourceEntry[] = DATA_SOURCES) {
  const counts: Record<SourceState, number> = {
    live: 0,
    seeded: 0,
    canned: 0,
    awaiting_jwm: 0,
  };
  for (const e of entries) counts[e.state]++;
  return counts;
}

export function percentLive(entries: DataSourceEntry[] = DATA_SOURCES): number {
  if (entries.length === 0) return 0;
  const c = sourceCounts(entries);
  return Math.round(((c.live + c.seeded * 0.5) / entries.length) * 100);
}

export const PLANE_LABELS: Record<Plane, string> = {
  exec: "Executive",
  architectural: "Architectural",
  processing: "Processing",
  engineering: "Engineering",
  "shop-floor": "Shop Floor",
  qc: "QC",
  safety: "Safety",
  maintenance: "Maintenance",
  fleet: "Fleet",
  inventory: "Inventory",
  admin: "Admin",
};
