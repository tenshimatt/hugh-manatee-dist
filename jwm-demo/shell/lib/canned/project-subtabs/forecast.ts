// Canned Forecast — schema mirrors A-Shop/Forecast.xlsx.
// Columns: Phase Code · Description · Current Budget · Actual Costs ·
// Left To Allocate · [month buckets].

import { cannedBudget } from "./budget";

export type ForecastRow = {
  phaseCode: string;
  description: string;
  category: string;
  currentBudget: number;
  actualCosts: number;
  leftToAllocate: number;
  monthly: Record<string, number>; // month -> $
};

export type ForecastData = {
  months: string[]; // in chronological order
  rows: ForecastRow[];
  totalsByMonth: Record<string, number>;
  totals: { current: number; actual: number; remaining: number };
};

const MONTHS = [
  "Sep 26",
  "Oct 26",
  "Nov 26",
  "Dec 26",
  "Jan 27",
  "Feb 27",
  "Mar 27",
  "Apr 27",
  "May 27",
];

export function cannedForecast(jobNumber: string): ForecastData {
  const b = cannedBudget(jobNumber);
  const months = MONTHS;
  const rows: ForecastRow[] = b.lines.map((l) => {
    const remaining = Math.max(0, l.current - l.actual);
    // Distribute remaining over the months with a realistic S-curve weighting.
    const weights = sCurveWeights(l.category, months.length);
    const sumW = weights.reduce((a, b) => a + b, 0) || 1;
    const monthly: Record<string, number> = {};
    months.forEach((m, i) => {
      monthly[m] = Math.round((remaining * weights[i]) / sumW);
    });
    return {
      phaseCode: l.phaseCode,
      description: l.description,
      category: l.category,
      currentBudget: l.current,
      actualCosts: l.actual,
      leftToAllocate: remaining,
      monthly,
    };
  });

  const totalsByMonth: Record<string, number> = {};
  months.forEach((m) => {
    totalsByMonth[m] = rows.reduce((a, r) => a + (r.monthly[m] || 0), 0);
  });
  const totals = {
    current: rows.reduce((a, r) => a + r.currentBudget, 0),
    actual: rows.reduce((a, r) => a + r.actualCosts, 0),
    remaining: rows.reduce((a, r) => a + r.leftToAllocate, 0),
  };
  return { months, rows, totalsByMonth, totals };
}

// Very rough per-category time weighting.
function sCurveWeights(category: string, n: number): number[] {
  const early = /DRAFTING|ENGINEERING|MATERIALS/i.test(category);
  const late  = /FIELD|FREIGHT|CRATING/i.test(category);
  const w: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(1, n - 1);
    if (early) w.push(1 - t * 0.9 + 0.05);
    else if (late) w.push(0.05 + t);
    else w.push(Math.sin(Math.PI * t));
  }
  return w;
}
