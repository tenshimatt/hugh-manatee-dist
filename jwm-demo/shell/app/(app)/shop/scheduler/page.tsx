"use client";

/**
 * /shop/scheduler — the JWM hand-rolled MES, reborn as a live grid.
 *
 * Mirrors the Excel layout from 1010_A_shop_Production_Schedule.xlsx and
 * 1040_T_Shop_Production_Schedule.xlsx: row = job, columns = workstations
 * in manufacturing sequence (PGM → FL/TL → PU → SHEAR → FM → MA → WE →
 * GRINDING → ASM → PEM → FIN → QA → OS → SHIP). Colour coding follows the
 * spreadsheet convention Drew uses: green = on track, amber = at risk, red =
 * behind, slate = pending/not started, blue = in progress, dark = complete.
 *
 * This is THE view Drew opens every morning. The point of the page is:
 * "same view, alive".
 */
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Filter, X, AlertTriangle, CheckCircle2, Clock, PauseCircle, GripVertical, Sliders, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type CellStatus =
  | "on_track"
  | "at_risk"
  | "behind"
  | "complete"
  | "in_progress"
  | "pending"
  | "hold";

interface Cell {
  scheduled_date: string;
  actual_date: string | null;
  status: CellStatus;
  hours_est: number;
}

interface Column {
  slug: string;
  label: string;
  division: string;
}

interface Job {
  id: string;
  customer: string;
  part: string;
  qty: number;
  due_date: string;
  division: "Processing" | "Architectural";
  status: "on_track" | "at_risk" | "behind" | "complete";
  cells: Record<string, Cell>;
}

interface Payload {
  columns: Column[];
  jobs: Job[];
  count: number;
}

const STATUS_CLASSES: Record<CellStatus, string> = {
  on_track: "bg-emerald-100 text-emerald-900 border-emerald-300",
  at_risk: "bg-amber-100 text-amber-900 border-amber-300",
  behind: "bg-red-100 text-red-900 border-red-300",
  complete: "bg-slate-700 text-white border-slate-800",
  in_progress: "bg-sky-100 text-sky-900 border-sky-300",
  pending: "bg-slate-50 text-slate-500 border-slate-200",
  hold: "bg-purple-100 text-purple-900 border-purple-300",
};

const STATUS_LABELS: Record<CellStatus, string> = {
  on_track: "On",
  at_risk: "Risk",
  behind: "Late",
  complete: "Done",
  in_progress: "WIP",
  pending: "—",
  hold: "HLD",
};

const JOB_STATUS_TONE: Record<Job["status"], "green" | "amber" | "red" | "slate"> = {
  on_track: "green",
  at_risk: "amber",
  behind: "red",
  complete: "slate",
};

/**
 * Priority scoring — five signals Chris surfaced on 2026-04-19:
 *  - Time to completion (how soon the ship date is)
 *  - Liquidated damages on the contract (LD penalty risk)
 *  - Material availability
 *  - Profitability (margin on the job)
 *  - Customer lateness history (have we been late on this customer before?)
 *
 * Each weight is 0..10 in the UI (stored 0..1 internally). Each signal
 * produces a 0..100 score, multiplied by its weight, summed. Higher total
 * = higher priority = appears earlier in the grid.
 *
 * Auto-sort replaces Drew's manual drag order when ON. Drag order is
 * preserved underneath so he can flip back anytime.
 */
interface PriorityWeights {
  time: number;       // 0..10, default 6
  ld: number;         // 0..10, default 8
  material: number;   // 0..10, default 5
  margin: number;     // 0..10, default 3
  lateness: number;   // 0..10, default 4
}
const DEFAULT_WEIGHTS: PriorityWeights = { time: 6, ld: 8, material: 5, margin: 3, lateness: 4 };
const WEIGHT_LABELS: Record<keyof PriorityWeights, { label: string; help: string }> = {
  time:     { label: "Time to completion",   help: "How soon the ship date is" },
  ld:       { label: "Liquidated damages",   help: "Contract LD penalty risk" },
  material: { label: "Material availability", help: "Material in stock / ready" },
  margin:   { label: "Profitability",        help: "Margin on the job" },
  lateness: { label: "Customer lateness",    help: "Have we been late on this customer before?" },
};

// Hash a job id to a deterministic 0..1 number — used as a demo-time proxy
// for signal data that's not yet in the live schema (LD flag, customer
// lateness history). Phase 2 replaces each proxy with a real Schedule Line
// field.
function hashSignal(jobId: string, salt: string): number {
  let h = 0;
  const s = jobId + "|" + salt;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h % 1000) / 1000;
}

