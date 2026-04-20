/**
 * Route data access — live ERPNext via whitelisted method + REST, with canned fallback.
 *
 * Backend endpoints (see /apps/jwm_manufacturing/jwm_manufacturing/routes_api.py):
 *   /api/method/jwm_manufacturing.routes_api.list_routes?limit=N
 *   /api/method/jwm_manufacturing.routes_api.get_route?name=ROUTE-...
 *   /api/method/jwm_manufacturing.routes_api.update_step (POST)
 *
 * All calls go through the Next.js API route handlers so the admin token
 * never reaches the browser.
 */

import { ERPNEXT_URL, ERPNEXT_API_KEY, ERPNEXT_API_SECRET, erpnextConfigured } from "./erpnext";
import {
  CANNED_ROUTES,
  getCannedRoute,
  listCannedRoutes,
  type RouteFull,
  type RouteSummary,
  type RouteStep,
  type RouteStepStatus,
  type RouteStatus,
} from "./canned/routes";

export type { RouteFull, RouteSummary, RouteStep, RouteStepStatus, RouteStatus };

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (ERPNEXT_API_KEY && ERPNEXT_API_SECRET) {
    h["Authorization"] = `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`;
  }
  return h;
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 5000): Promise<Response> {
  const ctl = new AbortController();
  const tid = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctl.signal, cache: "no-store", headers: { ...authHeaders(), ...(init.headers || {}) } });
  } finally {
    clearTimeout(tid);
  }
}

/** List routes. Live + canned fallback. */
export async function listRoutes(): Promise<{ data: RouteSummary[]; source: "live" | "canned" }> {
  if (!erpnextConfigured()) {
    return { data: listCannedRoutes(), source: "canned" };
  }
  try {
    const url = `${ERPNEXT_URL}/api/method/jwm_manufacturing.routes_api.list_routes?limit=100`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`list_routes ${res.status}`);
    const body = (await res.json()) as { message: { data: RouteSummary[] } };
    const data = body.message?.data ?? [];
    return { data, source: "live" };
  } catch (e) {
    console.warn("[routes] live list failed, using canned:", e);
    return { data: listCannedRoutes(), source: "canned" };
  }
}

/** Get single route with steps. Live + canned fallback. */
export async function getRoute(id: string): Promise<{ data: RouteFull | null; source: "live" | "canned" }> {
  if (!erpnextConfigured()) {
    return { data: getCannedRoute(id) ?? null, source: "canned" };
  }
  try {
    const url = `${ERPNEXT_URL}/api/method/jwm_manufacturing.routes_api.get_route?name=${encodeURIComponent(id)}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`get_route ${res.status}`);
    const body = (await res.json()) as { message: { data: RouteFull } };
    return { data: body.message?.data ?? null, source: "live" };
  } catch (e) {
    console.warn(`[routes] live get_route(${id}) failed, using canned:`, e);
    return { data: getCannedRoute(id) ?? null, source: "canned" };
  }
}

/** Update a single step. Returns {ok, updated} from server or local no-op. */
export async function updateRouteStep(
  routeName: string,
  stepName: string,
  updates: Partial<RouteStep>,
): Promise<{ ok: boolean; source: "live" | "canned"; updated?: Partial<RouteStep>; reason?: string }> {
  if (!erpnextConfigured()) {
    return { ok: false, source: "canned", reason: "erpnext-not-configured" };
  }
  try {
    const url = `${ERPNEXT_URL}/api/method/jwm_manufacturing.routes_api.update_step`;
    const form = new URLSearchParams();
    form.set("parent", routeName);
    form.set("step_name", stepName);
    form.set("updates", JSON.stringify(updates));
    const res = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    if (!res.ok) throw new Error(`update_step ${res.status}`);
    const body = (await res.json()) as { message: { ok: boolean; updated?: Partial<RouteStep>; reason?: string } };
    return { ...body.message, source: "live" };
  } catch (e) {
    console.warn("[routes] live update_step failed:", e);
    return { ok: false, source: "canned", reason: String(e) };
  }
}

/** Helpers for the viz. */
export function stepColor(status: RouteStepStatus): string {
  switch (status) {
    case "Complete":     return "#10b981";
    case "In Progress":  return "#f59e0b";
    case "Pending":      return "#94a3b8";
    case "Skipped":      return "#cbd5e1";
    case "NCR Loopback": return "#dc2626";
  }
}

export function statusBadgeClass(status: RouteStatus): string {
  switch (status) {
    case "Active":   return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "Complete": return "bg-blue-100 text-blue-800 border-blue-300";
    case "Draft":    return "bg-slate-100 text-slate-700 border-slate-300";
    case "On Hold":  return "bg-amber-100 text-amber-900 border-amber-300";
  }
}

/** Separate main sequence from optional/NCR branches for viz. */
export function partitionSteps(steps: RouteStep[]): { main: RouteStep[]; branches: RouteStep[] } {
  const main = steps
    .filter((s) => !(s.is_optional || (s.branch_from_step && s.branch_from_step > 0)))
    .sort((a, b) => a.step_no - b.step_no);
  const branches = steps
    .filter((s) => s.is_optional || (s.branch_from_step && s.branch_from_step > 0))
    .sort((a, b) => a.step_no - b.step_no);
  return { main, branches };
}

export { CANNED_ROUTES, getCannedRoute, listCannedRoutes };
