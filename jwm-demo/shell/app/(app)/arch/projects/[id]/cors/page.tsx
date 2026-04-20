import { getProject } from "@/lib/canned/active-projects";
import {
  cannedCORs,
  corTotalsByStatus,
  type CORStatus,
} from "@/lib/canned/project-subtabs/cors";
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
  const dataSource: "live" | "canned" = "canned";

  return (
    <SubtabChrome
      projectId={decoded}
      jobNumber={jobNumber}
      jobName={jobName}
      active="cors"
      title="Change Order Request Log"
      description="All submitted, approved, rejected, and voided change orders for this job."
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {(Object.keys(totals) as CORStatus[]).map((s) => (
          <div key={s} className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                {s}
              </span>
              <span
                className={
                  "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold " +
                  STATUS_STYLES[s]
                }
              >
                {totals[s].count}
              </span>
            </div>
            <div className="text-xl font-bold mt-1 text-[#0A2E5C]">
              {fmt$(totals[s].amount)}
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr className="text-left">
                <th className="px-3 py-2">COR #</th>
                <th className="px-3 py-2">Cust. Tracking</th>
                <th className="px-3 py-2">Origin</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Zone</th>
                <th className="px-3 py-2 text-right">Sched. Δ (d)</th>
                <th className="px-3 py-2">Start</th>
                <th className="px-3 py-2">Finish</th>
                <th className="px-3 py-2">Signed DFAR</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">ROM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.corNumber} className="text-slate-700">
                  <td className="px-3 py-1.5 font-mono text-[11px]">{r.corNumber}</td>
                  <td className="px-3 py-1.5 font-mono text-[11px] text-slate-500">
                    {r.customerTracking}
                  </td>
                  <td className="px-3 py-1.5">{r.originDoc}</td>
                  <td className="px-3 py-1.5">{r.description}</td>
                  <td className="px-3 py-1.5">{r.zone}</td>
                  <td
                    className={
                      "px-3 py-1.5 text-right tabular-nums " +
                      (r.scheduleImpactDays > 0
                        ? "text-rose-700 font-semibold"
                        : r.scheduleImpactDays < 0
                        ? "text-emerald-700 font-semibold"
                        : "")
                    }
                  >
                    {r.scheduleImpactDays > 0 ? `+${r.scheduleImpactDays}` : r.scheduleImpactDays}
                  </td>
                  <td className="px-3 py-1.5 tabular-nums">{r.startDate}</td>
                  <td className="px-3 py-1.5 tabular-nums">{r.finishDate}</td>
                  <td className="px-3 py-1.5 tabular-nums text-slate-500">
                    {r.signedDFAR || "—"}
                  </td>
                  <td className="px-3 py-1.5">
                    <span
                      className={
                        "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold " +
                        STATUS_STYLES[r.status]
                      }
                    >
                      {r.status}
                    </span>
                  </td>
                  <td
                    className={
                      "px-3 py-1.5 text-right tabular-nums " +
                      (r.rom < 0 ? "text-emerald-700" : "")
                    }
                  >
                    {fmt$(r.rom)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#0A2E5C] text-white font-semibold">
                <td colSpan={10} className="px-3 py-2 text-[11px] uppercase tracking-wider">
                  Total Logged
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {fmt$(rows.reduce((a, r) => a + r.rom, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </CardBody>
      </Card>

      <DataSourceFootnote source={dataSource} />
    </SubtabChrome>
  );
}
