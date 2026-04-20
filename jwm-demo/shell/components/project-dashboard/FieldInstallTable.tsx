import { CheckCircle2, Circle } from "lucide-react";
import type { FieldInstallRow } from "@/lib/canned/active-projects";

export function FieldInstallTable({ rows }: { rows: FieldInstallRow[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 h-full">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-3">
        Field Install
      </div>
      <ul className="divide-y divide-slate-100">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-2 py-1.5">
            {r.complete ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            )}
            <span className="text-[11px] text-slate-700 flex-1 truncate">{r.label}</span>
            <span className="text-[11px] font-semibold text-[#0A2E5C] tabular-nums">
              {r.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
