/**
 * Drafter square-footage → material cost calculator.
 *
 * Scope: JWM1451-111. Replaces manual Tshop Estimator lookups that drafters
 * currently do by hand when putting SF on a part. Canned rates for demo —
 * swap for a live ERPNext Item Price feed when the estimator dataset is
 * ingested.
 *
 * Usage:
 *   import { computeCost, MATERIAL_RATES, MATERIALS } from "@/lib/cost-calc";
 *   const r = computeCost({ material: "acm_3mm", sf: 24, qty: 10, wastePct: 12 });
 */

export type MaterialKey =
  | "acm_3mm"
  | "acm_4mm"
  | "plate_1_8"
  | "plate_3_16"
  | "plate_1_4"
  | "tube_2x2"
  | "imp"
  | "corrugated"
  | "other";

export type FinishKey = "painted" | "anodised" | "mill" | "other" | "none";

export interface MaterialRate {
  matPerSF: number;
  labourPerSF: number;
  /** Optional per-finish uplift $/SF. */
  finish?: Partial<Record<FinishKey, number>>;
}

/**
 * Canonical rate table. Values derived from Tshop Estimator xlsx shape —
 * good enough for demo-day, not for issuing PO's.
 */
export const MATERIAL_RATES: Record<MaterialKey, MaterialRate> = {
  acm_3mm: { matPerSF: 4.8, labourPerSF: 2.0 },
  acm_4mm: { matPerSF: 6.2, labourPerSF: 2.2 },
  plate_1_8: { matPerSF: 3.5, labourPerSF: 1.8 },
  plate_3_16: { matPerSF: 5.1, labourPerSF: 1.9 },
  plate_1_4: { matPerSF: 6.9, labourPerSF: 2.0 },
  tube_2x2: { matPerSF: 7.5, labourPerSF: 2.5 },
  imp: { matPerSF: 9.0, labourPerSF: 3.0 },
  corrugated: { matPerSF: 3.9, labourPerSF: 1.7 },
  other: { matPerSF: 5.0, labourPerSF: 2.0 },
};

/** Display metadata for material dropdown. */
export const MATERIALS: { key: MaterialKey; label: string; gaugeHint: string }[] = [
  { key: "acm_3mm", label: "ACM 3mm", gaugeHint: "3mm composite panel" },
  { key: "acm_4mm", label: "ACM 4mm", gaugeHint: "4mm composite panel" },
  { key: "plate_1_8", label: 'Plate 1/8"', gaugeHint: "0.125 in aluminium plate" },
  { key: "plate_3_16", label: 'Plate 3/16"', gaugeHint: "0.1875 in aluminium plate" },
  { key: "plate_1_4", label: 'Plate 1/4"', gaugeHint: "0.25 in aluminium plate" },
  { key: "tube_2x2", label: "Tube 2x2", gaugeHint: "2x2 square tube, wall per drawing" },
  { key: "imp", label: "IMP", gaugeHint: "Insulated metal panel" },
  { key: "corrugated", label: "Corrugated", gaugeHint: "Corrugated sheet" },
  { key: "other", label: "Other", gaugeHint: "Custom — verify with estimator" },
];

/** Per-finish uplift ($/SF). Defaults apply across all materials. */
export const FINISH_UPLIFT: Record<FinishKey, number> = {
  none: 0,
  mill: 0,
  painted: 1.5,
  anodised: 2.2,
  other: 1.0,
};

export const FINISHES: { key: FinishKey; label: string }[] = [
  { key: "none", label: "None" },
  { key: "mill", label: "Mill" },
  { key: "painted", label: "Painted" },
  { key: "anodised", label: "Anodised" },
  { key: "other", label: "Other" },
];

export interface CostInput {
  material: MaterialKey;
  sf: number;
  qty: number;
  wastePct: number;
  finish?: FinishKey;
}

export interface CostBreakdown {
  matCost: number;
  labourCost: number;
  finishCost: number;
  perUnit: number;
  total: number;
  warnings: string[];
}

/**
 * Compute a cost breakdown. Pure; safe to call in render.
 *
 * Waste factor is applied to both material and labour — scrap panels cost
 * metal AND time to re-cut. This matches how estimators carry it on the
 * paper sheet.
 */
export function computeCost(input: CostInput): CostBreakdown {
  const rate = MATERIAL_RATES[input.material] ?? MATERIAL_RATES.other;
  const sf = Number.isFinite(input.sf) && input.sf > 0 ? input.sf : 0;
  const qty = Number.isFinite(input.qty) && input.qty > 0 ? input.qty : 0;
  const wasteMult = 1 + (Number.isFinite(input.wastePct) ? input.wastePct : 0) / 100;

  const matCost = sf * rate.matPerSF * wasteMult;
  const labourCost = sf * rate.labourPerSF * wasteMult;
  const finishKey: FinishKey = input.finish ?? "none";
  const finishCost = sf * (FINISH_UPLIFT[finishKey] ?? 0);

  const perUnit = matCost + labourCost + finishCost;
  const total = perUnit * qty;

  const warnings: string[] = [];
  if (sf > 0 && (sf < 0.5 || sf > 500)) {
    warnings.push(
      `Square footage ${sf} is outside typical range (0.5 – 500). Double-check the drawing.`
    );
  }
  if (perUnit > 0 && (perUnit < 20 || perUnit > 5000)) {
    warnings.push(
      `Per-unit cost $${perUnit.toFixed(2)} is outside typical range ($20 – $5,000). Verify material + SF.`
    );
  }
  if (qty <= 0) {
    warnings.push("Quantity must be at least 1.");
  }

  return { matCost, labourCost, finishCost, perUnit, total, warnings };
}

export function formatUSD(n: number): string {
  if (!Number.isFinite(n)) return "$0.00";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
