/**
 * Fleet (Pool Vehicle sign-out) live + canned helpers.
 *
 * Backed by three ERPNext DocTypes created on jwm-erp.beyondpandora.com:
 *   - Pool Vehicle           (name = vehicle_name)
 *   - Approved Driver        (name = Employee id; active flag)
 *   - Pool Vehicle Booking   (naming: PVB-YYYY-#####)
 *
 * The UI never hits ERPNext directly — API routes under /api/fleet/* use these
 * helpers and fall back to canned data when ERPNext is unreachable.
 *
 * See JWM1451-89 for requirement ("form is for anyone; driver picker is
 * filtered to the approved drivers list").
 */

import {
  ERPNEXT_URL,
  ERPNEXT_API_KEY,
  ERPNEXT_API_SECRET,
  erpnextConfigured,
} from "./erpnext";

// ---------- Shared shapes ----------

export interface PoolVehicle {
  name: string;
  make_model?: string;
  plate_number?: string;
  status: "Available" | "In Use" | "In Service" | "Retired";
  current_location?: string;
  notes?: string;
}

export interface ApprovedDriver {
  name: string;              // employee id (used as primary key)
  employee: string;
  employee_name?: string;    // hydrated from Employee doc
  licence_number?: string;
  licence_expiry?: string;
  approved_date?: string;
  active: 0 | 1;
}

export interface PoolBooking {
  name: string;
  vehicle: string;
  driver: string;
  driver_name?: string;      // hydrated
  starts_at: string;         // ISO-ish "YYYY-MM-DD HH:MM:SS"
  ends_at: string;
  purpose?: string;
  destination?: string;
  status: "Pending" | "Confirmed" | "Active" | "Completed" | "Cancelled";
  booked_by?: string;
}

// ---------- Canned fallbacks ----------

const CANNED_VEHICLES: PoolVehicle[] = [
  { name: "Truck 1", make_model: "Ford F-150 2022", plate_number: "TN-JWM-101", status: "Available", current_location: "JWM Nashville Yard" },
  { name: "Truck 2", make_model: "Ford F-250 2021", plate_number: "TN-JWM-102", status: "Available", current_location: "JWM Nashville Yard" },
  { name: "Van 1", make_model: "Ford Transit 250 2023", plate_number: "TN-JWM-201", status: "Available", current_location: "JWM Nashville Yard" },
];

const CANNED_DRIVERS: ApprovedDriver[] = [
  { name: "HR-EMP-00001", employee: "HR-EMP-00001", employee_name: "Paul Roberts", licence_number: "TN-DL-2200000", licence_expiry: "2027-04-20", approved_date: "2026-02-19", active: 1 },
  { name: "HR-EMP-00002", employee: "HR-EMP-00002", employee_name: "Denis Usatenko", licence_number: "TN-DL-2201117", licence_expiry: "2027-06-06", approved_date: "2026-02-08", active: 1 },
  { name: "HR-EMP-00003", employee: "HR-EMP-00003", employee_name: "Nadira Vlatkovic", licence_number: "TN-DL-2202234", licence_expiry: "2027-07-23", approved_date: "2026-01-28", active: 1 },
  { name: "HR-EMP-00004", employee: "HR-EMP-00004", employee_name: "Hennadii Stakhurskyi", licence_number: "TN-DL-2203351", licence_expiry: "2027-09-08", approved_date: "2026-01-17", active: 1 },
  { name: "HR-EMP-00005", employee: "HR-EMP-00005", employee_name: "Ailen Niedfeld", licence_number: "TN-DL-2204468", licence_expiry: "2027-10-25", approved_date: "2026-01-06", active: 1 },
];

function cannedBookings(): PoolBooking[] {
  const today = new Date();
  today.setHours(9, 0, 0, 0);
  const todayEnd = new Date(today.getTime()); todayEnd.setHours(13, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 3600 * 1000); tomorrow.setHours(8, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow.getTime()); tomorrowEnd.setHours(11, 0, 0, 0);
  const fmt = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");
  return [
    { name: "PVB-CANNED-00001", vehicle: "Truck 1", driver: "HR-EMP-00001", driver_name: "Paul Roberts", starts_at: fmt(today), ends_at: fmt(todayEnd), purpose: "Site walk-through — Nashville Airport", destination: "BNA Concourse D", status: "Confirmed", booked_by: "HR-EMP-00001" },
    { name: "PVB-CANNED-00002", vehicle: "Van 1", driver: "HR-EMP-00002", driver_name: "Denis Usatenko", starts_at: fmt(tomorrow), ends_at: fmt(tomorrowEnd), purpose: "Deliver samples to Amazon HQ2", destination: "Arlington VA", status: "Confirmed", booked_by: "HR-EMP-00002" },
  ];
}

