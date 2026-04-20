// Change Order Budget summary — rollup of COR log by status + by category.

import { getProject } from "@/lib/canned/active-projects";
import {
  cannedCORs,
  corTotalsByStatus,
  type CORStatus,
} from "@/lib/canned/project-subtabs/cors";
import { cannedBudget } from "@/lib/canned/project-subtabs/budget";
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

const STATUS_STYLES: Record<CORStatus, string> = {
  Pending:  "bg-amber-100 text-amber-700 border-amber-200",
  Approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Rejected: "bg-rose-100 text-rose-700 border-rose-200",
  Voided:   "bg-slate-200 text-slate-600 border-slate-300",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decoded = decodeURIComponent(id);
  const project = getProject(decoded);
  const { jobNumber, jobName } = resolveChromeHeader(decoded, project);
  const rows = cannedCORs(jobNumber);
  const totals = corTotalsByStatus(rows);
  const budget = cannedBudget(jobNumber);
  const dataSource: "live" | "canned" = "canned";

  const totalSubmitted = rows.reduce((a, r) => a + r.rom, 0);
  const totalExecuted = totals.Approved.amount;

  // Rollup by category (from the parent Budget seed — COR $ by category shape).
  const byCategory = new Map<string, { initial: number; cor: number }>();
  for (const l of budget.lines) {
    if (!byCategory.has(l.category))
      byCategory.set(l.category, { initial: 0, cor: 0 });
    const b = byCategory.get(l.category)!;
    b.initial += l.initial;
    b.cor += l.changeOrders;
  }

  return (
    <SubtabChrome
      projectId={decoded}
      jobNumber={jobNumber}
      jobName={jobName}
      active="cor-budget"
      title="Change Order Budget"
      description="Summary rollup of Change Order Requests against the baseline budget."
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Tile label="Total Submitted" value={fmt$(totalSubmitted)} />
        <Tile label="Total Executed" value={fmt$(totalExecuted)} tone="green" />
        <Tile label="Total Rejected" value={fmt$(totals.Rejected.amount)} tone="red" />
        <Tile label="Total Voided" value={fmt$(totals.Voided.amount)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardBody>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
              By Status
            </div>
            <table className="w-full text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-slate-500">
                <tr className="text-left border-b border-slate-100">
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Count</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2 text-right">% of Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(Object.keys(totals) as CORStatus[]).map((s) => {
                  const pct = totalSubmitted
                    ? Math.round((totals[s].amount / totalSubmitted) * 100)
                    : 0;
                  return (
                    <tr key={s}>
                      <td className="py-1.5">
                        <span
                          className={
                            "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold " +
                            STATUS_STYLES[s]
                          }
                        >
                          {s}
                        </span>
                      </td>
                      <td className="py-1.5 text-right tabular-nums">{totals[s].count}</td>
                      <td className="py-1.5 text-right tabular-nums">{fmt$(totals[s].amount)}</td>
                      <td className="py-1.5 text-right tabular-nums text-slate-500">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
              By Budget Category
            </div>
            <table className="w-full text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-slate-500">
                <tr className="text-left border-b border-slate-100">
                  <th className="py-2">Category</th>
                  <th className="py-2 text-right">Initial Budget</th>
                  <th className="py-2 text-right">CO $</th>
                  <th className="py-2 text-right">% Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...byCategory.entries()].map(([cat, v]) => {
                  const pct = v.initial ? Math.round((v.cor / v.initial) * 100) : 0;
                  return (
                    <tr key={cat}>
                      <td className="py-1.5 text-[11px] font-semibold text-[#0A2E5C]">{cat}</td>
                      <td className="py-1.5 text-right tabular-nums">{fmt$(v.initial)}</td>
                      <td className="py-1.5 text-right tabular-nums">{fmt$(v.cor)}</td>
                      <td className="py-1.5 text-right tabular-nums text-slate-500">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardBody>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
            Log (sorted by amount)
          </div>
          <table className="w-full text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-slate-500">
              <tr className="text-left border-b border-slate-100">
                <th className="py-2">COR #</th>
                <th className="py-2">Description</th>
                <th className="py-2">Status</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...rows]
                .sort((a, b) => Math.abs(b.rom) - Math.abs(a.rom))
                .map((r) => (
                  <tr key={r.corNumber}>
                    <td className="py-1.5 font-mono text-[11px]">{r.corNumber}</td>
                    <td className="py-1.5">{r.description}</td>
                    <td className="py-1.5">
                      <span
                        className={
                          "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold " +
                          STATUS_STYLES[r.status]
                        }
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-1.5 text-right tabular-nums">{fmt$(r.rom)}</td>
                  </tr>
                ))}
            </tbody>
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
