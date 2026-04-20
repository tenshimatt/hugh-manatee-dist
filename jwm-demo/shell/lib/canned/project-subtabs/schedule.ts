// Canned Project Schedule — schema mirrors A-Shop/Project Schedule.xlsx.
// Columns: Health · % Complete · Task Name · Task ID · Panel/Piece Count ·
// System · Responsible Person · Duration · Start · Finish · Predecessors · Comments · Status · Indent.

export type TaskStatus = "Not Started" | "In Progress" | "Complete" | "Blocked";
export type TaskHealth = "Green" | "Yellow" | "Red" | "Gray";

export type ScheduleTask = {
  taskId: string;
  indent: number; // 1 = phase, 2 = group, 3 = task
  name: string;
  system?: string;
  responsible?: string;
  duration: string;
  startDate: string;
  finishDate: string;
  predecessors?: string;
  status: TaskStatus;
  percentComplete: number;
  health: TaskHealth;
};

export type ScheduleData = {
  tasks: ScheduleTask[];
  summary: {
    percentComplete: number;
    overallHealth: TaskHealth;
    notStarted: number;
    inProgress: number;
    complete: number;
    startDate: string;
    finishDate: string;
  };
};

export function cannedSchedule(jobNumber: string): ScheduleData {
  const salt = hashToUnit(jobNumber);

  type Seed = [
    id: string,
    indent: number,
    name: string,
    durDays: number,
    startOffsetDays: number,
    predecessors?: string,
  ];
  const seeds: Seed[] = [
    ["1",   1, "Project Schedule",                                   265,   0],
    ["2",   2, "PM Front Loading / Admin",                            94,  12],
    ["3",   3, "Receive NTP / Contract go-ahead",                      2,  12],
    ["4",   3, "Estimating Turnover",                                  1,  14, "3"],
    ["5",   3, "Review Project Scope",                                 5,  15, "4"],
    ["6",   3, "Prepare Project Schedule",                            10,  15, "4"],
    ["7",   3, "Prepare Phase Code & Time/Cost Plan",                 10,  15, "4"],
    ["8",   3, "Prepare SOV",                                         10,  15, "4"],
    ["9",   3, "Prepare Equipment / Construction Plan",               10,  15, "4"],
    ["10",  3, "Enter Project into ERPNext & Schedule System",         1,  22, "6"],
    ["20",  2, "Submittals",                                           65,  30],
    ["21",  3, "Engineering Shop Drawings",                            23,  30, "20"],
    ["22",  3, "Prepare Submittal Pack",                               23,  30, "21"],
    ["23",  3, "Submit Submittal Pack",                                 1,  54, "22"],
    ["24",  3, "Receive Reviewed Submittal Pack",                     10,  55, "23"],
    ["25",  3, "Resubmit Submittal Pack",                              10,  68, "24"],
    ["26",  3, "Approved Final Submittals",                             1,  80, "25"],
    ["40",  2, "Procurement",                                           45,  82],
    ["41",  3, "Prepare Buy Lists",                                      5,  82, "26"],
    ["42",  3, "Issue POs — Composite Metals",                           3,  88, "41"],
    ["43",  3, "Issue POs — IMP + Louvers",                              3,  88, "41"],
    ["44",  3, "Material Receiving & QC",                              14, 110],
    ["60",  2, "Shop Fabrication",                                      95, 120],
    ["61",  3, "CNC Cut & Break",                                      30, 120, "44"],
    ["62",  3, "Assembly",                                              60, 135, "61"],
    ["63",  3, "QA/QC & Crating",                                      25, 180, "62"],
    ["80",  2, "Field Installation",                                   100, 200],
    ["81",  3, "Z-Furring / Substrate",                                 25, 200, "63"],
    ["82",  3, "ACM Installation",                                     50, 220, "81"],
    ["83",  3, "IMP + Louver Install",                                 50, 230, "81"],
    ["84",  3, "Punchlist & Close-out",                                 15, 260, "83"],
  ];

  const base = new Date(2026, 7, 20); // Aug 20 2026
  const tasks: ScheduleTask[] = seeds.map(([id, indent, name, dur, startOff, preds]) => {
    const start = new Date(base);
    start.setDate(start.getDate() + startOff);
    const finish = new Date(start);
    finish.setDate(finish.getDate() + dur);

    // Rough status progression — earlier offsets -> more complete.
    const pct =
      startOff < 30 ? 60 + Math.round(salt * 30)
      : startOff < 70 ? 30 + Math.round(salt * 30)
      : startOff < 120 ? 10 + Math.round(salt * 20)
      : 0;
    const status: TaskStatus =
      pct >= 100 ? "Complete" : pct > 0 ? "In Progress" : "Not Started";
    const health: TaskHealth =
      indent === 1 ? "Green" : pct === 0 ? "Gray" : pct > 50 ? "Green" : "Yellow";

    return {
      taskId: id,
      indent,
      name,
      duration: `${dur}d`,
      startDate: fmt(start),
      finishDate: fmt(finish),
      predecessors: preds,
      status,
      percentComplete: Math.min(100, pct),
      health,
    };
  });

  const leaf = tasks.filter((t) => t.indent >= 3);
  const notStarted = leaf.filter((t) => t.status === "Not Started").length;
  const inProgress = leaf.filter((t) => t.status === "In Progress").length;
  const complete   = leaf.filter((t) => t.status === "Complete").length;
  const pct = Math.round(
    leaf.reduce((a, t) => a + t.percentComplete, 0) / Math.max(1, leaf.length),
  );
  return {
    tasks,
    summary: {
      percentComplete: pct,
      overallHealth: pct > 60 ? "Green" : pct > 25 ? "Yellow" : "Gray",
      notStarted,
      inProgress,
      complete,
      startDate: tasks[0]?.startDate ?? "",
      finishDate: tasks[tasks.length - 1]?.finishDate ?? "",
    },
  };
}

function fmt(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function hashToUnit(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (((h >>> 0) % 1000) / 1000) * 0.9 + 0.05;
}
