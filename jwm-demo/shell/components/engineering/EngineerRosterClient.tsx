/**
 * EngineerRosterClient (JWM1451-83) — Engineering resource-planning page.
 *
 * Two views:
 *   1. roster  — vertical list grouped by discipline with capacity bars + chips
 *   2. heatmap — engineers × 10 weekdays, cells coloured by planned hours
 *
 * Drag source: left rail of engineering pipeline cards.
 * Drop targets:
 *   - any engineer row  (books for today)
 *   - any heatmap cell  (books for that day)
 *
 * Persistence is session-local:
 *   - server  : module-level Map in /api/engineering/assign
 *   - client  : localStorage mirror ("jwm:eng-assignments")
 */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Users, LayoutGrid, CalendarDays, Cog, Search, Info } from "lucide-react";
import type { Engineer, EngineeringAssignment } from "@/lib/engineering-schedule";
import {
  avatarHslFor,
  initialsOf,
  nextWeekdays,
  todayISO,
  utilBucket,
} from "@/lib/engineering-schedule";
import type { Card as JobCardData } from "@/lib/engineering-pipeline";
import { PRIORITY_BAR } from "@/lib/engineering-pipeline";
import { CapacityHeatmap } from "./CapacityHeatmap";
import { AssignmentDrawer, type DrawerState } from "./AssignmentDrawer";

const LS_KEY = "jwm:eng-assignments";

