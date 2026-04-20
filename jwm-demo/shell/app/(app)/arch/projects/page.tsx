import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";
import { listProjects, type ActiveProject } from "@/lib/canned/active-projects";
import { formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { isLive, listScheduleLines, pctFromRaw, type LivePSLine } from "@/lib/erpnext-live";

export const dynamic = "force-dynamic";

const DOT = {
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  red: "bg-red-500",
} as const;

/** Row shape this page renders. Superset of canned ActiveProject + live row. */
type ProjectRow = {
  id: string;
  jobNumber: string;
  jobName: string;
  pmName: string;
  healthStatus: "green" | "yellow" | "red";
  healthLabel: string;
  percentComplete: number;
  contract: number;
  committed: number;
};

function cannedToRow(p: ActiveProject): ProjectRow {
  return {
    id: p.id,
    jobNumber: p.jobNumber,
    jobName: p.jobName,
    pmName: p.pm.name,
    healthStatus: p.health.status,
    healthLabel: p.health.label,
    percentComplete: p.percentComplete,
    contract: p.budget.contract,
    committed: p.budget.committed,
  };
}

/** Collapse many schedule lines into one row per job_id. */
function linesToProjectRows(lines: LivePSLine[], cannedMap: Map<string, ActiveProject>): ProjectRow[] {
  const byJob = new Map<string, LivePSLine[]>();
  for (const l of lines) {
    if (!l.job_id) continue;
    const arr = byJob.get(l.job_id);
    if (arr) arr.push(l);
    else byJob.set(l.job_id, [l]);
  }
  const rows: ProjectRow[] = [];
  for (const [jobId, rowsForJob] of byJob) {
    const first = rowsForJob[0];
    const canned = cannedMap.get(jobId);
    const done = rowsForJob.reduce((a, r) => a + (r.qty_completed ?? 0), 0);
    const need = rowsForJob.reduce((a, r) => a + (r.qty_required ?? 0), 0);
    const pctQty = need > 0 ? Math.round((done / need) * 100) : null;
    const pctRaw = pctFromRaw(first?.jwm_raw_data);
    const percentComplete = pctRaw ?? pctQty ?? canned?.percentComplete ?? 0;
    rows.push({
      id: jobId,
      jobNumber: jobId.split("-")[0] ?? jobId,
      jobName: first?.job_name || canned?.jobName || jobId,
      pmName: canned?.pm.name || "—",
      healthStatus: canned?.health.status || "green",
      healthLabel: canned?.health.label || "Active",
      percentComplete,
      contract: canned?.budget.contract ?? 0,
      committed: canned?.budget.committed ?? 0,
    });
  }
  rows.sort((a, b) => a.id.localeCompare(b.id));
  return rows;
}

async function loadRows(): Promise<{ rows: ProjectRow[]; source: "live" | "canned" }> {
  const canned = listProjects();
  const cannedMap = new Map(canned.map((c) => [c.id, c]));
  if (isLive()) {
    try {
      const lines = await listScheduleLines(2000);
      if (lines.length) {
        const rows = linesToProjectRows(lines, cannedMap);
        // Keep canned entries that didn't appear live (demo safety net).
        for (const c of canned) {
          if (!rows.find((r) => r.id === c.id)) rows.push(cannedToRow(c));
        }
        return { rows: rows.slice(0, 50), source: "live" };
      }
    } catch (e) {
      console.warn("[arch/projects] live fetch failed, using canned:", e);
    }
  }
  return { rows: canned.map(cannedToRow), source: "canned" };
}

export default async function ProjectsListPage() {
  const { rows } = await loadRows();

  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-center gap-2 text-[#C9A349] text-xs font-bold uppercase tracking-widest">
          <Building2 className="w-4 h-4" /> Architectural · Projects
        </div>
        <h1 className="text-3xl font-bold text-[#0A2E5C] tracking-tight">Active Projects</h1>
        <p className="text-slate-500 mt-1 max-w-2xl text-sm">
          Cradle-to-grave view of every active architectural job. Click a row to open the
          project dashboard.
        </p>
      </header>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Job</th>
              <th className="text-left px-4 py-3 font-semibold">PM</th>
              <th className="text-left px-4 py-3 font-semibold">Health</th>
              <th className="text-right px-4 py-3 font-semibold">% Complete</th>
              <th className="text-right px-4 py-3 font-semibold">Contract</th>
              <th className="text-right px-4 py-3 font-semibold">Committed</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((p) => (
              <tr
                key={p.id}
                className="hover:bg-[#eaf3f8]/50 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/arch/projects/${encodeURIComponent(p.id)}`}
                    className="block"
                  >
                    <div className="font-semibold text-[#0A2E5C]">{p.jobName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{p.id}</div>
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">{p.pmName}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <span className={cn("w-2.5 h-2.5 rounded-full", DOT[p.healthStatus])} />
                    <span className="text-slate-700">{p.healthLabel}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-[#0A2E5C] tabular-nums">
                  {p.percentComplete}%
                </td>
                <td className="px-4 py-3 text-right text-slate-700 tabular-nums">
                  {p.contract ? formatMoney(p.contract) : "—"}
                </td>
                <td className="px-4 py-3 text-right text-slate-700 tabular-nums">
                  {p.committed ? formatMoney(p.committed) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/arch/projects/${encodeURIComponent(p.id)}`}
                    className="inline-flex items-center text-[#C9A349] hover:text-[#0A2E5C]"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
