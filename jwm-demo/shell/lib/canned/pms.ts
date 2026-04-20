// PM seed data for PMO "My Projects" dashboard.
// Sourced from Production Schedule_new.xlsx grouped by PM column.
// Names normalized, slugs kebab-case.

export type PMProject = {
  id: string;          // short job id e.g. 24060-BM01
  jobNumber: string;   // e.g. 24060
  jobName: string;     // e.g. "Loves Blacksburg"
  progress: number;    // 0..100
  vs: "ahead" | "ontrack" | "behind";
  start: string;       // ISO
  end: string;         // ISO
  ship: string;        // ISO
  links: { label: string; href: string }[];
};

export type UpcomingTask = {
  due: string;
  task: string;
  project: string;
  status: "Not Started" | "In Progress" | "Blocked" | "Review";
};

export type PM = {
  slug: string;
  name: string;
  email: string;
  phone?: string;
  title: string;
  projects: PMProject[];
  tasks: UpcomingTask[];
  budget: {
    total: number;
    spent: number;
    committed: number;
    remaining: number;
  };
};

const link = (id: string) => [
  { label: "Project", href: `/arch/projects/${id}` },
  { label: "Budget", href: `/arch/projects/${id}#budget` },
  { label: "Schedule", href: `/arch/projects/${id}#schedule` },
];

function mkProject(
  id: string,
  jobName: string,
  progress: number,
  vs: PMProject["vs"],
  start: string,
  end: string,
  ship: string,
): PMProject {
  return {
    id,
    jobNumber: id.split("-")[0],
    jobName,
    progress,
    vs,
    start,
    end,
    ship,
    links: link(id),
  };
}

