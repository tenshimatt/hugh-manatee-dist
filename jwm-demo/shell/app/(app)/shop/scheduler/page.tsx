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
import { Download, Filter, X, AlertTriangle, CheckCircle2, Clock, PauseCircle } from "lucide-react";
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

export default function SchedulerPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [division, setDivision] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [detail, setDetail] = useState<Job | null>(null);

  useEffect(() => {
    fetch("/api/scheduler")
      .then((r) => r.json())
      .then((j: Payload) => setData(j))
      .catch((e) => setErr(String(e)));
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.jobs.filter((j) => {
      if (division !== "all" && j.division !== division) return false;
      if (statusFilter !== "all" && j.status !== statusFilter) return false;
      return true;
    });
  }, [data, division, statusFilter]);

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

      {/* --- Status tally pills --- */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill
          label="On Track"
          count={counts.on_track}
          tone="green"
          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
        />
        <StatusPill
          label="At Risk"
          count={counts.at_risk}
          tone="amber"
          icon={<Clock className="w-3.5 h-3.5" />}
        />
        <StatusPill
          label="Behind"
          count={counts.behind}
          tone="red"
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
        />
        <StatusPill
          label="Complete"
          count={counts.complete}
          tone="slate"
          icon={<PauseCircle className="w-3.5 h-3.5" />}
        />
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
        <div className="ml-auto text-xs text-slate-500">
          Showing {filtered.length} of {data.jobs.length} jobs
        </div>
      </div>

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
              {data.columns.map((c) => (
                <th key={c.slug} className="px-1 py-2 font-semibold whitespace-nowrap">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((j) => (
              <tr
                key={j.id}
                className="hover:bg-slate-50 border-t border-slate-100 cursor-pointer"
                onClick={() => setDetail(j)}
              >
                <td className="px-2 py-1.5 font-mono text-[#064162] font-semibold sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100">
                  {j.id}
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
            ))}
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
}: {
  label: string;
  count: number;
  tone: "green" | "amber" | "red" | "slate";
  icon: React.ReactNode;
}) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : tone === "amber"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : tone === "red"
      ? "bg-red-50 text-red-800 border-red-200"
      : "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 h-8 rounded-full border text-xs font-semibold",
        toneClass
      )}
    >
      {icon}
      {label}
      <span className="tabular-nums ml-1">{count}</span>
    </div>
  );
}
