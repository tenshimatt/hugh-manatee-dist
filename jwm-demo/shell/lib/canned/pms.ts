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

// Helpers for xlsx-sourced PMs: pct 0..1 -> 0..100, coarse vs-status from budget/health signals.
function pct(n: number | null | undefined): number {
  if (!n && n !== 0) return 0;
  return Math.max(0, Math.min(100, Math.round(n * 100)));
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
  // ---- PMs sourced from PMO Summary Rollup.xlsx (2026-04-20) ----
  {
    slug: "joe-hoyle",
    name: "Joe Hoyle",
    email: "jhoyle@jwmcd.com",
    title: "Project Manager — Architectural",
    projects: [
      mkProject("24005-VA12", "GCDC Building 2 / VA1.2", pct(0.99), "ontrack", "2024-02-01", "2026-03-16", "2026-03-02"),
      mkProject("24018-NAL1DC1", "QTS NAL1 DC1", pct(0.95), "behind", "2024-02-21", "2026-02-13", "2026-02-01"),
      mkProject("24048-NAL2DC1", "QTS NAL2 DC1", pct(0.89), "ontrack", "2024-06-26", "2026-04-03", "2026-03-20"),
      mkProject("24065-NAL2DC2", "QTS NAL2 DC2", pct(0.86), "behind", "2024-07-19", "2026-05-08", "2026-04-24"),
      mkProject("24068-NAL1DC2", "QTS NAL1 DC2", pct(0.87), "ontrack", "2024-09-10", "2026-04-10", "2026-03-28"),
      mkProject("24072-LCK064", "LCK064", pct(0.81), "behind", "2024-10-01", "2026-05-04", "2026-04-20"),
      mkProject("24079-NYC01", "Nashville Youth Campus", pct(0.72), "behind", "2024-12-19", "2026-12-01", "2026-11-10"),
      mkProject("26001-EDITION", "Edition Hotel", pct(0.26), "ontrack", "2026-01-19", "2028-02-21", "2028-02-01"),
    ],
    tasks: [
      { due: "2026-04-21", task: "Close-out GCDC VA1.2 punchlist", project: "24005-VA12", status: "In Progress" },
      { due: "2026-04-23", task: "Budget recovery plan — LCK064", project: "24072-LCK064", status: "Not Started" },
      { due: "2026-04-28", task: "Nashville Youth Campus phase 2 review", project: "24079-NYC01", status: "Review" },
    ],
    budget: { total: 21680994, spent: 13700034, committed: 2499320, remaining: 5481640 },
  },
  {
    slug: "laura-forero",
    name: "Laura Forero",
    email: "lforero@jwmcd.com",
    title: "Project Manager — Architectural",
    projects: [
      mkProject("24012-VUMC3", "VUMC MCE 3rd Floor", pct(1.0), "ahead", "2024-02-14", "2026-02-06", "2026-01-24"),
      mkProject("24031-AJ3", "AJ Capital 3", pct(1.0), "ontrack", "2024-04-16", "2026-01-15", "2026-01-03"),
      mkProject("24038-CCGMC", "Courtesy Chevrolet GMC", pct(0.26), "behind", "2024-06-03", "2026-02-18", "2026-02-06"),
      mkProject("24075-DEMON", "Demonbreun Hill", pct(0.54), "ontrack", "2024-10-11", "2027-11-11", "2027-10-20"),
      mkProject("25008-CSTC", "Columbia State Tech Center", pct(0.93), "behind", "2025-01-17", "2026-06-22", "2026-06-10"),
      mkProject("25030-TREMONT", "510 W Tremont", pct(0.67), "ontrack", "2025-06-23", "2026-06-23", "2026-06-10"),
      mkProject("25031-LLUMARS", "LLU Mars US Warehouse", pct(0.83), "behind", "2025-04-07", "2026-08-18", "2026-08-04"),
      mkProject("25037-CHESTOFF", "Chestnut Street Office", pct(0.88), "ontrack", "2025-05-20", "2026-07-24", "2026-07-10"),
      mkProject("25038-CHESTVEN", "Chestnut Street Venue", pct(0.74), "behind", "2025-05-20", "2026-06-17", "2026-06-05"),
      mkProject("25040-MOSES", "Moses Lincoln Vitrine", pct(0.97), "ahead", "2025-06-02", "2026-02-13", "2026-01-30"),
      mkProject("25058-BRENTS", "Brentsville HS Turf Facility", pct(0.52), "ontrack", "2025-09-30", "2027-07-21", "2027-07-01"),
      mkProject("25076-TSB", "TSB Building", pct(0.44), "ontrack", "2026-01-26", "2026-10-12", "2026-09-28"),
      mkProject("26002-WOC", "World Outreach Church", pct(0.44), "ontrack", "2026-01-26", "2026-12-17", "2026-12-03"),
      mkProject("26017-LAFAYETTE", "601 Lafayette Tower", pct(0.0), "ontrack", "2026-08-20", "2027-05-14", "2027-04-24"),
    ],
    tasks: [
      { due: "2026-04-21", task: "Mars warehouse ship plan", project: "25031-LLUMARS", status: "In Progress" },
      { due: "2026-04-23", task: "TSB panel release", project: "25076-TSB", status: "Review" },
      { due: "2026-04-25", task: "Brentsville submittals", project: "25058-BRENTS", status: "Not Started" },
      { due: "2026-04-29", task: "Chestnut Venue phase close", project: "25038-CHESTVEN", status: "Blocked" },
    ],
    budget: { total: 4067463, spent: 727284, committed: 602723, remaining: 2737456 },
  },
  {
    slug: "chris-buttrey",
    name: "Chris Buttrey",
    email: "cbuttrey@jwmcd.com",
    title: "Senior Project Manager — Architectural",
    projects: [
      mkProject("24026-1740DIV", "1740 Division", pct(0.91), "ontrack", "2024-04-12", "2026-05-06", "2026-04-22"),
      mkProject("24030-VANTAGE21", "Vantage TX-21", pct(0.91), "behind", "2024-04-26", "2026-06-26", "2026-06-12"),
      mkProject("24045-TMMMS", "TMMMS Childcare", pct(1.0), "ahead", "2024-07-05", "2025-11-28", "2025-11-14"),
      mkProject("24069-TCATPU", "TCAT Pulaski", pct(0.96), "behind", "2024-09-11", "2026-06-04", "2026-05-20"),
      mkProject("24077-IAD667", "IAD 667 TI", pct(0.8), "behind", "2024-10-24", "2026-05-04", "2026-04-20"),
      mkProject("24078-IAD668", "IAD 668 TI", pct(0.7), "ontrack", "2024-10-24", "2026-06-29", "2026-06-15"),
      mkProject("25004-IAD500", "IAD 500 TI", pct(0.71), "ontrack", "2025-01-06", "2026-09-08", "2026-08-25"),
      mkProject("25033-CONVERGE", "Converge Office Building", pct(0.5), "behind", "2026-01-21", "2026-09-24", "2026-09-10"),
      mkProject("25075-STTHW", "St Thomas West Canopy Replace", pct(0.7), "behind", "2025-12-22", "2027-03-26", "2027-03-10"),
      mkProject("26006-AWS196", "AWS IAD 196 197 198", pct(0.0), "ontrack", "2026-08-20", "2027-05-14", "2027-04-24"),
    ],
    tasks: [
      { due: "2026-04-22", task: "Vantage TX-21 budget recovery", project: "24030-VANTAGE21", status: "In Progress" },
      { due: "2026-04-24", task: "AWS IAD 196 kickoff", project: "26006-AWS196", status: "Not Started" },
      { due: "2026-04-28", task: "IAD 667 install close-out", project: "24077-IAD667", status: "Review" },
    ],
    budget: { total: 28315875, spent: 4208564, committed: 5486691, remaining: 18620620 },
  },
  {
    slug: "andre-van-der-merwe",
    name: "Andre Van Der Merwe",
    email: "avandermerwe@jwmcd.com",
    title: "Project Manager — Architectural",
    projects: [
      mkProject("25052-TEMA", "TEMA Warehouse", pct(0.9), "behind", "2025-08-05", "2026-05-21", "2026-05-07"),
      mkProject("25054-ALTRA", "Altra Clarkville", pct(0.58), "ontrack", "2025-08-03", "2026-09-03", "2026-08-20"),
      mkProject("25055-MERCEDES", "Mercedes Body Shop Reno", pct(0.95), "behind", "2025-08-06", "2026-10-12", "2026-09-28"),
      mkProject("25059-ASCDJR", "Allen Samuels CDJR and LC", pct(0.96), "behind", "2025-09-01", "2026-12-15", "2026-12-01"),
      mkProject("25061-BNAA", "BNA Concourse A", pct(0.34), "behind", "2025-10-08", "2027-05-13", "2027-04-25"),
      mkProject("25066-GOODWILL", "Goodwill Opportunity Center", pct(0.56), "ontrack", "2025-10-30", "2026-10-28", "2026-10-14"),
      mkProject("25067-HARISON", "Harison Bend", pct(0.58), "behind", "2025-10-08", "2026-05-19", "2026-05-05"),
      mkProject("25069-HHSP", "Henry Horten State Park Inn", pct(0.72), "ontrack", "2025-12-02", "2026-06-15", "2026-06-01"),
      mkProject("25072-ATL2DC5", "QTS ATL2 DC5", pct(0.43), "ontrack", "2026-01-01", "2027-05-14", "2027-04-24"),
      mkProject("25073-QTSREBRAND", "QTS Rebranding", pct(0.16), "behind", "2026-01-01", "2027-03-26", "2027-03-12"),
    ],
    tasks: [
      { due: "2026-04-21", task: "BNA Concourse A submittal turnover", project: "25061-BNAA", status: "In Progress" },
      { due: "2026-04-24", task: "TEMA final punchlist walk", project: "25052-TEMA", status: "Review" },
      { due: "2026-04-28", task: "QTS ATL2 DC5 panel release", project: "25072-ATL2DC5", status: "Not Started" },
    ],
    budget: { total: 13151916, spent: 951018, committed: 2193697, remaining: 10007201 },
  },
  {
    slug: "carlos-silva",
    name: "Carlos Silva",
    email: "csilva@jwmcd.com",
    title: "Project Manager — Architectural",
    projects: [
      mkProject("24039-VISIONARY", "The Visionary", pct(0.98), "behind", "2024-07-01", "2026-05-07", "2026-04-24"),
      mkProject("25002-MEDCTR", "Med Center Health", pct(0.99), "ahead", "2025-05-23", "2026-10-02", "2026-09-18"),
      mkProject("25042-IAD183", "IAD 183", pct(0.66), "behind", "2025-07-08", "2027-05-20", "2027-05-05"),
      mkProject("25045-DLRIAD59", "DLR IAD59", pct(0.81), "ontrack", "2025-06-09", "2026-08-12", "2026-07-29"),
      mkProject("25056-OPPIDAN", "Oppidan Ashland", pct(0.6), "ontrack", "2026-09-01", "2027-08-09", "2027-07-20"),
      mkProject("25077-ANDREWS", "Andrews Sports Medicine", pct(0.09), "ontrack", "2026-03-03", "2026-11-18", "2026-11-04"),
      mkProject("26023-NSHATL", "NSH Atlanta ED", pct(0.0), "behind", "2026-08-20", "2027-05-14", "2027-04-24"),
    ],
    tasks: [
      { due: "2026-04-22", task: "Visionary final close-out", project: "24039-VISIONARY", status: "Review" },
      { due: "2026-04-25", task: "IAD 183 field coord", project: "25042-IAD183", status: "In Progress" },
      { due: "2026-04-30", task: "Andrews Sports kickoff", project: "25077-ANDREWS", status: "Not Started" },
    ],
    budget: { total: 14338428, spent: 4691685, committed: 2114282, remaining: 7532461 },
  },
  {
    slug: "wylie-mcdougall",
    name: "Wylie McDougall",
    email: "wmcdougall@jwmcd.com",
    title: "Project Manager — Architectural",
    projects: [
      mkProject("24046-UAB", "UAB Biomedical Research & Psych", pct(0.98), "behind", "2024-07-15", "2026-02-16", "2026-02-02"),
      mkProject("25012-STJUDE", "St Jude Hospital", pct(0.4), "behind", "2025-02-01", "2027-01-20", "2027-01-06"),
      mkProject("25041-WEDGE", "Wedgewood Bldg E", pct(0.78), "behind", "2025-06-05", "2026-06-09", "2026-05-26"),
      mkProject("25048-ENFSER", "East Nashville FSER", pct(0.84), "ontrack", "2025-07-02", "2026-04-10", "2026-03-27"),
      mkProject("25070-1401CH", "1401 Church St", pct(0.0), "ontrack", "2026-08-20", "2027-05-14", "2027-04-24"),
      mkProject("26011-2NDAVE", "2nd Ave Mockup Build", pct(0.0), "ontrack", "2026-08-20", "2027-05-14", "2027-04-24"),
    ],
    tasks: [
      { due: "2026-04-22", task: "St Jude phase-gate review", project: "25012-STJUDE", status: "Review" },
      { due: "2026-04-24", task: "UAB close-out walk", project: "24046-UAB", status: "In Progress" },
      { due: "2026-04-29", task: "1401 Church scope confirm", project: "25070-1401CH", status: "Not Started" },
    ],
    budget: { total: 4936750, spent: 3543583, committed: 111023, remaining: 1282144 },
  },
  {
    slug: "colton-van-meter",
    name: "Colton Van Meter",
    email: "cvanmeter@jwmcd.com",
    title: "Project Manager — Architectural",
    projects: [
      mkProject("26010-ASCTE", "ASCTE Research and Dorm", pct(0.34), "ontrack", "2026-03-11", "2026-11-03", "2026-10-20"),
      mkProject("26013-VA41", "Vantage VA41", pct(0.34), "ontrack", "2026-09-01", "2027-09-24", "2027-09-10"),
      mkProject("26018-IAD874", "PH95 Phase 2 IAD 874", pct(0.25), "ontrack", "2026-03-27", "2026-12-17", "2026-12-03"),
      mkProject("26024-ATL2DC6", "QTS ATL2 DC6", pct(0.13), "ontrack", "2026-04-08", "2027-10-08", "2027-09-24"),
      mkProject("26026-ATL2DC7", "QTS ATL2 DC7", pct(0.0), "ontrack", "2026-08-20", "2027-05-14", "2027-04-24"),
    ],
    tasks: [
      { due: "2026-04-22", task: "ASCTE engineering release", project: "26010-ASCTE", status: "In Progress" },
      { due: "2026-04-25", task: "QTS ATL2 DC6 submittal log", project: "26024-ATL2DC6", status: "Not Started" },
    ],
    budget: { total: 12623250, spent: 4472, committed: 147312, remaining: 12471466 },
  },
  {
    slug: "nick-akins",
    name: "Nick Akins",
    email: "nakins@jwmcd.com",
    title: "Project Manager — Architectural",
    projects: [
      mkProject("24076-GCDCSEC", "GCDC Security Building", pct(0.2), "behind", "2021-12-01", "2025-06-24", "2025-06-10"),
      mkProject("25007-ATL2DC10", "QTS ATL2 DC10", pct(0.76), "behind", "2025-03-07", "2026-05-07", "2026-04-23"),
      mkProject("25049-801RETAIL", "801 Retail", pct(0.0), "ontrack", "2026-08-20", "2027-05-14", "2027-04-24"),
    ],
    tasks: [
      { due: "2026-04-22", task: "ATL2 DC10 close-out", project: "25007-ATL2DC10", status: "Review" },
      { due: "2026-04-25", task: "GCDC Security lessons-learned", project: "24076-GCDCSEC", status: "In Progress" },
    ],
    budget: { total: 1498003, spent: 808495, committed: 91959, remaining: 597549 },
  },
  {
    slug: "josh-mcpherson",
    name: "Josh McPherson",
    email: "jmcpherson@jwmcd.com",
    title: "Project Manager — Architectural",
    projects: [
      mkProject("24028-CHIMEM", "CHI Memorial Hospital", pct(1.0), "ahead", "2024-04-23", "2025-09-09", "2025-08-26"),
      mkProject("25036-TCATCHA", "TCAT Chattanooga", pct(0.87), "behind", "2025-06-27", "2026-01-26", "2026-01-12"),
    ],
    tasks: [
      { due: "2026-04-23", task: "TCAT Chattanooga punchlist", project: "25036-TCATCHA", status: "In Progress" },
    ],
    budget: { total: 1636034, spent: 1391670, committed: 25236, remaining: 219128 },
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
