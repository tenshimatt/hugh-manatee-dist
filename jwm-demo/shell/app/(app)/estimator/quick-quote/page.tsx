/**
 * /estimator/quick-quote
 *
 * Short-form manual quote entry (no PDF drop, no LLM extraction). Estimator
 * types in customer + 1..N drawing/description/qty/rate lines, clicks
 * "Create Quotation", we POST to /api/estimator/quick-quote/create which
 * creates an ERPNext Quotation (or canned fallback). Redirects to
 * /estimator/quick-quote/preview/<name> on success.
 */

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Sparkles,
  Copy,
  Loader2,
  FileOutput,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";
import ratesJson from "@/lib/canned/operation-rates.json";

interface Line {
  id: string;
  drawing_no: string;
  description: string;
  qty: number;
  rate: number;
  uom: string;
  notes: string;
}

const CUSTOMERS = [
  "Vanderlande Industries Inc.",
  "Nissan North America",
  "Ariens Company",
  "Ryman Hospitality Properties",
  "Google Data Center",
  "FlexJet",
  "Nashville International Airport (BNA)",
];

const DIVISIONS = ["Architectural", "Processing", "Mixed"] as const;

const UOM_OPTIONS = ["Nos", "EA", "LOT", "FT", "IN", "LB"];

function newLine(): Line {
  return {
    id: Math.random().toString(36).slice(2, 9),
    drawing_no: "",
    description: "",
    qty: 1,
    rate: 0,
    uom: "Nos",
    notes: "",
  };
}

