/**
 * /exec/spectrum-drift — Spectrum vs Smartsheet reconciliation.
 *
 * JWM runs two systems of record: Spectrum (the incumbent ERP, general ledger
 * + WIP) and Smartsheet (operational day-to-day, what Chris looks at). A
 * `Spectrum CV` column in the PMO export + `Spectrum minus Smartsheet` delta
 * quantify drift per project. This page surfaces the worst-drifting rows and
 * makes the "why we replace Spectrum" case concrete.
 */
import Link from "next/link";
import { LineChart, CircleDot, ArrowLeft, AlertTriangle } from "lucide-react";
import { PMO_ROWS, fmtMoney, pmSlug } from "@/lib/pmo-rollup";
import { DriftFilterClient } from "@/components/exec/DriftFilterClient";

export const dynamic = "force-dynamic";

export default function SpectrumDriftPage() {
  const active = PMO_ROWS.filter((r) => !r.archived);

  // Build drift records — only projects with non-zero Spectrum CV and a delta.
  const rows = active
    .map((r) => {
      const delta = r.spectrumDelta ?? 0;
      const cv = r.contractValue ?? 0;
      const spectrumCv = r.spectrumCv ?? 0;
      const pctOfCv = cv > 0 ? delta / cv : 0;
      return {
        jobName: r.jobName,
        shortJobNo: r.shortJobNo,
        pm: r.pm,
        contractValue: cv,
        spectrumCv,
        delta,
        absDelta: Math.abs(delta),
        pctOfCv,
      };
    })
    .filter((r) => r.absDelta > 0)
    .sort((a, b) => b.absDelta - a.absDelta);

  const total = rows.reduce((s, r) => s + r.absDelta, 0);
  const over10k = rows.filter((r) => r.absDelta > 10_000).length;
  const over50k = rows.filter((r) => r.absDelta > 50_000).length;
  const over250k = rows.filter((r) => r.absDelta > 250_000).length;
  const avg = rows.length > 0 ? total / rows.length : 0;

  return (
    <div className="space-y-5">
      <Link
        href="/exec/arch"
        className="inline-flex items-center gap-2 text-[#064162] font-semibold hover:underline text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Exec Arch
      </Link>

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[#e69b40] text-xs font-bold uppercase tracking-widest">
            <LineChart className="w-4 h-4" /> Executive · Spectrum Drift
          </div>
          <h1 className="text-3xl font-bold text-[#064162] tracking-tight">
            Spectrum ⇄ Smartsheet reconciliation
          </h1>
          <p className="text-slate-500 mt-1 max-w-3xl">
            Per-project delta between Spectrum&rsquo;s contract value and Smartsheet&rsquo;s.
            {" "}Positive = Spectrum higher, negative = Smartsheet higher. This is the
            {" "}&ldquo;why we replace Spectrum&rdquo; case in one table.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="px-2 py-1 rounded-full border bg-slate-100 text-slate-600 border-slate-300">
            <CircleDot className="w-3 h-3 inline-block mr-1 -mt-0.5" />
            Canned — PMO xlsx 2026-04-20
          </span>
        </div>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label="Total drift (|Σ|)" value={fmtMoney(total, true)} tone="amber" accent />
        <Kpi label="Projects with drift" value={rows.length.toString()} />
        <Kpi label="> $10k" value={over10k.toString()} tone="amber" />
        <Kpi label="> $50k" value={over50k.toString()} tone="red" />
        <Kpi label="> $250k" value={over250k.toString()} tone="red" accent />
      </div>

      {rows.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-3">
          <div className="flex items-start gap-2 text-amber-900">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <strong>Drift is real.</strong> Average absolute delta per affected project
              is <span className="font-bold tabular-nums">{fmtMoney(avg, true)}</span>. Every
              row is a reconciliation the finance team resolves by hand today.
              Eliminating drift = single source of truth = the Spectrum-retirement thesis.
            </div>
          </div>
        </div>
      )}

      <DriftFilterClient rows={rows} />
    </div>
  );
}

function Kpi({
  label, value, tone = "slate", accent,
}: {
  label: string; value: string; tone?: "slate" | "amber" | "red"; accent?: boolean;
}) {
  const color =
    tone === "amber" ? "text-amber-700" :
    tone === "red" ? "text-red-700" :
    "text-slate-700";
  return (
    <div
      className={`rounded-xl border p-3 shadow-sm ${
        accent ? "bg-white border-amber-300" : "bg-white border-slate-200"
      }`}
    >
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
      <div className={`mt-0.5 text-2xl font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
