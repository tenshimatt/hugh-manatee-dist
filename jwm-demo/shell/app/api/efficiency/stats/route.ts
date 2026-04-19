import { NextResponse } from "next/server";
import { listEvents, groupBy, avg, EfficiencyEvent } from "@/lib/efficiency-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/efficiency/stats
 *
 * Returns Drew's 6 KPIs:
 *   1. by_operation: avg efficiency per operation
 *   2. by_material: avg efficiency per material
 *   3. by_operator: avg efficiency per operator
 *   4. est_vs_actual_labour: planned vs actual hours (sum per op)
 *   5. est_vs_actual_material: placeholder via scrap_qty / planned_qty per material
 *   6. part_history: per-part historical efficiency
 *
 * Plus:
 *   - today: {overall_eff, best_operator, worst_workstation, variance_vs_baseline}
 *   - trend: [{date, eff}]  — 14 day rolling avg
 */
function effOf(events: EfficiencyEvent[]): number {
  return avg(events.map((e) => e.efficiency_pct));
}

export async function GET() {
  const events = listEvents();
  const today = new Date().toISOString().slice(0, 10);

  // Baseline = avg eff across all events (proxy for "normal")
  const baseline = effOf(events);

  // Today slice — fall back to most recent date if "today" is outside window
  const allDates = [...new Set(events.map((e) => e.date))].sort();
  const latestDate = allDates[allDates.length - 1] || today;
  const todaysEvents = events.filter((e) => e.date === latestDate);
  const todaysEff = effOf(todaysEvents);

  // Best operator today
  const byOpToday = groupBy(todaysEvents, (e) => e.operator);
  let bestOperator = "—";
  let bestEff = -Infinity;
  for (const [op, list] of Object.entries(byOpToday)) {
    const e = effOf(list);
    if (e > bestEff) {
      bestEff = e;
      bestOperator = op;
    }
  }

  // Worst workstation today
  const byWsToday = groupBy(todaysEvents, (e) => e.workstation_label);
  let worstWs = "—";
  let worstEff = Infinity;
  for (const [ws, list] of Object.entries(byWsToday)) {
    const e = effOf(list);
    if (e < worstEff) {
      worstEff = e;
      worstWs = ws;
    }
  }

  // 14-day trend
  const byDate = groupBy(events, (e) => e.date);
  const trend = Object.entries(byDate)
    .map(([date, list]) => ({ date, eff: effOf(list), count: list.length }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  // Drew KPIs
  const by_operation = Object.entries(groupBy(events, (e) => e.operation))
    .map(([k, v]) => ({ key: k, eff: effOf(v), count: v.length }))
    .sort((a, b) => b.count - a.count);

  const by_material = Object.entries(groupBy(events, (e) => e.material || "—"))
    .map(([k, v]) => ({ key: k, eff: effOf(v), count: v.length }))
    .sort((a, b) => b.count - a.count);

  const by_operator = Object.entries(groupBy(events, (e) => e.operator))
    .map(([k, v]) => ({ key: k, eff: effOf(v), count: v.length }))
    .sort((a, b) => b.eff - a.eff);

  const by_workstation = Object.entries(groupBy(events, (e) => e.workstation_label))
    .map(([k, v]) => ({ key: k, eff: effOf(v), count: v.length }))
    .sort((a, b) => b.count - a.count);

  const est_vs_actual_labour = Object.entries(groupBy(events, (e) => e.operation))
    .map(([k, v]) => ({
      key: k,
      est: Math.round(v.reduce((s, e) => s + e.planned_hours, 0) * 10) / 10,
      act: Math.round(v.reduce((s, e) => s + e.actual_hours, 0) * 10) / 10,
      count: v.length,
    }))
    .sort((a, b) => b.count - a.count);

  const est_vs_actual_material = Object.entries(groupBy(events, (e) => e.material || "—"))
    .map(([k, v]) => ({
      key: k,
      planned: v.reduce((s, e) => s + e.planned_qty, 0),
      actual: v.reduce((s, e) => s + e.actual_qty, 0),
      scrap: v.reduce((s, e) => s + (e.scrap_qty || 0), 0),
      count: v.length,
    }))
    .sort((a, b) => b.count - a.count);

  const part_history = Object.entries(groupBy(events, (e) => e.part || "—"))
    .map(([k, v]) => ({
      key: k,
      eff: effOf(v),
      count: v.length,
      trend: v
        .slice(-5)
        .map((e) => ({ date: e.date, eff: e.efficiency_pct })),
    }))
    .filter((x) => x.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return NextResponse.json({
    as_of: new Date().toISOString(),
    today: {
      date: latestDate,
      overall_eff: todaysEff,
      best_operator: bestOperator,
      best_operator_eff: bestEff === -Infinity ? 0 : bestEff,
      worst_workstation: worstWs,
      worst_workstation_eff: worstEff === Infinity ? 0 : worstEff,
      variance_vs_baseline: Math.round((todaysEff - baseline) * 10) / 10,
      baseline,
    },
    trend,
    drew_kpis: {
      by_operation,
      by_material,
      by_operator,
      by_workstation,
      est_vs_actual_labour,
      est_vs_actual_material,
      part_history,
    },
    source: "canned",
  });
}
