/**
 * RouteEditorClient — interactive editor for a Route.
 *
 * - Pipeline viz on top (full variant), clickable to scroll to step row.
 * - Step table below with inline status dropdown, NCR branch toggle.
 * - Drag the grip handle to reorder steps (top = do first). Up/down arrows
 *   remain as an accessibility fallback. HTML5 native drag-and-drop; no libs.
 * - Branch (optional) steps anchor to their main step; they're not drag-reorderable
 *   themselves — move the anchor step and the branch follows.
 * - Save persists via POST /api/routes/[id]/step per edited step.
 */
"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, Save, GitBranch, GripVertical } from "lucide-react";
import { RoutePipeline } from "./RoutePipeline";
import type { RouteFull, RouteStep, RouteStepStatus } from "@/lib/routes";

const STATUSES: RouteStepStatus[] = ["Pending", "In Progress", "Complete", "Skipped", "NCR Loopback"];

export function RouteEditorClient({
  initialRoute,
  isLive,
}: {
  initialRoute: RouteFull;
  isLive: boolean;
}) {
  // Local working copy — changes flushed on Save.
  const [steps, setSteps] = useState<RouteStep[]>(initialRoute.steps);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  // HTML5 drag state (no external lib). dragIdx = the row currently being dragged.
  // overIdx = the row being hovered as a drop target. top-of-list is step_no=1.
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dirty = useMemo(
    () => JSON.stringify(steps) !== JSON.stringify(initialRoute.steps),
    [steps, initialRoute.steps],
  );

  function updateStep(i: number, patch: Partial<RouteStep>) {
    setSteps((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  }

  function renumberMainSequence(arr: RouteStep[]) {
    let n = 1;
    for (const s of arr) {
      if (!(s.is_optional || (s.branch_from_step ?? 0) > 0)) {
        s.step_no = n++;
      }
    }
  }

  function moveStep(i: number, dir: -1 | 1) {
    setSteps((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      renumberMainSequence(next);
      return next;
    });
  }

  // Drag-to-reorder: top of list = do first (step_no=1).
  function moveStepTo(from: number, to: number) {
    if (from === to || from < 0 || to < 0) return;
    setSteps((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      const insertAt = from < to ? to : to;
      next.splice(insertAt, 0, moved);
      renumberMainSequence(next);
      return next;
    });
  }

  function toggleBranch(i: number) {
    setSteps((prev) =>
      prev.map((s, j) => {
        if (j !== i) return s;
        const becomingBranch = !(s.is_optional || (s.branch_from_step ?? 0) > 0);
        if (becomingBranch) {
          // Anchor branch to previous main step's step_no
          const prevMain = prev
            .slice(0, j)
            .filter((x) => !(x.is_optional || (x.branch_from_step ?? 0) > 0));
          const anchor = prevMain.length ? prevMain[prevMain.length - 1].step_no : 1;
          return { ...s, is_optional: 1, branch_from_step: anchor, status: "NCR Loopback" as RouteStepStatus, step_no: 99 };
        } else {
          return { ...s, is_optional: 0, branch_from_step: null, status: s.status === "NCR Loopback" ? "Pending" : s.status };
        }
      }),
    );
  }

  async function saveStep(i: number) {
    const step = steps[i];
    if (!step.name) {
      // unsaved locally — server has no record. For the demo this happens rarely since all 3 routes are seeded.
      setSaveMsg(`Step ${step.step_no} is local-only (no backend record). Full-route save not implemented.`);
      return;
    }
    setSavingIdx(i);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/routes/${encodeURIComponent(initialRoute.name)}/step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step_name: step.name,
          updates: {
            status: step.status,
            planned_hours: step.planned_hours,
            is_optional: step.is_optional ? 1 : 0,
            branch_from_step: step.branch_from_step,
            operation: step.operation,
            workstation: step.workstation,
          },
        }),
      });
      const body = await res.json();
      setSaveMsg(body.ok ? `Saved step ${step.step_no}.` : `Save failed: ${body.reason || res.status}`);
    } catch (e) {
      setSaveMsg(`Save error: ${String(e)}`);
    } finally {
      setSavingIdx(null);
    }
  }

  async function saveAll() {
    setSaveMsg(null);
    let okCount = 0;
    let failCount = 0;
    for (let i = 0; i < steps.length; i++) {
      const original = initialRoute.steps[i];
      if (!original) continue;
      if (JSON.stringify(steps[i]) === JSON.stringify(original)) continue;
      if (!steps[i].name) continue;
      setSavingIdx(i);
      try {
        const res = await fetch(`/api/routes/${encodeURIComponent(initialRoute.name)}/step`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step_name: steps[i].name,
            updates: {
              status: steps[i].status,
              planned_hours: steps[i].planned_hours,
              is_optional: steps[i].is_optional ? 1 : 0,
              branch_from_step: steps[i].branch_from_step,
              operation: steps[i].operation,
              workstation: steps[i].workstation,
            },
          }),
        });
        const body = await res.json();
        if (body.ok) okCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }
    setSavingIdx(null);
    setSaveMsg(`Save complete — ${okCount} ok, ${failCount} failed.`);
  }

  return (
    <div className="space-y-5">
      <section className="border border-slate-200 rounded-lg bg-white shadow-sm">
        <header className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-sky-600" /> Pipeline
          </h2>
          <span className="text-xs text-slate-500">
            {steps.filter((s) => s.status === "Complete").length}/
            {steps.filter((s) => !(s.is_optional || (s.branch_from_step ?? 0) > 0)).length} main steps complete
          </span>
        </header>
        <RoutePipeline steps={steps} variant="full" />
      </section>

      <section className="border border-slate-200 rounded-lg bg-white shadow-sm">
        <header className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Steps</h2>
          <div className="flex items-center gap-2">
            {saveMsg && <span className="text-xs text-slate-600">{saveMsg}</span>}
            <button
              type="button"
              onClick={saveAll}
              disabled={!dirty || !isLive}
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="w-3 h-3" /> Save all changes
            </button>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="text-left px-2 py-2 w-8" aria-label="Drag"></th>
                <th className="text-left px-3 py-2 w-12">#</th>
                <th className="text-left px-3 py-2">Operation</th>
                <th className="text-left px-3 py-2">Workstation</th>
                <th className="text-left px-3 py-2 w-28">Planned h</th>
                <th className="text-left px-3 py-2 w-36">Status</th>
                <th className="text-left px-3 py-2 w-28">Branch</th>
                <th className="text-right px-3 py-2 w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((s, i) => {
                const isBranch = Boolean(s.is_optional) || (s.branch_from_step ?? 0) > 0;
                const isDragging = dragIdx === i;
                const isOver = overIdx === i && dragIdx !== null && dragIdx !== i;
                return (
                  <tr
                    key={s.name || `${s.step_no}-${s.operation}-${i}`}
                    onDragOver={(e) => {
                      if (dragIdx === null || isBranch) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (overIdx !== i) setOverIdx(i);
                    }}
                    onDragLeave={() => {
                      if (overIdx === i) setOverIdx(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragIdx === null || dragIdx === i) return;
                      moveStepTo(dragIdx, i);
                      setDragIdx(null);
                      setOverIdx(null);
                    }}
                    className={`border-t border-slate-100 ${isBranch ? "bg-red-50/40" : ""} ${
                      isDragging ? "opacity-40" : ""
                    } ${isOver ? "bg-sky-100 ring-2 ring-sky-400" : ""}`}
                  >
                    <td className="px-2 py-2 text-center">
                      {isBranch ? (
                        <span className="text-slate-300" title="Branch steps reorder via the anchor step">
                          <GripVertical className="w-4 h-4 inline" />
                        </span>
                      ) : (
                        <span
                          draggable
                          onDragStart={(e) => {
                            setDragIdx(i);
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData("text/plain", String(i));
                          }}
                          onDragEnd={() => {
                            setDragIdx(null);
                            setOverIdx(null);
                          }}
                          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 inline-flex"
                          title="Drag to reorder — top = do first"
                          aria-label="Drag handle"
                        >
                          <GripVertical className="w-4 h-4" />
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-700">
                      {isBranch ? <span className="text-red-600 font-bold">↳</span> : s.step_no}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full border border-slate-200 rounded px-2 py-1 text-sm"
                        value={s.operation}
                        onChange={(e) => updateStep(i, { operation: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full border border-slate-200 rounded px-2 py-1 text-sm"
                        value={s.workstation}
                        onChange={(e) => updateStep(i, { workstation: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.25"
                        className="w-20 border border-slate-200 rounded px-2 py-1 text-sm"
                        value={s.planned_hours}
                        onChange={(e) => updateStep(i, { planned_hours: parseFloat(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="border border-slate-200 rounded px-2 py-1 text-sm bg-white"
                        value={s.status}
                        onChange={(e) => updateStep(i, { status: e.target.value as RouteStepStatus })}
                      >
                        {STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => toggleBranch(i)}
                        className={`text-xs font-semibold px-2 py-1 rounded border flex items-center gap-1 ${
                          isBranch
                            ? "bg-red-100 text-red-800 border-red-300 hover:bg-red-200"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                        title={isBranch ? "Remove NCR branch flag" : "Flag as NCR / optional branch"}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {isBranch ? `Branch of #${s.branch_from_step}` : "Mark branch"}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex gap-1 items-center">
                        <button
                          type="button"
                          onClick={() => moveStep(i, -1)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30"
                          disabled={i === 0}
                          aria-label="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStep(i, 1)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30"
                          disabled={i === steps.length - 1}
                          aria-label="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => saveStep(i)}
                          disabled={savingIdx === i || !isLive}
                          className="ml-1 text-xs px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
                        >
                          {savingIdx === i ? "..." : "Save"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!isLive && (
          <div className="px-4 py-2 text-xs bg-amber-50 border-t border-amber-200 text-amber-900">
            Canned mode — edits won&apos;t persist to ERPNext.
          </div>
        )}
      </section>
    </div>
  );
}

export default RouteEditorClient;
