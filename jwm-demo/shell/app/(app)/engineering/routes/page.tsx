/**
 * /engineering/routes — list page.
 * Server component. Reads live from ERPNext via lib/routes; canned fallback.
 */
import Link from "next/link";
import { GitBranch, CircleDot } from "lucide-react";
import { listRoutes, statusBadgeClass } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function RoutesListPage() {
  const { data, source } = await listRoutes();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-sky-600" /> Routes
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manufacturing routes defining the ordered operations for each job. Side-branches
            capture NCR loopbacks and optional finishing.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span
            className={`px-2 py-1 rounded-full border ${
              source === "live"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-600 border-slate-300"
            }`}
          >
            <CircleDot className="w-3 h-3 inline-block mr-1 -mt-0.5" />
            {source === "live" ? "Live ERPNext" : "Canned fallback"}
          </span>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Route</th>
              <th className="text-left px-4 py-3">Job ID</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Description</th>
              <th className="text-left px-4 py-3">Modified</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No routes defined.
                </td>
              </tr>
            )}
            {data.map((r) => (
              <tr key={r.name} className="border-t border-slate-100 hover:bg-sky-50/40 transition">
                <td className="px-4 py-3">
                  <Link
                    href={`/engineering/routes/${encodeURIComponent(r.name)}`}
                    className="font-semibold text-sky-700 hover:text-sky-900 hover:underline"
                  >
                    {r.route_name}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-700">{r.job_id}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${statusBadgeClass(r.status)}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{r.description || "—"}</td>
                <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                  {r.modified ? new Date(r.modified.replace(" ", "T") + "Z").toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