function loadLocal(): EngineeringAssignment[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as EngineeringAssignment[];
  } catch {
    /* ignore */
  }
  return null;
}
function saveLocal(items: EngineeringAssignment[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {
    /* quota */
  }
}

export default function EngineerRosterClient({
  engineers,
  cards,
  initialAssignments,
  source,
}: {
  engineers: Engineer[];
  cards: JobCardData[];
  initialAssignments: EngineeringAssignment[];
  source: "live" | "canned";
}) {
  // Lazy-initialise from localStorage once (avoids setState-in-effect). Falls
  // back to server-seeded initialAssignments when no local copy exists or when
  // rendering on the server.
  const [assignments, setAssignments] = useState<EngineeringAssignment[]>(() => {
    const local = loadLocal();
    return local && local.length ? local : initialAssignments;
  });
  const [view, setView] = useState<"roster" | "heatmap">("roster");
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [dragCardId, setDragCardId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const tempIdRef = useRef(0);

  // Mirror to localStorage on any change.
  useEffect(() => {
    saveLocal(assignments);
  }, [assignments]);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((c) => `${c.id} ${c.jobName}`.toLowerCase().includes(q));
  }, [search, cards]);

  const grouped = useMemo(() => {
    const by: Record<string, Engineer[]> = { Executive: [], ACM: [], "P&T": [] };
    for (const e of engineers) (by[e.discipline] ?? (by[e.discipline] = [])).push(e);
    // managers first within each group
    for (const k of Object.keys(by)) {
      by[k].sort((a, b) => Number(b.isManager) - Number(a.isManager) || a.displayName.localeCompare(b.displayName));
    }
    return by;
  }, [engineers]);

  const weekKeys = useMemo(() => nextWeekdays(5), []);
  const weeklyHoursByEng = useMemo(() => {
    const out = new Map<string, number>();
    for (const a of assignments) {
      if (!weekKeys.includes(a.date)) continue;
      out.set(a.engineer_id, (out.get(a.engineer_id) ?? 0) + a.hours);
    }
    return out;
  }, [assignments, weekKeys]);

  const todaysByEng = useMemo(() => {
    const t = todayISO();
    const out = new Map<string, EngineeringAssignment[]>();
    for (const a of assignments) {
      if (a.date !== t) continue;
      const arr = out.get(a.engineer_id) || [];
      arr.push(a);
      out.set(a.engineer_id, arr);
    }
    return out;
  }, [assignments]);

  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function assignCardToEngineer(engineerId: string, date: string, cardId: string) {
    const card = cardById.get(cardId);
    if (!card) return;
    const tempId = `tmp-${++tempIdRef.current}`;
    const optimistic: EngineeringAssignment = {
      id: tempId,
      engineer_id: engineerId,
      card_id: cardId,
      date,
      hours: 4,
      stage: card.stage,
    };
    setAssignments((prev) => [...prev, optimistic]);
    const eng = engineers.find((e) => e.id === engineerId);
    showToast(`${card.id} → ${eng?.displayName ?? engineerId} (${prettyDate(date)})`);
    try {
      const res = await fetch("/api/engineering/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engineer_id: engineerId,
          card_id: cardId,
          date,
          hours: 4,
          stage: card.stage,
        }),
      });
      if (res.ok) {
        const body = (await res.json()) as { assignment?: EngineeringAssignment };
        if (body.assignment) {
          setAssignments((prev) =>
            prev.map((a) => (a.id === tempId ? body.assignment! : a)),
          );
        }
      }
    } catch {
      // keep optimistic
    }
  }

  async function removeAssignment(id: string) {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    try {
      await fetch(`/api/engineering/assign?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <header>
        <div className="flex items-center gap-2 text-[#e69b40] text-xs font-bold uppercase tracking-widest">
          <Cog className="w-4 h-4" /> Engineering
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[#064162] tracking-tight">
              Resource Planning
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {engineers.length} engineers across ACM + Plate &amp; Tube · drag cards onto a
              person or heatmap cell to book them.
            </p>
          </div>
          <nav className="text-xs text-slate-500">
            <Link href="/engineering" className="hover:text-[#064162]">Engineering</Link>
            <span className="mx-1">/</span>
            <span className="text-slate-700 font-semibold">Resource Planning</span>
          </nav>
        </div>
      </header>

      {/* Source + view toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border ${
            source === "live"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
        >
          <Info className="w-3 h-3" />
          {source === "live" ? "Live ERPNext" : "Canned fallback"}
        </span>
        <span className="text-[11px] text-slate-500">
          Assignments are session-local · real ERPNext persistence lands in Phase 2.5.
        </span>
        <div className="ml-auto inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold">
          <button
            onClick={() => setView("roster")}
            className={`inline-flex items-center gap-1 px-2.5 h-8 rounded-md ${
              view === "roster" ? "bg-[#064162] text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Team Roster
          </button>
          <button
            onClick={() => setView("heatmap")}
            className={`inline-flex items-center gap-1 px-2.5 h-8 rounded-md ${
              view === "heatmap" ? "bg-[#064162] text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" /> Heatmap
          </button>
        </div>
      </div>

      {/* Main split — card rail left, main view right */}
      <div className="flex gap-4 min-h-[600px]">
        {/* Card rail */}
        <aside className="w-64 shrink-0 rounded-xl border border-slate-200 bg-white flex flex-col">
          <div className="p-3 border-b border-slate-200">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#064162] mb-1.5 inline-flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5" /> Engineering Cards
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full h-7 rounded-md border border-slate-200 bg-white pl-7 pr-2 text-[11px]"
              />
            </div>
            <div className="mt-1.5 text-[10px] text-slate-500">
              {filteredCards.length} cards · drag onto an engineer
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-[700px]">
            {filteredCards.slice(0, 80).map((c) => (
              <div
                key={c.id}
                draggable
                onDragStart={(e) => {
                  setDragCardId(c.id);
                  e.dataTransfer.effectAllowed = "copy";
                  e.dataTransfer.setData("text/plain", c.id);
                }}
                onDragEnd={() => setDragCardId(null)}
                className={`cursor-grab active:cursor-grabbing rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-[#064162]/30 transition overflow-hidden ${
                  dragCardId === c.id ? "opacity-40" : ""
                }`}
                title="Drag onto an engineer to book"
              >
                <div className="relative pl-3 pr-2 py-1.5">
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ background: PRIORITY_BAR[c.priority] }}
                    aria-hidden
                  />
                  <div className="font-mono text-[11px] font-bold text-[#064162]">
                    {c.id}
                  </div>
                  <div className="text-[11px] text-slate-700 leading-snug line-clamp-1">
                    {c.jobName}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-400 uppercase tracking-wider">
                    <span className="rounded bg-slate-100 px-1 py-0.5 font-semibold">
                      {c.division} Shop
                    </span>
                    <span>{c.stage}</span>
                  </div>
                </div>
              </div>
            ))}
            {filteredCards.length > 80 && (
              <div className="text-[10px] text-center py-1 text-slate-400">
                + {filteredCards.length - 80} more
              </div>
            )}
          </div>
        </aside>

        {/* Main view */}
        <div className="flex-1 min-w-0">
          {view === "roster" ? (
            <div className="space-y-5">
              {(["Executive", "ACM", "P&T"] as const).map((d) => {
                const group = grouped[d] || [];
                if (!group.length) return null;
                return (
                  <section key={d}>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-[#064162] mb-2">
                      {d} · {group.length}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {group.map((e) => {
                        const weekly = weeklyHoursByEng.get(e.id) ?? 0;
                        const util = Math.round((weekly / e.capacityHrsPerWeek) * 100);
                        const bucket = utilBucket(util);
                        const todays = todaysByEng.get(e.id) ?? [];
                        const mgr = engineers.find((x) => x.id === e.reportsTo);
                        return (
                          <button
                            key={e.id}
                            onClick={() => setDrawer({ mode: "engineer", engineer: e })}
                            onDragOver={(ev) => {
                              if (!dragCardId) return;
                              ev.preventDefault();
                              ev.dataTransfer.dropEffect = "copy";
                            }}
                            onDrop={(ev) => {
                              if (!dragCardId) return;
                              ev.preventDefault();
                              const id = dragCardId;
                              setDragCardId(null);
                              void assignCardToEngineer(e.id, todayISO(), id);
                            }}
                            className="text-left rounded-xl border border-slate-200 bg-white p-3 hover:shadow-md hover:border-[#064162]/30 transition"
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 ring-2 ring-white shadow-sm"
                                style={{ background: avatarHslFor(e.displayName) }}
                                aria-hidden
                              >
                                {initialsOf(e.displayName)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="font-bold text-[#064162] text-sm truncate">
                                    {e.displayName}
                                  </div>
                                  {e.isManager && (
                                    <span className="text-[9px] font-bold uppercase tracking-wider bg-[#e69b40] text-white rounded px-1.5 py-0.5">
                                      Mgr
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  {e.designation}
                                </div>
                                {mgr && (
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    Reports to {mgr.displayName}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="mt-2.5">
                              <div className="flex items-center justify-between text-[10px] font-semibold">
                                <span className={bucket.text}>This week</span>
                                <span className="tabular-nums text-slate-600">
                                  {weekly}h / {e.capacityHrsPerWeek}h · {util}%
                                </span>
                              </div>
                              <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className={`h-full ${bucket.bar} transition-all`}
                                  style={{ width: `${Math.min(100, util)}%` }}
                                />
                              </div>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-1">
                              {todays.length === 0 ? (
                                <span className="text-[10px] italic text-slate-400">
                                  No jobs today
                                </span>
                              ) : (
                                <>
                                  {todays.slice(0, 3).map((a) => (
                                    <span
                                      key={a.id}
                                      className="inline-flex items-center gap-1 rounded bg-[#eaf3f8] text-[#064162] text-[10px] font-mono font-semibold px-1.5 py-0.5"
                                    >
                                      {a.card_id}
                                    </span>
                                  ))}
                                  {todays.length > 3 && (
                                    <span className="text-[10px] text-slate-500 font-semibold">
                                      +{todays.length - 3} more
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <CapacityHeatmap
              engineers={engineers}
              assignments={assignments}
              onCellClick={(engId, date) => {
                const eng = engineers.find((x) => x.id === engId);
                if (!eng) return;
                setDrawer({ mode: "cell", engineer: eng, date });
              }}
              onDropCard={(engId, date) => {
                if (!dragCardId) return;
                const id = dragCardId;
                setDragCardId(null);
                void assignCardToEngineer(engId, date, id);
              }}
              dragCardId={dragCardId}
            />
          )}
        </div>
      </div>

      <AssignmentDrawer
        state={drawer}
        assignments={assignments}
        cards={cards}
        onClose={() => setDrawer(null)}
        onRemove={removeAssignment}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#064162] text-white px-4 py-2.5 rounded-lg shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}
    </div>
  );
}

function prettyDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
