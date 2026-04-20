import type { ActiveProject } from "@/lib/canned/active-projects";
import { cn } from "@/lib/utils";

export function MarginTile({ margin }: { margin: ActiveProject["margin"] }) {
  const rows: [string, number][] = [
    ["Initial", margin.initial],
    ["Current", margin.current],
    ["Budget at Completion", margin.budgetAtCompletion],
  ];
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-3">
        Margin
      </div>
      <div className="space-y-3">
        {rows.map(([label, v]) => (
          <div key={label}>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] uppercase tracking-wider text-slate-600">
                {label}
              </span>
              <span className="text-sm font-bold text-[#0A2E5C]">{v}%</span>
            </div>
            <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full",
                  v >= 20 ? "bg-emerald-500" : v >= 10 ? "bg-amber-400" : "bg-red-500"
                )}
                style={{ width: `${Math.max(0, Math.min(100, v * 4))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarginIncreaseTile({
  marginIncrease,
}: {
  marginIncrease: ActiveProject["marginIncrease"];
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-3">
        Margin Increase %
      </div>
      <div className="flex gap-1 mb-3">
        <button
          className={cn(
            "flex-1 text-[10px] uppercase font-bold tracking-wider rounded-md px-2 py-1 border",
            marginIncrease.direction === "decrease"
              ? "bg-[#0A2E5C] text-white border-[#0A2E5C]"
              : "bg-white text-slate-500 border-slate-200"
          )}
        >
          Decrease
        </button>
        <button
          className={cn(
            "flex-1 text-[10px] uppercase font-bold tracking-wider rounded-md px-2 py-1 border",
            marginIncrease.direction === "increase"
              ? "bg-[#0A2E5C] text-white border-[#0A2E5C]"
              : "bg-white text-slate-500 border-slate-200"
          )}
        >
          Increase
        </button>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-[#C9A349] leading-none">
          {marginIncrease.changeOrdersPct.toFixed(1)}%
        </div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-2">
          Change Orders
        </div>
      </div>
    </div>
  );
}
