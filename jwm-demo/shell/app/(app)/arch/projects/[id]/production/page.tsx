// Production sub-tab — mirrors A-Shop/Production.xlsx schema.
// Per-project production metrics: units produced vs estimated, man-hours,
// $/MH, % work done, grouped by stage (Engineering / Fabrication / Field / Equipment).
//
// Tries a live fetch against ERPNext Project Schedule Line for this job;
// falls back to the canned template if nothing matches. 5s timeout.

import { getProject } from "@/lib/canned/active-projects";
import { cannedProduction } from "@/lib/canned/project-subtabs/production";
import { isLive, listScheduleLines, type LivePSLine } from "@/lib/erpnext-live";
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

async function tryLive(jobId: string): Promise<{
  unitsRequired: number;
  unitsCompleted: number;
  stationCount: number;
} | null> {
  if (!isLive()) return null;
  try {
    const lines: LivePSLine[] = await listScheduleLines(500, [["job_id", "=", jobId]]);
    if (!lines.length) return null;
    const need = lines.reduce((a, r) => a + (r.qty_required ?? 0), 0);
    const done = lines.reduce((a, r) => a + (r.qty_completed ?? 0), 0);
    return { unitsRequired: need, unitsCompleted: done, stationCount: lines.length };
  } catch (e) {
    console.warn("[production] live fetch failed, canned fallback:", e);
    return null;
  }
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
  const data = cannedProduction(jobNumber);
  const live = await tryLive(decoded);
  const dataSource: "live" | "canned" = live ? "live" : "canned";

  // If we got live panel-level counts, swap them into the Fabrication totals block.
  const liveBanner = live ? (
    <div className="bg-[#eaf3f8] border border-[#0A2E5C]/15 rounded-xl px-4 py-3 text-xs text-[#0A2E5C] mb-4">
      Live ERPNext panel tracking:{" "}
      <span className="font-bold">{live.unitsCompleted.toLocaleString()}</span> /{" "}
      <span className="font-bold">{live.unitsRequired.toLocaleString()}</span> units
      across <span className="font-bold">{live.stationCount}</span> station rows.
    </div>
  ) : null;

  // Group rows by stage.
  const stages = ["Engineering", "Fabrication", "Field", "Equipment"] as const;

  return (
    <SubtabChrome
      projectId={decoded}
      jobNumber={jobNumber}
      jobName={jobName}
      active="production"
      title="Production"
      description="Per-project production metrics: man-hours, units produced, and % work done by stage."
    >
      {liveBanner}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-5">
        <Tile label="% Work Done" value={`${data.totals.percentComplete}%`} tone="gold" />
        <Tile
          label="Hours Used / Est"
          value={`${data.totals.hoursUsed.toLocaleString()} / ${data.totals.hoursEstimated.toLocaleString()}`}
        />
        <Tile
          label="Units Produced / Est"
          value={`${data.totals.unitsProduced.toLocaleString()} / ${data.totals.unitsEstimated.toLocaleString()}`}
        />
        <Tile label="Cost to Date" value={fmt$(data.totals.costToDate)} />
        <Tile
          label="Avg $/MH"
          value={fmt$(Math.round(data.totals.costToDate / Math.max(1, data.totals.hoursUsed)))}
        />
      </div>

      {stages.map((stage) => {
        const rows = data.rows.filter((r) => r.stage === stage);
        if (!rows.length) return null;
        const stHours = rows.reduce((a, r) => a + r.manHoursUsed, 0);
        const stEst = rows.reduce((a, r) => a + r.totalHoursEstimated, 0);
        return (
          <Card key={stage} className="mb-4">
            <CardBody className="p-0 overflow-x-auto">
              <div className="flex items-center justify-between px-4 py-2 bg-[#eaf3f8] border-b border-slate-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#0A2E5C]">
                  {stage}
                </div>
                <div className="text-[11px] text-slate-500">
                  Hours: <span className="font-bold text-[#0A2E5C]">{stHours.toLocaleString()}</span>{" "}
                  / {stEst.toLocaleString()}
                </div>
              </div>
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase tracking-wider text-slate-500">
                  <tr className="text-left border-b border-slate-100">
                    <th className="px-3 py-2">Phase</th>
                    <th className="px-3 py-2">Scope</th>
                    <th className="px-3 py-2 text-right">MH Used</th>
                    <th className="px-3 py-2 text-right">Units Produced</th>
                    <th className="px-3 py-2 text-right">$ to Date</th>
                    <th className="px-3 py-2 text-right">$/MH</th>
                    <th className="px-3 py-2 text-right">Hrs/Unit</th>
                    <th className="px-3 py-2 text-right">Est Hrs/Unit</th>
                    <th className="px-3 py-2 text-right">Est Hrs</th>
                    <th className="px-3 py-2 text-right">Est Units</th>
                    <th className="px-3 py-2">% Done</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr key={r.phaseCode}>
                      <td className="px-3 py-1.5 font-mono text-[11px]">{r.phaseCode}</td>
                      <td className="px-3 py-1.5">{r.scope}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">
                        {r.manHoursUsed.toLocaleString()}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">
                        {r.unitsProduced.toLocaleString()}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{fmt$(r.costToDate)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">
                        {fmt$(r.currentCostPerMH)}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">
                        {r.hoursPerUnit.toFixed(2)}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-slate-500">
                        {r.hoursPerUnitEstimated.toFixed(2)}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">
                        {r.totalHoursEstimated.toLocaleString()}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">
                        {r.totalUnitsEstimated.toLocaleString()}
                      </td>
                      <td className="px-3 py-1.5 w-28">
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-[#C9A349]"
                            style={{ width: `${Math.min(100, r.percentComplete)}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {r.percentComplete}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        );
      })}

      <DataSourceFootnote
        source={dataSource}
        note={
          live
            ? "Live panel counts mixed with canned labour rates."
            : "ERPNext panel tracking not resolvable for this job id."
        }
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
      <div className={"text-xl font-bold mt-1 " + toneCls}>{value}</div>
    </div>
  );
}
