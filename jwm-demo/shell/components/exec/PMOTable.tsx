"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  type PMORow,
  healthDot,
  fmtMoney,
  fmtPct,
  pmSlug,
} from "@/lib/pmo-rollup";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";

type SortKey = keyof PMORow | "spectrumDrift";
type SortDir = "asc" | "desc";

const COLUMNS: Array<{
  key: SortKey;
  label: string;
  className?: string;
  num?: boolean;
  fmt?: (v: unknown, row: PMORow) => React.ReactNode;
}> = [
  { key: "jobName", label: "Job" },
  { key: "shortJobNo", label: "No", num: true },
  { key: "pm", label: "PM" },
  { key: "type", label: "Type" },
  {
    key: "jobHealth", label: "JH",
    fmt: (v) => (
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${healthDot(v as never)}`} title={String(v ?? "—")} />
    ),
  },
  {
    key: "budgetHealth", label: "BH",
    fmt: (v) => (
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${healthDot(v as never)}`} title={String(v ?? "—")} />
    ),
  },
  { key: "pctComplete", label: "% Cmp", num: true, fmt: (v) => fmtPct(v as number, 0) },
  { key: "contractValue", label: "Contract $", num: true, fmt: (v) => fmtMoney(v as number, true) },
  { key: "currentBudget", label: "Budget $", num: true, fmt: (v) => fmtMoney(v as number, true) },
  { key: "actualCost", label: "Actual $", num: true, fmt: (v) => fmtMoney(v as number, true) },
  { key: "budgetRemaining", label: "Remain $", num: true, fmt: (v) => fmtMoney(v as number, true) },
  { key: "currentMargin", label: "Margin", num: true, fmt: (v) => fmtPct(v as number, 1) },
  { key: "profit", label: "Profit $", num: true, fmt: (v) => fmtMoney(v as number, true) },
  {
    key: "spectrumDrift", label: "Spec Δ", num: true,
    fmt: (_v, row) => {
      const d = row.spectrumDelta;
      if (d == null) return "—";
      const color = Math.abs(d) > 50_000 ? "text-amber-700 font-bold" : Math.abs(d) > 10_000 ? "text-amber-600" : "text-slate-400";
      return <span className={color}>{fmtMoney(d, true)}</span>;
    },
  },
  {
    key: "finishDate", label: "Finish",
    fmt: (v) => (v ? String(v).slice(0, 10) : "—"),
  },
];

export function PMOTable({ rows }: { rows: PMORow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("jobName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [pmFilter, setPmFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [healthFilter, setHealthFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const pmOptions = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) if (r.pm) s.add(r.pm);
    return Array.from(s).sort();
  }, [rows]);

  const typeOptions = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) if (r.type) s.add(r.type);
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (pmFilter !== "all" && r.pm !== pmFilter) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (healthFilter !== "all" && r.budgetHealth !== healthFilter) return false;
      if (q) {
        const hay = `${r.jobName} ${r.shortJobNo} ${r.pm}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, pmFilter, typeFilter, healthFilter, search]);

  const sorted = useMemo(() => {
    const arr = filtered.slice();
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      let av: unknown, bv: unknown;
      if (sortKey === "spectrumDrift") {
        av = Math.abs(a.spectrumDelta ?? 0);
        bv = Math.abs(b.spectrumDelta ?? 0);
      } else {
        av = a[sortKey as keyof PMORow];
        bv = b[sortKey as keyof PMORow];
      }
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir(k === "jobName" ? "asc" : "desc"); }
  }

  const anyFilter = pmFilter !== "all" || typeFilter !== "all" || healthFilter !== "all" || search.trim() !== "";

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search job / PM / number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-7 pr-2 text-xs border border-slate-300 rounded-lg bg-white w-56"
          />
        </div>
        <Select label="PM" value={pmFilter} onChange={setPmFilter} options={pmOptions} />
        <Select label="Type" value={typeFilter} onChange={setTypeFilter} options={typeOptions} />
        <Select
          label="Budget Health"
          value={healthFilter}
          onChange={setHealthFilter}
          options={["Green", "Amber", "Red"]}
        />
        {anyFilter && (
          <button
            onClick={() => {
              setPmFilter("all"); setTypeFilter("all"); setHealthFilter("all"); setSearch("");
            }}
            className="inline-flex items-center gap-1 px-2 h-8 text-[11px] font-semibold text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
        <span className="ml-auto text-[11px] text-slate-500">
          {sorted.length} of {rows.length} projects
        </span>
      </div>

      <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-[#064162] text-white">
              <tr>
                {COLUMNS.map((c) => {
                  const active = sortKey === c.key;
                  return (
                    <th
                      key={c.key}
                      onClick={() => toggleSort(c.key)}
                      className={`px-2 py-2 font-semibold whitespace-nowrap cursor-pointer select-none ${c.num ? "text-right" : "text-left"} ${active ? "bg-[#0a5480]" : "hover:bg-[#0a5480]/70"}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {c.label}
                        {active && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => {
                const slug = pmSlug(r.pm);
                return (
                  <tr
                    key={`${r.shortJobNo}-${i}`}
                    className={`border-t border-slate-100 hover:bg-[#fdf2e3]/60 cursor-pointer ${i % 2 ? "bg-slate-50/50" : ""}`}
                  >
                    {COLUMNS.map((c, ci) => {
                      const v = c.key === "spectrumDrift" ? r.spectrumDelta : (r[c.key as keyof PMORow] as unknown);
                      const rendered = c.fmt ? c.fmt(v, r) : v == null ? "—" : String(v);
                      return (
                        <td
                          key={c.key}
                          className={`px-2 py-1.5 ${c.num ? "text-right tabular-nums" : ""} ${ci === 0 ? "font-semibold text-[#064162]" : "text-slate-700"}`}
                        >
                          {ci === 0 ? (
                            <Link
                              href={`/arch/projects/${encodeURIComponent(`${r.shortJobNo ?? ""}-${r.jobName.replace(/[^a-zA-Z0-9]+/g, "-")}`)}`}
                              className="hover:underline"
                            >
                              {r.jobName}
                            </Link>
                          ) : c.key === "pm" && slug ? (
                            <Link href={`/arch/pm/${slug}`} className="text-slate-700 hover:text-[#064162] hover:underline">
                              {r.pm}
                            </Link>
                          ) : (
                            rendered
                          )}
                        </td>
                      );
                    })}
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

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-[11px]">
      <span className="font-semibold text-slate-500 uppercase tracking-wide">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-xs border border-slate-300 rounded-lg px-2 bg-white"
      >
        <option value="all">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
