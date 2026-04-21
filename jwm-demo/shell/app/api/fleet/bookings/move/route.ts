import { NextRequest, NextResponse } from "next/server";
import { erpnextConfigured } from "@/lib/erpnext";
import {
  findBookingConflict,
  isApprovedDriver,
  moveBookingLive,
  type PoolBooking,
} from "@/lib/fleet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/fleet/bookings/move
 *
 * Body: { name, vehicle, driver, starts_at, ends_at }
 *
 * Validation:
 *   1. ends_at > starts_at
 *   2. Driver is on the active approved-driver list
 *   3. Target (vehicle × time window) has no overlapping booking (excluding self)
 *
 * Canned mode: no persistence, but all three gates still run so the UI
 * surfaces realistic error messages during demo.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const vehicle = String(body.vehicle || "").trim();
  const driver = String(body.driver || "").trim();
  const starts_at = String(body.starts_at || "").trim();
  const ends_at = String(body.ends_at || "").trim();

  const missing: string[] = [];
  if (!name) missing.push("name");
  if (!vehicle) missing.push("vehicle");
  if (!driver) missing.push("driver");
  if (!starts_at) missing.push("starts_at");
  if (!ends_at) missing.push("ends_at");
  if (missing.length) {
    return NextResponse.json({ error: "MISSING_FIELDS", fields: missing }, { status: 400 });
  }

  if (Date.parse(ends_at.replace(" ", "T")) <= Date.parse(starts_at.replace(" ", "T"))) {
    return NextResponse.json(
      { error: "ENDS_AT_MUST_FOLLOW_STARTS_AT", message: "End time must be after start time." },
      { status: 400 }
    );
  }

  const approved = await isApprovedDriver(driver);
  if (!approved) {
    return NextResponse.json(
      {
        error: "DRIVER_NOT_APPROVED",
        message: `${driver} is no longer on the active approved-driver list.`,
      },
      { status: 403 }
    );
  }

  const conflict = await findBookingConflict({ vehicle, starts_at, ends_at, excludeName: name });
  if (conflict) {
    return NextResponse.json(
      {
        error: "SLOT_OCCUPIED",
        message: `${vehicle} is already booked ${conflict.starts_at.slice(11, 16)}–${conflict.ends_at.slice(11, 16)} (${conflict.name}).`,
        conflict,
      },
      { status: 409 }
    );
  }

  if (!erpnextConfigured()) {
    const echo: PoolBooking = {
      name,
      vehicle,
      driver,
      starts_at,
      ends_at,
      status: "Confirmed",
    };
    return NextResponse.json({ source: "canned", booking: echo });
  }

  try {
    const booking = await moveBookingLive({ name, vehicle, driver, starts_at, ends_at });
    return NextResponse.json({ source: "live", booking });
  } catch (err) {
    return NextResponse.json(
      { error: "ERPNEXT_FAILED", message: String(err) },
      { status: 502 }
    );
  }
}
