/**
 * Production Detail Report — Epicor-style view.
 *
 * Mirrors the 1:1 layout of the Epicor PDF Chris shared so his team reads
 * the demo with zero retraining.
 *
 * Usage:
 *   <ProductionDetailReport report={pdr} />
 *
 * Data source: /api/planner/[wo]/pdr (buildPDR → live ERPNext + canned fallback)
 */

"use client";

import { Printer } from "lucide-react";
import type { PDRReport } from "@/lib/pdr/types";

/* ------------------------------ helpers ------------------------------ */

const fmtN = (n: number, d = 2) =>
  Number(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const fmtMoney = (n: number) =>
  Number(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const effClass = (pct: number): string => {
  if (pct >= 90) return "text-emerald-700 font-semibold";
  if (pct >= 70) return "text-amber-700 font-semibold";
  if (pct > 0) return "text-rose-700 font-semibold";
  return "text-slate-500";
};

/** Dotted-line section separator like the PDF `- - - SECTION - - -`. */
function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mt-5 mb-2 print:mt-3 print:mb-1">
      <span className="text-[10px] tracking-[0.15em] text-slate-500">- - - - - -</span>
      <span className="text-[11px] font-bold tracking-wider text-[#064162]">{label}</span>
      <span className="flex-1 text-[10px] tracking-[0.15em] text-slate-400 overflow-hidden whitespace-nowrap">
        {"- ".repeat(120)}
      </span>
    </div>
  );
}

function SrcBadge({ source }: { source: "live" | "canned" }) {
  return (
    <span
      className={`ml-2 text-[9px] px-1.5 py-[1px] rounded font-semibold tracking-wide print:hidden ${
        source === "live" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
      }`}
    >
      {source.toUpperCase()}
    </span>
  );
}

/* ------------------------------ component ------------------------------ */

