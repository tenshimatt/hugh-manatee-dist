"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CARDS as DEFAULT_CARDS,
  STAGES,
  type Card as JobCardData,
  type Priority,
  type StageKey,
  PRIORITY_BAR,
} from "@/lib/engineering-pipeline";
import { JobCard } from "@/components/engineering/JobCard";
import { JobDrawer } from "@/components/engineering/JobDrawer";
import { Cog, LayoutGrid, Table as TableIcon, Search } from "lucide-react";

const PRIORITIES: Priority[] = ["high", "med", "low"];
const PRIORITY_LABEL: Record<Priority, string> = {
  high: "High",
  med: "Medium",
  low: "Low",
  info: "Info",
};

export default function PipelineClient({ cards }: { cards?: JobCardData[] }) {
  const initial = cards && cards.length ? cards : DEFAULT_CARDS;
  // Local card state so drag-and-drop can mutate stages optimistically.
  const [CARDS, setCards] = useState<JobCardData[]>(initial);
  const [division, setDivision] = useState<"all" | "A" | "T">("all");
  const [pm, setPm] = useState<string>("all");
  const [priorities, setPriorities] = useState<Set<Priority>>(new Set());
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"kanban" | "grid">("kanban");
  const [openCard, setOpenCard] = useState<JobCardData | null>(null);
  // Drag state for drag-to-reorder / cross-column moves. dragId = card being
  // dragged. overStage = column currently hovered as a drop target.
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<StageKey | null>(null);
  const [moveToast, setMoveToast] = useState<string | null>(null);

  const pmOptions = useMemo(() => {
    const s = new Set<string>();
    for (const c of CARDS) if (c.pm) s.add(c.pm);
    return Array.from(s).sort();
  }, [CARDS]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CARDS.filter((c) => {
      if (division !== "all" && c.division !== division) return false;
      if (pm !== "all" && c.pm !== pm) return false;
      if (priorities.size > 0 && !priorities.has(c.priority)) return false;
      if (q) {
        const hay = `${c.id} ${c.jobName} ${c.pm}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [division, pm, priorities, search, CARDS]);

  const byStage = useMemo(() => {
    const m = new Map<StageKey, JobCardData[]>();
    for (const s of STAGES) m.set(s.key, []);
    for (const c of filtered) {
      const arr = m.get(c.stage);
      if (arr) arr.push(c);
    }
    // sort within column by rankedPriority asc (low = higher priority)
    for (const [, arr] of m) {
      arr.sort((a, b) => {
        const ar = a.rankedPriority ?? 999;
        const br = b.rankedPriority ?? 999;
        return ar - br;
      });
    }
    return m;
  }, [filtered]);

  const togglePriority = (p: Priority) => {
    setPriorities((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };

  const clearFilters = () => {
    setDivision("all");
    setPm("all");
    setPriorities(new Set());
    setSearch("");
  };

  // Apply the drop. Optimistic local update first; fire-and-forget PATCH to
  // persist to ERPNext (Schedule Line.jwm_stage). Rollback on failure.
  async function handleDrop(targetStage: StageKey) {
    if (!dragId) return;
    const card = CARDS.find((c) => c.id === dragId);
    if (!card || card.stage === targetStage) {
      setDragId(null);
      setOverStage(null);
      return;
    }
    const fromStage = card.stage;
    const stageLabel = STAGES.find((s) => s.key === targetStage)?.label ?? targetStage;
    setCards((prev) =>
      prev.map((c) => (c.id === dragId ? { ...c, stage: targetStage } : c)),
    );
    setDragId(null);
    setOverStage(null);
    setMoveToast(`${card.id} → ${stageLabel}`);
    try {
      const res = await fetch("/api/pipeline/update-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.id, stage: targetStage }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMoveToast(`${card.id} → ${stageLabel} ✓`);
    } catch (e) {
      // Rollback on failure — unless fetch simply hasn't a backing endpoint,
      // which is fine for canned-mode demos.
      const data = await (async () => {
        try {
          return await fetch("/api/pipeline/update-stage", { method: "HEAD" }).then((r) => r.status);
        } catch {
          return -1;
        }
      })();
      if (data === 404 || data === -1) {
        // No backend endpoint yet — keep optimistic move, note canned.
        setMoveToast(`${card.id} → ${stageLabel} (local)`);
      } else {
        setCards((prev) =>
          prev.map((c) => (c.id === card.id ? { ...c, stage: fromStage } : c)),
        );
        setMoveToast(`Move failed: ${(e as Error).message}`);
      }
    }
    setTimeout(() => setMoveToast(null), 2500);
  }

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 8rem)" }}>
      {/* Header */}
      <div className="pb-3">
        <div className="flex items-center gap-2 text-[#e69b40] text-xs font-bold uppercase tracking-widest">
          <Cog className="w-4 h-4" /> Engineering
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[#064162] tracking-tight">Production Schedule — Pipeline</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {filtered.length} of {CARDS.length} jobs · {STAGES.length} engineering stages · live from Smartsheet parity import
            </p>
          </div>
          <nav className="text-xs text-slate-500">
            <Link href="/engineering" className="hover:text-[#064162]">Engineering</Link>
            <span className="mx-1">/</span>
            <span className="text-slate-700 font-semibold">Pipeline</span>
          </nav>
        </div>
      </div>

      {/* Filter bar */}
      <div className="pb-3 mb-3 border-b border-slate-200">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Division */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold">
            {(["all", "A", "T"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDivision(d)}
                className={`px-3 h-8 rounded-md transition-colors ${
                  division === d
                    ? "bg-[#064162] text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {d === "all" ? "All" : `${d} Shop`}
              </button>
            ))}
          </div>

          {/* PM */}
          <select
            value={pm}
            onChange={(e) => setPm(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700"
            aria-label="Filter by PM"
          >
            <option value="all">All PMs</option>
            {pmOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Priority */}
          <div className="flex items-center gap-1.5">
            {PRIORITIES.map((p) => (
              <label
                key={p}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 h-8 text-xs font-semibold cursor-pointer select-none ${
                  priorities.has(p)
                    ? "border-[#064162] bg-[#eaf3f8] text-[#064162]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={priorities.has(p)}
                  onChange={() => togglePriority(p)}
                />
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: PRIORITY_BAR[p] }}
                />
                {PRIORITY_LABEL[p]}
              </label>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search job ID or customer..."
              className="w-full h-8 rounded-lg border border-slate-200 bg-white pl-8 pr-2 text-xs"
            />
          </div>

          {(division !== "all" || pm !== "all" || priorities.size > 0 || search) && (
            <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-[#064162] underline">
              Clear
            </button>
          )}

          <div className="ml-auto inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold">
            <button
              onClick={() => setView("kanban")}
              className={`inline-flex items-center gap-1 px-2.5 h-8 rounded-md ${
                view === "kanban" ? "bg-[#064162] text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Kanban
            </button>
            <button
              onClick={() => setView("grid")}
              className={`inline-flex items-center gap-1 px-2.5 h-8 rounded-md ${
                view === "grid" ? "bg-[#064162] text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> Grid
            </button>
          </div>
        </div>
      </div>

      {/* Board */}
      {view === "kanban" ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden bg-slate-50 rounded-xl border border-slate-200" style={{ height: "calc(100vh - 16rem)" }}>
          <div className="inline-flex gap-3 p-3 h-full min-h-0">
            {STAGES.map((s) => {
              const items = byStage.get(s.key) ?? [];
              const accentGold = s.accent === "gold";
              const isOver = overStage === s.key && dragId !== null;
              return (
                <section
                  key={s.key}
                  onDragOver={(e) => {
                    if (dragId === null) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (overStage !== s.key) setOverStage(s.key);
                  }}
                  onDragLeave={(e) => {
                    // Ignore leave events fired as the pointer crosses child
                    // elements within the column — only clear when leaving the
                    // section entirely.
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    if (overStage === s.key) setOverStage(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    void handleDrop(s.key);
                  }}
                  className={`flex flex-col w-64 flex-shrink-0 bg-white rounded-xl border shadow-sm transition-all ${
                    isOver ? "border-[#e69b40] ring-2 ring-[#e69b40]/40" : "border-slate-200"
                  }`}
                  aria-label={s.label}
                >
                  <header
                    className={`flex items-center justify-between px-3 h-10 rounded-t-xl ${
                      accentGold
                        ? "bg-[#e69b40] text-white"
                        : "bg-[#064162] text-white"
                    }`}
                  >
                    <h2 className="text-[11px] font-bold uppercase tracking-wider truncate">
                      {s.label}
                    </h2>
                    <span className="inline-flex items-center justify-center min-w-[22px] h-5 rounded-full bg-white/20 text-white text-[10px] font-bold px-1.5">
                      {items.length}
                    </span>
                  </header>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                    {items.length === 0 ? (
                      <div
                        className={`text-[11px] text-center py-4 italic ${
                          isOver ? "text-[#e69b40] font-semibold not-italic" : "text-slate-400"
                        }`}
                      >
                        {isOver ? "Drop here" : "No jobs"}
                      </div>
                    ) : (
                      items.map((c) => (
                        <div
                          key={c.id}
                          draggable
                          onDragStart={(e) => {
                            setDragId(c.id);
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData("text/plain", c.id);
                          }}
                          onDragEnd={() => {
                            setDragId(null);
                            setOverStage(null);
                          }}
                          className={`cursor-grab active:cursor-grabbing ${
                            dragId === c.id ? "opacity-40" : ""
                          }`}
                          title="Drag to move · click to open"
                        >
                          <JobCard card={c} onClick={() => setOpenCard(c)} />
                        </div>
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <GridView cards={filtered} onOpen={setOpenCard} />
      )}

      <JobDrawer card={openCard} onClose={() => setOpenCard(null)} />

      {moveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#064162] text-white px-4 py-2.5 rounded-lg shadow-xl text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
          {moveToast}
        </div>
      )}
    </div>
  );
}

function GridView({ cards, onOpen }: { cards: JobCardData[]; onOpen: (c: JobCardData) => void }) {
  return (
    <div className="flex-1 overflow-auto bg-white rounded-xl border border-slate-200" style={{ height: "calc(100vh - 16rem)" }}>
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-[#064162] text-white text-xs uppercase tracking-wider">
          <tr>
            <Th>Job ID</Th>
            <Th>Job Name</Th>
            <Th>PM</Th>
            <Th>Stage</Th>
            <Th>Priority</Th>
            <Th>Division</Th>
            <Th>Material</Th>
            <Th>Ship Target</Th>
            <Th>Station</Th>
          </tr>
        </thead>
        <tbody>
          {cards.map((c, i) => {
            const stage = STAGES.find((s) => s.key === c.stage)?.label ?? c.stage;
            return (
              <tr
                key={c.id}
                onClick={() => onOpen(c)}
                className={`cursor-pointer hover:bg-[#eaf3f8] ${i % 2 ? "bg-slate-50" : ""}`}
              >
                <Td mono bold>{c.id}</Td>
                <Td>{c.jobName}</Td>
                <Td>{c.pm}</Td>
                <Td>{stage}</Td>
                <Td>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ background: PRIORITY_BAR[c.priority] }}
                    />
                    {PRIORITY_LABEL[c.priority]}
                  </span>
                </Td>
                <Td>{c.division} Shop</Td>
                <Td>{c.materialType}</Td>
                <Td>{c.shipTarget ? new Date(c.shipTarget).toLocaleDateString() : "—"}</Td>
                <Td>{c.station}</Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-bold px-3 py-2 whitespace-nowrap">{children}</th>;
}
function Td({
  children,
  mono,
  bold,
}: {
  children: React.ReactNode;
  mono?: boolean;
  bold?: boolean;
}) {
  return (
    <td
      className={`px-3 py-2 whitespace-nowrap border-b border-slate-100 ${
        mono ? "font-mono text-xs" : ""
      } ${bold ? "font-semibold text-[#064162]" : "text-slate-700"}`}
    >
      {children}
    </td>
  );
}
