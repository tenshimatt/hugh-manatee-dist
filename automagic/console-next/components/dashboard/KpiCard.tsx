"use client";

import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KpiData {
  label: string;
  value: number;
  unit?: string;
  delta?: number;
  period?: string;
  icon?: LucideIcon;
  accent?: "sky" | "teal" | "gold";
  goodDirection?: "up" | "down" | "neutral";
}

const ACCENTS = {
  sky: { icon: "text-sky-brand bg-sky-brand-50", value: "text-sky-brand-600" },
  teal: { icon: "text-teal-brand bg-teal-brand-50", value: "text-teal-brand-600" },
  gold: { icon: "text-gold-brand-600 bg-gold-brand-50", value: "text-gold-brand-600" },
};

export function KpiCard({ k }: { k: KpiData }) {
  const Icon = k.icon;
  const accent = ACCENTS[k.accent ?? "sky"];

  let deltaColor = "text-muted";
  let DeltaIcon = Minus;
  if (typeof k.delta === "number" && k.delta !== 0) {
    const up = k.delta > 0;
    DeltaIcon = up ? TrendingUp : TrendingDown;
    const good = k.goodDirection ?? "up";
    if (good === "neutral") deltaColor = "text-muted-strong";
    else if ((up && good === "up") || (!up && good === "down")) deltaColor = "text-teal-brand-600";
    else deltaColor = "text-red-600";
  }

  return (
    <div className="am-card p-5 flex flex-col justify-between min-h-[148px] am-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
            {k.label}
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={cn("text-4xl font-bold tabular-nums", accent.value)}>
              {k.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </span>
            {k.unit && (
              <span className="text-lg text-muted font-semibold">{k.unit}</span>
            )}
          </div>
        </div>
        {Icon && (
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", accent.icon)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {(typeof k.delta === "number" || k.period) && (
        <div className={cn("flex items-center gap-1 text-xs font-medium", deltaColor)}>
          {typeof k.delta === "number" && (
            <>
              <DeltaIcon className="w-3.5 h-3.5" />
              <span>
                {k.delta > 0 ? "+" : ""}
                {k.delta}
                {k.unit ?? ""}
              </span>
            </>
          )}
          {k.period && <span className="text-muted font-normal">· {k.period}</span>}
        </div>
      )}
    </div>
  );
}
