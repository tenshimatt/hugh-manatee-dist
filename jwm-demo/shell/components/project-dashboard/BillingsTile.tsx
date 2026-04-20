import { formatMoney } from "@/lib/utils";
import type { ActiveProject } from "@/lib/canned/active-projects";

export function BillingsTile({ billings }: { billings: ActiveProject["billings"] }) {
  const rows: [string, number][] = [
    ["Billed", billings.billed],
    ["Amount Received to Date", billings.received],
    ["Recognised Revenue", billings.recognisedRevenue],
    ["Retainage", billings.retainage],
    ["Bill + AC", billings.billPlusAC],
    ["Actual", billings.actual],
  ];
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-3">
        Billings
      </div>
      <ul className="space-y-1.5">
        {rows.map(([label, v]) => (
          <li
            key={label}
            className="flex items-baseline justify-between border-b border-slate-100 pb-1"
          >
            <span className="text-[11px] text-slate-600">{label}</span>
            <span className="text-sm font-semibold text-[#0A2E5C] tabular-nums">
              {formatMoney(v)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
