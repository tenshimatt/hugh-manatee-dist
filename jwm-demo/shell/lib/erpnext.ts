/**
 * ERPNext / Frappe REST client.
 *
 * Shape matches real Frappe endpoints:
 *   GET  /api/resource/<DocType>?fields=[...]&filters=[...]
 *   GET  /api/resource/<DocType>/<name>
 *   POST /api/resource/<DocType>        (create)
 *   PUT  /api/resource/<DocType>/<name> (update)
 *   POST /api/method/<module.path>      (whitelisted server method)
 *
 * Auth: `Authorization: token <api_key>:<api_secret>`
 *
 * ENV:
 *   ERPNEXT_URL        e.g. https://erp.jwm.internal
 *   ERPNEXT_API_KEY
 *   ERPNEXT_API_SECRET
 *
 * If ERPNEXT_URL is not set, consumers should fall back to canned data.
 */

export const ERPNEXT_URL = process.env.ERPNEXT_URL?.replace(/\/$/, "") || "";
export const ERPNEXT_API_KEY = process.env.ERPNEXT_API_KEY || "";
export const ERPNEXT_API_SECRET = process.env.ERPNEXT_API_SECRET || "";

export const erpnextConfigured = () => Boolean(ERPNEXT_URL && ERPNEXT_API_KEY && ERPNEXT_API_SECRET);

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (ERPNEXT_API_KEY && ERPNEXT_API_SECRET) {
    h["Authorization"] = `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`;
  }
  return h;
}

export interface FrappeListParams {
  fields?: string[];
  filters?: Array<[string, string, unknown]> | Record<string, unknown>;
  limit_page_length?: number;
  limit_start?: number;
  order_by?: string;
}

export async function getList<T = Record<string, unknown>>(
  doctype: string,
  params: FrappeListParams = {}
): Promise<T[]> {
  if (!erpnextConfigured()) throw new Error("ERPNEXT_NOT_CONFIGURED");
  const qs = new URLSearchParams();
  if (params.fields) qs.set("fields", JSON.stringify(params.fields));
  if (params.filters) qs.set("filters", JSON.stringify(params.filters));
  if (params.limit_page_length) qs.set("limit_page_length", String(params.limit_page_length));
  if (params.limit_start) qs.set("limit_start", String(params.limit_start));
  if (params.order_by) qs.set("order_by", params.order_by);
  const res = await fetch(`${ERPNEXT_URL}/api/resource/${encodeURIComponent(doctype)}?${qs}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`ERPNext list ${doctype} ${res.status}`);
  const body = (await res.json()) as { data?: T[] };
  return body.data || [];
}

export async function getDoc<T = Record<string, unknown>>(doctype: string, name: string): Promise<T> {
  if (!erpnextConfigured()) throw new Error("ERPNEXT_NOT_CONFIGURED");
  const res = await fetch(
    `${ERPNEXT_URL}/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
    { headers: authHeaders(), cache: "no-store" }
  );
  if (!res.ok) throw new Error(`ERPNext get ${doctype}/${name} ${res.status}`);
  const body = (await res.json()) as { data: T };
  return body.data;
}

export async function createDoc<T = Record<string, unknown>>(
  doctype: string,
  payload: Record<string, unknown>
): Promise<T> {
  if (!erpnextConfigured()) throw new Error("ERPNEXT_NOT_CONFIGURED");
  const res = await fetch(`${ERPNEXT_URL}/api/resource/${encodeURIComponent(doctype)}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`ERPNext create ${doctype} ${res.status}`);
  const body = (await res.json()) as { data: T };
  return body.data;
}

export async function updateDoc<T = Record<string, unknown>>(
  doctype: string,
  name: string,
  payload: Record<string, unknown>
): Promise<T> {
  if (!erpnextConfigured()) throw new Error("ERPNEXT_NOT_CONFIGURED");
  const res = await fetch(
    `${ERPNEXT_URL}/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
    { method: "PUT", headers: authHeaders(), body: JSON.stringify(payload) }
  );
  if (!res.ok) throw new Error(`ERPNext update ${doctype}/${name} ${res.status}`);
  const body = (await res.json()) as { data: T };
  return body.data;
}

export async function callMethod<T = unknown>(
  methodPath: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  if (!erpnextConfigured()) throw new Error("ERPNEXT_NOT_CONFIGURED");
  const res = await fetch(`${ERPNEXT_URL}/api/method/${methodPath}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`ERPNext method ${methodPath} ${res.status}`);
  const body = (await res.json()) as { message: T };
  return body.message;
}

export const erpnextDeskUrl = (path: string = "/app") =>
  ERPNEXT_URL ? `${ERPNEXT_URL}${path}` : "#erpnext-not-configured";
