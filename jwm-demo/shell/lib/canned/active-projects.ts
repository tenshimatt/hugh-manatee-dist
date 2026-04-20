// Active JWM job data for per-project Dashboard demo.
// Swappable shape — getProject(id) is the seam for ERPNext later.

export type HealthStatus = "green" | "yellow" | "red";

export type TaskStatusSlice = {
  status: "Not Started" | "In Progress" | "Complete";
  count: number;
};

export type FieldInstallRow = {
  label: string;
  value: number | string;
  complete?: boolean;
};

export type ActiveProject = {
  id: string;
  jobNumber: string;
  jobName: string;
  pm: { name: string; email: string; phone?: string };
  health: { status: HealthStatus; label: string };
  budgetHealth: { status: HealthStatus; percentSpent: number };
  percentComplete: number;
  taskStatus: TaskStatusSlice[];
  budget: {
    contract: number;
    current: number;
    totalCost: number;
    projectedSpend: number;
    committed: number;
    remaining: number;
  };
  margin: { initial: number; current: number; budgetAtCompletion: number };
  marginIncrease: { changeOrdersPct: number; direction: "decrease" | "increase" };
  fieldInstall: FieldInstallRow[];
  billings: {
    billed: number;
    received: number;
    recognisedRevenue: number;
    retainage: number;
    billPlusAC: number;
    actual: number;
  };
  changeOrders: {
    submitted: number;
    approved: number;
    rejected: number;
    voided: number;
  };
  milestones: { name: string; date: string; status: "done" | "active" | "upcoming" }[];
  /** Mirrors `Archive Project` column in PMO Summary Rollup.xlsx. Archived jobs are hidden from the
   *  /arch/projects list by default but remain queryable. Sourced from JWM1451-123. */
  archived: boolean;
};

const STD_FIELD_INSTALL: FieldInstallRow[] = [
  { label: "PL + #", value: 42, complete: true },
  { label: "Mat'l Manhours", value: 128, complete: true },
  { label: "APM Mark Haram", value: 1, complete: true },
  { label: "ACM Hours", value: 88, complete: true },
  { label: "Post Op Coating", value: "Yes", complete: true },
  { label: "Plastic Wrap", value: "Yes", complete: true },
  { label: "Layout", value: 6, complete: true },
  { label: "Layout Install", value: 4, complete: true },
  { label: "Single Skin Install", value: 18, complete: true },
  { label: "Panel Install", value: 52, complete: false },
  { label: "MH Install", value: 12, complete: false },
  { label: "MH Install Hours", value: 96, complete: false },
  { label: "QC Shipping", value: 2, complete: false },
  { label: "Crating", value: 8, complete: false },
  { label: "Shipped", value: 0, complete: false },
  { label: "QC Final", value: 0, complete: false },
  { label: "Rolled Up", value: 0, complete: false },
  { label: "Sealed", value: 0, complete: false },
  { label: "Corrugated Panel", value: 0, complete: false },
];

