"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Plus, Sparkles, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * /erf/new — submit a new Engineering Release Form.
 *
 * "Help me fill this" posts to /api/erf/ai-fill which returns canned
 * pattern-matched suggestions (see route for the TODO about wiring to
 * LiteLLM in Phase 2). Submit posts to /api/erf and redirects to /erf/[id].
 */

type LineItem = {
  part: string;
  qty: number;
  uom: string;
  gauge?: string;
  material?: string;
};

type Division = "Architectural" | "Processing";
type Priority = "low" | "normal" | "urgent";

export default function NewErfPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [customer, setCustomer] = useState("");
  const [project, setProject] = useState("");
  const [notes, setNotes] = useState("");
  const [division, setDivision] = useState<Division>("Architectural");
  const [priority, setPriority] = useState<Priority>("normal");
  const [targetRelease, setTargetRelease] = useState(
    new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10)
  );
  const [items, setItems] = useState<LineItem[]>([
    { part: "", qty: 1, uom: "ea" },
  ]);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiRationale, setAiRationale] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addLine() {
    setItems((xs) => [...xs, { part: "", qty: 1, uom: "ea" }]);
  }
  function removeLine(i: number) {
    setItems((xs) => xs.filter((_, idx) => idx !== i));
  }
  function updateLine(i: number, patch: Partial<LineItem>) {
    setItems((xs) => xs.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }

  async function runAiFill() {
    setAiBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/erf/ai-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer, project, notes }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      if (j.suggested_title && !title) setTitle(j.suggested_title);
      if (j.division) setDivision(j.division);
      if (j.priority) setPriority(j.priority);
      if (j.target_release) setTargetRelease(j.target_release);
      if (Array.isArray(j.line_items) && j.line_items.length > 0) {
        setItems(j.line_items);
      }
      setAiRationale(j.rationale || null);
    } catch (e) {
      setError(`AI fill failed: ${String(e)}`);
    } finally {
      setAiBusy(false);
    }
  }

  async function submit() {
    if (!title.trim() || !customer.trim()) {
      setError("Title and Customer are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch("/api/erf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          customer,
          project: project || title,
          division,
          priority,
          target_release: targetRelease,
          notes,
          line_items: items.filter((x) => x.part.trim()),
          status: "Draft",
        }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      router.push(`/arch/erf/${j.erf.id}`);
    } catch (e) {
      setError(`Submit failed: ${String(e)}`);
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/arch/erf"
        className="inline-flex items-center gap-2 text-[#064162] font-semibold hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to ERF queue
      </Link>

      <header className="space-y-1">
        <div className="text-xs font-bold text-[#e69b40] uppercase tracking-widest">
          Engineering Release
        </div>
        <h1 className="text-3xl font-bold text-[#064162] tracking-tight">New ERF</h1>
        <p className="text-slate-500">
          Submit a release for engineering review. Use &ldquo;Help me fill this&rdquo; to
          auto-populate from the customer + project.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <section className="jwm-card p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Customer *" required>
            <input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="e.g. Ryman Hospitality Properties"
              className="jwm-input"
            />
          </Field>
          <Field label="Project">
            <input
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="e.g. Opryland East Atrium Stair"
              className="jwm-input"
            />
          </Field>
        </div>

        <Field label="Notes / scope">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="What needs to be released? Any known blockers, drawings pending, material lead times."
            className="jwm-input"
          />
        </Field>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button
            variant="gold"
            size="md"
            onClick={runAiFill}
            disabled={aiBusy || (!customer.trim() && !project.trim())}
          >
            {aiBusy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Help me fill this
              </>
            )}
          </Button>
          {aiRationale && (
            <div className="text-xs text-slate-600 bg-[#fdf2e3] border border-[#f3d7a8] rounded-lg px-3 py-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#e69b40]" />
              {aiRationale}
            </div>
          )}
        </div>
      </section>

      <section className="jwm-card p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[#064162]">Release details</h2>
          <p className="text-xs text-slate-500">Edit as needed; AI fill pre-populates reasonable defaults.</p>
        </div>

        <Field label="Title *" required>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short description"
            className="jwm-input"
          />
        </Field>

        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Division">
            <select
              value={division}
              onChange={(e) => setDivision(e.target.value as Division)}
              className="jwm-input"
            >
              <option>Architectural</option>
              <option>Processing</option>
            </select>
          </Field>
          <Field label="Priority">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="jwm-input"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </Field>
          <Field label="Target release">
            <input
              type="date"
              value={targetRelease}
              onChange={(e) => setTargetRelease(e.target.value)}
              className="jwm-input"
            />
          </Field>
        </div>
      </section>

      <section className="jwm-card p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#064162]">Line items</h2>
          <Badge tone="slate" className="text-[10px]">
            {items.length} line{items.length === 1 ? "" : "s"}
          </Badge>
        </div>

        <div className="space-y-2">
          {items.map((x, i) => (
            <div
              key={i}
              className="grid grid-cols-12 gap-2 items-start border border-slate-200 rounded-xl p-3 bg-slate-50/50"
            >
              <div className="col-span-12 sm:col-span-5">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Part</label>
                <input
                  value={x.part}
                  onChange={(e) => updateLine(i, { part: e.target.value })}
                  placeholder="e.g. Outer Stringer Plate"
                  className="jwm-input mt-0.5"
                />
              </div>
              <div className="col-span-4 sm:col-span-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Qty</label>
                <input
                  type="number"
                  min={0}
                  value={x.qty}
                  onChange={(e) => updateLine(i, { qty: Number(e.target.value) })}
                  className="jwm-input mt-0.5"
                />
              </div>
              <div className="col-span-4 sm:col-span-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">UOM</label>
                <input
                  value={x.uom}
                  onChange={(e) => updateLine(i, { uom: e.target.value })}
                  className="jwm-input mt-0.5"
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Gauge</label>
                <input
                  value={x.gauge || ""}
                  onChange={(e) => updateLine(i, { gauge: e.target.value })}
                  placeholder="1/2&quot;"
                  className="jwm-input mt-0.5"
                />
              </div>
              <div className="col-span-10 sm:col-span-2">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Material</label>
                <input
                  value={x.material || ""}
                  onChange={(e) => updateLine(i, { material: e.target.value })}
                  placeholder="A36"
                  className="jwm-input mt-0.5"
                />
              </div>
              <div className="col-span-2 sm:col-span-1 flex items-end justify-end">
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  disabled={items.length === 1}
                  className="h-10 w-10 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30"
                  aria-label="Remove line"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={addLine}>
          <Plus className="w-4 h-4" />
          Add line
        </Button>
      </section>

      <div className="flex items-center justify-end gap-3 sticky bottom-4 bg-white/80 backdrop-blur rounded-xl border border-slate-200 p-3 shadow-sm">
        <Link
          href="/arch/erf"
          className="text-sm text-slate-600 hover:underline px-3 py-2"
        >
          Cancel
        </Link>
        <Button variant="primary" size="md" onClick={submit} disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Submit ERF
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-600 ml-0.5">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
