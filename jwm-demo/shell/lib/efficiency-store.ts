/**
 * efficiency-store.ts — in-memory + JSON-seeded store for efficiency events.
 *
 * The Monday demo uses a canned JSON seed (lib/canned/efficiency-events.json).
 * New records submitted via POST /api/efficiency/new are held in a process-
 * local array so they appear on /shop/efficiency immediately. Next restart
 * resets to seed — intentional for demo.
 *
 * Phase 2: replace with an ERPNext "Efficiency Event" DocType + REST client.
 */
import seed from "./canned/efficiency-events.json";

export interface EfficiencyEvent {
  id: string;
  date: string; // YYYY-MM-DD
  shift: "Day" | "Swing" | "Night" | string;
  workstation: string;
  workstation_label: string;
  division: "Processing" | "Architectural" | string;
  operation: string;
  operator: string;
  material?: string;
  part?: string;
  job?: string;
  planned_qty: number;
  actual_qty: number;
  planned_hours: number;
  actual_hours: number;
  scrap_qty?: number;
  efficiency_pct: number;
  notes?: string;
  created_at?: string;
}

// Use globalThis so hot-reload in dev doesn't wipe user-submitted events.
type Store = { events: EfficiencyEvent[] };
const g = globalThis as unknown as { __jwm_eff_store?: Store };
if (!g.__jwm_eff_store) {
  g.__jwm_eff_store = {
    events: (seed.events as EfficiencyEvent[]).slice(),
  };
}
const store: Store = g.__jwm_eff_store;

export function listEvents(): EfficiencyEvent[] {
  // Newest first
  return [...store.events].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function addEvent(
  e: Omit<EfficiencyEvent, "id" | "efficiency_pct" | "created_at"> & { efficiency_pct?: number }
): EfficiencyEvent {
  const id = `EFF-${String(store.events.length + 1).padStart(4, "0")}`;
  const efficiency_pct =
    typeof e.efficiency_pct === "number"
      ? e.efficiency_pct
      : e.actual_hours > 0
      ? Math.round((e.planned_hours / e.actual_hours) * 1000) / 10
      : 0;
  const record: EfficiencyEvent = {
    ...e,
    id,
    efficiency_pct,
    created_at: new Date().toISOString(),
  };
  store.events.push(record);
  return record;
}

/** Group helpers for dashboard KPIs (Drew's 6). */
export function groupBy<T>(
  arr: T[],
  key: (x: T) => string
): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const x of arr) {
    const k = key(x);
    (out[k] ||= []).push(x);
  }
  return out;
}

export function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}
