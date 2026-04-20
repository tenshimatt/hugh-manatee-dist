/**
 * AssignmentDrawer — right-side slide-in panel for an engineer's week.
 *
 * Two open modes:
 *   - mode="engineer" : show the engineer's next-10-weekday workload
 *   - mode="cell"     : show a single (engineer × day) cell's assignments
 */
"use client";

import { X, Trash2, Calendar as CalIcon } from "lucide-react";
import type { Engineer, EngineeringAssignment } from "@/lib/engineering-schedule";
import { avatarHslFor, initialsOf, nextWeekdays, utilBucket } from "@/lib/engineering-schedule";
import type { Card as JobCardData } from "@/lib/engineering-pipeline";

export interface DrawerState {
  mode: "engineer" | "cell";
  engineer: Engineer;
  date?: string; // required when mode === "cell"
}

export function AssignmentDrawer({
  state,
  assignments,
  cards,
  onClose,
  onRemove,
}: {
  state: DrawerState | null;
  assignments: EngineeringAssignment[];
  cards: JobCardData[];
  onClose: () => void;
  onRemove: (id: string) => void;
}) {
  if (!state) return null;

  const { engineer, mode, date } = state;
  const cardById = new Map(cards.map((c) => [c.id, c]));
  const engineerAssignments = assignments.filter((a) => a.engineer_id === engineer.id);

  const days = mode === "cell" && date ? [date] : nextWeekdays(10);
  const weeklyHours = engineerAssignments
    .filter((a) => nextWeekdays(5).includes(a.date))
    .reduce((s, a) => s + a.hours, 0);
  const util = Math.round((weeklyHours / engineer.capacityHrsPerWeek) * 100);
  const bucket = utilBucket(util);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 flex justify-end"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${engineer.displayName} assignments`}
    >
      <aside
        className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="p-5 border-b border-slate-200 flex items-start gap-3">
          <span
            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm ring-2 ring-white shadow-sm"
            style={{ background: avatarHslFor(engineer.displayName) }}
            aria-hidden
          >
            {initialsOf(engineer.displayName)}
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-[#064162] leading-tight">
              {engineer.displayName}
            </h2>
            <p className="text-xs text-slate-500 truncate">{engineer.designation}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
              {engineer.discipline}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* This-week capacity */}
        {mode === "engineer" && (
          <div className={`p-4 border-b border-slate-200 ${bucket.bg}`}>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className={bucket.text}>This week</span>
              <span className="tabular-nums text-slate-700">
                {weeklyHours}h / {engineer.capacityHrsPerWeek}h · {util}%
              </span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-white/60 overflow-hidden">
              <div
                className={`h-full ${bucket.bar} transition-all`}
                style={{ width: `${Math.min(100, util)}%` }}
              />
            </div>
          </div>
        )}

        {/* Days list */}
        <div className="flex-1 p-4 space-y-4">
          {days.map((d) => {
            const dayItems = engineerAssignments.filter((a) => a.date === d);
            const dayHours = dayItems.reduce((s, a) => s + a.hours, 0);
            return (
              <section key={d}>
                <header className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1.5">
                    <CalIcon className="w-3.5 h-3.5" />
                    {formatDateLabel(d)}
                  </span>
                  <span className="tabular-nums">{dayHours}h</span>
                </header>
                <div className="mt-2 space-y-1.5">
                  {dayItems.length === 0 ? (
                    <div className="text-[11px] italic text-slate-400 py-2">
                      No assignments
                    </div>
                  ) : (
                    dayItems.map((a) => {
                      const card = cardById.get(a.card_id);
                      return (
                        <div
                          key={a.id}
                          className="rounded-lg border border-slate-200 bg-white p-2 flex items-start justify-between gap-2 group"
                        >
                          <div className="min-w-0">
                            <div className="font-mono text-[11px] font-bold text-[#064162]">
                              {a.card_id}
                            </div>
                            <div className="text-xs text-slate-700 leading-snug line-clamp-2">
                              {card?.jobName || "(card not found)"}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold uppercase tracking-wider">
                                {a.stage}
                              </span>
                              <span className="tabular-nums">{a.hours}h</span>
                            </div>
                          </div>
                          <button
                            onClick={() => onRemove(a.id)}
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                            aria-label="Remove"
                            title="Remove assignment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
