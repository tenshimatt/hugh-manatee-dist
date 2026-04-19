"use client";

/**
 * /shop/efficiency — Daily Efficiency Dashboard
 *
 * Mirrors the Daily Efficiency Log.xlsx that Drew + team maintain by hand.
 * Surfaces his 6 KPIs (efficiency by op / material / operator, est-vs-actual
 * labour + material, part performance history) as tabs, plus a 14-day trend
 * and a sortable table of today's entries.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Plus, TrendingUp, TrendingDown, Minus, Award, AlertTriangle, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Kpi = { key: string; eff: number; count: number };
type KpiEstActual = { key: string; est: number; act: number; count: number };
type KpiMaterial = { key: string; planned: number; actual: number; scrap: number; count: number };
type PartHist = {
  key: string;
  eff: number;
  count: number;
  trend: { date: string; eff: number }[];
};

interface Stats {
  as_of: string;
  today: {
    date: string;
    overall_eff: number;
    best_operator: string;
    best_operator_eff: number;
    worst_workstation: string;
    worst_workstation_eff: number;
    variance_vs_baseline: number;
    baseline: number;
  };
  trend: { date: string; eff: number; count: number }[];
  drew_kpis: {
    by_operation: Kpi[];
    by_material: Kpi[];
    by_operator: Kpi[];
    by_workstation: Kpi[];
    est_vs_actual_labour: KpiEstActual[];
    est_vs_actual_material: KpiMaterial[];
    part_history: PartHist[];
  };
}

interface EffEvent {
  id: string;
  date: string;
  shift: string;
  workstation: string;
  workstation_label: string;
  division: string;
  operation: string;
  operator: string;
  material?: string;
  part?: string;
  planned_qty: number;
  actual_qty: number;
  planned_hours: number;
  actual_hours: number;
  scrap_qty?: number;
  efficiency_pct: number;
  notes?: string;
}

const KPI_TABS = [
  { id: "by_operation", label: "By Operation" },
  { id: "by_material", label: "By Material" },
  { id: "by_operator", label: "By Operator" },
  { id: "est_vs_actual_labour", label: "Est vs Actual Labour" },
  { id: "est_vs_actual_material", label: "Est vs Actual Material" },
  { id: "part_history", label: "Part History" },
] as const;

type TabId = (typeof KPI_TABS)[number]["id"];

function effColor(eff: number): string {
  if (eff >= 100) return "text-emerald-700";
  if (eff >= 90) return "text-amber-700";
  return "text-red-700";
}
function effBg(eff: number): string {
  if (eff >= 100) return "bg-emerald-100 text-emerald-900";
  if (eff >= 90) return "bg-amber-100 text-amber-900";
  return "bg-red-100 text-red-900";
}

export default function EfficiencyPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<EffEvent[]>([]);
  const [tab, setTab] = useState<TabId>("by_operation");
  const [filterWs, setFilterWs] = useState<string>("all");
  const [filterOperator, setFilterOperator] = useState<string>("all");
  const [sortKey, setSortKey] = useState<keyof EffEvent>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  async function reload() {
    const [s, l] = await Promise.all([
      fetch("/api/efficiency/stats").then((r) => r.json()),
      fetch("/api/efficiency/list").then((r) => r.json()),
    ]);
    setStats(s);
    setEvents(l.events);
  }

  useEffect(() => {
    reload();
  }, []);

  const todaysDate = stats?.today?.date;
  const todaysEvents = useMemo(
    () => events.filter((e) => e.date === todaysDate),
    [events, todaysDate]
  );

  const filteredTable = useMemo(() => {
    let out = todaysEvents;
    if (filterWs !== "all") out = out.filter((e) => e.workstation === filterWs);
    if (filterOperator !== "all") out = out.filter((e) => e.operator === filterOperator);
    const sorted = [...out].sort((a, b) => {
      const av = a[sortKey] as string | number;
      const bv = b[sortKey] as string | number;
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [todaysEvents, filterWs, filterOperator, sortKey, sortDir]);

  const wsOptions = useMemo(
    () =>
      [...new Set(events.map((e) => `${e.workstation}|${e.workstation_label}`))].sort(),
    [events]
  );
  const operatorOptions = useMemo(
    () => [...new Set(events.map((e) => e.operator))].sort(),
    [events]
  );

  if (!stats)
    return <div className="p-8 text-slate-500">Loading efficiency…</div>;

  return (
    <div className="p-6 space-y-5 max-w-none">
      {/* --- Header --- */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Daily Efficiency Log
          </div>
          <h1 className="text-2xl font-bold text-[#064162] tracking-tight">
            Efficiency — {stats.today.date}
          </h1>
          <p className="text-sm text-slate-600">
            Drew&apos;s 6 KPIs, live. Baseline = 14-day rolling average (
            {stats.today.baseline.toFixed(1)}%).
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/shop/efficiency/new">
            <Button className="gap-2 bg-[#064162] hover:bg-[#0a5480]">
              <Plus className="w-4 h-4" />
              Log efficiency event
            </Button>
          </Link>
        </div>
      </div>

      {/* --- KPI Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Today's Overall Efficiency"
          value={`${stats.today.overall_eff.toFixed(1)}%`}
          valueColor={effColor(stats.today.overall_eff)}
          icon={<Activity className="w-5 h-5" />}
          accent="navy"
        />
        <KpiCard
          label="Best Operator Today"
          value={stats.today.best_operator}
          sub={`${stats.today.best_operator_eff.toFixed(1)}% efficiency`}
          icon={<Award className="w-5 h-5" />}
          accent="green"
        />
        <KpiCard
          label="Worst Workstation Today"
          value={stats.today.worst_workstation}
          sub={`${stats.today.worst_workstation_eff.toFixed(1)}% efficiency`}
          icon={<AlertTriangle className="w-5 h-5" />}
          accent="red"
        />
        <KpiCard
          label="Variance vs Baseline"
          value={`${
            stats.today.variance_vs_baseline > 0 ? "+" : ""
          }${stats.today.variance_vs_baseline.toFixed(1)}%`}
          valueColor={
            stats.today.variance_vs_baseline > 0
              ? "text-emerald-700"
              : stats.today.variance_vs_baseline < 0
              ? "text-red-700"
              : "text-slate-700"
          }
          icon={
            stats.today.variance_vs_baseline > 0 ? (
              <TrendingUp className="w-5 h-5" />
            ) : stats.today.variance_vs_baseline < 0 ? (
              <TrendingDown className="w-5 h-5" />
            ) : (
              <Minus className="w-5 h-5" />
            )
          }
          accent={
            stats.today.variance_vs_baseline > 0
              ? "green"
              : stats.today.variance_vs_baseline < 0
              ? "red"
              : "slate"
          }
        />
      </div>

      {/* --- Trend chart --- */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            14-day efficiency trend
          </h3>
          <div className="text-xs text-slate-500">
            Baseline: {stats.today.baseline.toFixed(1)}%
          </div>
        </div>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <LineChart data={stats.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[60, 120]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip
                formatter={(v: unknown) => `${Number(v).toFixed(1)}%`}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <ReferenceLine
                y={stats.today.baseline}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{ value: "baseline", fontSize: 10, fill: "#64748b" }}
              />
              <Line
                type="monotone"
                dataKey="eff"
                stroke="#064162"
                strokeWidth={2}
                dot={{ r: 3, fill: "#e69b40" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- Drew's 6 KPI tabs --- */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="border-b border-slate-200 px-3 pt-2 flex flex-wrap gap-1 overflow-x-auto">
          {KPI_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap",
                tab === t.id
                  ? "bg-[#064162] text-white"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="p-5">
          <KpiTabBody tab={tab} stats={stats} />
        </div>
      </div>

      {/* --- Today's entries table --- */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700">
            Today&apos;s entries ({filteredTable.length})
          </h3>
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={filterWs}
              onChange={(e) => setFilterWs(e.target.value)}
              className="h-8 text-xs border border-slate-300 rounded-lg px-2 bg-white"
            >
              <option value="all">All workstations</option>
              {wsOptions.map((s) => {
                const [v, l] = s.split("|");
                return (
                  <option key={v} value={v}>
                    {l}
                  </option>
                );
              })}
            </select>
            <select
              value={filterOperator}
              onChange={(e) => setFilterOperator(e.target.value)}
              className="h-8 text-xs border border-slate-300 rounded-lg px-2 bg-white"
            >
              <option value="all">All operators</option>
              {operatorOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider">
              <tr>
                {(
                  [
                    ["operator", "Operator"],
                    ["workstation_label", "Workstation"],
                    ["operation", "Operation"],
                    ["shift", "Shift"],
                    ["planned_qty", "Plan Qty"],
                    ["actual_qty", "Act Qty"],
                    ["planned_hours", "Plan Hrs"],
                    ["actual_hours", "Act Hrs"],
                    ["efficiency_pct", "Eff %"],
                  ] as [keyof EffEvent, string][]
                ).map(([k, l]) => (
                  <th
                    key={k}
                    onClick={() => {
                      if (sortKey === k)
                        setSortDir(sortDir === "asc" ? "desc" : "asc");
                      else {
                        setSortKey(k);
                        setSortDir("asc");
                      }
                    }}
                    className="px-3 py-2 text-left font-semibold cursor-pointer hover:bg-slate-100"
                  >
                    {l} {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                ))}
                <th className="px-3 py-2 text-left font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredTable.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-3 py-8 text-center text-slate-400"
                  >
                    No entries match filters.
                  </td>
                </tr>
              )}
              {filteredTable.map((e) => (
                <tr
                  key={e.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-3 py-2 font-medium">{e.operator}</td>
                  <td className="px-3 py-2">{e.workstation_label}</td>
                  <td className="px-3 py-2">{e.operation}</td>
                  <td className="px-3 py-2">{e.shift}</td>
                  <td className="px-3 py-2 tabular-nums">{e.planned_qty}</td>
                  <td className="px-3 py-2 tabular-nums">{e.actual_qty}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {e.planned_hours.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {e.actual_hours.toFixed(2)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "inline-block px-2 py-0.5 rounded font-semibold",
                        effBg(e.efficiency_pct)
                      )}
                    >
                      {e.efficiency_pct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-500 max-w-[220px] truncate">
                    {e.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  accent,
  valueColor,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: "navy" | "green" | "red" | "amber" | "slate";
  valueColor?: string;
}) {
  const bg =
    accent === "navy"
      ? "from-[#eaf3f8] to-white"
      : accent === "green"
      ? "from-emerald-50 to-white"
      : accent === "red"
      ? "from-red-50 to-white"
      : accent === "amber"
      ? "from-amber-50 to-white"
      : "from-slate-50 to-white";
  const iconBg =
    accent === "navy"
      ? "bg-[#064162] text-white"
      : accent === "green"
      ? "bg-emerald-600 text-white"
      : accent === "red"
      ? "bg-red-600 text-white"
      : accent === "amber"
      ? "bg-amber-500 text-white"
      : "bg-slate-500 text-white";

  return (
    <div
      className={cn(
        "bg-gradient-to-br border border-slate-200 rounded-2xl shadow-sm p-4 flex items-start gap-3",
        bg
      )}
    >
      <div className={cn("rounded-xl p-2 flex-shrink-0", iconBg)}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </div>
        <div
          className={cn(
            "text-xl font-bold tracking-tight truncate",
            valueColor || "text-[#064162]"
          )}
        >
          {value}
        </div>
        {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function KpiTabBody({ tab, stats }: { tab: TabId; stats: Stats }) {
  const k = stats.drew_kpis;
  if (tab === "by_operation" || tab === "by_material" || tab === "by_operator") {
    const data =
      tab === "by_operation"
        ? k.by_operation
        : tab === "by_material"
        ? k.by_material
        : k.by_operator;
    return <EffBarTable data={data} />;
  }
  if (tab === "est_vs_actual_labour") {
    return <EstActualLabour data={k.est_vs_actual_labour} />;
  }
  if (tab === "est_vs_actual_material") {
    return <EstActualMaterial data={k.est_vs_actual_material} />;
  }
  if (tab === "part_history") {
    return <PartHistoryView data={k.part_history} />;
  }
  return null;
}

function EffBarTable({ data }: { data: Kpi[] }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <BarChart data={data.slice(0, 12)} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" domain={[0, 120]} tick={{ fontSize: 11 }} unit="%" />
            <YAxis
              type="category"
              dataKey="key"
              tick={{ fontSize: 11 }}
              width={130}
            />
            <Tooltip formatter={(v: unknown) => `${Number(v).toFixed(1)}%`} />
            <Bar dataKey="eff" fill="#064162" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-y-auto max-h-80 border border-slate-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Key</th>
              <th className="px-3 py-2 text-right font-semibold">Eff</th>
              <th className="px-3 py-2 text-right font-semibold">n</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.key} className="border-t border-slate-100">
                <td className="px-3 py-1.5 truncate max-w-[240px]">{r.key}</td>
                <td
                  className={cn("px-3 py-1.5 text-right font-semibold", effColor(r.eff))}
                >
                  {r.eff.toFixed(1)}%
                </td>
                <td className="px-3 py-1.5 text-right text-slate-500 tabular-nums">
                  {r.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EstActualLabour({ data }: { data: KpiEstActual[] }) {
  return (
    <div style={{ width: "100%", height: 340 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="key" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={70} />
          <YAxis tick={{ fontSize: 11 }} unit="h" />
          <Tooltip />
          <Legend />
          <Bar dataKey="est" name="Estimated hours" fill="#94a3b8" />
          <Bar dataKey="act" name="Actual hours" fill="#e69b40" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EstActualMaterial({ data }: { data: KpiMaterial[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-3 py-2 text-left">Material</th>
            <th className="px-3 py-2 text-right">Planned Qty</th>
            <th className="px-3 py-2 text-right">Actual Qty</th>
            <th className="px-3 py-2 text-right">Scrap</th>
            <th className="px-3 py-2 text-right">Yield %</th>
            <th className="px-3 py-2 text-right">Events</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => {
            const yieldPct = r.planned
              ? Math.round(((r.actual - r.scrap) / r.planned) * 1000) / 10
              : 0;
            return (
              <tr key={r.key} className="border-t border-slate-100">
                <td className="px-3 py-1.5">{r.key}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{r.planned}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{r.actual}</td>
                <td className="px-3 py-1.5 text-right tabular-nums text-red-700">
                  {r.scrap || "—"}
                </td>
                <td
                  className={cn(
                    "px-3 py-1.5 text-right font-semibold",
                    effColor(yieldPct)
                  )}
                >
                  {yieldPct.toFixed(1)}%
                </td>
                <td className="px-3 py-1.5 text-right text-slate-500">{r.count}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PartHistoryView({ data }: { data: PartHist[] }) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {data.map((p) => (
        <div
          key={p.key}
          className="border border-slate-200 rounded-lg p-3 bg-slate-50"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="font-mono text-xs font-semibold text-slate-700 truncate max-w-[220px]">
              {p.key}
            </div>
            <span
              className={cn(
                "text-xs font-bold px-2 py-0.5 rounded",
                effBg(p.eff)
              )}
            >
              {p.eff.toFixed(1)}%
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mb-1">
            {p.count} runs · last {p.trend.length}
          </div>
          <div style={{ width: "100%", height: 40 }}>
            <ResponsiveContainer>
              <LineChart data={p.trend}>
                <Line
                  type="monotone"
                  dataKey="eff"
                  stroke="#064162"
                  strokeWidth={1.5}
                  dot={false}
                />
                <YAxis domain={[40, 140]} hide />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}
