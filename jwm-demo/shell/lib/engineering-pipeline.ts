import raw from "./canned/production-schedule.json";

export type StageKey =
  | "uncategorized"
  | "evaluating"
  | "float"
  | "layout"
  | "layout_check"
  | "sketch"
  | "sketch_check"
  | "correction"
  | "cnc_prog"
  | "laser_prog"
  | "punch_prog"
  | "prog_complete"
  | "release_shop";

export const STAGES: { key: StageKey; label: string; accent?: string }[] = [
  { key: "uncategorized", label: "Uncategorized" },
  { key: "evaluating", label: "Evaluating" },
  { key: "float", label: "Float" },
  { key: "layout", label: "Layout" },
  { key: "layout_check", label: "Layout Check" },
  { key: "sketch", label: "Sketch" },
  { key: "sketch_check", label: "Sketch Check" },
  { key: "correction", label: "Correction" },
  { key: "cnc_prog", label: "CNC Programming" },
  { key: "laser_prog", label: "Laser Programming" },
  { key: "punch_prog", label: "Punch Programming" },
  { key: "prog_complete", label: "Program Complete" },
  { key: "release_shop", label: "Release to Shop", accent: "gold" },
];

export type Priority = "high" | "med" | "low" | "info";
export const PRIORITY_BAR: Record<Priority, string> = {
  high: "#dc2626",
  med: "#f59e0b",
  low: "#10b981",
  info: "#3b82f6",
};
export const PRIORITY_LABEL: Record<Priority, string> = {
  high: "High",
  med: "Medium",
  low: "Low",
  info: "Info",
};

export type Card = {
  id: string;
  jobName: string;
  pm: string;
  stage: StageKey;
  priority: Priority;
  rankedPriority: number | null;
  division: "A" | "T";
  department: string;
  assignees: string[];
  materialType: string;
  releaseType: string;
  description: string;
  miscMaterials: string;
  address: string;
  productionFolder: string;
  shipTarget: string | null;
  releaseToShopTarget: string | null;
  releasedToShopActual: string | null;
  station: string;
  draftingHours: number | string | null;
  shopHours: number | string | null;
  requiredProcesses: string;
  latestComment: string;
  engManager: string;
  drafter: string;
  checker: string;
  weekToShip: string;
};

export const CARDS: Card[] = raw as unknown as Card[];

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h} 55% 45%)`;
}

export function fmtDate(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
