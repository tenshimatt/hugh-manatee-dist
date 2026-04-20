import { CalendarRange, CheckCircle2, CircleDot, Clock } from "lucide-react";
import type { ActiveProject } from "@/lib/canned/active-projects";
import { cn } from "@/lib/utils";

const ICONS = {
  done: CheckCircle2,
  active: CircleDot,
  upcoming: Clock,
} as const;

const TONE = {
  done: "text-emerald-500",
  active: "text-[#C9A349]",
  upcoming: "text-slate-300",
} as const;

export function ProjectScheduleStub({
  milestones,
}: {
  milestones: ActiveProject["milestones"];
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarRange className="w-4 h-4 text-[#0A2E5C]" />
          <h3 className="text-sm font-semibold text-[#0A2E5C] uppercase tracking-wide">
            Project Schedule
          </h3>
        </div>
        <span className="inline-flex items-center rounded-full border border-[#C9A349]/40 bg-[#C9A349]/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8a5716]">
          Gantt coming in Phase 2
        </span>
      </div>

      <div className="relative">
        <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-200" />
        <ul className="space-y-3">
          {milestones.map((m) => {
            const Icon = ICONS[m.status];
            return (
              <li key={m.name} className="relative flex items-center gap-3 pl-8">
                <Icon
                  className={cn(
                    "w-4 h-4 absolute left-1 top-1/2 -translate-y-1/2 bg-white",
                    TONE[m.status]
                  )}
                />
                <div className="flex-1 flex items-center justify-between border-b border-slate-100 pb-2">
                  <span
                    className={cn(
                      "text-sm",
                      m.status === "done"
                        ? "text-slate-400 line-through"
                        : "text-slate-800 font-medium"
                    )}
                  >
                    {m.name}
                  </span>
                  <span className="text-xs text-slate-500 tabular-nums">{m.date}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
