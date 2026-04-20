import { NextRequest, NextResponse } from "next/server";
import { erpnextConfigured } from "@/lib/erpnext";
import { createBookingLive, isApprovedDriver } from "@/lib/fleet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/fleet/bookings/create
 *
 * Body: { vehicle, driver, starts_at, ends_at, purpose?, destination?, booked_by? }
 *
 * Enforcement: the driver must appear on the Approved Driver list with
 * active=1. Form is open to anyone (see JWM1451-89) — this is the one
 * backend gate.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const vehicle = String(body.vehicle || "").trim();
  const driver = String(body.driver || "").trim();
  const starts_at = String(body.starts_at || "").trim();
  const ends_at = String(body.ends_at || "").trim();
  const purpose = body.purpose ? String(body.purpose) : undefined;
  const destination = body.destination ? String(body.destination) : undefined;
  const booked_by = body.booked_by ? String(body.booked_by) : undefined;

  const missing: string[] = [];
  if (!vehicle) missing.push("vehicle");
  if (!driver) missing.push("driver");
  if (!starts_at) missing.push("starts_at");
  if (!ends_at) missing.push("ends_at");
  if (missing.length) {
    return NextResponse.json({ error: "MISSING_FIELDS", fields: missing }, { status: 400 });
  }

  if (Date.parse(ends_at) <= Date.parse(starts_at)) {
    return NextResponse.json({ error: "ENDS_AT_MUST_FOLLOW_STARTS_AT" }, { status: 400 });
  }

  // Driver-approval gate.
  const approved = await isApprovedDriver(driver);
  if (!approved) {
    return NextResponse.json(
      { error: "DRIVER_NOT_APPROVED", message: `Employee ${driver} is not on the active approved-driver list.` },
      { status: 403 }
    );
  }

  // Canned mode: echo a fake booking back without persistence.
  if (!erpnextConfigured()) {
    return NextResponse.json({
      source: "canned",
      booking: {
        name: `PVB-LOCAL-${Date.now().toString(36).toUpperCase()}`,
        vehicle,
        driver,
        starts_at,
        ends_at,
        purpose,
        destination,
        status: "Confirmed",
        booked_by: booked_by || driver,
      },
    });
  }

  try {
    const booking = await createBookingLive({
      vehicle,
      driver,
      starts_at,
      ends_at,
      purpose,
      destination,
      booked_by,
    });
    return NextResponse.json({ source: "live", booking });
  } catch (err) {
    return NextResponse.json({ error: "ERPNEXT_FAILED", message: String(err) }, { status: 502 });
  }
}
