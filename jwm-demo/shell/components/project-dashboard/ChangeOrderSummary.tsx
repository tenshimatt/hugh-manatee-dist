import { formatMoney } from "@/lib/utils";
import type { ActiveProject } from "@/lib/canned/active-projects";

export function ChangeOrderSummary({
  changeOrders,
}: {
  changeOrders: ActiveProject["changeOrders"];
}) {
  const rows: [string, number][] = [
    ["Total Value of Submitted Change Orders", changeOrders.submitted],
    ["Total Value of Approved", changeOrders.approved],
    ["Total Value of Rejected", changeOrders.rejected],
    ["Total Value of Voided", changeOrders.voided],
  ];
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-3">
        Change Order Budget
      </div>
      <ul className="space-y-1.5">
        {rows.map(([label, v]) => (
          <li
            key={label}
            className="flex items-baseline justify-between border-b border-slate-100 pb-1 gap-3"
          >
            <span className="text-[11px] text-slate-600 flex-1">{label}</span>
            <span className="text-sm font-semibold text-[#0A2E5C] tabular-nums">
              {formatMoney(v)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
