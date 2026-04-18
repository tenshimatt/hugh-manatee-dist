"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KpiData {
  key: string;
  label: string;
  value: number;
  unit: string;
  trend: "up" | "down";
  delta: number;
  period: string;
  spark: number[];
  tone?: "default" | "warn";
}

function Sparkline({ data, color = "#064162" }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const w = 120;
  const h = 36;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function KpiCard({ k }: { k: KpiData }) {
  const up = k.trend === "up";
  const isGoodUp = k.key === "on_time_delivery" || k.key === "active_work_orders";
  const isGoodDown = k.key === "open_ncrs";
  const isWarnUp = k.key === "scrap_rate";
  let arrowColor = "text-slate-500";
  if ((up && isGoodUp) || (!up && isGoodDown)) arrowColor = "text-emerald-600";
  else if ((up && isWarnUp) || (!up && isGoodUp)) arrowColor = "text-red-600";

  return (
    <div className="jwm-card p-5 flex flex-col justify-between min-h-[160px] fade-in">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {k.label}
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-[#064162] tabular-nums">
              {k.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </span>
            {k.unit && (
              <span className="text-lg text-slate-500 font-semibold">{k.unit}</span>
            )}
          </div>
        </div>
        <Sparkline data={k.spark} color={k.tone === "warn" ? "#e69b40" : "#064162"} />
      </div>
      <div className={cn("flex items-center gap-1 text-xs font-medium", arrowColor)}>
        {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        <span>
          {up ? "+" : ""}
          {k.delta}
          {k.unit}
        </span>
        <span className="text-slate-400 font-normal">· {k.period}</span>
      </div>
    </div>
  );
}
