"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  type Opportunity, type SalesStage,
  fmtUsd, initials, stageColour,
} from "@/lib/arch-sales";
import { LayoutGrid, Table as TableIcon, Search, X } from "lucide-react";

const STAGES: SalesStage[] = ["Active", "Submitted", "Won", "Lost", "No Bid"];
const ALWAYS_SHOW: Set<SalesStage> = new Set(["Active", "Submitted"]);
const PAGE_SIZE = 50;

export function SalesBoardClient({ opportunities }: { opportunities: Opportunity[] }) {
  const [view, setView] = useState<"kanban" | "grid">("kanban");
  const [search, setSearch] = useState("");
  const [estimator, setEstimator] = useState<string>("all");
  const [jobType, setJobType] = useState<string>("all");
  const [year, setYear] = useState<string>("all");

  const estimators = useMemo(() => {
    const s = new Set<string>();
    for (const o of opportunities) if (o.estimator) s.add(o.estimator);
    return Array.from(s).sort();
  }, [opportunities]);
  const jobTypes = useMemo(() => {
    const s = new Set<string>();
    for (const o of opportunities) if (o.jobType) s.add(o.jobType);
    return Array.from(s).sort();
  }, [opportunities]);
  const years = useMemo(() => {
    const s = new Set<number>();
    for (const o of opportunities) if (o.year) s.add(o.year);
    return Array.from(s).sort((a, b) => b - a);
  }, [opportunities]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return opportunities.filter((o) => {
      if (estimator !== "all" && o.estimator !== estimator) return false;
      if (jobType !== "all" && o.jobType !== jobType) return false;
      if (year !== "all" && String(o.year) !== year) return false;
      if (q) {
        const hay = `${o.projectName} ${o.company ?? ""} ${o.estimator ?? ""} ${o.city ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [opportunities, estimator, jobType, year, search]);

  const byStage = useMemo(() => {
    const m = new Map<SalesStage, Opportunity[]>();
    for (const s of STAGES) m.set(s, []);
    for (const o of filtered) {
      const arr = m.get(o.stage) ?? m.get("Other" as SalesStage);
      if (arr) arr.push(o);
    }
    // Sort by totalBidValue desc within each column so the big ones float up
    for (const [, arr] of m) arr.sort((a, b) => (b.totalBidValue ?? 0) - (a.totalBidValue ?? 0));
    return m;
  }, [filtered]);

  const anyFilter = estimator !== "all" || jobType !== "all" || year !== "all" || search.trim() !== "";

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search project / company / estimator…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-7 pr-2 text-xs border border-slate-300 rounded-lg bg-white w-64"
          />
        </div>
        <Select label="Estimator" value={estimator} onChange={setEstimator} options={estimators} />
        <Select label="Job type" value={jobType} onChange={setJobType} options={jobTypes} />
        <Select label="Year" value={year} onChange={setYear} options={years.map(String)} />
        {anyFilter && (
          <button
            onClick={() => { setEstimator("all"); setJobType("all"); setYear("all"); setSearch(""); }}
            className="inline-flex items-center gap-1 px-2 h-8 text-[11px] font-semibold text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
        <span className="ml-auto text-[11px] text-slate-500">
          {filtered.length.toLocaleString()} of {opportunities.length.toLocaleString()}
        </span>
        <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5">
          <button
            onClick={() => setView("kanban")}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold ${view === "kanban" ? "bg-[#064162] text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <LayoutGrid className="w-3 h-3" /> Kanban
          </button>
          <button
            onClick={() => setView("grid")}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold ${view === "grid" ? "bg-[#064162] text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <TableIcon className="w-3 h-3" /> Grid
          </button>
        </div>
      </div>

      {view === "kanban" ? (
        <div className="flex-1 overflow-x-auto bg-slate-50 rounded-xl border border-slate-200">
          <div className="inline-flex gap-3 p-3" style={{ minHeight: "calc(100vh - 22rem)" }}>
            {STAGES.map((stage) => {
              const items = byStage.get(stage) ?? [];
              const col = stageColour(stage);
              const showAll = ALWAYS_SHOW.has(stage);
              return (
                <StageColumn
                  key={stage}
                  stage={stage}
                  items={items}
                  color={col}
                  initiallyLimit={showAll ? null : PAGE_SIZE}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <GridView items={filtered} />
      )}
    </div>
  );
}

function StageColumn({
  stage, items, color, initiallyLimit,
}: {
  stage: SalesStage;
  items: Opportunity[];
  color: { bg: string; fg: string; border: string };
  initiallyLimit: number | null;
}) {
  const [limit, setLimit] = useState<number>(initiallyLimit ?? items.length);
  const visible = items.slice(0, limit);
  const more = items.length - limit;

  return (
    <section
      className="flex flex-col w-72 flex-shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm"
      aria-label={stage}
    >
      <header
        className="flex items-center justify-between px-3 h-10 rounded-t-xl text-white"
        style={{ backgroundColor: color.bg }}
      >
        <h2 className="text-[11px] font-bold uppercase tracking-wider">{stage}</h2>
        <span className="inline-flex items-center justify-center min-w-[24px] h-5 rounded-full bg-white/20 text-[10px] font-bold px-1.5">
          {items.length.toLocaleString()}
        </span>
      </header>
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-[calc(100vh-18rem)]">
        {visible.length === 0 ? (
          <div className="text-[11px] text-slate-400 text-center py-4 italic">No opportunities</div>
        ) : (
          visible.map((o) => <OpportunityCard key={o.id} o={o} />)
        )}
        {more > 0 && (
          <button
            onClick={() => setLimit((l) => l + PAGE_SIZE)}
            className="w-full text-xs font-semibold py-2 rounded border border-dashed border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            Load {Math.min(PAGE_SIZE, more)} more ({more.toLocaleString()} hidden)
          </button>
        )}
      </div>
    </section>
  );
}

function OpportunityCard({ o }: { o: Opportunity }) {
  return (
    <Link
      href={`/arch/sales/${encodeURIComponent(o.id)}`}
      className="block rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm hover:shadow-md hover:border-[#064162]/40 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-[12px] text-[#064162] leading-tight line-clamp-2">
          {o.projectName}
        </div>
        {o.closeProbability != null && o.closeProbability > 0 && (
          <span className="text-[10px] font-bold text-[#b97418] tabular-nums">
            {Math.round(o.closeProbability * 100)}%
          </span>
        )}
      </div>
      {o.company && (
        <div className="text-[10px] text-slate-500 mt-0.5 truncate" title={o.company}>{o.company}</div>
      )}
      <div className="flex items-center justify-between gap-2 mt-1.5">
        <span className="text-sm font-bold tabular-nums text-[#e69b40]">
          {fmtUsd(o.totalBidValue)}
        </span>
        <div className="flex items-center gap-1">
          {o.estimator && (
            <span
              title={o.estimator}
              className="w-5 h-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-white bg-[#064162]"
            >
              {initials(o.estimator)}
            </span>
          )}
        </div>
      </div>
      {(o.city || o.state || o.jobType) && (
        <div className="flex flex-wrap gap-1 mt-1">
          {o.jobType && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold uppercase">
              {o.jobType}
            </span>
          )}
          {(o.city || o.state) && (
            <span className="text-[9px] text-slate-500">
              {[o.city, o.state].filter(Boolean).join(", ")}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

function GridView({ items }: { items: Opportunity[] }) {
  const [limit, setLimit] = useState(200);
  const visible = items.slice(0, limit);
  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-[#064162] text-white">
            <tr>
              <th className="text-left px-2 py-2 font-semibold whitespace-nowrap">Project</th>
              <th className="text-left px-2 py-2 font-semibold">Stage</th>
              <th className="text-right px-2 py-2 font-semibold">Bid $</th>
              <th className="text-left px-2 py-2 font-semibold">Estimator</th>
              <th className="text-left px-2 py-2 font-semibold">Company</th>
              <th className="text-left px-2 py-2 font-semibold">Job Type</th>
              <th className="text-left px-2 py-2 font-semibold">City/State</th>
              <th className="text-right px-2 py-2 font-semibold">Prob</th>
              <th className="text-left px-2 py-2 font-semibold">Received</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((o, i) => {
              const col = stageColour(o.stage);
              return (
                <tr key={o.id} className={`border-t border-slate-100 hover:bg-[#fdf2e3]/60 ${i % 2 ? "bg-slate-50/50" : ""}`}>
                  <td className="px-2 py-1.5 font-semibold text-[#064162]">
                    <Link href={`/arch/sales/${encodeURIComponent(o.id)}`} className="hover:underline">
                      {o.projectName}
                    </Link>
                  </td>
                  <td className="px-2 py-1.5">
                    <span
                      className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full border"
                      style={{ backgroundColor: col.bg, color: "#fff", borderColor: col.border }}
                    >
                      {o.stage}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{fmtUsd(o.totalBidValue)}</td>
                  <td className="px-2 py-1.5 text-slate-700">{o.estimator ?? "—"}</td>
                  <td className="px-2 py-1.5 text-slate-700 truncate max-w-[220px]" title={o.company ?? ""}>{o.company ?? "—"}</td>
                  <td className="px-2 py-1.5 text-slate-700">{o.jobType ?? "—"}</td>
                  <td className="px-2 py-1.5 text-slate-700">{[o.city, o.state].filter(Boolean).join(", ") || "—"}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{o.closeProbability ? `${Math.round(o.closeProbability * 100)}%` : "—"}</td>
                  <td className="px-2 py-1.5 text-slate-500 tabular-nums">{o.receivedDate?.slice(0, 10) ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {items.length > limit && (
        <div className="p-2 border-t border-slate-100 flex justify-center">
          <button
            onClick={() => setLimit((l) => l + 200)}
            className="text-xs font-semibold px-3 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Load 200 more ({(items.length - limit).toLocaleString()} hidden)
          </button>
        </div>
      )}
    </div>
  );
}

function Select({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-[11px]">
      <span className="font-semibold text-slate-500 uppercase tracking-wide">{label}:</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-8 text-xs border border-slate-300 rounded-lg px-2 bg-white max-w-[180px]">
        <option value="all">All</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
