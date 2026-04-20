import Link from "next/link";
import { ClipboardList, Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CANNED_REPORTS,
  filterReports,
  type FieldDailyReport,
} from "@/lib/canned/field-daily";
import { erpnextConfigured, getList } from "@/lib/erpnext";

export const dynamic = "force-dynamic";

/**
 * /arch/field-daily — list view of all Field Daily Reports, newest first.
 * Filters: project (job_number), since (7/30/90 days).
 *
 * Data: tries ERPNext `Field Daily Report` (5s budget), falls back to canned.
 */

const SINCE_PRESETS: Record<string, number> = { "7": 7, "30": 30, "90": 90 };

async function loadReports(
  project: string | undefined,
  days: number | undefined
): Promise<{ reports: FieldDailyReport[]; source: "live" | "canned" }> {
  const since = days
    ? new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
    : undefined;

  if (erpnextConfigured()) {
    try {
      const filters: Array<[string, string, unknown]> = [];
      if (project) filters.push(["job_number", "=", project]);
      if (since) filters.push(["date", ">=", since]);
      const live = (await Promise.race([
        getList<FieldDailyReport>("Field Daily Report", {
          fields: ["*"],
          filters,
          order_by: "date desc",
          limit_page_length: 200,
        }),
        new Promise<FieldDailyReport[]>((_, rej) =>
          setTimeout(() => rej(new Error("timeout")), 5000)
        ),
      ])) as FieldDailyReport[];
      if (live && live.length > 0) return { reports: live, source: "live" };
    } catch (e) {
      console.warn("[arch/field-daily] live failed, canned:", e);
    }
  }

  return {
    reports: filterReports(CANNED_REPORTS, { project, since }),
    source: "canned",
  };
}

export default async function FieldDailyListPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; since?: string }>;
}) {
  const sp = await searchParams;
  const project = sp.project || undefined;
  const sinceKey = sp.since || "30";
  const days = SINCE_PRESETS[sinceKey];

  const { reports, source } = await loadReports(project, days);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#C9A349] font-bold">
            Architectural
          </div>
          <h1 className="text-2xl font-bold text-[#0A2E5C] flex items-center gap-2">
            <ClipboardList className="w-6 h-6" /> Field Daily Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Daily crew logs, install progression, weather, and safety.{" "}
            <span className="text-slate-400">({source})</span>
          </p>
        </div>
        <Link
          href={
            project
              ? `/arch/field-daily/new?project=${encodeURIComponent(project)}`
              : "/arch/field-daily/new"
          }
        >
          <Button variant="primary">
            <Plus className="w-4 h-4" /> New Field Daily
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-xl p-3">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Filters
        </div>
        <form className="flex items-center gap-2" method="GET">
          <input
            name="project"
            placeholder="Job # (e.g. 25031)"
            defaultValue={project || ""}
            className="h-9 px-2 text-sm border border-slate-300 rounded-lg"
          />
          <select
            name="since"
            defaultValue={sinceKey}
            className="h-9 px-2 text-sm border border-slate-300 rounded-lg"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Button type="submit" variant="outline" size="sm">
            Apply
          </Button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="text-left px-4 py-2 font-semibold">Date</th>
              <th className="text-left px-4 py-2 font-semibold">Project</th>
              <th className="text-left px-4 py-2 font-semibold">PM</th>
              <th className="text-left px-4 py-2 font-semibold">Submitter</th>
              <th className="text-center px-3 py-2 font-semibold">Delays</th>
              <th className="text-center px-3 py-2 font-semibold">Injuries</th>
              <th className="text-right px-4 py-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  No reports match these filters.
                </td>
              </tr>
            )}
            {reports.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-medium">{r.date}</td>
                <td className="px-4 py-2">
                  <div className="font-semibold text-[#0A2E5C]">{r.job_number}</div>
                  <div className="text-xs text-slate-500">{r.job_name}</div>
                </td>
                <td className="px-4 py-2">{r.project_manager}</td>
                <td className="px-4 py-2">{r.submitter_name}</td>
                <td className="px-3 py-2 text-center">
                  {r.has_delays === "Yes" ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                      Yes
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  {r.has_injuries === "Yes" ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-800">
                      Yes
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/arch/field-daily/${encodeURIComponent(r.id)}`}
                    className="inline-flex items-center gap-1 text-[#064162] text-xs font-semibold hover:underline"
                  >
                    Open <ChevronRight className="w-3 h-3" />
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
