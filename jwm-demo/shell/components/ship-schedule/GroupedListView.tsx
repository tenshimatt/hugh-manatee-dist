"use client";

/**
 * GroupedListView — Drew's Excel shape: section per ship date with a table
 * of jobs shipping that day.
 */
import type { ShipScheduleGroup } from "@/lib/erpnext-live";

interface Props {
  groups: ShipScheduleGroup[];
}

const BUCKET_ICON: Record<string, string> = {
  high: "🔴",
  medium: "🟡",
  normal: "⚪",
};

const BUCKET_LABEL: Record<string, string> = {
  high: "High bottleneck",
  medium: "Medium load",
  normal: "Normal",
};

const BUCKET_HEADER: Record<string, string> = {
  high: "bg-red-50 border-red-200 text-red-800",
  medium: "bg-amber-50 border-amber-200 text-amber-800",
  normal: "bg-slate-50 border-slate-200 text-slate-700",
};

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function GroupedListView({ groups }: Props) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        No shipments in the selected horizon.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <section
          key={g.date}
          className={`border rounded-lg overflow-hidden ${BUCKET_HEADER[g.bucket]}`}
        >
          <header className="px-4 py-2.5 flex items-center gap-3 border-b border-current/10">
            <span className="text-lg leading-none" aria-hidden>
              {BUCKET_ICON[g.bucket]}
            </span>
            <div className="flex-1">
              <div className="font-bold text-sm">{formatDate(g.date)}</div>
              <div className="text-xs opacity-75">{BUCKET_LABEL[g.bucket]}</div>
            </div>
            <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/60 border border-current/20">
              {g.jobs.length} job{g.jobs.length === 1 ? "" : "s"}
            </span>
          </header>
          <table className="w-full text-sm bg-white">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2">Job ID</th>
                <th className="text-left px-4 py-2">Job Name</th>
                <th className="text-right px-4 py-2">Qty</th>
                <th className="text-left px-4 py-2">Station</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">PM</th>
              </tr>
            </thead>
            <tbody>
              {g.jobs.map((j) => (
                <tr key={j.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-mono text-xs text-slate-700">{j.id}</td>
                  <td className="px-4 py-2 text-slate-800">{j.jobName}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-700">
                    {j.qty ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-slate-700">{j.station || "—"}</td>
                  <td className="px-4 py-2 text-slate-700">{j.status || "—"}</td>
                  <td className="px-4 py-2 text-slate-700">{j.pm || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
