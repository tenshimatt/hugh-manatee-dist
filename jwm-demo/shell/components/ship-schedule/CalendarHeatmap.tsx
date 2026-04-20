"use client";

/**
 * CalendarHeatmap — next N weeks; each cell colored by bottleneck bucket.
 * Click a cell to open a side panel with the day's jobs.
 */
import type { ShipScheduleGroup } from "@/lib/erpnext-live";

interface Props {
  groups: ShipScheduleGroup[];
  weeks?: number;
  onSelect: (date: string) => void;
  selected?: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function bucketStyles(bucket: "high" | "medium" | "normal" | "empty"): string {
  switch (bucket) {
    case "high":   return "bg-[#dc2626] text-white border-red-700";
    case "medium": return "bg-[#f59e0b] text-white border-amber-600";
    case "normal": return "bg-[#94a3b8] text-white border-slate-400";
    default:       return "bg-[#f1f5f9] text-slate-400 border-slate-200";
  }
}

export function CalendarHeatmap({ groups, weeks = 10, onSelect, selected }: Props) {
  // Build a map of date -> group
  const byDate = new Map<string, ShipScheduleGroup>();
  for (const g of groups) byDate.set(g.date, g);

  // Start from the Monday of this week
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay(); // 0 Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const start = new Date(today.getTime() + mondayOffset * DAY_MS);

  const demoDay = "2026-04-20";
  const todayKey = isoDate(today);

  const rows: Array<{ weekStart: Date; days: Date[] }> = [];
  for (let w = 0; w < weeks; w++) {
    const weekStart = new Date(start.getTime() + w * 7 * DAY_MS);
    const days: Date[] = [];
    for (let d = 0; d < 7; d++) days.push(new Date(weekStart.getTime() + d * DAY_MS));
    rows.push({ weekStart, days });
  }

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-sm" aria-label="Ship schedule heatmap">
        <thead>
          <tr>
            <th className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-left pr-3 pb-2">
              Week
            </th>
            {dayLabels.map((d) => (
              <th
                key={d}
                className={`px-1.5 pb-2 text-xs font-semibold uppercase tracking-wide text-center ${
                  d === "Sat" || d === "Sun" ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="pr-3 py-1 text-xs font-mono text-slate-500 whitespace-nowrap">
                {r.weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </td>
              {r.days.map((d, j) => {
                const key = isoDate(d);
                const g = byDate.get(key);
                const isWeekend = j >= 5;
                const bucket = g?.bucket ?? "empty";
                const outline =
                  key === demoDay
                    ? "ring-2 ring-[#e69b40] ring-offset-1"
                    : key === todayKey
                      ? "ring-2 ring-sky-500 ring-offset-1"
                      : "";
                const count = g?.jobs.length ?? 0;
                const topJobs = g?.jobs.slice(0, 3).map((j) => j.jobName).join(", ") || "No shipments";
                const isSelected = selected === key;
                return (
                  <td key={j} className="p-1">
                    <button
                      type="button"
                      onClick={() => g && onSelect(key)}
                      disabled={!g}
                      title={`${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} — ${count} job${count === 1 ? "" : "s"}\n${topJobs}`}
                      className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-md border text-sm font-bold transition ${bucketStyles(
                        bucket
                      )} ${isWeekend ? "opacity-50" : ""} ${outline} ${
                        g ? "hover:scale-110 cursor-pointer" : "cursor-default"
                      } ${isSelected ? "scale-110 ring-2 ring-[#064162]" : ""}`}
                      aria-label={`${key}: ${count} jobs`}
                    >
                      <span className="text-[10px] leading-none opacity-75">{d.getDate()}</span>
                      {g && <span className="text-sm leading-none mt-0.5">{count}</span>}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#dc2626] inline-block" /> High (5+)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#f59e0b] inline-block" /> Medium (3-4)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#94a3b8] inline-block" /> Normal (1-2)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#f1f5f9] border border-slate-200 inline-block" /> None
        </div>
      </div>
    </div>
  );
}
