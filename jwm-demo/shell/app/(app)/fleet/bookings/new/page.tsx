"use client";

/**
 * /fleet/bookings/new — Booking form.
 *
 * Form is open to anyone (Chris: "Form is for anyone"), but the driver
 * dropdown is restricted to approved + active drivers. The API route
 * re-verifies on the server.
 */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarPlus, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Vehicle = { name: string; make_model?: string; status: string };
type Driver = { name: string; employee: string; employee_name?: string; active: 0 | 1 };

function nowIsoLocal(offsetHours = 0): string {
  const d = new Date();
  d.setHours(d.getHours() + offsetHours, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NewBookingPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicle, setVehicle] = useState("");
  const [driver, setDriver] = useState("");
  const [startsAt, setStartsAt] = useState(() => nowIsoLocal(1));
  const [endsAt, setEndsAt] = useState(() => nowIsoLocal(3));
  const [purpose, setPurpose] = useState("");
  const [destination, setDestination] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/fleet/vehicles").then((r) => r.json()),
      fetch("/api/fleet/drivers").then((r) => r.json()),
    ]).then(
      ([v, d]: [{ items: Vehicle[] }, { items: Driver[] }]) => {
        setVehicles(v.items);
        setDrivers(d.items);
      }
    );
  }, []);

  const availableVehicles = useMemo(
    () => vehicles.filter((v) => v.status === "Available"),
    [vehicles]
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!vehicle || !driver || !startsAt || !endsAt) {
      setErrorMsg("Vehicle, driver, start, and end are required.");
      return;
    }
    if (Date.parse(endsAt) <= Date.parse(startsAt)) {
      setErrorMsg("End time must be after start time.");
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        vehicle,
        driver,
        starts_at: startsAt.replace("T", " ") + ":00",
        ends_at: endsAt.replace("T", " ") + ":00",
        purpose: purpose || undefined,
        destination: destination || undefined,
        booked_by: driver,
      };
      const res = await fetch("/api/fleet/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        error?: string;
        message?: string;
        booking?: { name: string };
      };
      if (!res.ok) {
        setErrorMsg(
          json.message ||
            (json.error === "DRIVER_NOT_APPROVED"
              ? "That employee is not on the approved drivers list."
              : json.error || "Booking failed.")
        );
      } else {
        setSuccessMsg(`Booked as ${json.booking?.name}.`);
        setTimeout(() => router.push("/fleet/bookings"), 900);
      }
    } catch (err) {
      setErrorMsg(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-4">
        <Link
          href="/fleet/bookings"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[#064162]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to calendar
        </Link>
      </div>
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
          Fleet
        </div>
        <h1 className="text-2xl font-bold text-[#064162] tracking-tight flex items-center gap-2">
          <CalendarPlus className="w-6 h-6" /> New Pool Vehicle Booking
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Anyone can submit this form. The <strong>driver</strong> must be on the
          approved drivers list.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <Row label="Vehicle" required>
          <select
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
            className="w-full h-10 border border-slate-300 rounded-lg px-3"
            required
          >
            <option value="">— select an available vehicle —</option>
            {availableVehicles.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name}
                {v.make_model ? ` — ${v.make_model}` : ""}
              </option>
            ))}
          </select>
          {availableVehicles.length === 0 && (
            <div className="text-xs text-amber-700 mt-1">No vehicles currently Available.</div>
          )}
        </Row>

        <Row label="Driver (approved only)" required>
          <select
            value={driver}
            onChange={(e) => setDriver(e.target.value)}
            className="w-full h-10 border border-slate-300 rounded-lg px-3"
            required
          >
            <option value="">— select an approved driver —</option>
            {drivers.map((d) => (
              <option key={d.name} value={d.employee}>
                {d.employee_name || d.employee} ({d.employee})
              </option>
            ))}
          </select>
          <div className="text-xs text-slate-500 mt-1">
            Only drivers on the{" "}
            <Link href="/fleet/drivers" className="underline text-[#064162]">
              approved list
            </Link>{" "}
            appear here.
          </div>
        </Row>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Row label="Starts at" required>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full h-10 border border-slate-300 rounded-lg px-3"
              required
            />
          </Row>
          <Row label="Ends at" required>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full h-10 border border-slate-300 rounded-lg px-3"
              required
            />
          </Row>
        </div>

        <Row label="Purpose">
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            placeholder="Site visit, supplier pickup, delivery…"
          />
        </Row>

        <Row label="Destination">
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full h-10 border border-slate-300 rounded-lg px-3"
            placeholder="Address or site name"
          />
        </Row>

        {errorMsg && (
          <div className="text-sm p-3 rounded-lg bg-red-50 text-red-800 border border-red-200">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="text-sm p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
            <Badge tone="green">OK</Badge>
            {successMsg}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="h-10 px-5 rounded-xl bg-[#064162] text-white text-sm font-semibold hover:bg-[#0a5a85] disabled:opacity-60"
          >
            {submitting ? "Booking…" : "Book Vehicle"}
          </button>
          <Link
            href="/fleet/bookings"
            className="h-10 px-4 inline-flex items-center rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function Row({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
