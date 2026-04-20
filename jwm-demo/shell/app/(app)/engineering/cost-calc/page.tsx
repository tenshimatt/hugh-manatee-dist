"use client";

/**
 * /engineering/cost-calc — Drafter Material Cost Calculator (JWM1451-111).
 *
 * Usage: Drafter picks a material, punches the square footage off the part,
 * qty + waste factor, and sees live per-unit + total cost. Validation rails
 * flag atypical SF or per-unit cost so re-makes get caught before the cut.
 *
 * Canned rate table lives in `@/lib/cost-calc` — swap in ERPNext Item Price
 * once the estimator dataset is ingested.
 */

import { useMemo, useState } from "react";
import { Calculator, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  MATERIALS,
  MATERIAL_RATES,
  FINISHES,
  computeCost,
  formatUSD,
  type MaterialKey,
  type FinishKey,
} from "@/lib/cost-calc";

export default function CostCalcPage() {
  const [material, setMaterial] = useState<MaterialKey>("acm_4mm");
  const [gauge, setGauge] = useState<string>("");
  const [sf, setSf] = useState<string>("24");
  const [qty, setQty] = useState<string>("1");
  const [wastePct, setWastePct] = useState<string>("12");
  const [finish, setFinish] = useState<FinishKey>("mill");

  const result = useMemo(
    () =>
      computeCost({
        material,
        sf: parseFloat(sf),
        qty: parseFloat(qty),
        wastePct: parseFloat(wastePct),
        finish,
      }),
    [material, sf, qty, wastePct, finish]
  );

  const rate = MATERIAL_RATES[material];
  const gaugeHint =
    MATERIALS.find((m) => m.key === material)?.gaugeHint ?? "";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-sky-600" />
          Material Cost Calculator
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Drafter tool — pick material, punch the square footage off the part,
          get live per-unit and total cost. Catches bad numbers before re-makes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Inputs
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Material">
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value as MaterialKey)}
                className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {MATERIALS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">{gaugeHint}</p>
            </Field>

            <Field label="Gauge / thickness (notes)">
              <input
                type="text"
                value={gauge}
                onChange={(e) => setGauge(e.target.value)}
                placeholder="e.g. 0.125 / 11ga / wall 1/8"
                className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </Field>
          </div>

          <Field label="Square footage (per unit)" emphasise>
            <input
              type="number"
              min={0}
              step="0.01"
              value={sf}
              onChange={(e) => setSf(e.target.value)}
              className="w-full h-14 rounded-lg border-2 border-sky-300 bg-sky-50 px-4 text-2xl font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-500">
              The key number. Typical range 0.5 – 500 SF per part.
            </p>
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Quantity">
              <input
                type="number"
                min={1}
                step="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </Field>

            <Field label="Waste factor (%)">
              <input
                type="number"
                min={0}
                max={100}
                step="0.5"
                value={wastePct}
                onChange={(e) => setWastePct(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">Industry default 12%</p>
            </Field>

            <Field label="Finish">
              <select
                value={finish}
                onChange={(e) => setFinish(e.target.value as FinishKey)}
                className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {FINISHES.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="text-xs text-slate-500 border-t border-slate-100 pt-3">
            Rate card (canned): material ${rate.matPerSF.toFixed(2)}/SF · labour ${rate.labourPerSF.toFixed(2)}/SF.
          </div>
        </div>

        {/* Output */}
        <div className="bg-[#064162] text-white rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-sky-200">
            Live Cost
          </h2>

          <div>
            <div className="text-xs text-sky-200 uppercase tracking-wider">
              Per Unit
            </div>
            <div className="text-4xl font-bold tabular-nums">
              {formatUSD(result.perUnit)}
            </div>
          </div>

          <div className="border-t border-white/20 pt-4">
            <div className="text-xs text-sky-200 uppercase tracking-wider">
              Total ({qty || 0} units)
            </div>
            <div className="text-3xl font-bold tabular-nums">
              {formatUSD(result.total)}
            </div>
          </div>

          <dl className="space-y-1.5 text-sm border-t border-white/20 pt-4">
            <Row k="Material" v={formatUSD(result.matCost)} />
            <Row k="Labour" v={formatUSD(result.labourCost)} />
            <Row k="Finish" v={formatUSD(result.finishCost)} />
          </dl>

          {result.warnings.length === 0 ? (
            <div className="flex items-start gap-2 text-xs bg-emerald-500/20 border border-emerald-300/40 rounded-lg p-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-300" />
              <span>Within typical range.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {result.warnings.map((w, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs bg-amber-500/20 border border-amber-300/40 rounded-lg p-2.5"
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-300" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  emphasise,
}: {
  label: string;
  children: React.ReactNode;
  emphasise?: boolean;
}) {
  return (
    <label className="block">
      <span
        className={
          emphasise
            ? "block text-sm font-bold text-slate-900 mb-1"
            : "block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1"
        }
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-sky-200">{k}</dt>
      <dd className="font-semibold tabular-nums">{v}</dd>
    </div>
  );
}
