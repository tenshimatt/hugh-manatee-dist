/**
 * Right-rail "Project Budget Overview" — 6 canned figures from the Smartsheet screenshot.
 */
import { fmtUsdFull } from "./KpiTile";

export interface ProjectBudgetOverviewProps {
  data: {
    currentCmTotal: number;
    totalCurrentBudget: number;
    totalBacklog: number;
    totalActualCostToDate: number;
    committedCost: number;
    totalProjectedBuiltActive: number;
  };
}

export function ProjectBudgetOverview({ data }: ProjectBudgetOverviewProps) {
  const rows: Array<[string, number]> = [
    ["Current CM Total", data.currentCmTotal],
    ["Total Current Budget", data.totalCurrentBudget],
    ["Total Backlog", data.totalBacklog],
    ["Total Actual Cost to Date", data.totalActualCostToDate],
    ["Committed Cost", data.committedCost],
    ["Total Projected Built to Active Projects", data.totalProjectedBuiltActive],
  ];
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-800">Project Budget Overview</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">Canned — from Smartsheet snapshot</p>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-t border-slate-100">
              <td className="px-4 py-2.5 text-slate-600">{label}</td>
              <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900">
                {fmtUsdFull(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
