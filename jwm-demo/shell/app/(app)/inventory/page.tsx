/**
 * /inventory — live ERPNext Stock module rollup.
 *
 * Chris called this a Box-1 co-requisite on 2026-04-20: "Inventory would be
 * one of them that will be calling in real-time to check your stock. You'd
 * be able to track finished goods, everything right there."
 *
 * Reads `Bin` records (one per item × warehouse) and rolls up per warehouse
 * + surfaces low-stock (reserved > actual) as the first-glance table.
 */
import Link from "next/link";
import { Boxes, Warehouse, AlertTriangle, TrendingDown, TrendingUp, CircleDot, Package } from "lucide-react";
import { getInventory } from "@/lib/erpnext-live";

export const dynamic = "force-dynamic";

function fmtQty(n: number): string {
  if (!n) return "—";
  return Math.round(n).toLocaleString();
}
function fmtMoney(n: number): string {
  if (!n) return "$0";
  return `$${Math.round(n).toLocaleString()}`;
}

export default async function InventoryPage() {
  const inv = await getInventory(500);

  const totalActual = inv.warehouses.reduce((s, w) => s + w.actual, 0);
  const totalReserved = inv.warehouses.reduce((s, w) => s + w.reserved, 0);
  const totalValue = inv.warehouses.reduce((s, w) => s + w.value, 0);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[#e69b40] text-xs font-bold uppercase tracking-widest">
            <Boxes className="w-4 h-4" /> Inventory
          </div>
          <h1 className="text-3xl font-bold text-[#064162] tracking-tight">Inventory</h1>
          <p className="text-slate-500 mt-1 max-w-2xl">
            Shared stock across Architectural and Processing — raw stock, WIP, finished goods,
            bin locations. Live from ERPNext Stock module.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span
            className={`px-2 py-1 rounded-full border ${
              inv.source === "live"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-600 border-slate-300"
            }`}
          >
            <CircleDot className="w-3 h-3 inline-block mr-1 -mt-0.5" />
            {inv.source === "live" ? "Live ERPNext" : "Canned fallback"}
          </span>
        </div>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Distinct items" value={fmtQty(inv.totalItems)} accent icon={Package} />
        <Kpi label="Actual qty on hand" value={fmtQty(totalActual)} icon={Warehouse} />
        <Kpi label="Reserved" value={fmtQty(totalReserved)} icon={TrendingDown} />
        <Kpi label="Inventory value" value={fmtMoney(totalValue)} icon={TrendingUp} warn={totalValue === 0} />
      </div>

      {/* Warehouses rollup */}
      <section className="border border-slate-200 rounded-lg bg-white shadow-sm">
        <header className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-[#e69b40]" /> Warehouses
          </h2>
          <span className="text-xs text-slate-500">{inv.warehouses.length} locations</span>
        </header>
        {inv.warehouses.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            No warehouses configured in ERPNext.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Warehouse</th>
                  <th className="text-right px-4 py-2 font-semibold">SKUs</th>
                  <th className="text-right px-4 py-2 font-semibold">Actual</th>
                  <th className="text-right px-4 py-2 font-semibold">Reserved</th>
                  <th className="text-right px-4 py-2 font-semibold">Projected</th>
                  <th className="text-right px-4 py-2 font-semibold">Value</th>
                </tr>
              </thead>
              <tbody>
                {inv.warehouses.map((w) => {
                  const tight = w.reserved > w.actual;
                  return (
                    <tr key={w.name} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2 font-semibold text-[#064162]">{w.name}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{fmtQty(w.binCount)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{fmtQty(w.actual)}</td>
                      <td className={`px-4 py-2 text-right tabular-nums ${tight ? "text-red-700 font-semibold" : ""}`}>
                        {fmtQty(w.reserved)}
                      </td>
                      <td
                        className={`px-4 py-2 text-right tabular-nums ${w.projected < 0 ? "text-red-700" : w.projected > 0 ? "text-emerald-700" : "text-slate-400"}`}
                      >
                        {w.projected === 0 ? "—" : w.projected > 0 ? `+${fmtQty(w.projected)}` : fmtQty(w.projected)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-600">{fmtMoney(w.value)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Low stock alerts */}
      <section className="border border-amber-200 rounded-lg bg-gradient-to-r from-amber-50 to-white shadow-sm">
        <header className="px-4 py-3 border-b border-amber-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Low stock — reserved exceeds on-hand
          </h2>
          <span className="text-xs text-amber-800 font-semibold">{inv.lowStock.length} items</span>
        </header>
        {inv.lowStock.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-slate-500">
            No low-stock alerts right now. 👍
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-amber-50/60 text-amber-900 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Item</th>
                  <th className="text-left px-4 py-2 font-semibold">Warehouse</th>
                  <th className="text-right px-4 py-2 font-semibold">On Hand</th>
                  <th className="text-right px-4 py-2 font-semibold">Reserved</th>
                  <th className="text-right px-4 py-2 font-semibold">Shortfall</th>
                </tr>
              </thead>
              <tbody>
                {inv.lowStock.map((b, i) => {
                  const shortfall = b.reserved_qty - b.actual_qty;
                  return (
                    <tr key={`${b.item_code}-${b.warehouse}-${i}`} className="border-t border-amber-100">
                      <td className="px-4 py-2 font-mono text-xs text-[#064162] font-bold">{b.item_code}</td>
                      <td className="px-4 py-2 text-slate-700">{b.warehouse}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{fmtQty(b.actual_qty)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{fmtQty(b.reserved_qty)}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-bold text-red-700">
                        -{fmtQty(shortfall)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Full bin list */}
      <section className="border border-slate-200 rounded-lg bg-white shadow-sm">
        <header className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#064162]" /> All bins ({inv.bins.length})
          </h2>
          <Link
            href="https://jwm-erp.beyondpandora.com/app/bin"
            target="_blank"
            className="text-xs font-semibold text-[#064162] hover:underline"
          >
            Open in ERPNext &rarr;
          </Link>
        </header>
        {inv.bins.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            No bins found. Configure stock movements in ERPNext to populate.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Item</th>
                  <th className="text-left px-4 py-2 font-semibold">Warehouse</th>
                  <th className="text-right px-4 py-2 font-semibold">Actual</th>
                  <th className="text-right px-4 py-2 font-semibold">Reserved</th>
                  <th className="text-right px-4 py-2 font-semibold">Ordered</th>
                  <th className="text-right px-4 py-2 font-semibold">Projected</th>
                  <th className="text-right px-4 py-2 font-semibold">UoM</th>
                </tr>
              </thead>
              <tbody>
                {inv.bins.slice(0, 200).map((b, i) => (
                  <tr key={`${b.item_code}-${b.warehouse}-${i}`} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-1.5 font-mono text-xs text-[#064162]">{b.item_code}</td>
                    <td className="px-4 py-1.5 text-slate-700">{b.warehouse}</td>
                    <td className="px-4 py-1.5 text-right tabular-nums">{fmtQty(b.actual_qty)}</td>
                    <td className="px-4 py-1.5 text-right tabular-nums">{fmtQty(b.reserved_qty)}</td>
                    <td className="px-4 py-1.5 text-right tabular-nums">{fmtQty(b.ordered_qty)}</td>
                    <td className={`px-4 py-1.5 text-right tabular-nums ${b.projected_qty < 0 ? "text-red-700" : ""}`}>
                      {fmtQty(b.projected_qty)}
                    </td>
                    <td className="px-4 py-1.5 text-right text-xs text-slate-500">{b.stock_uom || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {inv.bins.length > 200 && (
              <div className="px-4 py-2 text-center text-xs text-slate-500 border-t border-slate-100">
                Showing first 200 of {inv.bins.length} bins. Filter in ERPNext for more.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  accent,
  warn,
}: {
  label: string;
  value: string;
  icon: typeof Boxes;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</div>
        <Icon className={`w-4 h-4 ${warn ? "text-red-500" : accent ? "text-[#e69b40]" : "text-slate-400"}`} />
      </div>
      <div
        className={`mt-1 text-3xl font-bold tabular-nums ${
          warn ? "text-red-700" : accent ? "text-[#e69b40]" : "text-[#064162]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
