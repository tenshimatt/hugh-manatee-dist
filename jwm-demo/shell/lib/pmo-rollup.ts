/**
 * PMO Rollup types + helpers — feeds /exec/pmo.
 *
 * Source of truth today: canned JSON generated from Chris's 2026-04-20
 * xlsx export (116 projects × 46 cols). When Phase-1 ticket 121 finishes
 * seeding live Project records into ERPNext, swap this to a live-ERPNext
 * fetcher with the same shape.
 */
import raw from "@/lib/canned/pmo-rollup.json";

export type Health = "Green" | "Amber" | "Red" | "Grey";

export interface PMORow {
  jobName: string;
  shortJobNo: number | string | null;
  type: string | null;
  jobHealth: Health | null;
  budgetHealth: Health | null;
  jobNumber: number | string | null;
  pctComplete: number | null;   // 0..1
  startDate: string | null;      // ISO YYYY-MM-DD
  finishDate: string | null;
  pm: string | null;
  budgetPctSpent: number | null; // 0..1
  contractValue: number | null;
  initialBudget: number | null;
  coBudget: number | null;
  currentCv: number | null;
  currentBudget: number | null;
  actualCost: number | null;
  committedCost: number | null;
  projectedSpend: number | null;
  budgetRemaining: number | null;
  budgetToAllocate: number | null;
  cashReceived: number | null;
  recognisedRevenue: number | null;
  billedToDate: number | null;
  lastBillingDate: string | null;
  leftToBill: number | null;
  backlog: number | null;
  billingPositive: number | null;
  cashVsCost: number | null;
  profit: number | null;
  currentMargin: number | null;
  initialMargin: number | null;
  markupInitialPct: number | null;
  markupCoPct: number | null;
  coSell: number | null;
  coExecuted: number | null;
  coSubmitted: number | null;
  coRejected: number | null;
  coVoided: number | null;
  cvMinusCost: number | null;
  spectrumCv: number | null;
  spectrumDelta: number | null;
  archived: boolean;
}

export const PMO_ROWS: PMORow[] = raw as PMORow[];

export function pmoTotals(rows: PMORow[]) {
  const sum = (k: keyof PMORow) =>
    rows.reduce((s, r) => s + (typeof r[k] === "number" ? (r[k] as number) : 0), 0);
  const activeCount = rows.filter((r) => !r.archived).length;
  const countByHealth = (field: "jobHealth" | "budgetHealth") =>
    rows.reduce(
      (acc, r) => {
        const h = (r[field] as Health | null) || "Grey";
        acc[h] = (acc[h] ?? 0) + 1;
        return acc;
      },
      { Green: 0, Amber: 0, Red: 0, Grey: 0 } as Record<Health, number>,
    );
  const contractValue = sum("contractValue");
  const profit = sum("profit");
  const margin = contractValue > 0 ? profit / contractValue : 0;
  return {
    activeCount,
    contractValue,
    initialBudget: sum("initialBudget"),
    currentBudget: sum("currentBudget"),
    actualCost: sum("actualCost"),
    committedCost: sum("committedCost"),
    projectedSpend: sum("projectedSpend"),
    budgetRemaining: sum("budgetRemaining"),
    billedToDate: sum("billedToDate"),
    recognisedRevenue: sum("recognisedRevenue"),
    backlog: sum("backlog"),
    coExecuted: sum("coExecuted"),
    coSubmitted: sum("coSubmitted"),
    profit,
    margin,
    jobHealth: countByHealth("jobHealth"),
    budgetHealth: countByHealth("budgetHealth"),
    spectrumCv: sum("spectrumCv"),
    spectrumDelta: sum("spectrumDelta"),
  };
}

export function healthClass(h: Health | null | undefined): string {
  switch (h) {
    case "Green": return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "Amber": return "bg-amber-100 text-amber-800 border-amber-300";
    case "Red":   return "bg-red-100 text-red-800 border-red-300";
    default:      return "bg-slate-100 text-slate-600 border-slate-300";
  }
}

export function healthDot(h: Health | null | undefined): string {
  switch (h) {
    case "Green": return "bg-emerald-500";
    case "Amber": return "bg-amber-500";
    case "Red":   return "bg-red-500";
    default:      return "bg-slate-300";
  }
}

export function fmtMoney(n: number | null | undefined, compact = false): string {
  if (n == null) return "—";
  if (compact && Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (compact && Math.abs(n) >= 10_000) return `$${Math.round(n / 1000)}k`;
  return `$${Math.round(n).toLocaleString()}`;
}

export function fmtPct(n: number | null | undefined, decimals = 0): string {
  if (n == null) return "—";
  return `${(n * 100).toFixed(decimals)}%`;
}

export function pmSlug(pm: string | null | undefined): string {
  if (!pm) return "";
  return pm.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
