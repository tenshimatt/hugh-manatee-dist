/**
 * ActiveProjectsTable — bottom table on exec division pages.
 * Shows up to 20 distinct jobs pulled from the Production Schedule Lines.
 */
import Link from "next/link";

export interface ActiveProject {
  jobId: string;
  jobName: string;
  pm?: string;
  shipTarget?: string;
  lineCount: number;
  status: string;
}

export interface ActiveProjectsTableProps {
  projects: ActiveProject[];
  division: "Architectural" | "Processing";
  source: "live" | "canned";
}

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("engineer")) return "bg-violet-50 text-violet-700 border-violet-200";
  if (s.includes("production") || s.includes("run")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s.includes("queue")) return "bg-amber-50 text-amber-700 border-amber-200";
  if (s.includes("fab")) return "bg-sky-50 text-sky-700 border-sky-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export function ActiveProjectsTable({ projects, division, source }: ActiveProjectsTableProps) {
  const sectionSlug = division === "Architectural" ? "arch" : "processing";
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Active Projects — {division === "Architectural" ? "A Shop" : "T Shop"}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Top {projects.length} by schedule-line volume
          </p>
        </div>
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
            source === "live"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-500 border-slate-300"
          }`}
        >
          {source === "live" ? "LIVE ERPNEXT" : "CANNED"}
        </span>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-white text-slate-700 text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-2">Job ID</th>
            <th className="text-left px-4 py-2">Job Name</th>
            <th className="text-left px-4 py-2">PM</th>
            <th className="text-left px-4 py-2">Ship Target</th>
            <th className="text-right px-4 py-2">Lines</th>
            <th className="text-left px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {projects.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                No active projects found.
              </td>
            </tr>
          )}
          {projects.map((p) => (
            <tr key={p.jobId} className="border-t border-slate-100 hover:bg-sky-50/40 transition">
              <td className="px-4 py-2 font-mono text-xs text-slate-700">
                <Link
                  href={`/${sectionSlug}/projects/${encodeURIComponent(p.jobId)}`}
                  className="text-sky-700 hover:underline"
                >
                  {p.jobId}
                </Link>
              </td>
              <td className="px-4 py-2 font-medium text-slate-900">{p.jobName}</td>
              <td className="px-4 py-2 text-slate-700">{p.pm || "—"}</td>
              <td className="px-4 py-2 font-mono text-xs text-slate-600">{p.shipTarget || "—"}</td>
              <td className="px-4 py-2 text-right font-mono text-xs text-slate-700">{p.lineCount}</td>
              <td className="px-4 py-2">
                <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusBadgeClass(p.status)}`}>
                  {p.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