const PROJECTS: ActiveProject[] = [
  {
    id: "25071-IAD181",
    jobNumber: "25071",
    jobName: "IAD181 Fitout",
    pm: { name: "Matt Rasmussen", email: "mrasmussen@jwmcd.com" },
    health: { status: "green", label: "On Track" },
    budgetHealth: { status: "green", percentSpent: 2 },
    percentComplete: 61,
    taskStatus: [
      { status: "Not Started", count: 12 },
      { status: "In Progress", count: 22 },
      { status: "Complete", count: 54 },
    ],
    budget: {
      contract: 1553000,
      current: 1553000,
      totalCost: 27254.34,
      projectedSpend: 417215,
      committed: 1109852.66,
      remaining: 1852,
    },
    margin: { initial: 24, current: 24, budgetAtCompletion: 0 },
    marginIncrease: { changeOrdersPct: 0, direction: "increase" },
    fieldInstall: STD_FIELD_INSTALL,
    billings: {
      billed: 1550992.68,
      received: 0,
      recognisedRevenue: 0,
      retainage: 0,
      billPlusAC: 0,
      actual: 1550992.68,
    },
    changeOrders: { submitted: 0, approved: 0, rejected: 0, voided: 0 },
    milestones: [
      { name: "Project Charter Signed", date: "2026-01-14", status: "done" },
      { name: "Engineering Release", date: "2026-02-28", status: "done" },
      { name: "Shop Floor Start", date: "2026-03-15", status: "done" },
      { name: "Panel Fabrication Complete", date: "2026-05-02", status: "active" },
      { name: "Field Install Kickoff", date: "2026-05-19", status: "upcoming" },
      { name: "Substantial Completion", date: "2026-07-31", status: "upcoming" },
    ],
    archived: false,
  },
  {
    id: "24060-BM01",
    jobNumber: "24060",
    jobName: "Loves Blacksburg",
    pm: { name: "Cole Norona", email: "cnorona@jwmcd.com", phone: "931.591.9340" },
    health: { status: "yellow", label: "At Risk" },
    budgetHealth: { status: "yellow", percentSpent: 58 },
    percentComplete: 60,
    taskStatus: [
      { status: "Not Started", count: 8 },
      { status: "In Progress", count: 34 },
      { status: "Complete", count: 46 },
    ],
    budget: {
      contract: 842500,
      current: 862500,
      totalCost: 498620,
      projectedSpend: 825300,
      committed: 612400,
      remaining: 37200,
    },
    margin: { initial: 22, current: 19, budgetAtCompletion: 17 },
    marginIncrease: { changeOrdersPct: 2.4, direction: "increase" },
    fieldInstall: STD_FIELD_INSTALL.map((r, i) => ({ ...r, complete: i < 10 })),
    billings: {
      billed: 517500,
      received: 422000,
      recognisedRevenue: 495000,
      retainage: 25875,
      billPlusAC: 517500,
      actual: 498620,
    },
    changeOrders: { submitted: 42000, approved: 20000, rejected: 12000, voided: 0 },
    milestones: [
      { name: "Project Charter Signed", date: "2025-11-02", status: "done" },
      { name: "Engineering Release", date: "2025-12-18", status: "done" },
      { name: "Shop Floor Start", date: "2026-01-22", status: "done" },
      { name: "Field Install Kickoff", date: "2026-03-10", status: "active" },
      { name: "Substantial Completion", date: "2026-06-14", status: "upcoming" },
    ],
    archived: false,
  },
  {
    id: "24071-FS10.R",
    jobNumber: "24071",
    jobName: "RS Gass State Lab",
    pm: { name: "Cole Norona", email: "cnorona@jwmcd.com", phone: "931.591.9340" },
    health: { status: "green", label: "On Track" },
    budgetHealth: { status: "green", percentSpent: 38 },
    percentComplete: 40,
    taskStatus: [
      { status: "Not Started", count: 22 },
      { status: "In Progress", count: 28 },
      { status: "Complete", count: 32 },
    ],
    budget: {
      contract: 1225000,
      current: 1225000,
      totalCost: 465500,
      projectedSpend: 1180000,
      committed: 812100,
      remaining: 44900,
    },
    margin: { initial: 26, current: 25, budgetAtCompletion: 23 },
    marginIncrease: { changeOrdersPct: 0.8, direction: "increase" },
    fieldInstall: STD_FIELD_INSTALL.map((r, i) => ({ ...r, complete: i < 6 })),
    billings: {
      billed: 490000,
      received: 380000,
      recognisedRevenue: 465500,
      retainage: 24500,
      billPlusAC: 490000,
      actual: 465500,
    },
    changeOrders: { submitted: 18500, approved: 9500, rejected: 0, voided: 0 },
    milestones: [
      { name: "Project Charter Signed", date: "2025-10-15", status: "done" },
      { name: "Engineering Release", date: "2025-12-04", status: "done" },
      { name: "Shop Floor Start", date: "2026-02-10", status: "active" },
      { name: "Field Install Kickoff", date: "2026-05-01", status: "upcoming" },
      { name: "Substantial Completion", date: "2026-09-20", status: "upcoming" },
    ],
    archived: false,
  },
  // ---- Archived demo rows (JWM1451-123) ----
  // Mirrors the `Archive Project` column in PMO Summary Rollup.xlsx. These are hidden from the
  // default /arch/projects view; the "Show archived" toggle surfaces them.
  {
    id: "23028-CHURCH",
    jobNumber: "23028",
    jobName: "1000 Church YMCA",
    pm: { name: "Dillon Bowman", email: "dbowman@jwmcd.com" },
    health: { status: "green", label: "Closed" },
    budgetHealth: { status: "green", percentSpent: 96 },
    percentComplete: 98,
    taskStatus: [
      { status: "Not Started", count: 0 },
      { status: "In Progress", count: 2 },
      { status: "Complete", count: 104 },
    ],
    budget: {
      contract: 184830,
      current: 146475,
      totalCost: 139897,
      projectedSpend: 139897,
      committed: 0,
      remaining: 6578,
    },
    margin: { initial: 37, current: 27, budgetAtCompletion: 27 },
    marginIncrease: { changeOrdersPct: 0, direction: "decrease" },
    fieldInstall: STD_FIELD_INSTALL.map((r) => ({ ...r, complete: true })),
    billings: {
      billed: 197337,
      received: 191927,
      recognisedRevenue: 197337,
      retainage: 0,
      billPlusAC: 197337,
      actual: 139897,
    },
    changeOrders: { submitted: 11775, approved: 11775, rejected: 0, voided: 0 },
    milestones: [
      { name: "Project Charter Signed", date: "2023-07-27", status: "done" },
      { name: "Substantial Completion", date: "2026-05-29", status: "done" },
      { name: "Archived", date: "2026-06-10", status: "done" },
    ],
    archived: true,
  },
  {
    id: "22015-LEGACY",
    jobNumber: "22015",
    jobName: "Legacy VA-12 Build-Out",
    pm: { name: "Matt Rasmussen", email: "mrasmussen@jwmcd.com" },
    health: { status: "green", label: "Closed" },
    budgetHealth: { status: "green", percentSpent: 99 },
    percentComplete: 100,
    taskStatus: [
      { status: "Not Started", count: 0 },
      { status: "In Progress", count: 0 },
      { status: "Complete", count: 72 },
    ],
    budget: {
      contract: 412000,
      current: 412000,
      totalCost: 408100,
      projectedSpend: 408100,
      committed: 0,
      remaining: 3900,
    },
    margin: { initial: 18, current: 17, budgetAtCompletion: 17 },
    marginIncrease: { changeOrdersPct: 0, direction: "decrease" },
    fieldInstall: STD_FIELD_INSTALL.map((r) => ({ ...r, complete: true })),
    billings: {
      billed: 412000,
      received: 412000,
      recognisedRevenue: 412000,
      retainage: 0,
      billPlusAC: 412000,
      actual: 408100,
    },
    changeOrders: { submitted: 0, approved: 0, rejected: 0, voided: 0 },
    milestones: [
      { name: "Substantial Completion", date: "2024-11-10", status: "done" },
      { name: "Archived", date: "2025-02-01", status: "done" },
    ],
    archived: true,
  },
];

export function listProjects(): ActiveProject[] {
  return PROJECTS;
}

export function getProject(id: string): ActiveProject | undefined {
  return PROJECTS.find((p) => p.id === id);
}