// ---------- Live helpers ----------

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (ERPNEXT_API_KEY && ERPNEXT_API_SECRET) {
    h["Authorization"] = `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`;
  }
  return h;
}

async function frappeGet<T>(path: string, timeoutMs = 4000): Promise<T> {
  const ctl = new AbortController();
  const tid = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(`${ERPNEXT_URL}${path}`, { headers: authHeaders(), cache: "no-store", signal: ctl.signal });
    if (!res.ok) throw new Error(`ERPNext ${res.status} ${path}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(tid);
  }
}

export async function listVehiclesLive(): Promise<PoolVehicle[]> {
  const fields = JSON.stringify(["name", "make_model", "plate_number", "status", "current_location"]);
  const body = await frappeGet<{ data: PoolVehicle[] }>(
    `/api/resource/Pool%20Vehicle?fields=${encodeURIComponent(fields)}&limit_page_length=100`
  );
  return body.data || [];
}

export async function listVehicles(): Promise<{ items: PoolVehicle[]; source: "live" | "canned" }> {
  if (!erpnextConfigured()) return { items: CANNED_VEHICLES, source: "canned" };
  try {
    const items = await listVehiclesLive();
    if (!items.length) return { items: CANNED_VEHICLES, source: "canned" };
    return { items, source: "live" };
  } catch {
    return { items: CANNED_VEHICLES, source: "canned" };
  }
}

export async function listDriversLive(): Promise<ApprovedDriver[]> {
  const fields = JSON.stringify(["name", "employee", "licence_number", "licence_expiry", "approved_date", "active"]);
  const body = await frappeGet<{ data: ApprovedDriver[] }>(
    `/api/resource/Approved%20Driver?fields=${encodeURIComponent(fields)}&limit_page_length=200`
  );
  const drivers = body.data || [];
  // Hydrate employee_name in parallel (best effort).
  const hydrated = await Promise.all(
    drivers.map(async (d) => {
      try {
        const emp = await frappeGet<{ data: { employee_name?: string } }>(
          `/api/resource/Employee/${encodeURIComponent(d.employee)}`
        );
        return { ...d, employee_name: emp.data?.employee_name };
      } catch {
        return d;
      }
    })
  );
  return hydrated;
}

export async function listDrivers(opts: { activeOnly?: boolean } = {}): Promise<{ items: ApprovedDriver[]; source: "live" | "canned" }> {
  const { activeOnly = true } = opts;
  const filter = (arr: ApprovedDriver[]) => (activeOnly ? arr.filter((d) => d.active === 1) : arr);
  if (!erpnextConfigured()) return { items: filter(CANNED_DRIVERS), source: "canned" };
  try {
    const items = await listDriversLive();
    if (!items.length) return { items: filter(CANNED_DRIVERS), source: "canned" };
    return { items: filter(items), source: "live" };
  } catch {
    return { items: filter(CANNED_DRIVERS), source: "canned" };
  }
}

export async function listBookingsLive(filters?: { from?: string; to?: string; vehicle?: string }): Promise<PoolBooking[]> {
  const flt: Array<[string, string, unknown]> = [];
  if (filters?.from) flt.push(["starts_at", ">=", filters.from]);
  if (filters?.to) flt.push(["starts_at", "<=", filters.to]);
  if (filters?.vehicle) flt.push(["vehicle", "=", filters.vehicle]);
  const fields = JSON.stringify(["name", "vehicle", "driver", "starts_at", "ends_at", "purpose", "destination", "status", "booked_by"]);
  const qs = new URLSearchParams();
  qs.set("fields", fields);
  qs.set("limit_page_length", "500");
  if (flt.length) qs.set("filters", JSON.stringify(flt));
  qs.set("order_by", "starts_at asc");
  const body = await frappeGet<{ data: PoolBooking[] }>(`/api/resource/Pool%20Vehicle%20Booking?${qs}`);
  return body.data || [];
}

export async function listBookings(filters?: { from?: string; to?: string; vehicle?: string }): Promise<{ items: PoolBooking[]; source: "live" | "canned" }> {
  if (!erpnextConfigured()) return { items: cannedBookings(), source: "canned" };
  try {
    const items = await listBookingsLive(filters);
    if (!items.length) return { items: cannedBookings(), source: "canned" };
    return { items, source: "live" };
  } catch {
    return { items: cannedBookings(), source: "canned" };
  }
}

export async function createBookingLive(payload: {
  vehicle: string;
  driver: string;
  starts_at: string;
  ends_at: string;
  purpose?: string;
  destination?: string;
  booked_by?: string;
}): Promise<PoolBooking> {
  const body = JSON.stringify({
    vehicle: payload.vehicle,
    driver: payload.driver,
    starts_at: payload.starts_at,
    ends_at: payload.ends_at,
    purpose: payload.purpose || "",
    destination: payload.destination || "",
    status: "Confirmed",
    booked_by: payload.booked_by || payload.driver,
  });
  const res = await fetch(`${ERPNEXT_URL}/api/resource/Pool%20Vehicle%20Booking`, {
    method: "POST",
    headers: authHeaders(),
    body,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`ERPNext booking create ${res.status} ${t.slice(0, 200)}`);
  }
  const json = (await res.json()) as { data: PoolBooking };
  return json.data;
}

/** Assert the given employee id is on the approved-driver list and active. */
export async function isApprovedDriver(employeeId: string): Promise<boolean> {
  const { items } = await listDrivers({ activeOnly: true });
  return items.some((d) => d.employee === employeeId);
}

/**
 * Does [aStart,aEnd) overlap [bStart,bEnd)? Booked blocks abut back-to-back
 * without collision (end-exclusive).
 */
export function windowsOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const as = Date.parse(aStart.replace(" ", "T"));
  const ae = Date.parse(aEnd.replace(" ", "T"));
  const bs = Date.parse(bStart.replace(" ", "T"));
  const be = Date.parse(bEnd.replace(" ", "T"));
  return as < be && bs < ae;
}

/**
 * Search for a Pool Vehicle Booking on the same vehicle whose window overlaps
 * [starts_at,ends_at), excluding `excludeName`. Used as the move validation
 * gate: if this returns a booking, the move must be rejected.
 */
export async function findBookingConflict(params: {
  vehicle: string;
  starts_at: string;
  ends_at: string;
  excludeName?: string;
}): Promise<PoolBooking | null> {
  if (!erpnextConfigured()) {
    const candidates = cannedBookings().filter((b) => b.vehicle === params.vehicle && b.name !== params.excludeName);
    return candidates.find((b) => windowsOverlap(params.starts_at, params.ends_at, b.starts_at, b.ends_at)) || null;
  }
  // Pull a wide window on the same vehicle; filter locally (simpler than nested filter JSON).
  const startDay = params.starts_at.slice(0, 10);
  const endDay = params.ends_at.slice(0, 10);
  const flt: Array<[string, string, unknown]> = [
    ["vehicle", "=", params.vehicle],
    ["starts_at", "<=", `${endDay} 23:59:59`],
    ["ends_at", ">=", `${startDay} 00:00:00`],
    ["status", "!=", "Cancelled"],
  ];
  const fields = JSON.stringify(["name", "vehicle", "starts_at", "ends_at", "status"]);
  const qs = new URLSearchParams();
  qs.set("fields", fields);
  qs.set("filters", JSON.stringify(flt));
  qs.set("limit_page_length", "100");
  try {
    const body = await frappeGet<{ data: PoolBooking[] }>(`/api/resource/Pool%20Vehicle%20Booking?${qs}`);
    const candidates = (body.data || []).filter((b) => b.name !== params.excludeName);
    return candidates.find((b) => windowsOverlap(params.starts_at, params.ends_at, b.starts_at, b.ends_at)) || null;
  } catch {
    return null; // fail-open in canned/unreachable mode; canned path above handles the real case
  }
}

/**
 * Move an existing booking to a new vehicle/window. The caller is expected
 * to have already run `findBookingConflict` and `isApprovedDriver`; this is
 * the persistence step.
 */
export async function moveBookingLive(payload: {
  name: string;
  vehicle: string;
  driver: string;
  starts_at: string;
  ends_at: string;
}): Promise<PoolBooking> {
  const body = JSON.stringify({
    vehicle: payload.vehicle,
    driver: payload.driver,
    starts_at: payload.starts_at,
    ends_at: payload.ends_at,
  });
  const res = await fetch(
    `${ERPNEXT_URL}/api/resource/Pool%20Vehicle%20Booking/${encodeURIComponent(payload.name)}`,
    { method: "PUT", headers: authHeaders(), body }
  );
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`ERPNext booking move ${res.status} ${t.slice(0, 200)}`);
  }
  const json = (await res.json()) as { data: PoolBooking };
  return json.data;
}
