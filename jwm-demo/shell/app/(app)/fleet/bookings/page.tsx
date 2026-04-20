"use client";

/**
 * /fleet/bookings — Bookings calendar (week view).
 *
 * CSS-grid calendar with vehicle rows x day columns. Each booking renders
 * as a time-range block within the day cell. Click a block → detail drawer.
 *
 * No new deps; same pattern as /shop/scheduler.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarRange, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Vehicle = { name: string; make_model?: string };
type Booking = {
  name: string;
  vehicle: string;
  driver: string;
  driver_name?: string;
  starts_at: string;
  ends_at: string;
  purpose?: string;
  destination?: string;
  status: "Pending" | "Confirmed" | "Active" | "Completed" | "Cancelled";
  booked_by?: string;
};

const DAY_MS = 24 * 3600 * 1000;

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = x.getDay(); // 0=Sun
  const delta = dow === 0 ? -6 : 1 - dow; // to Monday
  x.setDate(x.getDate() + delta);
  return x;
}

function fmtDay(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseErp(iso: string): Date {
  // "YYYY-MM-DD HH:MM:SS" (treated as local time for display)
  return new Date(iso.replace(" ", "T"));
}

const STATUS_TONE: Record<Booking["status"], "green" | "amber" | "slate" | "red" | "navy"> = {
  Confirmed: "green",
  Active: "navy",
  Pending: "amber",
  Completed: "slate",
  Cancelled: "red",
};

export default function BookingsCalendarPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [source, setSource] = useState<string>("");
  const [detail, setDetail] = useState<Booking | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const weekEnd = useMemo(() => new Date(weekStart.getTime() + 7 * DAY_MS), [weekStart]);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * DAY_MS)),
    [weekStart]
  );

  useEffect(() => {
    const from = weekStart.toISOString().slice(0, 10) + " 00:00:00";
    const to = new Date(weekEnd.getTime() - 1).toISOString().slice(0, 10) + " 23:59:59";
    Promise.all([
      fetch("/api/fleet/vehicles").then((r) => r.json()),
      fetch(`/api/fleet/bookings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`).then((r) => r.json()),
    ])
      .then(([v, b]: [{ items: Vehicle[] }, { items: Booking[]; source: string }]) => {
        setVehicles(v.items);
        setBookings(b.items);
        setSource(b.source);
      })
      .catch((e) => setErr(String(e)));
  }, [weekStart, weekEnd]);

  const bookingsByVehicleDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const start = parseErp(b.starts_at);
      const key = `${b.vehicle}__${dayKey(start)}`;
      const arr = map.get(key) || [];
      arr.push(b);
      map.set(key, arr);
    }
    return map;
  }, [bookings]);

  if (err) return <div className="p-8 text-red-700">Error loading bookings: {err}</div>;

  return (
    <div className="p-6 space-y-4 max-w-6xl">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Fleet
          </div>
          <h1 className="text-2xl font-bold text-[#064162] tracking-tight flex items-center gap-2">
            <CalendarRange className="w-6 h-6" /> Bookings Calendar
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Week of {weekStart.toLocaleDateString()} — {new Date(weekEnd.getTime() - 1).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={source === "live" ? "green" : "slate"}>
            {source === "live" ? "LIVE" : "CANNED"}
          </Badge>
          <button
            onClick={() => setWeekStart(new Date(weekStart.getTime() - 7 * DAY_MS))}
            className="h-9 px-3 border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="h-9 px-3 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-sm"
          >
            This week
          </button>
          <button
            onClick={() => setWeekStart(new Date(weekStart.getTime() + 7 * DAY_MS))}
            className="h-9 px-3 border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <Link
            href="/fleet/bookings/new"
            className="h-9 px-4 inline-flex items-center rounded-xl bg-[#064162] text-white text-sm font-semibold hover:bg-[#0a5a85]"
          >
            New Booking
          </Link>
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-x-auto">
        <div
          className="grid text-xs"
          style={{ gridTemplateColumns: `160px repeat(7, minmax(120px, 1fr))` }}
        >
          {/* Header row */}
          <div className="bg-[#064162] text-white px-3 py-2 font-semibold">Vehicle</div>
          {days.map((d) => {
            const isToday = dayKey(d) === dayKey(new Date());
            return (
              <div
                key={d.toISOString()}
                className={cn(
                  "px-3 py-2 font-semibold border-l border-white/20",
                  isToday ? "bg-[#e69b40] text-white" : "bg-[#064162] text-white"
                )}
              >
                {fmtDay(d)}
              </div>
            );
          })}

          {/* Vehicle rows */}
          {vehicles.map((v) => (
            <Row
              key={v.name}
              vehicle={v}
              days={days}
              bookingsByVehicleDay={bookingsByVehicleDay}
              onPick={setDetail}
            />
          ))}
          {vehicles.length === 0 && (
            <div className="col-span-8 p-8 text-center text-slate-500">No vehicles on roster.</div>
          )}
        </div>
      </div>

      {detail && <BookingDrawer booking={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function Row({
  vehicle,
  days,
  bookingsByVehicleDay,
  onPick,
}: {
  vehicle: Vehicle;
  days: Date[];
  bookingsByVehicleDay: Map<string, Booking[]>;
  onPick: (b: Booking) => void;
}) {
  return (
    <>
      <div className="px-3 py-3 border-t border-slate-100 bg-slate-50 font-semibold text-slate-900 sticky left-0 z-10">
        <div>{vehicle.name}</div>
        {vehicle.make_model && (
          <div className="text-[10px] font-normal text-slate-500 truncate">{vehicle.make_model}</div>
        )}
      </div>
      {days.map((d) => {
        const key = `${vehicle.name}__${dayKey(d)}`;
        const items = bookingsByVehicleDay.get(key) || [];
        return (
          <div
            key={key}
            className="border-t border-l border-slate-100 p-1.5 min-h-[64px] space-y-1"
          >
            {items.map((b) => {
              const s = parseErp(b.starts_at);
              const e = parseErp(b.ends_at);
              const tone = STATUS_TONE[b.status];
              const toneBg: Record<string, string> = {
                green: "bg-emerald-100 text-emerald-900 border-emerald-300",
                navy: "bg-[#eaf3f8] text-[#064162] border-[#cfe1ec]",
                amber: "bg-amber-100 text-amber-900 border-amber-300",
                slate: "bg-slate-100 text-slate-800 border-slate-300",
                red: "bg-red-100 text-red-900 border-red-300",
              };
              const timeStr = `${s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}–${e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
              return (
                <button
                  key={b.name}
                  onClick={() => onPick(b)}
                  className={cn(
                    "block w-full text-left px-2 py-1 border rounded-md text-[11px] font-semibold hover:shadow-sm cursor-pointer",
                    toneBg[tone]
                  )}
                  title={`${b.driver_name || b.driver} · ${b.purpose || ""}`}
                >
                  <div className="truncate">{b.driver_name || b.driver}</div>
                  <div className="text-[10px] font-normal opacity-80">{timeStr}</div>
                </button>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

function BookingDrawer({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const s = parseErp(booking.starts_at);
  const e = parseErp(booking.ends_at);
  return (
    <div
      className="fixed inset-0 bg-black/40 z-40 flex items-end md:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              Booking
            </div>
            <div className="text-xl font-bold text-[#064162] font-mono">{booking.name}</div>
            <div className="text-sm text-slate-600 mt-1">
              {booking.vehicle} · {booking.driver_name || booking.driver}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <Badge tone={STATUS_TONE[booking.status]}>{booking.status}</Badge>
          <Field label="Starts">{s.toLocaleString()}</Field>
          <Field label="Ends">{e.toLocaleString()}</Field>
          {booking.purpose && <Field label="Purpose">{booking.purpose}</Field>}
          {booking.destination && <Field label="Destination">{booking.destination}</Field>}
          {booking.booked_by && <Field label="Booked by">{booking.booked_by}</Field>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-500 uppercase">{label}</div>
      <div>{children}</div>
    </div>
  );
}