function computePriorityScore(job: Job, w: PriorityWeights): number {
  // Time: closer due date → higher score. Use days-until-due.
  const now = Date.now();
  const due = new Date(job.due_date).getTime();
  const daysUntil = Math.max(0, (due - now) / 86400000);
  // 0 days = 100, 60+ days = 0. Linear clamp.
  const timeScore = Math.max(0, Math.min(100, 100 - (daysUntil / 60) * 100));

  // Liquidated damages proxy (0/1) — Phase-2: real LD flag field.
  const ldScore = hashSignal(job.id, "ld") > 0.65 ? 100 : 0;

  // Material availability proxy — fewer pending cells = more ready = lower score
  // (we care most about jobs where material IS ready so they can actually run).
  const totalCells = Object.values(job.cells).length || 1;
  const readyCells = Object.values(job.cells).filter(
    (c) => c.status === "on_track" || c.status === "in_progress" || c.status === "complete",
  ).length;
  const materialScore = (readyCells / totalCells) * 100;

  // Margin proxy — hashed 0..100. Phase-2: real margin_pct field.
  const marginScore = Math.round(hashSignal(job.id, "margin") * 100);

  // Customer lateness proxy — hashed 0..100. Phase-2: customer history query.
  const latenessScore = Math.round(hashSignal(job.customer, "lateness") * 100);

  // Status boost — behind/at-risk always climbs.
  const statusBoost =
    job.status === "behind" ? 50 : job.status === "at_risk" ? 25 : 0;

  const total =
    timeScore * (w.time / 10) +
    ldScore * (w.ld / 10) +
    materialScore * (w.material / 10) +
    marginScore * (w.margin / 10) +
    latenessScore * (w.lateness / 10) +
    statusBoost;

  return Math.round(total);
}

