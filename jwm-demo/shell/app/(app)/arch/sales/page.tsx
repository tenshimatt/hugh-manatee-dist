/**
 * /arch/sales — JWM Architectural Sales pipeline board.
 *
 * Kanban-style by Stage. Canned-first (1,952 opportunities from Chris's
 * 2026-04-20 xlsx drop) with an ERPNext Opportunity live-fetch hook
 * already wired in `lib/arch-sales.ts`.
 */
import { Handshake, CircleDot } from "lucide-react";
import { getOpportunities, computeKpis, fmtUsd } from "@/lib/arch-sales";
import { SalesBoardClient } from "@/components/sales/SalesBoardClient";

export const dynamic = "force-dynamic";

export default async function ArchSalesPage() {
  const board = await getOpportunities();
  const kpis = computeKpis(board.opportunities);

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[#e69b40] text-xs font-bold uppercase tracking-widest">
            <Handshake className="w-4 h-4" /> Architectural · Sales
          </div>
          <h1 className="text-3xl font-bold text-[#064162] tracking-tight">
            Sales Pipeline — {kpis.totalCount.toLocaleString()} opportunities
          </h1>
          <p className="text-slate-500 mt-1 max-w-3xl">
            JWM's 4-year sales funnel in one pane. Active + Submitted on the left —
            the work in flight right now. Won / Lost / No Bid rows paginated. Click any
            card for the full opportunity detail.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span
            className={`px-2 py-1 rounded-full border ${
              board.source === "live"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-600 border-slate-300"
            }`}
          >
            <CircleDot className="w-3 h-3 inline-block mr-1 -mt-0.5" />
            {board.source === "live" ? "Live ERPNext (Opportunity)" : "Canned fallback"}
          </span>
        </div>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Kpi label="Active" value={kpis.activeCount.toString()} sub={fmtUsd(kpis.activeValue)} tone="gold" />
        <Kpi label="Submitted" value={kpis.submittedCount.toString()} sub={fmtUsd(kpis.submittedValue)} tone="navy" />
        <Kpi label="Won" value={kpis.wonCount.toString()} sub={fmtUsd(kpis.wonValue)} tone="green" />
        <Kpi label="Lost" value={kpis.lostCount.toString()} tone="red" />
        <Kpi label="Pipeline $" value={fmtUsd(kpis.totalPipeline)} tone="gold" />
        <Kpi label="Win rate (12mo)" value={`${(kpis.winRate12mo * 100).toFixed(1)}%`} tone="gold" />
      </div>

      <SalesBoardClient opportunities={board.opportunities} />
    </div>
  );
}

function Kpi({
  label, value, sub, tone = "slate",
}: {
  label: string; value: string; sub?: string; tone?: "slate" | "navy" | "gold" | "green" | "red";
}) {
  const color =
    tone === "navy" ? "text-[#064162]" :
    tone === "gold" ? "text-[#e69b40]" :
    tone === "green" ? "text-emerald-700" :
    tone === "red" ? "text-red-700" :
    "text-slate-700";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
      <div className={`mt-0.5 text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">{sub}</div>}
    </div>
  );
}
