"use client";

import { useState } from "react";
import Link from "next/link";
import { fmtMoney, pmSlug } from "@/lib/pmo-rollup";

interface DriftRow {
  jobName: string;
  shortJobNo: number | string | null;
  pm: string | null;
  contractValue: number;
  spectrumCv: number;
  delta: number;
  absDelta: number;
  pctOfCv: number;
}

type Bucket = "all" | "10k" | "50k" | "250k";
const BUCKETS: Array<{ key: Bucket; label: string; min: number }> = [
  { key: "all", label: "All drifts", min: 0 },
  { key: "10k", label: "≥ $10k", min: 10_000 },
  { key: "50k", label: "≥ $50k", min: 50_000 },
  { key: "250k", label: "≥ $250k", min: 250_000 },
];

export function DriftFilterClient({ rows }: { rows: DriftRow[] }) {
  const [bucket, setBucket] = useState<Bucket>("all");
  const [sortBy, setSortBy] = useState<"abs" | "pct">("abs");
  const min = BUCKETS.find((b) => b.key === bucket)?.min ?? 0;
  const filtered = rows
    .filter((r) => r.absDelta >= min)
    .sort((a, b) => (sortBy === "abs" ? b.absDelta - a.absDelta : Math.abs(b.pctOfCv) - Math.abs(a.pctOfCv)));

  // For the overlay bar — we scale against the max contract value in view.
  const maxBarValue = Math.max(
    ...filtered.map((r) => Math.max(r.contractValue, r.spectrumCv)),
    1,
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Threshold:</span>
        <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5">
          {BUCKETS.map((b) => (
            <button
              key={b.key}
              onClick={() => setBucket(b.key)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                bucket === b.key ? "bg-[#e69b40] text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
        <span className="ml-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Sort by:</span>
        <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5">
          {(["abs", "pct"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                sortBy === s ? "bg-[#064162] text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {s === "abs" ? "|Δ|" : "% of CV"}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[11px] text-slate-500">
          {filtered.length} project{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#064162] text-white">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Project</th>
                <th className="text-left px-3 py-2 font-semibold">PM</th>
                <th className="text-right px-3 py-2 font-semibold whitespace-nowrap">Smartsheet CV</th>
                <th className="text-right px-3 py-2 font-semibold whitespace-nowrap">Spectrum CV</th>
                <th className="text-left px-3 py-2 font-semibold" style={{ width: "32%" }}>
                  Visual
                </th>
                <th className="text-right px-3 py-2 font-semibold">Δ</th>
                <th className="text-right px-3 py-2 font-semibold">% of CV</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const slug = pmSlug(r.pm);
                const cvPct = (r.contractValue / maxBarValue) * 100;
                const spectrumPct = (r.spectrumCv / maxBarValue) * 100;
                const deltaPositive = r.delta > 0;
                return (
                  <tr
                    key={`${r.shortJobNo}-${i}`}
                    className={`border-t border-slate-100 hover:bg-[#fdf2e3]/60 ${i % 2 ? "bg-slate-50/50" : ""}`}
                  >
                    <td className="px-3 py-2 font-semibold text-[#064162]">
                      <Link
                        href={`/arch/projects/${encodeURIComponent(`${r.shortJobNo ?? ""}-${r.jobName.replace(/[^a-zA-Z0-9]+/g, "-")}`)}`}
                        className="hover:underline"
                      >
                        {r.jobName}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {slug ? (
                        <Link href={`/arch/pm/${slug}`} className="hover:text-[#064162] hover:underline">
                          {r.pm}
                        </Link>
                      ) : (
                        r.pm ?? "—"
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(r.contractValue, true)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(r.spectrumCv, true)}</td>
                    <td className="px-3 py-2">
                      <div className="relative h-4 bg-slate-100 rounded">
                        {/* Smartsheet bar (slate) */}
                        <div
                          className="absolute top-0 left-0 h-4 bg-slate-400 rounded-l"
                          style={{ width: `${cvPct}%` }}
                          title={`Smartsheet: ${fmtMoney(r.contractValue, true)}`}
                        />
                        {/* Spectrum overlay (gold with transparency) */}
                        <div
                          className="absolute top-0 left-0 h-4 bg-[#e69b40]/75 rounded-l ring-1 ring-white"
                          style={{ width: `${spectrumPct}%` }}
                          title={`Spectrum: ${fmtMoney(r.spectrumCv, true)}`}
                        />
                      </div>
                    </td>
                    <td
                      className={`px-3 py-2 text-right tabular-nums font-bold ${deltaPositive ? "text-amber-700" : "text-rose-700"}`}
                    >
                      {deltaPositive ? "+" : ""}
                      {fmtMoney(r.delta, true)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right tabular-nums ${Math.abs(r.pctOfCv) > 0.1 ? "font-bold text-rose-700" : Math.abs(r.pctOfCv) > 0.02 ? "text-amber-700" : "text-slate-500"}`}
                    >
                      {r.pctOfCv === 0 ? "—" : `${(r.pctOfCv * 100).toFixed(1)}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            No projects above this threshold. Drop the filter to see all drifts.
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center gap-4 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 bg-slate-400 rounded-sm" />
            Smartsheet CV
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 bg-[#e69b40]/75 rounded-sm" />
            Spectrum CV
          </div>
          <div className="text-slate-400 italic">Bar lengths relative to largest visible CV.</div>
        </div>
      )}
    </div>
  );
}
