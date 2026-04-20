// Schedule of Values (SOV) — AIA-style billing breakdown.
// Mirrors A-Shop/SOV.xlsx.

import { getProject } from "@/lib/canned/active-projects";
import { cannedSOV } from "@/lib/canned/project-subtabs/sov";
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

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decoded = decodeURIComponent(id);
  const project = getProject(decoded);
  const { jobNumber, jobName } = resolveChromeHeader(decoded, project);
  const contractValue = project?.budget.contract ?? 3_500_000;
  const data = cannedSOV(jobNumber, contractValue);

  const { totals, retainagePct } = data;

  return (
    <SubtabChrome
      projectId={decoded}
      jobNumber={jobNumber}
      jobName={jobName}
      active="sov"
      title="Schedule of Values"
      description="AIA-style pay-application breakdown with retainage and balance-to-finish."
    >
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
        <Tile label="Contract" value={fmt$(totals.scheduledValue)} />
        <Tile label="Previous App" value={fmt$(totals.previousApplication)} />
        <Tile label="This Period" value={fmt$(totals.thisPeriod)} tone="gold" />
        <Tile label="Stored This Period" value={fmt$(totals.storedThisPeriod)} />
        <Tile label="Balance to Finish" value={fmt$(totals.balanceToFinish)} />
        <Tile label={`Retainage (${retainagePct}%)`} value={fmt$(totals.retainage)} />
      </div>

      <Card>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr className="text-left">
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2 text-right">Scheduled Value</th>
                <th className="px-3 py-2 text-right">Previous App</th>
                <th className="px-3 py-2 text-right">This Period</th>
                <th className="px-3 py-2 text-right">Stored</th>
                <th className="px-3 py-2 text-right">Total + Stored %</th>
                <th className="px-3 py-2 text-right">% Complete</th>
                <th className="px-3 py-2 text-right">Balance to Finish</th>
                <th className="px-3 py-2 text-right">Retainage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.rows.map((r) => (
                <tr key={r.itemNumber} className="text-slate-700">
                  <td className="px-3 py-1.5 font-mono text-[11px]">{r.itemNumber}</td>
                  <td className="px-3 py-1.5">{r.description}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {fmt$(r.scheduledValue)}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {fmt$(r.previousApplication)}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-[#8a5716]">
                    {r.thisPeriod ? fmt$(r.thisPeriod) : "—"}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {r.storedThisPeriod ? fmt$(r.storedThisPeriod) : "—"}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-slate-500">
                    {r.completeAndStoredPct}%
                  </td>
                  <td className="px-3 py-1.5 w-28">
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${Math.min(100, r.percentComplete)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 text-right">
                      {r.percentComplete}%
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {fmt$(r.balanceToFinish)}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmt$(r.retainage)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#0A2E5C] text-white font-semibold">
                <td colSpan={2} className="px-3 py-2 text-[11px] uppercase tracking-wider">
                  Totals
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt$(totals.scheduledValue)}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {fmt$(totals.previousApplication)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt$(totals.thisPeriod)}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {fmt$(totals.storedThisPeriod)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {Math.round((totals.completeAndStored / Math.max(1, totals.scheduledValue)) * 100)}
                  %
                </td>
                <td className="px-3 py-2" />
                <td className="px-3 py-2 text-right tabular-nums">{fmt$(totals.balanceToFinish)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt$(totals.retainage)}</td>
              </tr>
            </tfoot>
          </table>
        </CardBody>
      </Card>

      <DataSourceFootnote
        source="canned"
        note="SOV is a contract artefact — Phase-2: sync pay-application rows from accounting."
      />
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
      <div className={"text-lg font-bold mt-1 " + toneCls}>{value}</div>
    </div>
  );
}