const PMS: PM[] = [
  {
    slug: "cole-norona",
    name: "Cole Norona",
    email: "cnorona@jwmcd.com",
    phone: "931.591.9340",
    title: "Senior Project Manager — Architectural",
    projects: [
      mkProject("24060-BM01", "Loves Blacksburg", 60, "behind", "2025-11-02", "2026-06-14", "2026-05-20"),
      mkProject("24071-FS10.R", "RS Gass State Lab", 40, "ontrack", "2025-10-15", "2026-09-20", "2026-08-14"),
      mkProject("24081-FS01", "DLR DFW37", 78, "ahead", "2025-08-12", "2026-05-05", "2026-04-22"),
      mkProject("24081-FS02", "DLR DFW37", 72, "ontrack", "2025-08-12", "2026-05-12", "2026-04-29"),
      mkProject("24081-FS03", "DLR DFW37", 55, "ontrack", "2025-09-04", "2026-05-28", "2026-05-15"),
      mkProject("25028-FL02", "TN Soybean Council", 18, "ontrack", "2026-03-01", "2026-11-30", "2026-11-10"),
    ],
    tasks: [
      { due: "2026-04-21", task: "Submit change order #3", project: "24060-BM01", status: "In Progress" },
      { due: "2026-04-22", task: "Review DLR DFW37 panel release", project: "24081-FS01", status: "Review" },
      { due: "2026-04-24", task: "Client walk-through", project: "24071-FS10.R", status: "Not Started" },
      { due: "2026-04-28", task: "Approve procurement PO #4821", project: "25028-FL02", status: "Not Started" },
      { due: "2026-04-30", task: "Phase gate review", project: "24081-FS02", status: "Not Started" },
    ],
    budget: { total: 6240000, spent: 2480000, committed: 2760000, remaining: 1000000 },
  },
  {
    slug: "marc-ribar",
    name: "Marc Ribar",
    email: "mribar@jwmcd.com",
    title: "Project Manager — Architectural",
    projects: [
      mkProject("24051-FS200", "TN Titans Stadium", 45, "behind", "2025-06-01", "2026-10-31", "2026-09-20"),
      mkProject("24051-FS201", "TN Titans Stadium", 52, "ontrack", "2025-06-01", "2026-10-31", "2026-09-25"),
      mkProject("24051-FS205", "TN Titans Stadium", 38, "ontrack", "2025-07-10", "2026-11-15", "2026-10-30"),
      mkProject("24051-FS206", "TN Titans Stadium", 35, "behind", "2025-07-10", "2026-11-20", "2026-11-05"),
      mkProject("24051-FS209.1", "TN Titans Stadium", 61, "ahead", "2025-05-20", "2026-09-30", "2026-09-15"),
      mkProject("24051-FS212", "TN Titans Stadium", 48, "ontrack", "2025-08-01", "2026-11-01", "2026-10-18"),
      mkProject("24051-FS46.1", "TN Titans Stadium", 70, "ahead", "2025-04-14", "2026-07-30", "2026-07-12"),
      mkProject("24051-FS46C", "TN Titans Stadium", 65, "ontrack", "2025-04-14", "2026-08-05", "2026-07-22"),
    ],
    tasks: [
      { due: "2026-04-21", task: "Stadium daily report", project: "24051-FS200", status: "In Progress" },
      { due: "2026-04-23", task: "Field install coordination", project: "24051-FS46.1", status: "In Progress" },
      { due: "2026-04-25", task: "Submittal package turnover", project: "24051-FS205", status: "Not Started" },
      { due: "2026-04-27", task: "Scaffolding schedule sync", project: "24051-FS201", status: "Blocked" },
    ],
    budget: { total: 14200000, spent: 7100000, committed: 4800000, remaining: 2300000 },
  },
  {
    slug: "dillon-bowman",
    name: "Dillon Bowman",
    email: "dbowman@jwmcd.com",
    title: "Project Manager — Architectural",
    projects: [
      mkProject("25016-BM201", "Rockdale CJAC", 25, "ontrack", "2026-02-12", "2027-02-28", "2027-02-10"),
      mkProject("25016-FL200", "Rockdale CJAC", 22, "ontrack", "2026-02-12", "2027-03-15", "2027-02-25"),
      mkProject("25016-MU101", "Rockdale CJAC", 30, "ahead", "2026-01-20", "2027-01-10", "2026-12-20"),
      mkProject("25016-MU103", "Rockdale CJAC", 28, "ontrack", "2026-01-20", "2027-01-25", "2027-01-05"),
      mkProject("25016-MU121", "Rockdale CJAC", 20, "behind", "2026-03-01", "2027-04-01", "2027-03-12"),
      mkProject("25017-FL99", "Nashville Yards Park", 58, "ontrack", "2025-09-18", "2026-08-28", "2026-08-10"),
    ],
    tasks: [
      { due: "2026-04-22", task: "Rockdale CJAC phase 1 close-out", project: "25016-MU101", status: "In Progress" },
      { due: "2026-04-24", task: "Yards Park punchlist review", project: "25017-FL99", status: "Review" },
      { due: "2026-04-29", task: "Submittal revise+resubmit", project: "25016-BM201", status: "Not Started" },
    ],
    budget: { total: 8650000, spent: 1950000, committed: 3900000, remaining: 2800000 },
  },
  {
    slug: "matt-rasmussen",
    name: "Matt Rasmussen",
    email: "mrasmussen@jwmcd.com",
    title: "Senior Project Manager — Architectural",
    projects: [
      mkProject("25071-IAD181", "Amazon IAD181 Fitout", 61, "ontrack", "2026-01-14", "2026-07-31", "2026-07-10"),
      mkProject("25032-FL01", "Amazon IAD181", 48, "ontrack", "2025-12-10", "2026-08-15", "2026-07-28"),
      mkProject("25065-MU01", "Crosswinds Casino Resort", 32, "ahead", "2026-02-20", "2026-12-18", "2026-11-30"),
      mkProject("25065-MU02", "Crosswinds Casino Resort", 30, "ontrack", "2026-02-20", "2026-12-20", "2026-12-05"),
      mkProject("25065-MU03", "Crosswinds Casino Resort", 28, "ontrack", "2026-02-20", "2026-12-27", "2026-12-10"),
      mkProject("25065-MU04", "Crosswinds Casino Resort", 26, "behind", "2026-03-01", "2027-01-08", "2026-12-20"),
      mkProject("25065-MU05", "Crosswinds Casino Resort", 22, "ontrack", "2026-03-05", "2027-01-15", "2026-12-28"),
      mkProject("25065-MU11", "Crosswinds Casino Resort", 18, "ontrack", "2026-03-12", "2027-02-02", "2027-01-12"),
    ],
    tasks: [
      { due: "2026-04-21", task: "IAD181 field install kickoff prep", project: "25071-IAD181", status: "In Progress" },
      { due: "2026-04-22", task: "Crosswinds submittal batch", project: "25065-MU01", status: "Review" },
      { due: "2026-04-24", task: "3D request sign-off", project: "25032-FL01", status: "In Progress" },
      { due: "2026-04-28", task: "Panel release approval", project: "25065-MU03", status: "Not Started" },
      { due: "2026-04-30", task: "Client status update (Amazon)", project: "25071-IAD181", status: "Not Started" },
      { due: "2026-05-02", task: "Crating plan review", project: "25065-MU04", status: "Blocked" },
    ],
    budget: { total: 12400000, spent: 5100000, committed: 4200000, remaining: 3100000 },
  },
];

export function listPMs(): PM[] {
  return PMS;
}

export function getPM(slug: string): PM | undefined {
  return PMS.find((p) => p.slug === slug);
}

export const QUICK_LINKS: { label: string; href: string }[] = [
  { label: "Panel Dashboard", href: "/arch/panel-dashboard" },
  { label: "Executive Portfolio Dashboard", href: "/exec/arch" },
  { label: "Production Schedule", href: "/engineering/pipeline" },
  { label: "Engineering Production Schedule", href: "/engineering/pipeline" },
  { label: "3D Production Schedule", href: "/arch/3d-schedule" },
  { label: "Scanner Calendar", href: "/arch/scanner-calendar" },
  { label: "Electives", href: "/arch/electives" },
  { label: "Restore Material", href: "/arch/restore-material" },
  { label: "Architectural Division Contract List", href: "/exec/arch/contracts" },
  { label: "Total Backlog", href: "/exec/arch#backlog" },
  { label: "Procurement Log", href: "/arch/procurement-log" },
];
