"use client";

/**
 * /shop/efficiency/new — Operator efficiency-event data-entry form.
 *
 * End-of-shift form the shift lead (or operator) fills to log one efficiency
 * record. Submits to POST /api/efficiency/new. On success, redirects to
 * /shop/efficiency where the new row appears immediately.
 *
 * The "AI-suggest-cause" button is a stub — shows a local heuristic-derived
 * "possible causes" list based on the variance magnitude. No LLM call yet.
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPERATORS = [
  "Hannah R.",
  "Lisa M.",
  "Autumn K.",
  "Owen P.",
  "Miguel Ortiz",
  "T. Henderson",
  "K. Walsh",
  "D. Peters",
  "J. Park",
  "C. Nguyen",
  "R. Li",
  "M. Ortiz",
];

const WORKSTATIONS = [
  { slug: "flat-laser-1", label: "Flat Laser #1", division: "Processing" },
  { slug: "flat-laser-2", label: "Flat Laser #2", division: "Processing" },
  { slug: "cnc-1", label: "CNC Mill #1", division: "Architectural" },
  { slug: "cnc-2", label: "CNC Mill #2", division: "Architectural" },
  { slug: "press-brake-1", label: "Press Brake #1", division: "Processing" },
  { slug: "press-brake-2", label: "Press Brake #2", division: "Processing" },
  { slug: "weld-bay-a", label: "Weld Bay A", division: "Architectural" },
  { slug: "weld-bay-b", label: "Weld Bay B", division: "Architectural" },
  { slug: "assembly-1", label: "Assembly #1", division: "Architectural" },
  { slug: "qc", label: "QC Station", division: "Processing" },
  { slug: "paint", label: "Paint Booth", division: "Architectural" },
  { slug: "shipping", label: "Shipping", division: "Processing" },
];

const OPERATIONS = [
  "Laser Cut",
  "Nest & Cut",
  "Heavy Plate Cut",
  "Press Brake Form",
  "Hem Bend",
  "Offset Bend",
  "Mill Flange",
  "Drill + Tap",
  "Profile Machine",
  "TIG Weld",
  "MIG Weld",
  "Tack + Weld",
  "Stringer Weld",
  "Subassembly",
  "Handrail Assy",
  "Panel Assy",
  "QC Inspection",
  "Dimensional Check",
  "Final Inspection",
  "Prep + Prime",
  "Topcoat",
  "Crate",
  "Palletize",
];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function variancePossibleCauses(eff: number, scrap: number): string[] {
  if (eff >= 100 && scrap === 0) {
    return [
      "Clean run — nested efficiently with prior job",
      "Operator familiar with part — no setup delay",
    ];
  }
  if (eff >= 95) {
    return [
      "Minor setup variance — within normal band",
      "First-article check took longer than planned",
    ];
  }
  if (eff >= 85) {
    return [
      "Material handling delay (loader / crane / cart)",
      "Tool change mid-run",
      "Program parameter adjustment required",
    ];
  }
  if (eff >= 70) {
    return [
      "Machine downtime (alarm / error / recovery)",
      "Kerf drift or edge burn — optics/gas suspect",
      "Operator new to workstation or part",
      "Material out of spec — pause for inspection",
    ];
  }
  return [
    "Major equipment failure (loader / auto-clamp down)",
    "Program error requiring programmer involvement",
    "Scrap rework loop — investigate root cause",
    "Mis-routed part — return to planner",
    "Dimensional issue — escalate to QC",
  ];
}

export default function NewEfficiencyEvent() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiCauses, setAiCauses] = useState<string[] | null>(null);

  // form state
  const [operator, setOperator] = useState(OPERATORS[0]);
  const [workstation, setWorkstation] = useState(WORKSTATIONS[0].slug);
  const [operation, setOperation] = useState(OPERATIONS[0]);
  const [shift, setShift] = useState<"Day" | "Swing" | "Night">("Day");
  const [date, setDate] = useState(today());
  const [plannedQty, setPlannedQty] = useState<string>("50");
  const [actualQty, setActualQty] = useState<string>("50");
  const [plannedHours, setPlannedHours] = useState<string>("4.0");
  const [actualHours, setActualHours] = useState<string>("4.0");
  const [scrapQty, setScrapQty] = useState<string>("0");
  const [material, setMaterial] = useState<string>("");
  const [part, setPart] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const ws = WORKSTATIONS.find((w) => w.slug === workstation)!;

  const eff = useMemo(() => {
    const ph = parseFloat(plannedHours);
    const ah = parseFloat(actualHours);
    if (!ph || !ah) return 0;
    return Math.round((ph / ah) * 1000) / 10;
  }, [plannedHours, actualHours]);

  function effBadge(): string {
    if (!eff) return "bg-slate-100 text-slate-600";
    if (eff >= 100) return "bg-emerald-100 text-emerald-800";
    if (eff >= 90) return "bg-amber-100 text-amber-800";
    return "bg-red-100 text-red-800";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/efficiency/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          shift,
          workstation,
          workstation_label: ws.label,
          division: ws.division,
          operation,
          operator,
          material,
          part,
          planned_qty: Number(plannedQty),
          actual_qty: Number(actualQty),
          planned_hours: Number(plannedHours),
          actual_hours: Number(actualHours),
          scrap_qty: Number(scrapQty),
          notes,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || "Submission failed");
        setSubmitting(false);
        return;
      }
      router.push("/shop/efficiency");
    } catch (err) {
      setError(String(err));
      setSubmitting(false);
    }
  }

  function suggestCauses() {
    setAiCauses(variancePossibleCauses(eff, Number(scrapQty) || 0));
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link
        href="/shop/efficiency"
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-[#064162] mb-3"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Efficiency
      </Link>
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-[#eaf3f8] to-white rounded-t-2xl">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Log efficiency event
          </div>
          <h1 className="text-2xl font-bold text-[#064162]">
            End-of-shift entry
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Minimal friction: 10 fields, one submit. Feeds the dashboard
            immediately.
          </p>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Date" required>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input"
                required
              />
            </Field>
            <Field label="Shift" required>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as "Day" | "Swing" | "Night")}
                className="input"
              >
                <option value="Day">Day</option>
                <option value="Swing">Swing</option>
                <option value="Night">Night</option>
              </select>
            </Field>
            <Field label="Operator" required>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="input"
                required
              >
                {OPERATORS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Workstation" required>
              <select
                value={workstation}
                onChange={(e) => setWorkstation(e.target.value)}
                className="input"
              >
                {WORKSTATIONS.map((w) => (
                  <option key={w.slug} value={w.slug}>
                    {w.label} ({w.division})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Operation" required>
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
                className="input"
              >
                {OPERATIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Material">
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder='e.g. A36 PL 1/4"'
                className="input"
              />
            </Field>
            <Field label="Part #">
              <input
                type="text"
                value={part}
                onChange={(e) => setPart(e.target.value)}
                placeholder="JWM-BRK-14G-0088"
                className="input font-mono"
              />
            </Field>
            <Field label="Planned Qty" required>
              <input
                type="number"
                value={plannedQty}
                onChange={(e) => setPlannedQty(e.target.value)}
                className="input tabular-nums"
                min="0"
                required
              />
            </Field>
            <Field label="Actual Qty" required>
              <input
                type="number"
                value={actualQty}
                onChange={(e) => setActualQty(e.target.value)}
                className="input tabular-nums"
                min="0"
                required
              />
            </Field>
            <Field label="Scrap Qty">
              <input
                type="number"
                value={scrapQty}
                onChange={(e) => setScrapQty(e.target.value)}
                className="input tabular-nums"
                min="0"
              />
            </Field>
            <Field label="Planned Hours" required>
              <input
                type="number"
                step="0.1"
                value={plannedHours}
                onChange={(e) => setPlannedHours(e.target.value)}
                className="input tabular-nums"
                min="0.01"
                required
              />
            </Field>
            <Field label="Actual Hours" required>
              <input
                type="number"
                step="0.1"
                value={actualHours}
                onChange={(e) => setActualHours(e.target.value)}
                className="input tabular-nums"
                min="0.01"
                required
              />
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Anything unusual — equipment issues, material delays, program changes…"
              className="input"
            />
          </Field>

          {/* Live efficiency preview + AI suggest */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                Calculated efficiency
              </div>
              <div className="text-2xl font-bold text-[#064162] tabular-nums">
                <span className={cn("px-2 py-0.5 rounded text-xl", effBadge())}>
                  {eff ? eff.toFixed(1) : "—"}%
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={suggestCauses}
            >
              <Sparkles className="w-4 h-4 text-[#e69b40]" />
              AI-suggest cause
            </Button>
          </div>

          {aiCauses && (
            <div className="bg-[#fdf2e3] border border-[#f3d7a8] rounded-lg p-4">
              <div className="text-[10px] uppercase tracking-wider text-[#8a5716] font-bold mb-2">
                Possible causes (heuristic — stub, no LLM call)
              </div>
              <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
                {aiCauses.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Link href="/shop/efficiency">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={submitting}
              className="gap-2 bg-[#064162] hover:bg-[#0a5480]"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? "Submitting…" : "Submit entry"}
            </Button>
          </div>
        </form>
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          height: 2.5rem;
          border: 1px solid #cbd5e1;
          border-radius: 0.5rem;
          padding: 0 0.75rem;
          font-size: 0.875rem;
          background: white;
          outline: none;
        }
        :global(textarea.input) {
          height: auto;
          padding: 0.5rem 0.75rem;
          font-family: inherit;
        }
        :global(.input:focus) {
          border-color: #064162;
          box-shadow: 0 0 0 2px rgba(6, 65, 98, 0.1);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600 block mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
