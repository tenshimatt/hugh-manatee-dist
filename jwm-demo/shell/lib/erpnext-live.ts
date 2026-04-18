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

async function cachedFetchJson<T>(url: string): Promise<T> {
  const hit = CACHE.get(url);
  const now = Date.now();
  if (hit && now - hit.at < CACHE_TTL_MS) {
    return hit.value as T;
  }
  const res = await fetch(url, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`ERPNext ${res.status} ${url}`);
  const body = (await res.json()) as T;
  CACHE.set(url, { at: now, value: body });
  return body;
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

export function withinDays(iso: string | undefined, days: number): boolean {
  if (!iso) return false;
  // Frappe timestamps come back as "YYYY-MM-DD HH:MM:SS.micro" (no TZ).
  // Treat them as UTC for stability; the diff tolerances here are +/- hours.
  const t = Date.parse(iso.replace(" ", "T") + (iso.endsWith("Z") ? "" : "Z"));
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= days * 24 * 60 * 60 * 1000;
}
