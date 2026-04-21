/**
 * Role-based people roster for /arch/people/[role]/[slug] dashboards.
 *
 * Source: SMARTSHEET_REFERENCE.md (the dashboard names Chris already has in
 * Smartsheet). Real names; canned counts; structure mirrors lib/canned/pms.ts.
 *
 * When ERPNext Employee records get hydrated with department + role custom
 * fields, swap the canned arrays for a live fetcher.
 */

export type RoleKey = "fm" | "fx" | "precon" | "office" | "manager";

export interface Person {
  slug: string;
  name: string;
  role: RoleKey;
  title: string;
  email?: string;
  // Counts the role-dashboard surfaces. Each role surfaces different things
  // (FMs care about field hours; FXs care about open RFI; Precon care about
  // open bids; Office cares about COs awaiting paperwork).
  metrics: Array<{ label: string; value: string; sub?: string; tone?: "navy" | "gold" | "green" | "amber" | "red" | "slate" }>;
  // Recent items the dashboard would highlight — kept as untyped pieces so
  // each role can display its own list.
  recent: Array<{ id: string; title: string; meta?: string; href?: string }>;
  // Role-specific quick-links rail.
  links: Array<{ label: string; href: string }>;
}

const PMO_LINKS: Person["links"] = [
  { label: "PMO Rollup", href: "/exec/pmo" },
  { label: "Production Schedule", href: "/shop/scheduler" },
  { label: "Engineering Pipeline", href: "/engineering/pipeline" },
];

const SALES_LINKS: Person["links"] = [
  { label: "Sales Pipeline", href: "/arch/sales" },
  { label: "Sales Leaders", href: "/arch/sales/leaders" },
  { label: "Quick Quote", href: "/estimator/quick-quote" },
];

