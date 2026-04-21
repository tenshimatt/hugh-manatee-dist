"use client";

/**
 * /fleet/bookings — Bookings calendar (week view) with drag-and-drop
 * rescheduling.
 *
 * Drag a booking block to another (vehicle × day) cell. The server
 * re-validates on every move:
 *   - target slot must be free (no overlap with another booking on that
 *     vehicle, excluding the booking being moved)
 *   - driver must still be on the active approved-driver list
 * On reject the UI reverts and shows a toast with the reason.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CalendarRange, ChevronLeft, ChevronRight, X, GripVertical } from "lucide-react";
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
  const dow = x.getDay();
  const delta = dow === 0 ? -6 : 1 - dow;
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
  return new Date(iso.replace(" ", "T"));
}

function fmtErp(d: Date): string {
  // "YYYY-MM-DD HH:MM:SS" local time
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Shift booking window from old day-start to new day-start, preserving time-of-day and duration. */
function shiftWindow(starts_at: string, ends_at: string, oldDayKey: string, newDayKey: string): { starts_at: string; ends_at: string } {
  const s = parseErp(starts_at);
  const e = parseErp(ends_at);
  const oldDay = new Date(oldDayKey + "T00:00:00");
  const newDay = new Date(newDayKey + "T00:00:00");
  const deltaMs = newDay.getTime() - oldDay.getTime();
  return { starts_at: fmtErp(new Date(s.getTime() + deltaMs)), ends_at: fmtErp(new Date(e.getTime() + deltaMs)) };
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
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [dragName, setDragName] = useState<string | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function showToast(kind: "ok" | "err", msg: string) {
    setToast({ kind, msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

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

  /**
   * Client-side overlap precheck. Server re-validates — this just spares
   * a round-trip for obviously-bad drops.
   */
  function hasLocalConflict(vehicle: string, starts_at: string, ends_at: string, excludeName: string): Booking | null {
    const s = Date.parse(starts_at.replace(" ", "T"));
    const e = Date.parse(ends_at.replace(" ", "T"));
    for (const b of bookings) {
      if (b.name === excludeName) continue;
      if (b.vehicle !== vehicle) continue;
      if (b.status === "Cancelled") continue;
      const bs = Date.parse(b.starts_at.replace(" ", "T"));
      const be = Date.parse(b.ends_at.replace(" ", "T"));
      if (s < be && bs < e) return b;
    }
    return null;
  }

  async function commitMove(b: Booking, targetVehicle: string, targetDayKey: string) {
    const originalDayKey = dayKey(parseErp(b.starts_at));
    if (targetVehicle === b.vehicle && targetDayKey === originalDayKey) return;

    const { starts_at, ends_at } = shiftWindow(b.starts_at, b.ends_at, originalDayKey, targetDayKey);

    const conflict = hasLocalConflict(targetVehicle, starts_at, ends_at, b.name);
    if (conflict) {
      showToast("err", `Can't move — ${targetVehicle} already booked ${conflict.starts_at.slice(11, 16)}–${conflict.ends_at.slice(11, 16)}.`);
      return;
    }

    // Optimistic update.
    const prev = bookings;
    const next = bookings.map((x) =>
      x.name === b.name ? { ...x, vehicle: targetVehicle, starts_at, ends_at } : x
    );
    setBookings(next);

    try {
      const res = await fetch("/api/fleet/bookings/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: b.name,
          vehicle: targetVehicle,
          driver: b.driver,
          starts_at,
          ends_at,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBookings(prev);
        showToast("err", data.message || data.error || `Move rejected (${res.status})`);
        return;
      }
      showToast("ok", `Moved ${b.name} → ${targetVehicle} · ${targetDayKey}`);
    } catch (e) {
      setBookings(prev);
      showToast("err", `Network error: ${String(e)}`);
    }
  }

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
            {" · "}
            <span className="text-slate-500">Drag a booking to another cell to reschedule.</span>
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

          {vehicles.map((v) => (
            <Row
              key={v.name}
              vehicle={v}
              days={days}
              bookingsByVehicleDay={bookingsByVehicleDay}
              bookingsByName={bookings}
              onPick={setDetail}
              dragName={dragName}
              setDragName={setDragName}
              hoverKey={hoverKey}
              setHoverKey={setHoverKey}
              onDrop={commitMove}
            />
          ))}
          {vehicles.length === 0 && (
            <div className="col-span-8 p-8 text-center text-slate-500">No vehicles on roster.</div>
          )}
        </div>
      </div>

      {detail && <BookingDrawer booking={detail} onClose={() => setDetail(null)} />}

      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-md",
            toast.kind === "ok"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          )}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function Row({
  vehicle,
  days,
  bookingsByVehicleDay,
  bookingsByName,
  onPick,
  dragName,
  setDragName,
  hoverKey,
  setHoverKey,
  onDrop,
}: {
  vehicle: Vehicle;
  days: Date[];
  bookingsByVehicleDay: Map<string, Booking[]>;
  bookingsByName: Booking[];
  onPick: (b: Booking) => void;
  dragName: string | null;
  setDragName: (n: string | null) => void;
  hoverKey: string | null;
  setHoverKey: (k: string | null) => void;
  onDrop: (b: Booking, targetVehicle: string, targetDayKey: string) => void;
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
        const targetKey = `${vehicle.name}__${dayKey(d)}`;
        const items = bookingsByVehicleDay.get(targetKey) || [];
        const isHover = hoverKey === targetKey && dragName !== null;
        return (
          <div
            key={targetKey}
            onDragOver={(e) => {
              if (dragName) {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (hoverKey !== targetKey) setHoverKey(targetKey);
              }
            }}
            onDragLeave={() => {
              if (hoverKey === targetKey) setHoverKey(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const name = e.dataTransfer.getData("text/plain") || dragName;
              setHoverKey(null);
              setDragName(null);
              if (!name) return;
              const b = bookingsByName.find((x) => x.name === name);
              if (!b) return;
              onDrop(b, vehicle.name, dayKey(d));
            }}
            className={cn(
              "border-t border-l border-slate-100 p-1.5 min-h-[64px] space-y-1 transition-colors",
              isHover && "bg-sky-50 ring-2 ring-inset ring-sky-300"
            )}
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
              const dragging = dragName === b.name;
              const movable = b.status !== "Completed" && b.status !== "Cancelled";
              return (
                <div
                  key={b.name}
                  draggable={movable}
                  onDragStart={(ev) => {
                    ev.dataTransfer.effectAllowed = "move";
                    ev.dataTransfer.setData("text/plain", b.name);
                    setDragName(b.name);
                  }}
                  onDragEnd={() => {
                    setDragName(null);
                    setHoverKey(null);
                  }}
                  onClick={() => onPick(b)}
                  className={cn(
                    "group w-full text-left px-2 py-1 border rounded-md text-[11px] font-semibold hover:shadow-sm flex items-start gap-1",
                    toneBg[tone],
                    movable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer opacity-75",
                    dragging && "opacity-40"
                  )}
                  title={`${b.driver_name || b.driver} · ${b.purpose || ""}${movable ? " · drag to reschedule" : ""}`}
                >
                  {movable && (
                    <GripVertical className="w-3 h-3 mt-0.5 opacity-40 group-hover:opacity-80 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{b.driver_name || b.driver}</div>
                    <div className="text-[10px] font-normal opacity-80">{timeStr}</div>
                  </div>
                </div>
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
