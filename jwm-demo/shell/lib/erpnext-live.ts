/**
 * Thin live-data helpers on top of `erpnext.ts`.
 *
 * Adds:
 *   - A 10s in-memory cache keyed by URL to avoid hammering ERPNext during
 *     rapid UI clicks.
 *   - Convenience fetchers for the DocTypes the demo reads (Work Order,
 *     NCR, Stock Entry, RMA, Job Card).
 *
 * Frappe permission note: the REST `/api/resource/<Dt>?fields=[...]` endpoint
 * rejects fields that lack `in_list_view` / `in_standard_filter`. For docs
 * where we need more fields we list names, then hydrate with per-doc
 * `/api/resource/<Dt>/<name>` GETs (which return full docs).
 */

import { ERPNEXT_URL, ERPNEXT_API_KEY, ERPNEXT_API_SECRET, erpnextConfigured } from "./erpnext";

type CacheEntry<T> = { at: number; value: T };
const CACHE = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 10_000;

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (ERPNEXT_API_KEY && ERPNEXT_API_SECRET) {
    h["Authorization"] = `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`;
  }
  return h;
}

async function cachedFetchJson<T>(url: string, timeoutMs = 5000): Promise<T> {
  const hit = CACHE.get(url);
  const now = Date.now();
  if (hit && now - hit.at < CACHE_TTL_MS) {
    return hit.value as T;
  }
  const ctl = new AbortController();
  const tid = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: authHeaders(), cache: "no-store", signal: ctl.signal });
    if (!res.ok) throw new Error(`ERPNext ${res.status} ${url}`);
    const body = (await res.json()) as T;
    CACHE.set(url, { at: now, value: body });
    return body;
  } finally {
    clearTimeout(tid);
  }
}

export function isLive(): boolean {
  return erpnextConfigured();
}

// ---------- Work Order ----------

export interface LiveWorkOrder {
  name: string;
  status: string;
  modified: string;
  jwm_division?: string;
  jwm_baseline_date?: string;
  jwm_revised_date?: string;
  production_item?: string;
  item_name?: string;
  bom_no?: string;
  qty?: number;
  produced_qty?: number;
  planned_start_date?: string;
  expected_delivery_date?: string;
  description?: string;
  company?: string;
}

export async function listWorkOrders(limit = 100): Promise<LiveWorkOrder[]> {
  if (!erpnextConfigured()) throw new Error("ERPNEXT_NOT_CONFIGURED");
  const fields = JSON.stringify(["name", "status", "modified"]);
  const url = `${ERPNEXT_URL}/api/resource/Work%20Order?fields=${encodeURIComponent(
    fields
  )}&limit_page_length=${limit}&order_by=modified%20desc`;
  const body = await cachedFetchJson<{ data: LiveWorkOrder[] }>(url);
  return body.data || [];
}

export async function getWorkOrderLive(name: string): Promise<LiveWorkOrder | null> {
  if (!erpnextConfigured()) return null;
  try {
    const url = `${ERPNEXT_URL}/api/resource/Work%20Order/${encodeURIComponent(name)}`;
    const body = await cachedFetchJson<{ data: LiveWorkOrder }>(url);
    return body.data || null;
  } catch {
    return null;
  }
}

// ---------- NCR ----------

export interface LiveNCR {
  name: string;
  modified: string;
  ncr_date?: string;
  work_order?: string;
  item?: string;
  qty_affected?: number;
  status?: string;
  disposition?: string;
  severity?: string;
  defect_description?: string;
  root_cause?: string;
  corrective_action?: string;
  reported_by?: string;
}

export async function listNCRs(limit = 50): Promise<LiveNCR[]> {
  if (!erpnextConfigured()) throw new Error("ERPNEXT_NOT_CONFIGURED");
  const fields = JSON.stringify(["name", "modified"]);
  const url = `${ERPNEXT_URL}/api/resource/NCR?fields=${encodeURIComponent(
    fields
  )}&limit_page_length=${limit}&order_by=modified%20desc`;
  const body = await cachedFetchJson<{ data: LiveNCR[] }>(url);
  return body.data || [];
}

