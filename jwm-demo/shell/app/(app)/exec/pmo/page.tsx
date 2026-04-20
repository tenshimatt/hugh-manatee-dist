/**
 * /exec/pmo — Cross-project PMO Rollup.
 *
 * Chris's "one pane to sweep 116 projects without opening each dashboard."
 * Derived from the 2026-04-20 xlsx export; Phase-2 swaps in live ERPNext
 * Project records (JWM1451-121 seeds them).
 */
import { PMOTable } from "@/components/exec/PMOTable";
import { PMO_ROWS, pmoTotals, fmtMoney, fmtPct } from "@/lib/pmo-rollup";
import { CircleDot, LineChart, TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ExecPMOPage() {
  const active = PMO_ROWS.filter((r) => !r.archived);
  const t = pmoTotals(active);

  // Aggregate budget health — Red if any project is Red OR > 10% are Amber.
  const redCount = t.budgetHealth.Red;
  const amberCount = t.budgetHealth.Amber;
  const aggregateBudgetHealth: "Green" | "Amber" | "Red" =
    redCount > 0 ? "Red" : amberCount > Math.max(5, active.length * 0.1) ? "Amber" : "Green";

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[#e69b40] text-xs font-bold uppercase tracking-widest">
            <LineChart className="w-4 h-4" /> Executive · PMO
          </div>
          <h1 className="text-3xl font-bold text-[#064162] tracking-tight">
            PMO Rollup — {active.length} active projects
          </h1>
          <p className="text-slate-500 mt-1 max-w-3xl">
            Cross-project health, budget, margin, and change-order exposure. Same data Chris
            scans every morning — one row per job, sortable + filterable. Click a row to open
            the Project Dashboard.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="px-2 py-1 rounded-full border bg-slate-100 text-slate-600 border-slate-300">
            <CircleDot className="w-3 h-3 inline-block mr-1 -mt-0.5" />
            Canned (Phase 1 — live ERPNext Project records inbound)
          </span>
        </div>
      </header>

      {/* KPI strip — headline totals from the xlsx Summary sheet */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        <Kpi label="Contract value" value={fmtMoney(t.contractValue, true)} tone="navy" icon={DollarSign} />
        <Kpi label="Current budget" value={fmtMoney(t.currentBudget, true)} />
        <Kpi label="Billed to date" value={fmtMoney(t.billedToDate, true)} />
        <Kpi label="Profit" value={fmtMoney(t.profit, true)} tone="gold" icon={TrendingUp} />
        <Kpi label="Avg margin" value={fmtPct(t.margin, 1)} tone="gold" icon={Percent} />
        <Kpi
          label="Budget health"
          value={aggregateBudgetHealth}
          tone={aggregateBudgetHealth === "Red" ? "red" : aggregateBudgetHealth === "Amber" ? "amber" : "green"}
          icon={aggregateBudgetHealth === "Red" ? TrendingDown : TrendingUp}
        />
      </div>

      {/* Secondary metrics row — health breakdown + CO + backlog */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <HealthBox
          label="Job Health"
          g={t.jobHealth.Green} a={t.jobHealth.Amber} r={t.jobHealth.Red}
        />
        <HealthBox
          label="Budget Health"
          g={t.budgetHealth.Green} a={t.budgetHealth.Amber} r={t.budgetHealth.Red}
        />
        <Kpi label="Backlog" value={fmtMoney(t.backlog, true)} />
        <Kpi label="Spectrum drift" value={fmtMoney(t.spectrumDelta, true)} tone={Math.abs(t.spectrumDelta) > 100000 ? "amber" : "slate"} />
      </div>

      {/* Main table */}
      <PMOTable rows={active} />
    </div>
  );
}

function Kpi({
  label,
  value,
  tone = "slate",
  icon: Icon,
}: {
  label: string;
  value: string;
  tone?: "slate" | "navy" | "gold" | "green" | "amber" | "red";
  icon?: typeof LineChart;
}) {
  const color =
    tone === "navy" ? "text-[#064162]" :
    tone === "gold" ? "text-[#e69b40]" :
    tone === "green" ? "text-emerald-700" :
    tone === "amber" ? "text-amber-700" :
    tone === "red" ? "text-red-700" :
    "text-slate-700";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
        {Icon && <Icon className={`w-3.5 h-3.5 ${color}`} />}
      </div>
      <div className={`mt-0.5 text-2xl font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function HealthBox({ label, g, a, r }: { label: string; g: number; a: number; r: number }) {
  const total = g + a + r || 1;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
      <div className="flex items-center gap-3 mt-1">
        <div className="flex-1 flex h-2 rounded-full overflow-hidden bg-slate-100">
          <div className="bg-emerald-500" style={{ width: `${(g / total) * 100}%` }} />
          <div className="bg-amber-500"   style={{ width: `${(a / total) * 100}%` }} />
          <div className="bg-red-500"     style={{ width: `${(r / total) * 100}%` }} />
        </div>
        <div className="flex gap-2 text-[11px] tabular-nums font-semibold">
          <span className="text-emerald-700">{g}</span>
          <span className="text-amber-700">{a}</span>
          <span className="text-red-700">{r}</span>
        </div>
      </div>
    </div>
  );
}
