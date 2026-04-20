import { cn } from "@/lib/utils";

type Status = "green" | "yellow" | "red";

const DOT: Record<Status, string> = {
  green: "bg-emerald-500 shadow-emerald-500/50",
  yellow: "bg-amber-400 shadow-amber-400/50",
  red: "bg-red-500 shadow-red-500/50",
};

const RING: Record<Status, string> = {
  green: "ring-emerald-200",
  yellow: "ring-amber-200",
  red: "ring-red-200",
};

export function HealthTile({
  title,
  status,
  label,
  sub,
}: {
  title: string;
  status: Status;
  label: string;
  sub?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-4 flex flex-col items-center text-center">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
        {title}
      </div>
      <div
        className={cn(
          "mt-3 w-14 h-14 rounded-full flex items-center justify-center ring-8",
          RING[status]
        )}
      >
        <span className={cn("w-7 h-7 rounded-full shadow", DOT[status])} />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-800">{label}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

export function PercentTile({ value, title }: { value: number; title: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-4 flex flex-col items-center text-center justify-center">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
        {title}
      </div>
      <div className="mt-4 text-5xl font-bold text-[#0A2E5C] leading-none">
        {value}
        <span className="text-2xl text-[#C9A349]">%</span>
      </div>
      <div className="mt-2 text-xs text-slate-500">% Complete</div>
    </div>
  );
}
