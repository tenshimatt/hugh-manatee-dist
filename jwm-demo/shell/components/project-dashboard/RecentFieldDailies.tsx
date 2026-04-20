import Link from "next/link";
import { ClipboardList, Plus, ChevronRight } from "lucide-react";
import {
  CANNED_REPORTS,
  filterReports,
  type FieldDailyReport,
} from "@/lib/canned/field-daily";
import { erpnextConfigured, getList } from "@/lib/erpnext";

/**
 * RecentFieldDailies — embed tile on the Project Dashboard showing today's
 * submission count and the last 3 reports for this project. Links out to
 * the full list + the "new" form with job_number pre-filled.
 *
 * Tries ERPNext (5s budget), falls back to canned seed.
 */

async function loadRecent(projectId: string): Promise<FieldDailyReport[]> {
  if (erpnextConfigured()) {
    try {
      const live = (await Promise.race([
        getList<FieldDailyReport>("Field Daily Report", {
          fields: ["*"],
          filters: [["job_number", "=", projectId]],
          order_by: "date desc",
          limit_page_length: 5,
        }),
        new Promise<FieldDailyReport[]>((_, rej) =>
          setTimeout(() => rej(new Error("timeout")), 5000)
        ),
      ])) as FieldDailyReport[];
      if (live && live.length > 0) return live.slice(0, 3);
    } catch (e) {
      console.warn("[RecentFieldDailies] live failed, canned:", e);
    }
  }
  return filterReports(CANNED_REPORTS, { project: projectId }).slice(0, 3);
}

export async function RecentFieldDailies({ projectId }: { projectId: string }) {
  const recent = await loadRecent(projectId);
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = recent.filter((r) => r.date === today).length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-[#C9A349]" />
          <h3 className="text-sm font-bold text-[#0A2E5C] uppercase tracking-wider">
            Recent Field Dailies
          </h3>
        </div>
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
          {todayCount > 0 ? `${todayCount} today` : "none today"}
        </div>
      </div>

      {recent.length === 0 ? (
        <div className="text-xs text-slate-400 py-3 text-center">
          No reports yet for this project.
        </div>
      ) : (
        <ul className="space-y-1 mb-3">
          {recent.map((r) => (
            <li key={r.id}>
              <Link
                href={`/arch/field-daily/${encodeURIComponent(r.id)}`}
                className="flex items-center gap-2 px-2 py-2 text-xs rounded-lg hover:bg-slate-50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800">{r.date}</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {r.submitter_name}
                    {r.has_delays === "Yes" && (
                      <span className="ml-1.5 text-amber-600 font-semibold">· delay</span>
                    )}
                    {r.has_injuries === "Yes" && (
                      <span className="ml-1.5 text-red-600 font-semibold">· injury</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-[#064162]" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <Link
          href={`/arch/field-daily/new?project=${encodeURIComponent(projectId)}`}
          className="flex-1 inline-flex items-center justify-center gap-1 h-9 bg-[#064162] text-white text-xs font-semibold rounded-lg hover:bg-[#0a5480]"
        >
          <Plus className="w-3.5 h-3.5" /> New Field Daily
        </Link>
        <Link
          href={`/arch/field-daily?project=${encodeURIComponent(projectId)}`}
          className="inline-flex items-center justify-center h-9 px-3 border border-slate-300 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-50"
        >
          View all
        </Link>
      </div>
    </div>
  );
}
