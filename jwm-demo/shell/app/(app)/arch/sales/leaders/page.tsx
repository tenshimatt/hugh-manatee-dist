/**
 * /arch/sales/leaders — per-estimator leaderboard.
 *
 * Auto-derived from the Arch Sales pipeline (1,952 opps). One row per
 * estimator: pipeline $, win rate, sold vs WIP margin, drift flag.
 */
import Link from "next/link";
import { Trophy, ArrowLeft, ArrowRight, AlertTriangle } from "lucide-react";
import { getOpportunities, computeEstimatorStats, fmtUsd } from "@/lib/arch-sales";

export const dynamic = "force-dynamic";

export default async function LeadersIndexPage() {
  const board = await getOpportunities();
  const stats = computeEstimatorStats(board.opportunities);

  return (
    <div className="space-y-5">
      <Link href="/arch/sales" className="inline-flex items-center gap-2 text-[#064162] font-semibold hover:underline text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Sales Pipeline
      </Link>

      <header>
        <div className="flex items-center gap-2 text-[#e69b40] text-xs font-bold uppercase tracking-widest">
          <Trophy className="w-4 h-4" /> Sales · Leaders
        </div>
        <h1 className="text-3xl font-bold text-[#064162] tracking-tight">
          Estimator leaderboard — {stats.length}
        </h1>
        <p className="text-slate-500 mt-1 max-w-3xl">
          Per-estimator pipeline, win rate, and the gap between margin sold and margin WIP. A
          large gap means we&rsquo;re winning at lower margins than we bid — early signal of
          discounting drift.
        </p>
      </header>

      <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#064162] text-white">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Estimator</th>
                <th className="text-right px-3 py-2 font-semibold">Active</th>
                <th className="text-right px-3 py-2 font-semibold">Submitted</th>
                <th className="text-right px-3 py-2 font-semibold whitespace-nowrap">Pipeline $</th>
                <th className="text-right px-3 py-2 font-semibold">Won</th>
                <th className="text-right px-3 py-2 font-semibold">Lost</th>
                <th className="text-right px-3 py-2 font-semibold">Win %</th>
                <th className="text-right px-3 py-2 font-semibold whitespace-nowrap">Sold M%</th>
                <th className="text-right px-3 py-2 font-semibold whitespace-nowrap">WIP M%</th>
                <th className="text-right px-3 py-2 font-semibold whitespace-nowrap">Δ pp</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => {
                const drift = s.marginDelta;
                const driftClass = Math.abs(drift) > 0.05 ? "text-rose-700 font-bold" : Math.abs(drift) > 0.02 ? "text-amber-700" : "text-slate-500";
                return (
                  <tr key={s.estimator} className={`border-t border-slate-100 hover:bg-[#fdf2e3]/60 ${i % 2 ? "bg-slate-50/50" : ""}`}>
                    <td className="px-3 py-2 font-semibold text-[#064162]">
                      <Link href={`/arch/sales/leaders/${encodeURIComponent(s.slug)}`} className="hover:underline">
                        {s.estimator}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.active}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.submitted}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-[#e69b40]">{fmtUsd(s.pipelineValue, true)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-emerald-700">{s.won}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-rose-700">{s.lost}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.won + s.lost > 0 ? `${(s.winRate * 100).toFixed(0)}%` : "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.avgSoldMargin > 0 ? `${(s.avgSoldMargin * 100).toFixed(1)}%` : "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.avgWipMargin > 0 ? `${(s.avgWipMargin * 100).toFixed(1)}%` : "—"}</td>
                    <td className={`px-3 py-2 text-right tabular-nums ${driftClass}`}>
                      {s.avgSoldMargin > 0 && s.avgWipMargin > 0 ? `${drift >= 0 ? "+" : ""}${(drift * 100).toFixed(1)}` : "—"}
                      {Math.abs(drift) > 0.05 && s.avgSoldMargin > 0 && s.avgWipMargin > 0 && (
                        <AlertTriangle className="w-3 h-3 inline-block ml-1 text-rose-600" />
                      )}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <Link href={`/arch/sales/leaders/${encodeURIComponent(s.slug)}`} className="text-[#064162] hover:text-[#0a5480]">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
