/**
 * CapacityHeatmap — engineers × next-10-weekdays grid.
 *
 * Each cell coloured by planned hours. Hover = tooltip of that cell's jobs.
 * Click a cell → opens the AssignmentDrawer scoped to that day.
 */
"use client";

import type { Engineer, EngineeringAssignment } from "@/lib/engineering-schedule";
import { avatarHslFor, heatCell, initialsOf, nextWeekdays } from "@/lib/engineering-schedule";

export function CapacityHeatmap({
  engineers,
  assignments,
  onCellClick,
  onDropCard,
  dragCardId,
}: {
  engineers: Engineer[];
  assignments: EngineeringAssignment[];
  onCellClick: (engineerId: string, date: string) => void;
  onDropCard?: (engineerId: string, date: string) => void;
  dragCardId?: string | null;
}) {
  const days = nextWeekdays(10);
  const byEngDay = new Map<string, EngineeringAssignment[]>();
  for (const a of assignments) {
    const k = `${a.engineer_id}|${a.date}`;
    const arr = byEngDay.get(k) || [];
    arr.push(a);
    byEngDay.set(k, arr);
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left font-bold text-[#064162] px-3 py-2 sticky left-0 bg-slate-50 z-10">
              Engineer
            </th>
            {days.map((d) => (
              <th
                key={d}
                className="text-center font-bold text-slate-500 px-2 py-2 min-w-[64px]"
              >
                <div className="text-[10px] uppercase tracking-wider">{dayOfWeek(d)}</div>
                <div className="text-[11px] tabular-nums">{shortDate(d)}</div>
              </th>
            ))}
            <th className="text-center font-bold text-slate-500 px-2 py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {engineers.map((e) => {
            const totalHrs = days.reduce((s, d) => {
              const items = byEngDay.get(`${e.id}|${d}`) || [];
              return s + items.reduce((ss, a) => ss + a.hours, 0);
            }, 0);
            return (
              <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                <td className="px-3 py-2 sticky left-0 bg-white z-10 border-r border-slate-100">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                      style={{ background: avatarHslFor(e.displayName) }}
                      aria-hidden
                    >
                      {initialsOf(e.displayName)}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-700 truncate max-w-[140px]">
                        {e.displayName}
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-400">
                        {e.discipline}
                      </div>
                    </div>
                  </div>
                </td>
                {days.map((d) => {
                  const items = byEngDay.get(`${e.id}|${d}`) || [];
                  const hrs = items.reduce((s, a) => s + a.hours, 0);
                  const title = items.length
                    ? items.map((a) => `${a.card_id} · ${a.hours}h · ${a.stage}`).join("\n")
                    : "0h planned";
                  return (
                    <td
                      key={d}
                      className="p-1"
                      onDragOver={(ev) => {
                        if (!dragCardId) return;
                        ev.preventDefault();
                        ev.dataTransfer.dropEffect = "copy";
                      }}
                      onDrop={(ev) => {
                        if (!dragCardId || !onDropCard) return;
                        ev.preventDefault();
                        onDropCard(e.id, d);
                      }}
                    >
                      <button
                        onClick={() => onCellClick(e.id, d)}
                        title={title}
                        className={`w-full h-9 rounded-md text-[11px] font-semibold tabular-nums transition ${heatCell(
                          hrs
                        )} ${hrs > 0 ? "text-slate-800" : "text-slate-300"} hover:ring-2 hover:ring-[#064162]/40`}
                        aria-label={`${e.displayName} ${d} ${hrs} hours`}
                      >
                        {hrs > 0 ? `${hrs}h` : ""}
                      </button>
                    </td>
                  );
                })}
                <td className="px-2 py-2 text-center font-bold text-[#064162] tabular-nums">
                  {totalHrs}h
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex items-center gap-3 px-4 py-2 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-600">
        <span className="font-semibold uppercase tracking-wider">Legend</span>
        <Swatch cls="bg-slate-50" label="0h" />
        <Swatch cls="bg-emerald-100" label="1-4h" />
        <Swatch cls="bg-emerald-300" label="5-7h" />
        <Swatch cls="bg-amber-300" label="8h cap" />
        <Swatch cls="bg-red-400" label=">8h over" />
      </div>
    </div>
  );
}

function Swatch({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-block w-3 h-3 rounded-sm border border-slate-200 ${cls}`} />
      {label}
    </span>
  );
}

function dayOfWeek(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}
function shortDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
}