export function ProductionDetailReport({ report }: { report: PDRReport }) {
  const { header, production_quantities: pq, totals, data_sources: src } = report;

  return (
    <div className="bg-white text-slate-900 border border-slate-300 rounded-sm shadow-sm print:border-0 print:shadow-none pdr-root">
      {/* Page masthead */}
      <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-slate-300 print:px-0">
        <div className="text-[11px] leading-tight">
          <div>User : <span className="font-semibold">hsadloski</span></div>
          <div className="mt-3 text-[15px] font-bold text-[#064162] tracking-tight">
            JOHN W MCDOUGALL CO., INC
          </div>
          <div className="text-[11px] font-semibold text-slate-700">Production Detail Report</div>
        </div>
        <div className="text-[11px] text-right leading-tight">
          <div>Page: 1</div>
          <div>Date: {new Date().toLocaleDateString("en-US")}</div>
          <div>Time: {new Date().toLocaleTimeString("en-US")}</div>
          <button
            onClick={() => window.print()}
            className="mt-3 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-slate-300 hover:bg-slate-50 print:hidden"
          >
            <Printer className="w-3 h-3" /> Print
          </button>
        </div>
      </div>

      <div className="px-6 py-4 font-mono text-[11px] leading-[1.45] print:px-0">
        {/* JOB HEADER */}
        <div className="grid grid-cols-[auto_1fr_auto] gap-x-8 gap-y-1 pb-2">
          <div>
            <span className="text-slate-500">Job:</span>{" "}
            <span className="font-bold text-[13px] text-[#064162]">{header.job}</span>
            <SrcBadge source={src.header} />
          </div>
          <div>
            <span className="text-slate-500">Part:</span>{" "}
            <span className="font-semibold">{header.part}</span>
            <span className="ml-6 text-slate-500">Rev:</span>{" "}
            <span className="font-semibold">{header.rev}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500">Required Due Dt:</span>{" "}
            <span className="font-semibold">{header.required_due_dt}</span>
          </div>
          <div>
            <span
              className={`inline-block px-2 py-[2px] text-[10px] font-bold tracking-wider rounded-sm ${
                header.status === "CLOSED"
                  ? "bg-slate-800 text-white"
                  : header.status === "IN PROCESS"
                    ? "bg-amber-500 text-white"
                    : header.status === "COMPLETE"
                      ? "bg-emerald-700 text-white"
                      : "bg-sky-700 text-white"
              }`}
            >
              {header.status}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Product Group:</span>{" "}
            <span>{header.product_group}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500">Completed Dt:</span>{" "}
            <span className="font-semibold">{header.completed_dt || "—"}</span>
          </div>
          <div />
          <div>
            {header.customer && (
              <>
                <span className="text-slate-500">Customer:</span>{" "}
                <span className="font-semibold">{header.customer}</span>
              </>
            )}
          </div>
          <div className="text-right">
            <span className="text-slate-500">Closed Dt:</span>{" "}
            <span className="font-semibold">{header.closed_dt || "—"}</span>
          </div>
        </div>

        {header.description && (
          <div className="text-slate-600 text-[11px] italic pl-[4ch]">{header.description}</div>
        )}

        {/* PRODUCTION QUANTITIES */}
        <SectionHeader label="PRODUCTION QUANTITIES" />
        <div className="grid grid-cols-4 gap-x-6 gap-y-1">
          <div><span className="text-slate-500">For Stock:</span> <span className="font-semibold">{fmtN(pq.for_stock)} {pq.uom}</span></div>
          <div><span className="text-slate-500">For Jobs:</span> <span className="font-semibold">{fmtN(pq.for_jobs)} {pq.uom}</span></div>
          <div><span className="text-slate-500">For Order:</span> <span className="font-semibold">{fmtN(pq.for_order)} {pq.uom}</span></div>
          <div><span className="text-slate-500">Total Req.:</span> <span className="font-semibold">{fmtN(pq.total_req)} {pq.uom}</span></div>
          <div><span className="text-slate-500">Rec/Stock:</span> <span className="font-semibold">{fmtN(pq.rec_stock)} {pq.uom}</span></div>
          <div><span className="text-slate-500">Rec./Jobs:</span> <span className="font-semibold">{fmtN(pq.rec_jobs)} {pq.uom}</span></div>
          <div><span className="text-slate-500">Shipped:</span> <span className="font-semibold">{fmtN(pq.shipped)} {pq.uom}</span></div>
          <div><span className="text-slate-500">Completed:</span> <span className="font-semibold">{fmtN(pq.completed)} {pq.uom}</span></div>
        </div>

        {/* SHIPPING SCHEDULE */}
        <div className="flex items-center mt-4">
          <div className="text-[11px] font-bold tracking-wider text-[#064162]">SHIPPING SCHEDULE:</div>
          <SrcBadge source={src.shipping_schedule} />
        </div>
        <table className="w-full mt-1 border-collapse">
          <thead>
            <tr className="border-b border-slate-400 text-slate-600 text-[10px]">
              <th className="text-left py-1 font-normal">Req. Date</th>
              <th className="text-left font-normal">SO / Line / Rel</th>
              <th className="text-right font-normal">Order Qty</th>
              <th className="text-right font-normal">Job Qty</th>
              <th className="text-right font-normal">Shipped Qty</th>
              <th className="text-right font-normal">Remain Qty</th>
              <th className="text-right font-normal">Order Value</th>
              <th className="text-left pl-3 font-normal">Stat</th>
              <th className="text-left font-normal">Ship To</th>
            </tr>
          </thead>
          <tbody>
            {report.shipping_schedule.length ? (
              report.shipping_schedule.map((r, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-1">{r.req_date}</td>
                  <td>{r.so_line_rel}</td>
                  <td className="text-right">{fmtN(r.order_qty)}</td>
                  <td className="text-right">{fmtN(r.job_qty)}</td>
                  <td className="text-right">{fmtN(r.shipped_qty)}</td>
                  <td className="text-right">{fmtN(r.remain_qty)}</td>
                  <td className="text-right">{fmtMoney(r.order_value)}</td>
                  <td className="pl-3">{r.stat}</td>
                  <td>{r.ship_to}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={9} className="text-slate-400 py-1 italic">(no shipping schedule)</td></tr>
            )}
          </tbody>
        </table>

        {/* SHIPPING ACTIVITY */}
        <div className="flex items-center mt-4">
          <div className="text-[11px] font-bold tracking-wider text-[#064162]">SHIPPING ACTIVITY:</div>
          <SrcBadge source={src.shipping_activity} />
        </div>
        <table className="w-full mt-1 border-collapse">
          <thead>
            <tr className="border-b border-slate-400 text-slate-600 text-[10px]">
              <th className="text-left py-1 font-normal">Pack</th>
              <th className="text-left font-normal">Line</th>
              <th className="text-left font-normal">Date</th>
              <th className="text-right font-normal">Job Qty</th>
              <th className="text-right font-normal">Stock Qty</th>
              <th className="text-left pl-3 font-normal">Order / Line / Rel.</th>
              <th className="text-left font-normal">Ship To</th>
              <th className="text-left font-normal">Shipped</th>
              <th className="text-left font-normal">Invoiced</th>
              <th className="text-left font-normal">Legal #</th>
            </tr>
          </thead>
          <tbody>
            {report.shipping_activity.length ? (
              report.shipping_activity.map((r, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-1">{r.pack}</td>
                  <td>{r.line}</td>
                  <td>{r.date}</td>
                  <td className="text-right">{fmtN(r.job_qty)}</td>
                  <td className="text-right">{fmtN(r.stock_qty)}</td>
                  <td className="pl-3">{r.order_line_rel}</td>
                  <td>{r.ship_to}</td>
                  <td>{r.shipped ? "Yes" : "No"}</td>
                  <td>{r.invoiced ? "Yes" : "No"}</td>
                  <td>{r.legal_number}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={10} className="text-slate-400 py-1 italic">(no shipping activity)</td></tr>
            )}
          </tbody>
        </table>

        {/* INVOICE ACTIVITY */}
        <div className="flex items-center mt-4">
          <div className="text-[11px] font-bold tracking-wider text-[#064162]">INVOICE ACTIVITY:</div>
          <SrcBadge source={src.invoice_activity} />
        </div>
        <table className="w-full mt-1 border-collapse">
          <thead>
            <tr className="border-b border-slate-400 text-slate-600 text-[10px]">
              <th className="text-left py-1 font-normal">Invoice #</th>
              <th className="text-left font-normal">Date</th>
              <th className="text-right font-normal">Qty</th>
              <th className="text-right font-normal">Gross</th>
              <th className="text-right font-normal">Misc.</th>
              <th className="text-right font-normal">Disc.</th>
              <th className="text-right font-normal">Adv. Bill</th>
              <th className="text-right font-normal">Net</th>
              <th className="text-left pl-3 font-normal">Pack / Ln</th>
              <th className="text-left font-normal">Order / Ln / Rel.</th>
            </tr>
          </thead>
          <tbody>
            {report.invoice_activity.length ? (
              report.invoice_activity.map((r, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-1">{r.invoice_type}</td>
                  <td>{r.date}</td>
                  <td className="text-right">{fmtN(r.quantity)}</td>
                  <td className="text-right">{fmtMoney(r.gross_amount)}</td>
                  <td className="text-right">{fmtMoney(r.misc_charges)}</td>
                  <td className="text-right">{fmtMoney(r.discounts)}</td>
                  <td className="text-right">{fmtMoney(r.adv_bill)}</td>
                  <td className="text-right font-semibold">{fmtMoney(r.net_amount)}</td>
                  <td className="pl-3">{r.pack_ln}</td>
                  <td>{r.order_line_rel}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={10} className="text-slate-400 py-1 italic">(no invoice activity)</td></tr>
            )}
            {report.invoice_activity.length > 1 && (
              <tr className="border-t border-slate-400">
                <td colSpan={7} className="text-right py-1 font-semibold">Total:</td>
                <td className="text-right font-bold">
                  {fmtMoney(report.invoice_activity.reduce((s, r) => s + r.net_amount, 0))}
                </td>
                <td colSpan={2} />
              </tr>
            )}
          </tbody>
        </table>

        {/* RAW MATERIALS — estimate vs actual side-by-side */}
        <div className="flex items-center mt-4">
          <div className="text-[11px] font-bold tracking-wider text-[#064162]">RAW MATERIALS:</div>
          <SrcBadge source={src.raw_materials} />
        </div>
        <table className="w-full mt-1 border-collapse">
          <thead>
            <tr className="text-[10px] text-slate-600">
              <th className="text-left py-0" />
              <th colSpan={3} className="text-center border-b border-slate-300 font-semibold text-[#064162]">
                ──────── Estimate ────────
              </th>
              <th colSpan={4} className="text-center border-b border-slate-300 border-l border-slate-300 font-semibold text-[#064162]">
                ─────────── Actual ───────────
              </th>
              <th />
            </tr>
            <tr className="border-b border-slate-400 text-slate-600 text-[10px]">
              <th className="text-left py-1 font-normal">Mtl. Part / Description</th>
              <th className="text-right font-normal">Qty</th>
              <th className="text-right font-normal">Cost</th>
              <th className="text-right font-normal">Mtl. Brdn.</th>
              <th className="text-right border-l border-slate-300 pl-2 font-normal">Qty</th>
              <th className="text-right font-normal">Cost</th>
              <th className="text-right font-normal">(-) Salvage</th>
              <th className="text-right font-normal">Mtl. Brdn.</th>
              <th className="text-left pl-3 font-normal">Req. Date</th>
            </tr>
          </thead>
          <tbody>
            {report.raw_materials.length ? (
              report.raw_materials.map((r) => (
                <tr key={r.seq} className="border-b border-slate-100 align-top">
                  <td className="py-1">
                    <div><span className="text-slate-500">{r.seq}</span> <span className="font-semibold">{r.mtl_part}</span></div>
                    <div className="text-slate-500 text-[10px]">{r.description}</div>
                  </td>
                  <td className="text-right">{fmtN(r.est_qty)} {r.uom}</td>
                  <td className="text-right">{fmtMoney(r.est_cost)}</td>
                  <td className="text-right">{fmtMoney(r.est_mtl_burden)}</td>
                  <td className="text-right border-l border-slate-300 pl-2">{fmtN(r.act_qty)}</td>
                  <td className="text-right">{fmtMoney(r.act_cost)}</td>
                  <td className="text-right">{fmtMoney(r.act_salvage)}</td>
                  <td className="text-right">{fmtMoney(r.act_mtl_burden)}</td>
                  <td className="pl-3">{r.req_date}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={9} className="text-slate-400 py-1 italic">(no raw material records)</td></tr>
            )}
          </tbody>
        </table>

        {/* OPERATIONS */}
        <div className="flex items-center mt-4">
          <div className="text-[11px] font-bold tracking-wider text-[#064162]">OPERATIONS:</div>
          <SrcBadge source={src.operations} />
        </div>
        <table className="w-full mt-1 border-collapse">
          <thead>
            <tr className="text-[10px] text-slate-600">
              <th colSpan={2} />
              <th colSpan={2} className="text-center border-b border-slate-300 font-semibold">─ Quantities ─</th>
              <th colSpan={2} className="text-center border-b border-slate-300 font-semibold">─ Setup Hrs ─</th>
              <th className="text-center border-b border-slate-300 font-semibold">%</th>
              <th colSpan={2} className="text-center border-b border-slate-300 font-semibold">─ Prod. Hours ─</th>
              <th className="text-center border-b border-slate-300 font-semibold">Rwk</th>
              <th className="text-center border-b border-slate-300 font-semibold">Labor/Brd</th>
              <th className="text-center border-b border-slate-300 font-semibold">Eff %</th>
              <th colSpan={2} className="text-center border-b border-slate-300 font-semibold">Std / Att.</th>
            </tr>
            <tr className="border-b border-slate-400 text-slate-600 text-[10px]">
              <th className="text-left py-1 font-normal">Opr</th>
              <th className="text-left font-normal">Resource Grp</th>
              <th className="text-right font-normal">Est Run</th>
              <th className="text-right font-normal">Cmp</th>
              <th className="text-right font-normal">Est</th>
              <th className="text-right font-normal">Act</th>
              <th className="text-right font-normal">Cmp</th>
              <th className="text-right font-normal">Est</th>
              <th className="text-right font-normal">Act</th>
              <th className="text-right font-normal">Hrs</th>
              <th className="text-right font-normal">$</th>
              <th className="text-right font-normal">Eff.</th>
              <th className="text-right font-normal">Std</th>
              <th className="text-right font-normal">Att.</th>
            </tr>
          </thead>
          <tbody>
            {report.operations.length ? (
              report.operations.map((o) => (
                <tr key={o.opr} className="border-b border-slate-100">
                  <td className="py-1 font-bold">{o.opr}{o.oper_code}</td>
                  <td className="text-slate-600">{o.resource_group}</td>
                  <td className="text-right">{fmtN(o.est_run)}</td>
                  <td className="text-right">{fmtN(o.completed)}</td>
                  <td className="text-right">{fmtN(o.setup_est)}</td>
                  <td className="text-right">{fmtN(o.setup_act)}</td>
                  <td className="text-right">{o.pct_cmp}</td>
                  <td className="text-right">{fmtN(o.prod_est)}</td>
                  <td className="text-right">{fmtN(o.prod_act)}</td>
                  <td className="text-right">{fmtN(o.rework_hours)}</td>
                  <td className="text-right">{fmtMoney(o.labor_burden_cost)}</td>
                  <td className={`text-right ${effClass(o.eff_pct)}`}>{fmtN(o.eff_pct, 1)}</td>
                  <td className="text-right">{fmtN(o.prod_std, 2)} {o.prod_std_uom}</td>
                  <td className="text-right">{fmtN(o.attained_std, 2)}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={14} className="text-slate-400 py-1 italic">(no operations)</td></tr>
            )}
          </tbody>
        </table>

        {/* ASM + JOB TOTALS */}
        <div className="mt-6 border-t-2 border-slate-400 pt-3">
          <div className="text-center text-[11px] font-bold tracking-wider text-[#064162]">
            ASM TOTALS ( {header.job} / 0 )
          </div>

          {/* HOURS */}
          <div className="grid grid-cols-[120px_1fr_1fr_auto] gap-x-6 mt-3 items-end">
            <div className="col-span-4 text-[10px] tracking-wider text-slate-500 border-b border-slate-300 mb-1">
              ──────────── HOURS ────────────
              <span className="ml-12 text-[#064162]">Estimate</span>
              <span className="ml-24 text-[#064162]">Actual</span>
            </div>
            <div className="text-slate-600">Setup</div>
            <div className="text-right">{fmtN(totals.hours.setup_est)}</div>
            <div className="text-right">{fmtN(totals.hours.setup_act)}</div>
            <div />
            <div className="text-slate-600">Prod</div>
            <div className="text-right">{fmtN(totals.hours.prod_est)}</div>
            <div className="text-right">{fmtN(totals.hours.prod_act)}</div>
            <div className="text-right">
              <span className="text-slate-600">Eff. Pct:</span>{" "}
              <span className={`text-[13px] ${effClass(totals.hours.eff_pct)}`}>
                {fmtN(totals.hours.eff_pct, 2)}
              </span>
            </div>
          </div>

          {/* COSTS */}
          <div className="grid grid-cols-[120px_1fr_1fr] gap-x-6 mt-4">
            <div className="col-span-3 text-[10px] tracking-wider text-slate-500 border-b border-slate-300 mb-1">
              ──────────── COSTS ────────────
              <span className="ml-12 text-[#064162]">Estimate</span>
              <span className="ml-24 text-[#064162]">Actual</span>
            </div>
            {([
              ["Labor", totals.costs.labor_est, totals.costs.labor_act],
              ["Burden", totals.costs.burden_est, totals.costs.burden_act],
              ["Material", totals.costs.material_est, totals.costs.material_act],
              ["Subcontract", totals.costs.subcontract_est, totals.costs.subcontract_act],
              ["Mtl. Burden", totals.costs.mtl_burden_est, totals.costs.mtl_burden_act],
            ] as const).flatMap(([label, e, a]) => [
              <div key={`${label}-l`} className="text-slate-600">{label}</div>,
              <div key={`${label}-e`} className="text-right">{fmtMoney(e)}</div>,
              <div key={`${label}-a`} className="text-right">{fmtMoney(a)}</div>,
            ])}
            <div className="text-slate-900 font-bold border-t border-slate-400 pt-1">Total</div>
            <div className="text-right font-bold border-t border-slate-400 pt-1">{fmtMoney(totals.costs.total_est)}</div>
            <div className="text-right font-bold border-t border-slate-400 pt-1">{fmtMoney(totals.costs.total_act)}</div>
          </div>

          <div className="text-center text-[11px] font-bold tracking-wider text-[#064162] mt-6">
            JOB TOTALS ( {header.job} )
          </div>
          <div className="grid grid-cols-[120px_1fr_1fr] gap-x-6 mt-2">
            <div className="text-slate-600">Unit</div>
            <div className="text-right">{fmtMoney(totals.unit.est)}</div>
            <div className="text-right">{fmtMoney(totals.unit.act)}</div>
          </div>

          {/* Profitability box */}
          <div className="mt-5 border-2 border-[#064162] rounded-sm p-3 bg-gradient-to-r from-slate-50 to-white">
            <div className="text-[11px] font-bold tracking-wider text-[#064162] mb-2">Profitability:</div>
            <div className="grid grid-cols-4 gap-4 items-center">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Actual Gross</div>
                <div className="text-[15px] font-bold">{fmtMoney(totals.profitability.actual_gross)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Cost</div>
                <div className="text-[15px] font-bold">{fmtMoney(totals.profitability.cost)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Net</div>
                <div className={`text-[15px] font-bold ${totals.profitability.net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                  {fmtMoney(totals.profitability.net)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">PL %</div>
                <div className={`text-[28px] font-black leading-none ${
                  totals.profitability.pl_pct >= 20
                    ? "text-emerald-700"
                    : totals.profitability.pl_pct >= 10
                      ? "text-amber-700"
                      : "text-rose-700"
                }`}>
                  {fmtN(totals.profitability.pl_pct, 2)}%
                </div>
              </div>
            </div>
          </div>

          <div className="text-right text-[10px] text-slate-500 mt-3">
            Job (Assy) : {header.job} ( 0 )
          </div>
        </div>
      </div>

      {/* Print-specific CSS */}
      <style jsx global>{`
        @media print {
          @page { size: letter landscape; margin: 0.4in; }
          body * { visibility: hidden; }
          .pdr-root, .pdr-root * { visibility: visible; }
          .pdr-root { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