export async function getNCRsHydrated(limit = 20): Promise<LiveNCR[]> {
  const names = await listNCRs(limit);
  const out = await Promise.all(
    names.map(async (n) => {
      try {
        const url = `${ERPNEXT_URL}/api/resource/NCR/${encodeURIComponent(n.name)}`;
        const body = await cachedFetchJson<{ data: LiveNCR }>(url);
        return body.data;
      } catch {
        return n;
      }
    })
  );
  return out;
}

// ---------- RMA ----------

export async function listRMAs(limit = 20): Promise<Array<{ name: string; modified: string }>> {
  if (!erpnextConfigured()) throw new Error("ERPNEXT_NOT_CONFIGURED");
  const fields = JSON.stringify(["name", "modified"]);
  const url = `${ERPNEXT_URL}/api/resource/RMA?fields=${encodeURIComponent(
    fields
  )}&limit_page_length=${limit}&order_by=modified%20desc`;
  const body = await cachedFetchJson<{ data: Array<{ name: string; modified: string }> }>(url);
  return body.data || [];
}

// ---------- Stock Entry (scrap / material issue) ----------

export interface LiveStockEntry {
  name: string;
  modified: string;
  posting_date?: string;
  stock_entry_type?: string;
  jwm_workstation?: string;
  total_outgoing_value?: number;
  remarks?: string;
  items?: Array<{
    item_code?: string;
    item_name?: string;
    qty?: number;
    basic_rate?: number;
    basic_amount?: number;
  }>;
}

export async function listScrapStockEntries(limit = 40): Promise<Array<{ name: string; modified: string }>> {
  if (!erpnextConfigured()) throw new Error("ERPNEXT_NOT_CONFIGURED");
  const filters = JSON.stringify([["stock_entry_type", "=", "Material Issue"]]);
  const fields = JSON.stringify(["name", "modified"]);
  const url = `${ERPNEXT_URL}/api/resource/Stock%20Entry?fields=${encodeURIComponent(
    fields
  )}&filters=${encodeURIComponent(filters)}&limit_page_length=${limit}&order_by=modified%20desc`;
  const body = await cachedFetchJson<{ data: Array<{ name: string; modified: string }> }>(url);
  return body.data || [];
}

export async function getScrapEventsHydrated(limit = 30): Promise<LiveStockEntry[]> {
  const names = await listScrapStockEntries(limit);
  const out = await Promise.all(
    names.map(async (n) => {
      try {
        const url = `${ERPNEXT_URL}/api/resource/Stock%20Entry/${encodeURIComponent(n.name)}`;
        const body = await cachedFetchJson<{ data: LiveStockEntry }>(url);
        return body.data;
      } catch {
        return { name: n.name, modified: n.modified } as LiveStockEntry;
      }
    })
  );
  return out;
}

// ---------- Job Card ----------

export interface LiveJobCard {
  name: string;
  workstation?: string;
  status?: string;
  modified: string;
}

export async function listJobCards(workstation?: string, limit = 50): Promise<LiveJobCard[]> {
  if (!erpnextConfigured()) throw new Error("ERPNEXT_NOT_CONFIGURED");
  const fields = JSON.stringify(["name", "workstation", "status", "modified"]);
  const qs = new URLSearchParams();
  qs.set("fields", fields);
  qs.set("limit_page_length", String(limit));
  qs.set("order_by", "modified desc");
  if (workstation) {
    qs.set("filters", JSON.stringify([["workstation", "=", workstation]]));
  }
  const url = `${ERPNEXT_URL}/api/resource/Job%20Card?${qs.toString()}`;
  const body = await cachedFetchJson<{ data: LiveJobCard[] }>(url);
  return body.data || [];
}

// ---------- helpers ----------

