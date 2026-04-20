import { formatMoney } from "@/lib/utils";
import type { ActiveProject } from "@/lib/canned/active-projects";

export function BudgetOverviewTile({ budget }: { budget: ActiveProject["budget"] }) {
  const rows: [string, number][] = [
    ["Contract Budget", budget.contract],
    ["Current Budget", budget.current],
    ["Total Cost", budget.totalCost],
    ["Projected Spend", budget.projectedSpend],
    ["Committed Cost", budget.committed],
    ["Budget Remaining", budget.remaining],
  ];
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-3">
        Budget Overview
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col border-b border-slate-100 pb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">
              {label}
            </span>
            <span className="text-sm font-semibold text-[#0A2E5C]">
              {formatMoney(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