export default function SchedulerPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [division, setDivision] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [detail, setDetail] = useState<Job | null>(null);

  // Drew's manual prioritisation: job IDs in custom order (top = do first).
  // Defaults to data-load order; persists in localStorage across reloads.
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Priority scoring — Auto-sort toggle + adjustable weights.
  // When Auto-sort is on, we replace Drew's manual drag order with
  // computed scores. Off = keep drag order.
  const [autoSort, setAutoSort] = useState(false);
  const [weights, setWeights] = useState<PriorityWeights>(DEFAULT_WEIGHTS);
  const [showWeights, setShowWeights] = useState(false);

  // Persist weights + autoSort across reloads.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("jwm.scheduler.priority");
      if (raw) {
        const p = JSON.parse(raw);
        if (p.weights) setWeights({ ...DEFAULT_WEIGHTS, ...p.weights });
        if (typeof p.autoSort === "boolean") setAutoSort(p.autoSort);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem(
        "jwm.scheduler.priority",
        JSON.stringify({ autoSort, weights }),
      );
    } catch {}
  }, [autoSort, weights]);

  useEffect(() => {
    fetch("/api/scheduler")
      .then((r) => r.json())
      .then((j: Payload) => setData(j))
      .catch((e) => setErr(String(e)));
  }, []);

  // Seed orderedIds from data, merging any persisted localStorage order so
  // Drew's manual priority survives a reload. New jobs (not in persisted
  // order) land at the bottom.
  useEffect(() => {
    if (!data) return;
    let persisted: string[] = [];
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem("jwm.scheduler.order") : null;
      if (raw) persisted = JSON.parse(raw);
    } catch {}
    const known = new Set(data.jobs.map((j) => j.id));
    const kept = persisted.filter((id) => known.has(id));
    const fresh = data.jobs.map((j) => j.id).filter((id) => !kept.includes(id));
    setOrderedIds([...kept, ...fresh]);
  }, [data]);

  function persistOrder(ids: string[]) {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("jwm.scheduler.order", JSON.stringify(ids));
      }
    } catch {}
  }

  function handleRowDrop(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    setOrderedIds((prev) => {
      const next = prev.slice();
      const from = next.indexOf(dragId);
      const to = next.indexOf(targetId);
      if (from < 0 || to < 0) return prev;
      next.splice(from, 1);
      next.splice(to, 0, dragId);
      persistOrder(next);
      return next;
    });
    setDragId(null);
    setOverId(null);
  }

  // Score every visible job once, memoised on weights.
  const scoreMap = useMemo(() => {
    if (!data) return new Map<string, number>();
    return new Map(data.jobs.map((j) => [j.id, computePriorityScore(j, weights)]));
  }, [data, weights]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const visible = data.jobs.filter((j) => {
      if (division !== "all" && j.division !== division) return false;
      if (statusFilter !== "all" && j.status !== statusFilter) return false;
      return true;
    });
    if (autoSort) {
      // Highest score first.
      return visible.slice().sort((a, b) => (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0));
    }
    if (orderedIds.length === 0) return visible;
    const rank = new Map(orderedIds.map((id, i) => [id, i]));
    return visible.slice().sort((a, b) => (rank.get(a.id) ?? 9999) - (rank.get(b.id) ?? 9999));
  }, [data, division, statusFilter, orderedIds, autoSort, scoreMap]);

  function downloadCsv() {
    if (!data) return;
    const cols = data.columns.map((c) => c.label).join(",");
    const header = `Job,Customer,Part,Qty,Due,Division,Status,${cols}`;
    const rows = filtered.map((j) => {
      const cellStrs = data.columns
        .map((c) => {
          const cell = j.cells[c.slug];
          if (!cell) return "";
          return `${cell.status}:${cell.scheduled_date}`;
        })
        .join(",");
      return `${j.id},"${j.customer}",${j.part},${j.qty},${j.due_date},${j.division},${j.status},${cellStrs}`;
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `jwm-schedule-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const counts = useMemo(() => {
    if (!data) return { on_track: 0, at_risk: 0, behind: 0, complete: 0 };
    const c = { on_track: 0, at_risk: 0, behind: 0, complete: 0 };
    for (const j of data.jobs) c[j.status]++;
    return c;
  }, [data]);

  if (err)
    return (
      <div className="p-8 text-red-700">Error loading scheduler: {err}</div>
    );
  if (!data) return <div className="p-8 text-slate-500">Loading scheduler…</div>;

  return (
    <div className="p-6 space-y-4 max-w-none">
      {/* --- Header --- */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Production Schedule
          </div>
          <h1 className="text-2xl font-bold text-[#064162] tracking-tight">
            Shop Schedule — Week of {new Date().toLocaleDateString()}
          </h1>
          <p className="text-sm text-slate-600">
            Live view mirroring the A Shop / T Shop production schedule
            workbooks. Each row is a job; columns run in manufacturing sequence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={downloadCsv} className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* --- Status tally pills (click to filter; click active pill to clear) --- */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill
          label="On Track"
          count={counts.on_track}
          tone="green"
          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          active={statusFilter === "on_track"}
          onClick={() => setStatusFilter((prev) => (prev === "on_track" ? "all" : "on_track"))}
        />
        <StatusPill
          label="At Risk"
          count={counts.at_risk}
          tone="amber"
          icon={<Clock className="w-3.5 h-3.5" />}
          active={statusFilter === "at_risk"}
          onClick={() => setStatusFilter((prev) => (prev === "at_risk" ? "all" : "at_risk"))}
        />
        <StatusPill
          label="Behind"
          count={counts.behind}
          tone="red"
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
          active={statusFilter === "behind"}
          onClick={() => setStatusFilter((prev) => (prev === "behind" ? "all" : "behind"))}
        />
        <StatusPill
          label="Complete"
          count={counts.complete}
          tone="slate"
          icon={<PauseCircle className="w-3.5 h-3.5" />}
          active={statusFilter === "complete"}
          onClick={() => setStatusFilter((prev) => (prev === "complete" ? "all" : "complete"))}
        />
        {statusFilter !== "all" && (
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className="inline-flex items-center gap-1 px-2 h-8 text-[11px] font-semibold text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100"
            title="Clear status filter"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* --- Filters --- */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
        <Filter className="w-4 h-4 text-slate-500" />
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-semibold">Division:</label>
          <select
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="h-8 text-sm border border-slate-300 rounded-lg px-2 bg-white"
          >
            <option value="all">All</option>
            <option value="Processing">Processing (T Shop)</option>
            <option value="Architectural">Architectural (A Shop)</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-semibold">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 text-sm border border-slate-300 rounded-lg px-2 bg-white"
          >
            <option value="all">All</option>
            <option value="on_track">On Track</option>
            <option value="at_risk">At Risk</option>
            <option value="behind">Behind</option>
            <option value="complete">Complete</option>
          </select>
        </div>
        {/* Auto-sort toggle */}
        <div className="flex items-center gap-2 border-l border-slate-300 pl-3 ml-1">
          <button
            type="button"
            onClick={() => setAutoSort((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border transition-all",
              autoSort
                ? "bg-[#e69b40] text-white border-[#b97418] ring-2 ring-[#e69b40]/40"
                : "bg-white text-slate-600 border-slate-300 hover:border-[#e69b40]/60"
            )}
            title={autoSort ? "Click to return to Drew's manual drag order" : "Click to auto-sort by priority score"}
          >
            <Zap className="w-3.5 h-3.5" />
            {autoSort ? "Auto-priority ON" : "Auto-priority OFF"}
          </button>
          <button
            type="button"
            onClick={() => setShowWeights((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold border transition-all",
              showWeights ? "bg-[#064162] text-white border-[#064162]" : "bg-white text-slate-500 border-slate-300 hover:border-[#064162]/50"
            )}
            title="Adjust priority signal weights"
          >
            <Sliders className="w-3.5 h-3.5" />
            Weights
          </button>
        </div>
        <div className="ml-auto text-xs text-slate-500">
          Showing {filtered.length} of {data.jobs.length} jobs
          {autoSort && " · sorted by priority score"}
        </div>
      </div>

      {/* --- Priority weights panel --- */}
      {showWeights && (
        <div className="bg-gradient-to-r from-[#fdf2e3] to-white border-2 border-[#e69b40]/40 rounded-xl p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3 gap-3">
            <div>
              <div className="text-sm font-bold text-[#b97418] flex items-center gap-1.5">
                <Sliders className="w-4 h-4" /> Priority signals — Drew's ordering logic
              </div>
              <div className="text-[11px] text-slate-600 mt-1 max-w-2xl">
                Higher weight = bigger impact on sort order. Score combines all five signals plus
                a boost for behind/at-risk jobs. Auto-priority must be ON for this to reorder the grid.
              </div>
            </div>
            <button
              onClick={() => setWeights(DEFAULT_WEIGHTS)}
              className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold"
              title="Reset to defaults"
            >
              Reset
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {(Object.keys(WEIGHT_LABELS) as (keyof PriorityWeights)[]).map((k) => (
              <div key={k} className="bg-white rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold text-[#064162] uppercase tracking-wide">
                    {WEIGHT_LABELS[k].label}
                  </div>
                  <span className="text-xs font-bold tabular-nums text-[#b97418]">
                    {weights[k]}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={weights[k]}
                  onChange={(e) => setWeights((w) => ({ ...w, [k]: parseInt(e.target.value, 10) }))}
                  className="w-full mt-1 accent-[#e69b40]"
                />
                <div className="text-[10px] text-slate-500 mt-0.5">{WEIGHT_LABELS[k].help}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Grid --- */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
        <table className="min-w-full text-xs border-collapse">
          <thead className="bg-[#064162] text-white sticky top-0 z-10">
            <tr>
              <th className="px-2 py-2 text-left font-semibold sticky left-0 bg-[#064162] z-20 min-w-[110px]">
                Job
              </th>
              <th className="px-2 py-2 text-left font-semibold min-w-[140px]">
                Customer
              </th>
              <th className="px-2 py-2 text-left font-semibold">Part</th>
              <th className="px-2 py-2 text-right font-semibold">Qty</th>
              <th className="px-2 py-2 text-left font-semibold">Due</th>
              <th className="px-2 py-2 text-left font-semibold">St.</th>
              <th
                className={cn(
                  "px-2 py-2 text-right font-semibold whitespace-nowrap",
                  autoSort ? "bg-[#e69b40] text-white" : ""
                )}
                title="Priority score from weighted signals"
              >
                Score
              </th>
              {data.columns.map((c) => (
                <th key={c.slug} className="px-1 py-2 font-semibold whitespace-nowrap">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((j) => {
              const isDragging = dragId === j.id;
              const isOver = overId === j.id && dragId !== null && dragId !== j.id;
              return (
              <tr
                key={j.id}
                onDragOver={(e) => {
                  if (dragId === null) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (overId !== j.id) setOverId(j.id);
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  if (overId === j.id) setOverId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleRowDrop(j.id);
                }}
                className={cn(
                  "border-t border-slate-100 cursor-pointer transition-colors",
                  isDragging ? "opacity-40" : "hover:bg-slate-50",
                  isOver && "bg-amber-50 ring-2 ring-[#e69b40]/40"
                )}
                onClick={() => setDetail(j)}
              >
                <td className="px-2 py-1.5 font-mono text-[#064162] font-semibold sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      draggable
                      onClick={(e) => e.stopPropagation()}
                      onDragStart={(e) => {
                        e.stopPropagation();
                        setDragId(j.id);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", j.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverId(null);
                      }}
                      className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 transition-colors"
                      title="Drag to reorder — top = do first"
                      aria-label="Drag handle"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </span>
                    {j.id}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-slate-700 truncate max-w-[160px]">
                  {j.customer}
                </td>
                <td className="px-2 py-1.5 font-mono text-slate-600">{j.part}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{j.qty}</td>
                <td className="px-2 py-1.5 text-slate-700">{j.due_date}</td>
                <td className="px-2 py-1.5">
                  <Badge tone={JOB_STATUS_TONE[j.status]} className="text-[10px]">
                    {j.status.replace("_", " ")}
                  </Badge>
                </td>
                <td
                  className={cn(
                    "px-2 py-1.5 text-right tabular-nums font-semibold",
                    autoSort ? "bg-[#fdf2e3] text-[#b97418]" : "text-slate-400"
                  )}
                  title="Priority score — open Weights panel to tune"
                >
                  {scoreMap.get(j.id) ?? 0}
                </td>
                {data.columns.map((c) => {
                  const cell = j.cells[c.slug];
                  if (!cell) {
                    return (
                      <td
                        key={c.slug}
                        className="px-1 py-1.5 text-center text-slate-300 border-l border-slate-100"
                      >
                        ·
                      </td>
                    );
                  }
                  return (
                    <td key={c.slug} className="px-0.5 py-1 border-l border-slate-100">
                      <div
                        className={cn(
                          "text-[10px] rounded border text-center font-semibold leading-tight py-1 px-1",
                          STATUS_CLASSES[cell.status]
                        )}
                        title={`${c.label} · ${cell.status} · sched ${cell.scheduled_date}${
                          cell.actual_date ? " · actual " + cell.actual_date : ""
                        }`}
                      >
                        <div>{STATUS_LABELS[cell.status]}</div>
                        <div className="text-[9px] font-normal opacity-80">
                          {cell.scheduled_date.slice(5)}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --- Legend --- */}
      <div className="flex flex-wrap gap-3 text-[11px] text-slate-600 pt-1">
        {(
          [
            "complete",
            "in_progress",
            "on_track",
            "at_risk",
            "behind",
            "hold",
            "pending",
          ] as CellStatus[]
        ).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span
              className={cn(
                "inline-block w-3 h-3 rounded border",
                STATUS_CLASSES[s]
              )}
            />
            {s.replace("_", " ")}
          </div>
        ))}
      </div>

      {/* --- Detail drawer --- */}
      {detail && (
        <div
          className="fixed inset-0 bg-black/40 z-40 flex items-end md:items-center justify-center p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  Job
                </div>
                <div className="text-xl font-bold text-[#064162] font-mono">
                  {detail.id}
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  {detail.customer} · {detail.part} · Qty {detail.qty} · Due{" "}
                  {detail.due_date}
                </div>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Badge tone={JOB_STATUS_TONE[detail.status]}>
                  {detail.status.replace("_", " ")}
                </Badge>
                <Badge tone="navy">{detail.division}</Badge>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Routing
                </div>
                <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-left">Op</th>
                      <th className="px-3 py-2 text-left">Scheduled</th>
                      <th className="px-3 py-2 text-left">Actual</th>
                      <th className="px-3 py-2 text-right">Est hrs</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(detail.cells).map(([slug, cell]) => (
                      <tr key={slug} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium">
                          {data.columns.find((c) => c.slug === slug)?.label ||
                            slug}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {cell.scheduled_date}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {cell.actual_date || "—"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {cell.hours_est}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={cn(
                              "inline-block px-2 py-0.5 text-[11px] rounded border",
                              STATUS_CLASSES[cell.status]
                            )}
                          >
                            {cell.status.replace("_", " ")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" disabled>
                  Reschedule (drag-to-reschedule — Phase 2)
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Add Hold
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({
  label,
  count,
  tone,
  icon,
  active,
  onClick,
}: {
  label: string;
  count: number;
  tone: "green" | "amber" | "red" | "slate";
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const baseTone =
    tone === "green"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : tone === "amber"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : tone === "red"
      ? "bg-red-50 text-red-800 border-red-200"
      : "bg-slate-100 text-slate-700 border-slate-200";
  const activeTone =
    tone === "green"
      ? "bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-300"
      : tone === "amber"
      ? "bg-amber-500 text-white border-amber-600 ring-2 ring-amber-300"
      : tone === "red"
      ? "bg-red-600 text-white border-red-700 ring-2 ring-red-300"
      : "bg-slate-700 text-white border-slate-800 ring-2 ring-slate-300";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!!active}
      title={active ? `Clear ${label} filter` : `Filter to ${label} only`}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 h-8 rounded-full border text-xs font-semibold transition-all cursor-pointer hover:shadow-sm",
        active ? activeTone : baseTone,
        !active && "hover:brightness-95"
      )}
    >
      {icon}
      {label}
      <span className="tabular-nums ml-1">{count}</span>
    </button>
  );
}