export const PEOPLE: Person[] = [
  // ---------- Field Managers (FM) ----------
  {
    slug: "cole-noterra",
    name: "Cole Noterra",
    role: "fm",
    title: "Field Manager",
    metrics: [
      { label: "Active sites", value: "8", tone: "navy" },
      { label: "Open Field Dailies", value: "12", tone: "gold" },
      { label: "Hours this week", value: "262", tone: "slate" },
      { label: "Crews deployed", value: "5" },
    ],
    recent: [
      { id: "fd-1", title: "Loves Blacksburg — daily 04/19", meta: "Layout 80% done", href: "/arch/field-daily" },
      { id: "fd-2", title: "Vanderlande Casablanca — daily 04/19", meta: "Single Skin install", href: "/arch/field-daily" },
      { id: "fd-3", title: "DLR DFW37 Phase 2 — RFI submitted", meta: "Awaiting response 4d", href: "/arch/field-daily" },
    ],
    links: [
      { label: "Field Dailies", href: "/arch/field-daily" },
      { label: "Pool Vehicle Bookings", href: "/fleet/bookings" },
      { label: "Project list", href: "/arch/projects" },
    ],
  },
  {
    slug: "laura-frami",
    name: "Laura Frami",
    role: "fm",
    title: "Field Manager",
    metrics: [
      { label: "Active sites", value: "6", tone: "navy" },
      { label: "Open Field Dailies", value: "8", tone: "gold" },
      { label: "Hours this week", value: "188" },
      { label: "Crews deployed", value: "4" },
    ],
    recent: [
      { id: "fd-4", title: "VUMC MCE 3rd Floor — daily 04/19", meta: "Crating + ship prep", href: "/arch/field-daily" },
      { id: "fd-5", title: "QTS-NAL1-DC1 — punch list reset", meta: "GC walked Friday", href: "/arch/field-daily" },
    ],
    links: [
      { label: "Field Dailies", href: "/arch/field-daily" },
      { label: "Project list", href: "/arch/projects" },
    ],
  },

  // ---------- FX Designers ----------
  {
    slug: "josh-mcpherson",
    name: "Josh McPherson",
    role: "fx",
    title: "FX Designer · ACM Lead",
    metrics: [
      { label: "Open RFIs", value: "7", tone: "amber" },
      { label: "Sketches in review", value: "23" },
      { label: "Sketch backlog", value: "41", tone: "navy" },
      { label: "Avg sketch turn", value: "1.4d", tone: "green" },
    ],
    recent: [
      { id: "fx-1", title: "ACM panel sketch — IAD181 elevations", meta: "Submitted to LO check", href: "/engineering/acm-flow" },
      { id: "fx-2", title: "RFI #382 — DLR DFW37 corner detail", meta: "Posted 04/18", href: "/engineering/acm-flow" },
    ],
    links: [
      { label: "ACM Flow", href: "/engineering/acm-flow" },
      { label: "Engineering Pipeline", href: "/engineering/pipeline" },
    ],
  },
  {
    slug: "mare-silva",
    name: "Mare Silva",
    role: "fx",
    title: "FX Designer",
    metrics: [
      { label: "Open RFIs", value: "4" },
      { label: "Sketches in review", value: "18" },
      { label: "Sketch backlog", value: "29", tone: "navy" },
      { label: "Avg sketch turn", value: "1.7d" },
    ],
    recent: [
      { id: "fx-3", title: "Plate detail — Vanderlande Casablanca", meta: "Programming queue", href: "/engineering/pt-flow" },
    ],
    links: [
      { label: "P&T Flow", href: "/engineering/pt-flow" },
      { label: "Engineering Pipeline", href: "/engineering/pipeline" },
    ],
  },
  {
    slug: "leon-soares",
    name: "Leon Soares",
    role: "fx",
    title: "FX Designer",
    metrics: [
      { label: "Open RFIs", value: "3" },
      { label: "Sketches in review", value: "11" },
      { label: "Sketch backlog", value: "16" },
      { label: "Avg sketch turn", value: "1.9d", tone: "amber" },
    ],
    recent: [
      { id: "fx-4", title: "Genesis canopy — BNA Project 2", meta: "Blocked on field dimension", href: "/engineering/acm-flow" },
    ],
    links: [
      { label: "ACM Flow", href: "/engineering/acm-flow" },
      { label: "Engineering Pipeline", href: "/engineering/pipeline" },
    ],
  },

  // ---------- Precon + Estimating Leaders ----------
  {
    slug: "mike-noterra",
    name: "Mike Noterra",
    role: "precon",
    title: "Precon + Estimating Lead",
    metrics: [
      { label: "Active bids", value: "44", tone: "gold" },
      { label: "Submitted", value: "39" },
      { label: "Lifetime won $", value: "$87M", tone: "green" },
      { label: "Win rate", value: "34%", tone: "navy" },
    ],
    recent: [
      { id: "p-1", title: "Equinix DC2 Phase 4 — bid due Tue", href: "/arch/sales" },
      { id: "p-2", title: "Amazon IAD181B — scope walk Wed", href: "/arch/sales" },
    ],
    links: SALES_LINKS,
  },
  {
    slug: "caleb-fanice",
    name: "Caleb Fanice",
    role: "precon",
    title: "Precon + Estimating Lead",
    metrics: [
      { label: "Active bids", value: "31" },
      { label: "Submitted", value: "27" },
      { label: "Lifetime won $", value: "$54M" },
      { label: "Win rate", value: "29%" },
    ],
    recent: [
      { id: "p-3", title: "QTS PJC1 DC1 expansion — RFP review", href: "/arch/sales" },
    ],
    links: SALES_LINKS,
  },
  {
    slug: "kevin-florde",
    name: "Kevin Florde",
    role: "precon",
    title: "Precon + Estimating Lead",
    metrics: [
      { label: "Active bids", value: "26" },
      { label: "Submitted", value: "19" },
      { label: "Lifetime won $", value: "$41M" },
      { label: "Win rate", value: "31%" },
    ],
    recent: [
      { id: "p-4", title: "VUMC tower — pre-bid meeting Mon", href: "/arch/sales" },
    ],
    links: SALES_LINKS,
  },

  // ---------- Sales / Precon Managers ----------
  {
    slug: "stephen-daniels",
    name: "Stephen Daniels",
    role: "manager",
    title: "Sales / Precon Manager",
    metrics: [
      { label: "Team active bids", value: "101", tone: "gold" },
      { label: "Team submitted", value: "85" },
      { label: "Pipeline $", value: "$182M", tone: "navy" },
      { label: "Team win rate", value: "31%" },
    ],
    recent: [
      { id: "m-1", title: "Quarterly review — Mike, Caleb, Kevin", meta: "Friday 10:00", href: "/arch/sales/leaders" },
    ],
    links: SALES_LINKS,
  },
  {
    slug: "harrison-hardman",
    name: "Harrison Hardman",
    role: "manager",
    title: "Sales / Precon Manager",
    metrics: [
      { label: "Team active bids", value: "67" },
      { label: "Team submitted", value: "54" },
      { label: "Pipeline $", value: "$118M" },
      { label: "Team win rate", value: "28%" },
    ],
    recent: [
      { id: "m-2", title: "Genesis program proposal — board pre-read", href: "/arch/sales" },
    ],
    links: SALES_LINKS,
  },

  // ---------- Office Manager ----------
  {
    slug: "kim-sullivan",
    name: "Kim Sullivan",
    role: "office",
    title: "Office Manager",
    metrics: [
      { label: "COs to file", value: "9", tone: "amber" },
      { label: "Invoices to issue", value: "14", tone: "navy" },
      { label: "Receivables 60+ days", value: "$412k", tone: "red" },
      { label: "Vendor approvals", value: "3" },
    ],
    recent: [
      { id: "o-1", title: "Equinix CO #4 — exec sign-off pending", href: "/arch/projects" },
      { id: "o-2", title: "Vanderbilt MCE pay-app #11 — ready", href: "/arch/projects" },
    ],
    links: [
      { label: "PMO Rollup", href: "/exec/pmo" },
      { label: "Spectrum Drift", href: "/exec/spectrum-drift" },
      { label: "Vendors directory", href: "/arch/vendors" },
    ],
  },
];

export const ROLE_LABELS: Record<RoleKey, string> = {
  fm: "Field Manager",
  fx: "FX Designer",
  precon: "Precon + Estimating Lead",
  office: "Office Manager",
  manager: "Sales / Precon Manager",
};

export const ROLE_PLURAL: Record<RoleKey, string> = {
  fm: "Field Managers",
  fx: "FX Designers",
  precon: "Precon Leaders",
  office: "Office Managers",
  manager: "Sales / Precon Managers",
};

export function listPeopleByRole(role: RoleKey): Person[] {
  return PEOPLE.filter((p) => p.role === role);
}

export function getPerson(slug: string): Person | undefined {
  return PEOPLE.find((p) => p.slug === slug);
}
