"use client";

/**
 * /fleet/pool — Pool Vehicle roster.
 *
 * Table + click-row drawer. High-level visibility only — Chris's note:
 * "Vehicle and drivers info is high level visibility."
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Truck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Vehicle = {
  name: string;
  make_model?: string;
  plate_number?: string;
  status: "Available" | "In Use" | "In Service" | "Retired";
  current_location?: string;
  notes?: string;
};

const STATUS_TONE: Record<Vehicle["status"], "green" | "amber" | "slate" | "red"> = {
  Available: "green",
  "In Use": "amber",
  "In Service": "slate",
  Retired: "red",
};

export default function PoolVehiclesPage() {
  const [items, setItems] = useState<Vehicle[] | null>(null);
  const [source, setSource] = useState<string>("");
  const [detail, setDetail] = useState<Vehicle | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/fleet/vehicles")
      .then((r) => r.json())
      .then((j: { items: Vehicle[]; source: string }) => {
        setItems(j.items);
        setSource(j.source);
      })
      .catch((e) => setErr(String(e)));
  }, []);

  if (err) return <div className="p-8 text-red-700">Error loading vehicles: {err}</div>;
  if (!items) return <div className="p-8 text-slate-500">Loading fleet…</div>;

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Fleet
          </div>
          <h1 className="text-2xl font-bold text-[#064162] tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6" /> Pool Vehicles
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Company trucks and vans available for sign-out. {items.length} vehicles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={source === "live" ? "green" : "slate"}>
            {source === "live" ? "LIVE" : "CANNED"}
          </Badge>
          <Link
            href="/fleet/bookings/new"
            className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-[#064162] text-white text-sm font-semibold hover:bg-[#0a5a85]"
          >
            Book a Vehicle
          </Link>
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#064162] text-white">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Vehicle</th>
              <th className="px-3 py-2 text-left font-semibold">Make / Model</th>
              <th className="px-3 py-2 text-left font-semibold">Plate</th>
              <th className="px-3 py-2 text-left font-semibold">Location</th>
              <th className="px-3 py-2 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((v) => (
              <tr
                key={v.name}
                onClick={() => setDetail(v)}
                className="border-t border-slate-100 cursor-pointer hover:bg-slate-50"
              >
                <td className="px-3 py-2 font-semibold text-[#064162]">{v.name}</td>
                <td className="px-3 py-2 text-slate-700">{v.make_model || "—"}</td>
                <td className="px-3 py-2 font-mono text-slate-600">{v.plate_number || "—"}</td>
                <td className="px-3 py-2 text-slate-600">{v.current_location || "—"}</td>
                <td className="px-3 py-2">
                  <Badge tone={STATUS_TONE[v.status]}>{v.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && (
        <div
          className="fixed inset-0 bg-black/40 z-40 flex items-end md:items-center justify-center p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  Vehicle
                </div>
                <div className="text-xl font-bold text-[#064162]">{detail.name}</div>
                <div className="text-sm text-slate-600 mt-1">
                  {detail.make_model} · Plate {detail.plate_number || "—"}
                </div>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="text-slate-500 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase">Status</div>
                <Badge tone={STATUS_TONE[detail.status]}>{detail.status}</Badge>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase">Location</div>
                <div>{detail.current_location || "—"}</div>
              </div>
              {detail.notes && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase">Notes</div>
                  <div className="whitespace-pre-wrap">{detail.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
