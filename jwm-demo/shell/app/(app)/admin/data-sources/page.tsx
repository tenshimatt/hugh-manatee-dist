/**
 * /admin/data-sources — one-pane dashboard answering "what on this demo is
 * real, what is seeded, what is canned, and what are we waiting on from
 * Chris?" Drives the AWAITING_JWM checklist that travels back to JWM.
 */
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  DATA_SOURCES,
  PLANE_LABELS,
  percentLive,
  sourceCounts,
  type DataSourceEntry,
  type Plane,
} from "@/lib/data-sources";
import {
  DataSourceBadge,
  sourceLabel,
  type SourceState,
} from "@/components/chrome/DataSourceBadge";

const STATE_ORDER: SourceState[] = ["awaiting_jwm", "canned", "seeded", "live"];

export default function DataSourcesPage() {
  const [filterState, setFilterState] = useState<SourceState | "all">("all");
  const [filterPlane, setFilterPlane] = useState<Plane | "all">("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return DATA_SOURCES.filter((e) => {
      if (filterState !== "all" && e.state !== filterState) return false;
      if (filterPlane !== "all" && e.plane !== filterPlane) return false;
      if (q) {
        const needle = q.toLowerCase();
        if (
          !e.route.toLowerCase().includes(needle) &&
          !e.label.toLowerCase().includes(needle) &&
          !e.source.toLowerCase().includes(needle) &&
          !(e.ask ?? "").toLowerCase().includes(needle)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [filterState, filterPlane, q]);

  const counts = sourceCounts(DATA_SOURCES);
  const pct = percentLive(DATA_SOURCES);
  const asks = DATA_SOURCES.filter((e) => e.state === "awaiting_jwm");

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Data Source Map</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Every screen in the shell, tagged by where its data comes from today. Flip entries
            as you ship them from canned → seeded → live. Items in <b>Awaiting JWM</b> are
            blocked on a specific ask from Chris.
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-emerald-700">{pct}%</div>
          <div className="text-xs uppercase tracking-wider text-slate-500">
            ERP-backed (live + ½ seeded)
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATE_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => setFilterState(filterState === s ? "all" : s)}
            className={`text-left border rounded-lg p-4 transition hover:shadow-sm ${
              filterState === s ? "ring-2 ring-sky-400 border-sky-300" : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <DataSourceBadge state={s} />
              <span className="text-2xl font-bold text-slate-700">{counts[s]}</span>
            </div>
            <div className="text-xs text-slate-500 mt-2">{sourceLabel(s)}</div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search route, label, source, ask…"
          className="border border-slate-300 rounded px-3 py-2 text-sm w-80"
        />
        <select
          value={filterPlane}
          onChange={(e) => setFilterPlane(e.target.value as Plane | "all")}
          className="border border-slate-300 rounded px-3 py-2 text-sm"
        >
          <option value="all">All planes</option>
          {Object.entries(PLANE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        {(filterState !== "all" || filterPlane !== "all" || q) && (
          <button
            onClick={() => {
              setFilterState("all");
              setFilterPlane("all");
              setQ("");
            }}
            className="text-xs text-sky-700 underline"
          >
            Reset filters
          </button>
        )}
        <span className="text-xs text-slate-500 ml-auto">
          {filtered.length} of {DATA_SOURCES.length} routes
        </span>
      </div>

      {asks.length > 0 && filterState === "all" && (
        <section className="border border-amber-300 bg-amber-50 rounded-lg p-4">
          <h2 className="font-semibold text-amber-900 text-sm uppercase tracking-wide mb-2">
            {asks.length} open asks for Chris / JWM
          </h2>
          <ul className="space-y-1 text-sm">
            {asks.map((e) => (
              <li key={e.route} className="flex gap-2">
                <span className="text-amber-700 font-mono text-xs min-w-[180px]">
                  {e.route}
                </span>
                <span className="text-amber-900">{e.ask}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-600">
            <tr>
              <th className="px-3 py-2">Route</th>
              <th className="px-3 py-2">Label</th>
              <th className="px-3 py-2">Plane</th>
              <th className="px-3 py-2">State</th>
              <th className="px-3 py-2">Source / Ask</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <Row key={e.route} entry={e} />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-slate-500 py-6 text-sm">
                  No routes match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ entry }: { entry: DataSourceEntry }) {
  const linkable = !entry.route.includes(":");
  return (
    <tr className="border-t border-slate-100 align-top hover:bg-slate-50">
      <td className="px-3 py-2 font-mono text-xs text-slate-700 whitespace-nowrap">
        {linkable ? (
          <Link href={entry.route} className="text-sky-700 hover:underline">
            {entry.route}
          </Link>
        ) : (
          entry.route
        )}
      </td>
      <td className="px-3 py-2">{entry.label}</td>
      <td className="px-3 py-2 text-xs text-slate-600">{PLANE_LABELS[entry.plane]}</td>
      <td className="px-3 py-2">
        <DataSourceBadge state={entry.state} />
      </td>
      <td className="px-3 py-2 text-slate-700 max-w-[640px]">
        <div>{entry.source}</div>
        {entry.ask && (
          <div className="text-amber-800 mt-1 text-xs">
            <b>Ask:</b> {entry.ask}
          </div>
        )}
        {entry.note && (
          <div className="text-slate-500 mt-1 text-xs italic">{entry.note}</div>
        )}
      </td>
    </tr>
  );
}
