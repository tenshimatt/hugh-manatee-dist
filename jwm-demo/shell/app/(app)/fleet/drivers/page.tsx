"use client";

/**
 * /fleet/drivers — Approved Drivers roster.
 *
 * Who is allowed to sign out a pool vehicle. This is the source of truth
 * that /fleet/bookings/new enforces against.
 */
import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Driver = {
  name: string;
  employee: string;
  employee_name?: string;
  licence_number?: string;
  licence_expiry?: string;
  approved_date?: string;
  active: 0 | 1;
};

function expiryTone(expiry?: string): "green" | "amber" | "red" | "slate" {
  if (!expiry) return "slate";
  const t = Date.parse(expiry);
  if (Number.isNaN(t)) return "slate";
  const days = (t - Date.now()) / (24 * 3600 * 1000);
  if (days < 0) return "red";
  if (days < 60) return "amber";
  return "green";
}

export default function DriversPage() {
  const [items, setItems] = useState<Driver[] | null>(null);
  const [source, setSource] = useState<string>("");
  const [showAll, setShowAll] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const qs = showAll ? "?all=1" : "";
    fetch(`/api/fleet/drivers${qs}`)
      .then((r) => r.json())
      .then((j: { items: Driver[]; source: string }) => {
        setItems(j.items);
        setSource(j.source);
      })
      .catch((e) => setErr(String(e)));
  }, [showAll]);

  if (err) return <div className="p-8 text-red-700">Error loading drivers: {err}</div>;
  if (!items) return <div className="p-8 text-slate-500">Loading drivers…</div>;

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Fleet
          </div>
          <h1 className="text-2xl font-bold text-[#064162] tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6" /> Approved Drivers
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Employees authorised to sign out a pool vehicle. {items.length} drivers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={source === "live" ? "green" : "slate"}>
            {source === "live" ? "LIVE" : "CANNED"}
          </Badge>
          <label className="inline-flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
            />
            Show inactive
          </label>
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#064162] text-white">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Employee</th>
              <th className="px-3 py-2 text-left font-semibold">Employee ID</th>
              <th className="px-3 py-2 text-left font-semibold">Licence</th>
              <th className="px-3 py-2 text-left font-semibold">Expiry</th>
              <th className="px-3 py-2 text-left font-semibold">Approved</th>
              <th className="px-3 py-2 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.name} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 font-semibold text-slate-900">
                  {d.employee_name || d.employee}
                </td>
                <td className="px-3 py-2 font-mono text-slate-600">{d.employee}</td>
                <td className="px-3 py-2 font-mono text-slate-600">
                  {d.licence_number || "—"}
                </td>
                <td className="px-3 py-2">
                  <Badge tone={expiryTone(d.licence_expiry)}>
                    {d.licence_expiry || "—"}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-slate-600">{d.approved_date || "—"}</td>
                <td className="px-3 py-2">
                  <Badge tone={d.active ? "green" : "slate"}>
                    {d.active ? "Active" : "Inactive"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