// ---------- JWM Production Schedule Line ----------

export interface LivePSLine {
  name: string;
  job_id: string;
  job_name?: string;
  shop?: string;          // "Architectural" | "Processing" | "Unknown"
  station?: string;       // stage-ish
  status?: string;
  ship_target?: string;
  qty_required?: number;
  qty_completed?: number;
  qty_remain?: number;
  est_hours?: number;
  customer?: string;
  jwm_raw_data?: string;
}

/** Fetch schedule lines from ERPNext. Throws on failure; caller falls back to canned. */
export async function listScheduleLines(limit = 2000, filters?: Array<[string, string, unknown]>): Promise<LivePSLine[]> {
  if (!erpnextConfigured()) throw new Error("ERPNEXT_NOT_CONFIGURED");
  const fields = JSON.stringify([
    "name", "job_id", "job_name", "shop", "station", "status",
    "ship_target", "qty_required", "qty_completed", "qty_remain", "est_hours", "customer",
    "jwm_raw_data",
  ]);
  const qs = new URLSearchParams();
  qs.set("fields", fields);
  qs.set("limit_page_length", String(limit));
  if (filters && filters.length) qs.set("filters", JSON.stringify(filters));
  const url = `${ERPNEXT_URL}/api/resource/JWM%20Production%20Schedule%20Line?${qs.toString()}`;
  const body = await cachedFetchJson<{ data: LivePSLine[] }>(url);
  return body.data || [];
}

/** Fetch a single schedule line by name (full row incl. raw_data). */
export async function getScheduleLine(name: string): Promise<LivePSLine | null> {
  if (!erpnextConfigured()) return null;
  try {
    const url = `${ERPNEXT_URL}/api/resource/JWM%20Production%20Schedule%20Line/${encodeURIComponent(name)}`;
    const body = await cachedFetchJson<{ data: LivePSLine }>(url);
    return body.data || null;
  } catch {
    return null;
  }
}

/** Stage slugs the kanban expects. */
const STATION_TO_STAGE: Record<string, string> = {
  // engineering-ish
  "evaluating": "evaluating",
  "float": "float",
  "layout": "layout",
  "layout check": "layout_check",
  "sketch": "sketch",
  "sketch check": "sketch_check",
  "correction": "correction",
  "cnc": "cnc_prog",
  "cnc prog": "cnc_prog",
  "laser": "laser_prog",
  "laser prog": "laser_prog",
  "punch": "punch_prog",
  "punch prog": "punch_prog",
  "program complete": "prog_complete",
  "release": "release_shop",
  "release to shop": "release_shop",
};

export function stationToStage(station?: string): string {
  if (!station) return "uncategorized";
  const k = station.trim().toLowerCase();
  return STATION_TO_STAGE[k] || "uncategorized";
}

