import { getProject } from "@/lib/canned/active-projects";
import { cannedForecast } from "@/lib/canned/project-subtabs/forecast";
import {
  SubtabChrome,
  resolveChromeHeader,
} from "@/components/project-dashboard/SubtabChrome";
import { Card, CardBody } from "@/components/ui/card";
import { DataSourceFootnote } from "@/components/project-dashboard/DataSourceFootnote";
import { ForecastChart } from "@/components/project-dashboard/ForecastChart";

export const dynamic = "force-dynamic";

function fmt$(n: number) {
  const neg = n < 0;
  const abs = Math.abs(Math.round(n));
  return (neg ? "-$" : "$") + abs.toLocaleString();
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decoded = decodeURIComponent(id);
  const project = getProject(decoded);
  const { jobNumber, jobName } = resolveChromeHeader(decoded, project);
  const data = cannedForecast(jobNumber);
  const dataSource: "live" | "canned" = "canned";

  // Build chart data — monthly + cumulative remaining spend.
  let cum = 0;
  const chartData = data.months.map((m) => {
    const spend = data.totalsByMonth[m] || 0;
    cum += spend;
    return { month: m, spend, cumulative: cum };
  });

  return (
    <SubtabChrome
      projectId={decoded}
      jobNumber={jobNumber}
      jobName={jobName}
      active="forecast"
      title="Forecast"
      description="Projected spend, cash flow, and margin-at-completion outlook by phase."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <Tile label="Current Budget" value={fmt$(data.totals.current)} />
        <Tile label="Actuals to Date" value={fmt$(data.totals.actual)} />
        <Tile label="Remaining to Allocate" value={fmt$(data.totals.remaining)} tone="gold" />
      </div>

      <Card className="mb-4">
        <CardBody>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
            Cash-Flow Outlook
          </div>
          <ForecastChart data={chartData} />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr className="text-left">
                <th className="px-3 py-2">Phase</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2 text-right">Current $</th>
                <th className="px-3 py-2 text-right">Actual $</th>
                <th className="px-3 py-2 text-right">Remaining $</th>
                {data.months.map((m) => (
                  <th key={m} className="px-2 py-2 text-right whitespace-nowrap">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.rows.map((r) => (
                <tr key={r.phaseCode} className="text-slate-700">
                  <td className="px-3 py-1.5 font-mono text-[11px]">{r.phaseCode}</td>
                  <td className="px-3 py-1.5">{r.description}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmt$(r.currentBudget)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmt$(r.actualCosts)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {fmt$(r.leftToAllocate)}
                  </td>
                  {data.months.map((m) => (
                    <td key={m} className="px-2 py-1.5 text-right tabular-nums text-slate-500">
                      {r.monthly[m] ? fmt$(r.monthly[m]) : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#0A2E5C] text-white font-semibold">
                <td colSpan={2} className="px-3 py-2 text-[11px] uppercase tracking-wider">
                  Forecast Rollup
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt$(data.totals.current)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt$(data.totals.actual)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt$(data.totals.remaining)}</td>
                {data.months.map((m) => (
                  <td key={m} className="px-2 py-2 text-right tabular-nums">
                    {fmt$(data.totalsByMonth[m] || 0)}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </CardBody>
      </Card>

      <DataSourceFootnote source={dataSource} />
    </SubtabChrome>
  );
}

function Tile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "gold";
}) {
  const toneCls = tone === "gold" ? "text-[#8a5716]" : "text-[#0A2E5C]";
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
        {label}
      </div>
      <div className={"text-xl font-bold mt-1 " + toneCls}>{value}</div>
    </div>
  );
}
