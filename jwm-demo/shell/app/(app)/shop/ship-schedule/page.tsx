/**
 * /shop/ship-schedule — Drew's bottleneck view.
 *
 * Replicates Drew's "Shipping Schedule — Jobs All or Coming to Shipping"
 * Excel workbook: every job grouped by ship date, with auto-flagged
 * bottleneck days (red 5+, amber 3-4, white 1-2).
 *
 * Server component. Fetches via getShipSchedule() which falls back to
 * canned production-schedule.json when ERPNext is unavailable.
 */
import Link from "next/link";
import { Calendar, CircleDot, ArrowLeft } from "lucide-react";
import { getShipSchedule } from "@/lib/erpnext-live";
import { ShipScheduleClient } from "@/components/ship-schedule/ShipScheduleClient";

export const dynamic = "force-dynamic";

export default async function ShipSchedulePage() {
  const result = await getShipSchedule(70); // 10 weeks

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-[#064162] font-semibold hover:underline mb-4 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Shop Floor
      </Link>

      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#064162] flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#e69b40]" /> Ship Schedule
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Bottleneck detection across upcoming ship dates. Auto-flagged red / amber / normal.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span
            className={`px-2 py-1 rounded-full border ${
              result.source === "live"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-600 border-slate-300"
            }`}
          >
            <CircleDot className="w-3 h-3 inline-block mr-1 -mt-0.5" />
            {result.source === "live" ? "Live ERPNext" : "Canned fallback"}
          </span>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        <Chip label="Total Jobs" value={result.totalJobs.toLocaleString()} />
        <Chip label="Unique Ship Dates" value={result.uniqueDates.toLocaleString()} />
        <Chip
          label="High-risk days"
          value={result.highDays.toLocaleString()}
          icon="🔴"
          tone="high"
        />
        <Chip
          label="Medium days"
          value={result.mediumDays.toLocaleString()}
          icon="🟡"
          tone="medium"
        />
        <Chip
          label="Normal days"
          value={result.normalDays.toLocaleString()}
          icon="⚪"
          tone="normal"
        />
      </div>

      <ShipScheduleClient groups={result.data} />
    </div>
  );
}

function Chip({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon?: string;
  tone?: "default" | "high" | "medium" | "normal";
}) {
  const toneClass =
    tone === "high"
      ? "border-red-200 bg-red-50 text-red-800"
      : tone === "medium"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : tone === "normal"
          ? "border-slate-200 bg-slate-50 text-slate-700"
          : "border-slate-200 bg-white text-slate-800";
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${toneClass}`}>
      {icon && <span aria-hidden>{icon}</span>}
      <span className="text-xs uppercase tracking-wide opacity-75">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );
}