/** Slugify PM name → kebab-case slug. */
export function pmSlug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Parse Percent Panels Released or similar pct from raw_data JSON blob. */
export function pctFromRaw(raw?: string): number | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    for (const k of ["Percent Panels Released", "Percent Complete", "% Complete"]) {
      const v = obj[k];
      if (typeof v === "number" && Number.isFinite(v)) return Math.round(v * 100) / 100;
      if (typeof v === "string") {
        const n = parseFloat(v.replace("%", ""));
        if (Number.isFinite(n)) return n;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

// ---------- Exec KPIs (division dashboards) ----------

export interface ExecKpis {
  source: "live" | "canned";
  division: "Architectural" | "Processing";
  totalActiveProjects: number;      // distinct job count  [LIVE]
  scheduleLineCount: number;        // total schedule lines in division  [LIVE]
  pipelineUnbilled: number;         // $ estimate derived from schedule line count [LIVE-derived]
  totalSalesPending: number;        // canned or derived from quotations
  totalSfOutThere: number;          // canned
  acmMarginPct: number;             // canned
  backlog: number;                  // canned
  combinedMarginPct: number;        // canned
  costToCome: number;               // canned
  // Right-rail budget overview (all canned for now)
  budgetOverview: {
    currentCmTotal: number;
    totalCurrentBudget: number;
    totalBacklog: number;
    totalActualCostToDate: number;
    committedCost: number;
    totalProjectedBuiltActive: number;
  };
  projects: Array<{
    jobId: string;
    jobName: string;
    pm?: string;
    shipTarget?: string;
    lineCount: number;
    status: string;
  }>;
  fetchedAt: string;
}

// Canned baselines per screenshot (Architectural) + scaled-down for Processing.
const ARCH_CANNED: Omit<ExecKpis, "source" | "division" | "fetchedAt" | "projects" | "totalActiveProjects" | "scheduleLineCount" | "pipelineUnbilled"> = {
  totalSalesPending: 453_658_000,
  totalSfOutThere: 8_927_933,
  acmMarginPct: 34.5,
  backlog: 108_135_807.62,
  combinedMarginPct: 26.3,
  costToCome: 72_731_964.67,
  budgetOverview: {
    currentCmTotal: 179_521_344,
    totalCurrentBudget: 132_249_812,
    totalBacklog: 108_135_807.62,
    totalActualCostToDate: 59_517_848,
    committedCost: 41_230_552,
    totalProjectedBuiltActive: 132_249_812,
  },
};

const PROC_CANNED: typeof ARCH_CANNED = {
  totalSalesPending: 87_412_000,
  totalSfOutThere: 1_845_220,
  acmMarginPct: 28.1,
  backlog: 22_416_500,
  combinedMarginPct: 22.5,
  costToCome: 14_210_800,
  budgetOverview: {
    currentCmTotal: 34_512_000,
    totalCurrentBudget: 28_400_000,
    totalBacklog: 22_416_500,
    totalActualCostToDate: 11_200_000,
    committedCost: 7_940_000,
    totalProjectedBuiltActive: 28_400_000,
  },
};

// Canned projects fallback (used when ERPNext unreachable).
const ARCH_CANNED_PROJECTS: ExecKpis["projects"] = [
  { jobId: "25071", jobName: "IAD181 Fitout", pm: "Matt Rasmussen", shipTarget: "2026-07-14", lineCount: 38, status: "In Production" },
  { jobId: "24902", jobName: "Nashville Airport Concourse D", pm: "Cole Norona", shipTarget: "2026-06-30", lineCount: 52, status: "In Production" },
  { jobId: "24815", jobName: "Amazon HQ2 Arlington", pm: "Marc Ribar", shipTarget: "2026-08-22", lineCount: 71, status: "Engineering" },
  { jobId: "24720", jobName: "Meta Data Center Cheyenne", pm: "Dillon Bowman", shipTarget: "2026-09-05", lineCount: 44, status: "Engineering" },
  { jobId: "24688", jobName: "Tysons Tower Curtain Wall", pm: "Marc Ribar", shipTarget: "2026-10-10", lineCount: 29, status: "Fabrication" },
];

const PROC_CANNED_PROJECTS: ExecKpis["projects"] = [
  { jobId: "T-24921", jobName: "Stainless Tube Production Run 14", pm: "Kevin Florde", shipTarget: "2026-05-30", lineCount: 8, status: "Running" },
  { jobId: "T-24887", jobName: "Structural Fab — Warehouse B", pm: "Stephen Daniels", shipTarget: "2026-06-18", lineCount: 5, status: "Queued" },
];

// Longer TTL than the per-URL cache to keep exec dashboards snappy.
const EXEC_CACHE = new Map<string, { at: number; value: ExecKpis }>();
const EXEC_TTL_MS = 60_000;

/**
 * Aggregates JWM Production Schedule Lines for a division into exec KPIs.
 * Cached 60s. Returns canned baseline if ERPNext is unavailable.
 */
export async function getExecKpis(division: "Architectural" | "Processing"): Promise<ExecKpis> {
  const cached = EXEC_CACHE.get(division);
  const now = Date.now();
  if (cached && now - cached.at < EXEC_TTL_MS) return cached.value;

  const canned = division === "Architectural" ? ARCH_CANNED : PROC_CANNED;
  const cannedProjects = division === "Architectural" ? ARCH_CANNED_PROJECTS : PROC_CANNED_PROJECTS;

  const fallback: ExecKpis = {
    source: "canned",
    division,
    totalActiveProjects: division === "Architectural" ? 116 : 14,
    scheduleLineCount: division === "Architectural" ? 3900 : 48,
    pipelineUnbilled: division === "Architectural" ? 101_000_000 : 18_500_000,
    ...canned,
    projects: cannedProjects,
    fetchedAt: new Date().toISOString(),
  };

  if (!erpnextConfigured()) {
    EXEC_CACHE.set(division, { at: now, value: fallback });
    return fallback;
  }

  try {
    const lines = await listScheduleLines(2000, [["shop", "=", division]]);
    if (!lines.length) {
      EXEC_CACHE.set(division, { at: now, value: fallback });
      return fallback;
    }

    // Distinct job counting.
    const byJob = new Map<string, LivePSLine[]>();
    for (const l of lines) {
      if (!l.job_id) continue;
      const arr = byJob.get(l.job_id) || [];
      arr.push(l);
      byJob.set(l.job_id, arr);
    }
    const distinctJobs = byJob.size;
    const lineCount = lines.length;
    // Rough $ per line heuristic — $26k per line lands Architectural near the $101M pipeline figure.
    const PER_LINE_USD = 26_000;
    const pipelineUnbilled = lineCount * PER_LINE_USD;

    // Build top 20 projects by line count.
    const projects: ExecKpis["projects"] = Array.from(byJob.entries())
      .map(([jobId, rows]) => {
        const first = rows[0];
        // Cheapest ship target = min non-empty.
        const shipTargets = rows.map((r) => r.ship_target).filter((s): s is string => !!s).sort();
        let pm: string | undefined;
        for (const r of rows) {
          if (!r.jwm_raw_data) continue;
          try {
            const obj = JSON.parse(r.jwm_raw_data) as Record<string, unknown>;
            const v = obj["PM"] ?? obj["Project Manager"] ?? obj["pm"];
            if (typeof v === "string" && v.trim()) { pm = v.trim(); break; }
          } catch { /* ignore */ }
        }
        return {
          jobId,
          jobName: first.job_name || jobId,
          pm,
          shipTarget: shipTargets[0],
          lineCount: rows.length,
          status: first.status || "Active",
        };
      })
      .sort((a, b) => b.lineCount - a.lineCount)
      .slice(0, 20);

    const value: ExecKpis = {
      source: "live",
      division,
      totalActiveProjects: distinctJobs,
      scheduleLineCount: lineCount,
      pipelineUnbilled,
      ...canned,
      projects: projects.length ? projects : cannedProjects,
      fetchedAt: new Date().toISOString(),
    };
    EXEC_CACHE.set(division, { at: now, value });
    return value;
  } catch {
    EXEC_CACHE.set(division, { at: now, value: fallback });
    return fallback;
  }
}

// ---------- Ship Schedule (Drew's bottleneck view) ----------

export interface ShipJob {
  id: string;              // job_id-line_name or production_schedule id
  jobName: string;
  qty?: number;
  station?: string;
  status?: string;
  pm?: string;
  shop?: string;
}

export interface ShipScheduleGroup {
  date: string;             // "YYYY-MM-DD"
  bucket: "high" | "medium" | "normal";
  jobs: ShipJob[];
}

export interface ShipScheduleResult {
  data: ShipScheduleGroup[];
  totalJobs: number;
  uniqueDates: number;
  source: "live" | "canned";
  highDays: number;
  mediumDays: number;
  normalDays: number;
  fetchedAt: string;
}

function bucketFor(n: number): "high" | "medium" | "normal" {
  if (n >= 5) return "high";
  if (n >= 3) return "medium";
  return "normal";
}

function toDateKey(iso: string | undefined | null): string | null {
  if (!iso) return null;
  // Accept "2026-05-15", "2026-05-15T00:00:00", "2026-05-15 00:00:00"
  const s = String(iso).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function pmFromRaw(raw?: string): string | undefined {
  if (!raw) return undefined;
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const v = obj["PM"] ?? obj["Project Manager"] ?? obj["pm"];
    if (typeof v === "string" && v.trim()) return v.trim();
  } catch { /* ignore */ }
  return undefined;
}

/**
 * Aggregates JWM Production Schedule Lines by ship_target into
 * bottleneck-flagged buckets. Live with 5s timeout; canned fallback.
 */
export async function getShipSchedule(horizonDays = 56): Promise<ShipScheduleResult> {
  const now = new Date();
  const horizonMs = horizonDays * 24 * 60 * 60 * 1000;

  const buildResult = (
    groups: ShipScheduleGroup[],
    source: "live" | "canned"
  ): ShipScheduleResult => {
    groups.sort((a, b) => a.date.localeCompare(b.date));
    let totalJobs = 0;
    let highDays = 0, mediumDays = 0, normalDays = 0;
    for (const g of groups) {
      totalJobs += g.jobs.length;
      if (g.bucket === "high") highDays++;
      else if (g.bucket === "medium") mediumDays++;
      else normalDays++;
    }
    return {
      data: groups,
      totalJobs,
      uniqueDates: groups.length,
      source,
      highDays, mediumDays, normalDays,
      fetchedAt: new Date().toISOString(),
    };
  };

  const groupLines = (lines: Array<{
    id: string; jobName: string; shipTarget: string | null | undefined;
    qty?: number; station?: string; status?: string; pm?: string; shop?: string;
  }>): ShipScheduleGroup[] => {
    const byDate = new Map<string, ShipJob[]>();
    for (const l of lines) {
      const key = toDateKey(l.shipTarget);
      if (!key) continue;
      const arr = byDate.get(key) || [];
      arr.push({
        id: l.id,
        jobName: l.jobName,
        qty: l.qty,
        station: l.station,
        status: l.status,
        pm: l.pm,
        shop: l.shop,
      });
      byDate.set(key, arr);
    }
    const groups: ShipScheduleGroup[] = [];
    for (const [date, jobs] of byDate.entries()) {
      groups.push({ date, bucket: bucketFor(jobs.length), jobs });
    }
    return groups;
  };

  // canned fallback always available
  const makeCanned = async (): Promise<ShipScheduleResult> => {
    try {
      const mod = (await import("./canned/production-schedule.json")) as {
        default: Array<{
          id: string; jobName: string; shipTarget?: string | null;
          station?: string; pm?: string; division?: string;
        }>;
      };
      const rows = mod.default || [];
      const lines = rows.map((r) => ({
        id: r.id,
        jobName: r.jobName || r.id,
        shipTarget: r.shipTarget ?? null,
        station: r.station,
        pm: r.pm,
        shop: r.division === "A" ? "Architectural" : r.division === "T" ? "Processing" : r.division,
        status: undefined,
        qty: undefined,
      }));
      const groups = groupLines(lines).filter((g) => {
        const t = Date.parse(g.date + "T00:00:00Z");
        return !Number.isNaN(t) && t - now.getTime() <= horizonMs && t - now.getTime() > -7 * 24 * 60 * 60 * 1000;
      });
      return buildResult(groups, "canned");
    } catch {
      return buildResult([], "canned");
    }
  };

  if (!erpnextConfigured()) {
    return makeCanned();
  }

  try {
    const filters: Array<[string, string, unknown]> = [["ship_target", "is", "set"]];
    // Race the live fetch with a 5s timeout for safety.
    const livePromise = listScheduleLines(2000, filters);
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT")), 5000)
    );
    const lines = await Promise.race([livePromise, timeout]);
    if (!lines || lines.length === 0) return makeCanned();

    const normalised = lines.map((l) => ({
      id: l.name,
      jobName: l.job_name || l.job_id || l.name,
      shipTarget: l.ship_target,
      qty: l.qty_required,
      station: l.station,
      status: l.status,
      pm: pmFromRaw(l.jwm_raw_data),
      shop: l.shop,
    }));
    const groups = groupLines(normalised).filter((g) => {
      const t = Date.parse(g.date + "T00:00:00Z");
      return !Number.isNaN(t) && t - now.getTime() <= horizonMs && t - now.getTime() > -7 * 24 * 60 * 60 * 1000;
    });
    if (groups.length === 0) return makeCanned();
    return buildResult(groups, "live");
  } catch {
    return makeCanned();
  }
}

// ---------- Engineering Employees (JWM1451-83) ----------

import type { Engineer, Discipline } from "./engineering-schedule";
import { CANNED_ENGINEERS } from "./engineering-schedule";

interface LiveEmployee {
  name: string;
  employee_name?: string;
  first_name?: string;
  last_name?: string;
  designation?: string;
  reports_to?: string;
  custom_engineering_discipline?: string;
}

function disciplineFromDesignation(designation: string | undefined): Discipline {
  const d = (designation || "").toLowerCase();
  if (d.includes("executive")) return "Executive";
  if (d.includes("acm")) return "ACM";
  if (d.includes("plate") || d.includes("tube") || d.includes("p&t")) return "P&T";
  return "ACM";
}

/**
 * Fetch the 15 Engineering employees from ERPNext (department=Engineering - JWM).
 * 5s timeout; returns CANNED_ENGINEERS on any failure or when !isLive().
 */
export async function listEngineers(): Promise<{ data: Engineer[]; source: "live" | "canned" }> {
  if (!erpnextConfigured()) return { data: CANNED_ENGINEERS, source: "canned" };
  try {
    const fields = JSON.stringify([
      "name", "employee_name", "first_name", "last_name",
      "designation", "reports_to", "custom_engineering_discipline",
    ]);
    const filters = JSON.stringify([["department", "=", "Engineering - JWM"]]);
    const url = `${ERPNEXT_URL}/api/resource/Employee?fields=${encodeURIComponent(
      fields
    )}&filters=${encodeURIComponent(filters)}&limit_page_length=50`;

    const livePromise = cachedFetchJson<{ data: LiveEmployee[] }>(url, 5000);
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT")), 5000)
    );
    const body = await Promise.race([livePromise, timeout]);
    const rows = body.data || [];
    if (!rows.length) return { data: CANNED_ENGINEERS, source: "canned" };

    const engineers: Engineer[] = rows.map((r) => {
      const discipline = (r.custom_engineering_discipline as Discipline)
        || disciplineFromDesignation(r.designation);
      const displayName = r.first_name && r.last_name
        ? `${r.first_name} ${r.last_name}`
        : r.employee_name || r.name;
      const designation = r.designation || "Engineer";
      const isManager = /manager|executive/i.test(designation);
      return {
        id: r.name,
        fullName: r.employee_name || displayName,
        displayName,
        designation,
        discipline,
        reportsTo: r.reports_to,
        isManager,
        capacityHrsPerWeek: 40,
      };
    });
    return { data: engineers, source: "live" };
  } catch {
    return { data: CANNED_ENGINEERS, source: "canned" };
  }
}

export function withinDays(iso: string | undefined, days: number): boolean {
  if (!iso) return false;
  // Frappe timestamps come back as "YYYY-MM-DD HH:MM:SS.micro" (no TZ).
  // Treat them as UTC for stability; the diff tolerances here are +/- hours.
  const t = Date.parse(iso.replace(" ", "T") + (iso.endsWith("Z") ? "" : "Z"));
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= days * 24 * 60 * 60 * 1000;
}