export default function QuickQuotePage() {
  const router = useRouter();
  const [customer, setCustomer] = useState("");
  const [division, setDivision] = useState<string>("");
  const [projectName, setProjectName] = useState("");
  const [validTill, setValidTill] = useState("");
  const [terms, setTerms] = useState("Net 30. Prices valid for 30 days. FOB JWM Nashville.");
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + Number(l.qty || 0) * Number(l.rate || 0), 0),
    [lines]
  );

  function updateLine(id: string, patch: Partial<Line>) {
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((ls) => [...ls, newLine()]);
  }
  function removeLine(id: string) {
    setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.id !== id) : ls));
  }

  // Stub: AI-assist. Canned suggestion for the current line based on drawing #.
  // TODO: wire to LiteLLM /api/ai/query with quote-specific prompt — Phase 2
  function aiSuggest(id: string) {
    const line = lines.find((l) => l.id === id);
    if (!line) return;
    // Canned: pick a plausible description + rate from operation-rates fixture
    const rates = ratesJson.rates;
    const pick = rates[Math.floor(Math.random() * rates.length)];
    updateLine(id, {
      description:
        line.description ||
        `Fabricated ${pick.label.toLowerCase()} component per drawing ${line.drawing_no || "—"}`,
      rate: line.rate || Number((pick.loaded_rate_usd || pick.rate_usd).toFixed(2)),
    });
  }

  // Stub: copy lines from an existing quote.
  // TODO: wire to LiteLLM /api/ai/query with quote-specific prompt — Phase 2
  function copyFromQuote() {
    setLines([
      {
        id: Math.random().toString(36).slice(2, 9),
        drawing_no: "JWM-11646-A",
        description: "Conveyor bracket assembly (Vanderlande A)",
        qty: 100,
        rate: 39.11,
        uom: "EA",
        notes: "Copied from SAL-QTN-2026-00014 (Vanderlande PO-14303)",
      },
      {
        id: Math.random().toString(36).slice(2, 9),
        drawing_no: "JWM-11646-B",
        description: "Conveyor bracket assembly (Vanderlande B)",
        qty: 50,
        rate: 39.11,
        uom: "EA",
        notes: "Copied from SAL-QTN-2026-00014 (Vanderlande PO-14303)",
      },
    ]);
    setCustomer((c) => c || "Vanderlande Industries Inc.");
    setDivision((d) => d || "Processing");
  }

  async function submit() {
    setErr(null);
    if (!customer.trim()) {
      setErr("Pick a customer first.");
      return;
    }
    const kept = lines.filter(
      (l) => (l.drawing_no.trim() || l.description.trim()) && l.qty > 0
    );
    if (kept.length === 0) {
      setErr("Add at least one line with qty > 0.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/estimator/quick-quote/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          division,
          project_name: projectName,
          valid_till: validTill,
          terms,
          lines: kept.map((l) => ({
            drawing_no: l.drawing_no,
            description: l.description,
            qty: l.qty,
            rate: l.rate,
            uom: l.uom,
            notes: l.notes,
          })),
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        name?: string;
        error?: string;
      };
      if (!data.ok || !data.name) {
        setErr(data.error || "create_failed");
        setSubmitting(false);
        return;
      }
      router.push(`/estimator/quick-quote/preview/${encodeURIComponent(data.name)}`);
    } catch (e) {
      setErr(String(e));
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="navy">Estimator</Badge>
            <Badge tone="gold">Quick Quote</Badge>
          </div>
          <h1 className="text-3xl font-bold text-[#064162] tracking-tight mt-1">
            Quick Quote
          </h1>
          <p className="text-slate-500 mt-1 max-w-2xl">
            Type a few drawing lines and push a real Quotation into ERPNext.
            For when a PDF + full extraction is overkill.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyFromQuote}>
            <Copy className="w-4 h-4" /> Copy from quote
          </Button>
          <Button variant="gold" size="lg" onClick={submit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Creating…
              </>
            ) : (
              <>
                <FileOutput className="w-4 h-4" /> Create Quotation
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Header block */}
      <div className="jwm-card p-5 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Field label="Customer">
          <input
            list="jwm-customers"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="Start typing…"
            className="jwm-input"
            aria-label="Customer"
          />
          <datalist id="jwm-customers">
            {CUSTOMERS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Division">
          <select
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="jwm-input"
            aria-label="Division"
          >
            <option value="">—</option>
            {DIVISIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Project name (optional)">
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. Opryland East Atrium"
            className="jwm-input"
          />
        </Field>
        <Field label="Valid till">
          <input
            type="date"
            value={validTill}
            onChange={(e) => setValidTill(e.target.value)}
            className="jwm-input"
          />
        </Field>
      </div>

      {/* Line items */}
      <div className="jwm-card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Line items ({lines.length})
          </div>
          <Button variant="outline" size="sm" onClick={addLine}>
            <Plus className="w-3.5 h-3.5" /> Add line
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 bg-slate-50 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-2.5 font-semibold w-36">Drawing #</th>
                <th className="text-left px-2 py-2.5 font-semibold">Description</th>
                <th className="text-right px-2 py-2.5 font-semibold w-20">Qty</th>
                <th className="text-left px-2 py-2.5 font-semibold w-20">UoM</th>
                <th className="text-right px-2 py-2.5 font-semibold w-28">Rate</th>
                <th className="text-right px-2 py-2.5 font-semibold w-28">Ext.</th>
                <th className="px-2 py-2.5 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => {
                const ext = Number(l.qty || 0) * Number(l.rate || 0);
                return (
                  <tr
                    key={l.id}
                    className="border-t border-slate-100 align-top hover:bg-slate-50/40"
                  >
                    <td className="px-4 py-2">
                      <input
                        value={l.drawing_no}
                        onChange={(e) =>
                          updateLine(l.id, { drawing_no: e.target.value })
                        }
                        placeholder="JWM-…"
                        className="jwm-input font-mono text-xs"
                        aria-label="Drawing number"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={l.description}
                        onChange={(e) =>
                          updateLine(l.id, { description: e.target.value })
                        }
                        placeholder="Short description"
                        className="jwm-input"
                        aria-label="Description"
                      />
                      {l.notes && (
                        <div className="text-[11px] text-slate-400 mt-1 truncate">
                          {l.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={l.qty}
                        onChange={(e) =>
                          updateLine(l.id, { qty: Number(e.target.value) })
                        }
                        className="jwm-input text-right"
                        aria-label="Quantity"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={l.uom}
                        onChange={(e) => updateLine(l.id, { uom: e.target.value })}
                        className="jwm-input"
                        aria-label="Unit of measure"
                      >
                        {UOM_OPTIONS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={l.rate}
                        onChange={(e) =>
                          updateLine(l.id, { rate: Number(e.target.value) })
                        }
                        className="jwm-input text-right font-mono"
                        aria-label="Rate"
                      />
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-slate-900">
                      {formatMoney(ext)}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1 justify-end">
                        <button
                          type="button"
                          onClick={() => aiSuggest(l.id)}
                          title="AI suggest description & rate"
                          aria-label="AI suggest"
                          className="p-1.5 rounded hover:bg-[#eaf3f8] text-[#064162]"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeLine(l.id)}
                          disabled={lines.length === 1}
                          title="Remove line"
                          aria-label="Remove line"
                          className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td colSpan={5} className="px-4 py-3 text-right font-semibold text-slate-700">
                  Subtotal
                </td>
                <td className="px-2 py-3 text-right font-mono font-bold text-[#064162]">
                  {formatMoney(subtotal)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Terms */}
      <div className="jwm-card p-5">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Terms
        </div>
        <textarea
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          rows={3}
          className="jwm-input w-full resize-y"
          aria-label="Terms"
        />
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
          {err}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wide font-semibold text-slate-500 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
