"use client";

/**
 * DaySidePanel — slide-over showing jobs shipping on a clicked day.
 */
import { X } from "lucide-react";
import type { ShipScheduleGroup } from "@/lib/erpnext-live";

interface Props {
  group: ShipScheduleGroup | null;
  onClose: () => void;
}

const BUCKET_LABEL: Record<string, { icon: string; label: string; color: string }> = {
  high:   { icon: "🔴", label: "High bottleneck",  color: "text-red-700" },
  medium: { icon: "🟡", label: "Medium load",      color: "text-amber-700" },
  normal: { icon: "⚪", label: "Normal",           color: "text-slate-700" },
};

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

export function DaySidePanel({ group, onClose }: Props) {
  if (!group) return null;
  const meta = BUCKET_LABEL[group.bucket];
  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/30 z-30"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-label={`Jobs shipping ${group.date}`}
        className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-white z-40 shadow-2xl overflow-y-auto"
      >
        <header className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-start gap-3">
          <div className="flex-1">
            <div className={`text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5 ${meta.color}`}>
              <span aria-hidden>{meta.icon}</span> {meta.label}
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">{formatDate(group.date)}</h2>
            <div className="text-xs text-slate-500 mt-0.5">
              {group.jobs.length} job{group.jobs.length === 1 ? "" : "s"} scheduled to ship
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>
        <div className="p-5 space-y-3">
          {group.jobs.map((j) => (
            <div
              key={j.id}
              className="border border-slate-200 rounded-lg p-3 hover:border-[#064162] transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{j.jobName}</div>
                  <div className="font-mono text-xs text-slate-500 mt-0.5">{j.id}</div>
                </div>
                {j.qty !== undefined && j.qty !== null && (
                  <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Qty</div>
                    <div className="text-sm font-semibold tabular-nums">{j.qty}</div>
                  </div>
                )}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Station: </span>
                  <span className="text-slate-800">{j.station || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-500">Status: </span>
                  <span className="text-slate-800">{j.status || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-500">PM: </span>
                  <span className="text-slate-800">{j.pm || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-500">Shop: </span>
                  <span className="text-slate-800">{j.shop || "—"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
