/**
 * /arch/sales/leaders/[slug] — single-estimator dashboard.
 *
 * Drill-down from /arch/sales/leaders. Headline GP + win rate + active deals
 * + biggest 5 in flight + closed history.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trophy, AlertTriangle } from "lucide-react";
import {
  getOpportunities,
  computeEstimatorStats,
  fmtUsd,
  initials,
  stageColour,
  type Opportunity,
} from "@/lib/arch-sales";

export const dynamic = "force-dynamic";

export default async function EstimatorDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const board = await getOpportunities();
  const stats = computeEstimatorStats(board.opportunities);
  const me = stats.find((s) => s.slug === decoded);
  if (!me) notFound();

  const myOpps = board.opportunities.filter((o) => (o.estimator ?? "Unassigned") === me.estimator);
  const inFlight = myOpps.filter((o) => o.stage === "Active" || o.stage === "Submitted")
    .sort((a, b) => (b.totalBidValue ?? 0) - (a.totalBidValue ?? 0));
  const recentClosed = myOpps.filter((o) => o.stage === "Won" || o.stage === "Lost")
    .sort((a, b) => {
      const ad = Date.parse(a.wonLostDate ?? "") || 0;
      const bd = Date.parse(b.wonLostDate ?? "") || 0;
      return bd - ad;
    })
    .slice(0, 10);

  const drift = me.marginDelta;
  const driftFlag = Math.abs(drift) > 0.05;

  return (
    <div className="space-y-5">
      <Link href="/arch/sales/leaders" className="inline-flex items-center gap-2 text-[#064162] font-semibold hover:underline text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Leaders
      </Link>

      {/* Hero */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-3 bg-[#064162] text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Trophy className="w-4 h-4" /> Estimator
        </div>
        <div className="p-6 flex items-center gap-4">
          <span className="w-14 h-14 rounded-full bg-[#064162] text-white flex items-center justify-center text-xl font-bold ring-4 ring-[#fdf2e3]">
            {initials(me.estimator)}
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-[#064162] tracking-tight">{me.estimator}</h1>
            <div className="text-sm text-slate-500 mt-0.5">
              {me.active} active · {me.submitted} submitted · {me.won} won lifetime · {me.lost} lost
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Pipeline value</div>
            <div className="text-3xl font-bold text-[#e69b40] tabular-nums">{fmtUsd(me.pipelineValue, true)}</div>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label="Win rate" value={me.won + me.lost > 0 ? `${(me.winRate * 100).toFixed(0)}%` : "—"} tone="navy" />
        <Kpi label="Won $ lifetime" value={fmtUsd(me.wonValue, true)} tone="green" />
        <Kpi label="Sold margin" value={me.avgSoldMargin > 0 ? `${(me.avgSoldMargin * 100).toFixed(1)}%` : "—"} tone="green" />
        <Kpi label="WIP margin" value={me.avgWipMargin > 0 ? `${(me.avgWipMargin * 100).toFixed(1)}%` : "—"} tone="gold" />
        <Kpi
          label="Sold − WIP"
          value={me.avgSoldMargin > 0 && me.avgWipMargin > 0 ? `${drift >= 0 ? "+" : ""}${(drift * 100).toFixed(1)}pp` : "—"}
          tone={driftFlag ? "red" : "slate"}
          accent={driftFlag}
        />
      </div>

      {driftFlag && (
        <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-700 flex-shrink-0" />
          <div className="text-sm text-amber-900">
            <strong>Margin drift &gt; 5pp.</strong>{" "}
            {drift < 0
              ? "Sold margin is below WIP margin — closed deals are coming in tighter than bids. Discounting in negotiation?"
              : "Sold margin exceeds WIP — closed deals are richer than current pipeline. Bidding too cautiously?"}
          </div>
        </div>
      )}

      {/* In flight */}
      <Panel title={`In-flight bids (${inFlight.length})`}>
        {inFlight.length === 0 ? (
          <div className="text-sm text-slate-500 text-center py-6">No active or submitted bids.</div>
        ) : (
          <div className="space-y-1.5">
            {inFlight.slice(0, 12).map((o) => (
              <DealRow key={o.id} o={o} />
            ))}
            {inFlight.length > 12 && (
              <div className="text-xs text-slate-400 text-center pt-2">+ {inFlight.length - 12} more</div>
            )}
          </div>
        )}
      </Panel>

      {/* Recent closes */}
      <Panel title="Recent closes (last 10)">
        {recentClosed.length === 0 ? (
          <div className="text-sm text-slate-500 text-center py-6">No closes on record.</div>
        ) : (
          <div className="space-y-1.5">
            {recentClosed.map((o) => <DealRow key={o.id} o={o} />)}
          </div>
        )}
      </Panel>
    </div>
  );
}

function DealRow({ o }: { o: Opportunity }) {
  const col = stageColour(o.stage);
  return (
    <Link
      href={`/arch/sales/${encodeURIComponent(o.id)}`}
      className="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-200 hover:border-[#064162]/40 hover:bg-[#fdf2e3]/40"
    >
      <span
        className="text-[10px] font-bold px-2 py-0.5 rounded uppercase text-white tracking-wider min-w-[58px] text-center"
        style={{ backgroundColor: col.bg }}
      >
        {o.stage}
      </span>
      <span className="flex-1 min-w-0 truncate text-sm font-semibold text-[#064162]">{o.projectName}</span>
      {o.company && <span className="text-xs text-slate-500 truncate hidden md:inline max-w-[200px]">{o.company}</span>}
      <span className="text-sm tabular-nums font-bold text-[#e69b40]">{fmtUsd(o.totalBidValue, true)}</span>
    </Link>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="px-4 py-2 border-b border-slate-100">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">{title}</h2>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Kpi({
  label, value, tone = "slate", accent,
}: {
  label: string; value: string; tone?: "slate" | "navy" | "gold" | "green" | "red"; accent?: boolean;
}) {
  const color =
    tone === "navy" ? "text-[#064162]" :
    tone === "gold" ? "text-[#e69b40]" :
    tone === "green" ? "text-emerald-700" :
    tone === "red" ? "text-rose-700" :
    "text-slate-700";
  return (
    <div
      className={`rounded-xl border p-3 shadow-sm ${
        accent ? "bg-amber-50 border-amber-300" : "bg-white border-slate-200"
      }`}
    >
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
      <div className={`mt-0.5 text-2xl font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
