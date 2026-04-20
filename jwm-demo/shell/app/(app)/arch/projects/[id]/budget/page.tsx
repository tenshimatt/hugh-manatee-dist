import { getProject } from "@/lib/canned/active-projects";
import { cannedBudget, type BudgetLine } from "@/lib/canned/project-subtabs/budget";
import {
  SubtabChrome,
  resolveChromeHeader,
} from "@/components/project-dashboard/SubtabChrome";
import { Card, CardBody } from "@/components/ui/card";
import { DataSourceFootnote } from "@/components/project-dashboard/DataSourceFootnote";

export const dynamic = "force-dynamic";

function fmt$(n: number) {
  const neg = n < 0;
  const abs = Math.abs(Math.round(n));
  return (neg ? "-$" : "$") + abs.toLocaleString();
}
function healthBg(h: string) {
  if (h === "Red") return "bg-rose-100 text-rose-700 border-rose-200";
  if (h === "Yellow") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
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
  const data = cannedBudget(jobNumber);
  const dataSource: "live" | "canned" = "canned"; // Live Budget DocType not in ERPNext yet.

  // Group by category.
  const categories = new Map<string, BudgetLine[]>();
  for (const l of data.lines) {
    if (!categories.has(l.category)) categories.set(l.category, []);
    categories.get(l.category)!.push(l);
  }

  return (
    <SubtabChrome
      projectId={decoded}
      jobNumber={jobNumber}
      jobName={jobName}
      active="budget"
      title="Budget"
      description="Line-item cost tracking across materials, fabrication, and field labour."
    >
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-5">
        <SummaryTile label="Contract Value" value={fmt$(data.summary.contract)} />
        <SummaryTile label="Current Budget" value={fmt$(data.summary.current)} />
        <SummaryTile label="Actual Cost" value={fmt$(data.summary.actual)} />
        <SummaryTile label="Projected Spend" value={fmt$(data.summary.projected)} />
        <SummaryTile
          label="Budget Remaining"
          value={fmt$(data.summary.remaining)}
          tone={data.summary.remaining < 0 ? "red" : "green"}
        />
      </div>

      <Card>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr className="text-left">
                <th className="px-3 py-2">Phase</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2 text-right">Initial</th>
                <th className="px-3 py-2 text-right">COs</th>
                <th className="px-3 py-2 text-right">Current</th>
                <th className="px-3 py-2 text-right">Actual</th>
                <th className="px-3 py-2 text-right">Committed</th>
                <th className="px-3 py-2 text-right">Projected</th>
                <th className="px-3 py-2 text-right">Remaining</th>
                <th className="px-3 py-2">Spend</th>
                <th className="px-3 py-2">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...categories.entries()].map(([cat, rows]) => {
                const subCurrent = rows.reduce((a, r) => a + r.current, 0);
                const subActual = rows.reduce((a, r) => a + r.actual, 0);
                return (
                  <CategoryGroup
                    key={`cat-${cat}`}
                    cat={cat}
                    rows={rows}
                    subCurrent={subCurrent}
                    subActual={subActual}
                  />
                );
              })}
              <tr className="bg-[#0A2E5C] text-white font-semibold">
                <td colSpan={2} className="px-3 py-2 text-[11px] uppercase tracking-wider">
                  Totals
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt$(data.summary.initial)}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {fmt$(data.lines.reduce((a, r) => a + r.changeOrders, 0))}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt$(data.summary.current)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt$(data.summary.actual)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt$(data.summary.committed)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt$(data.summary.projected)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt$(data.summary.remaining)}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {data.summary.budgetPctSpent}%
                </td>
                <td className="px-3 py-2">
                  <span
                    className={
                      "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold " +
                      healthBg(data.summary.budgetHealth)
                    }
                  >
                    {data.summary.budgetHealth}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </CardBody>
      </Card>

      <DataSourceFootnote source={dataSource} />
    </SubtabChrome>
  );
}

function CategoryGroup({
  cat,
  rows,
  subCurrent,
  subActual,
}: {
  cat: string;
  rows: BudgetLine[];
  subCurrent: number;
  subActual: number;
}) {
  return (
    <>
      <tr className="bg-[#eaf3f8]">
        <td
          colSpan={11}
          className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#0A2E5C]"
        >
          {cat}{" "}
          <span className="text-slate-500 font-semibold ml-2 normal-case">
            Current {fmt$(subCurrent)} · Actual {fmt$(subActual)}
          </span>
        </td>
      </tr>
      {rows.map((r) => {
        const ratio = Math.max(
          0,
          Math.min(1.2, r.actual / Math.max(1, r.current)),
        );
        return (
          <tr key={r.phaseCode} className="text-slate-700">
            <td className="px-3 py-1.5 font-mono text-[11px]">{r.phaseCode}</td>
            <td className="px-3 py-1.5">{r.description}</td>
            <td className="px-3 py-1.5 text-right tabular-nums">{fmt$(r.initial)}</td>
            <td className="px-3 py-1.5 text-right tabular-nums text-[#8a5716]">
              {r.changeOrders ? fmt$(r.changeOrders) : "—"}
            </td>
            <td className="px-3 py-1.5 text-right tabular-nums">{fmt$(r.current)}</td>
            <td className="px-3 py-1.5 text-right tabular-nums">{fmt$(r.actual)}</td>
            <td className="px-3 py-1.5 text-right tabular-nums">{fmt$(r.committed)}</td>
            <td className="px-3 py-1.5 text-right tabular-nums">{fmt$(r.projected)}</td>
            <td
              className={
                "px-3 py-1.5 text-right tabular-nums " +
                (r.remaining < 0 ? "text-rose-700 font-semibold" : "")
              }
            >
              {fmt$(r.remaining)}
            </td>
            <td className="px-3 py-1.5 w-28">
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={
                    "h-full " +
                    (ratio > 1
                      ? "bg-rose-500"
                      : ratio > 0.9
                      ? "bg-amber-500"
                      : "bg-emerald-500")
                  }
                  style={{ width: `${Math.min(100, ratio * 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {Math.round(ratio * 100)}%
              </div>
            </td>
            <td className="px-3 py-1.5">
              <span
                className={
                  "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold " +
                  healthBg(r.health)
                }
              >
                {r.health}
              </span>
            </td>
          </tr>
        );
      })}
    </>
  );
}

function SummaryTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "green" | "red";
}) {
  const toneCls =
    tone === "red" ? "text-rose-700" : tone === "green" ? "text-emerald-700" : "text-[#0A2E5C]";
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
        {label}
      </div>
      <div className={"text-xl font-bold mt-1 " + toneCls}>{value}</div>
    </div>
  );
}
