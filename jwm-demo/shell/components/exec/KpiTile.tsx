/**
 * KpiTile — big-number executive tile with optional subtitle and "live|canned" pill.
 *
 * Usage:
 *   <KpiTile label="Total Active Projects" value={116} source="live" accent="emerald" />
 */
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface KpiTileProps {
  label: string;
  value: string | number;
  subtitle?: string;
  source?: "live" | "canned";
  accent?: "emerald" | "sky" | "amber" | "violet" | "rose" | "slate";
  trend?: "up" | "down" | "flat";
  size?: "sm" | "md" | "lg";
}

const accentMap: Record<NonNullable<KpiTileProps["accent"]>, { ring: string; text: string; bar: string }> = {
  emerald: { ring: "border-emerald-200", text: "text-emerald-700", bar: "bg-emerald-500" },
  sky:     { ring: "border-sky-200",     text: "text-sky-700",     bar: "bg-sky-500" },
  amber:   { ring: "border-amber-200",   text: "text-amber-700",   bar: "bg-amber-500" },
  violet:  { ring: "border-violet-200",  text: "text-violet-700",  bar: "bg-violet-500" },
  rose:    { ring: "border-rose-200",    text: "text-rose-700",    bar: "bg-rose-500" },
  slate:   { ring: "border-slate-200",   text: "text-slate-700",   bar: "bg-slate-400" },
};

const sizeMap = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
};

export function KpiTile({
  label,
  value,
  subtitle,
  source = "canned",
  accent = "sky",
  trend,
  size = "lg",
}: KpiTileProps) {
  const a = accentMap[accent];
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  return (
    <div className={`relative bg-white border ${a.ring} rounded-lg p-4 shadow-sm overflow-hidden`}>
      <div className={`absolute top-0 left-0 h-1 w-full ${a.bar}`} />
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] uppercase tracking-wide font-semibold text-slate-600">{label}</div>
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
            source === "live"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-500 border-slate-300"
          }`}
        >
          {source === "live" ? "LIVE" : "CANNED"}
        </span>
      </div>
      <div className={`font-bold ${a.text} ${sizeMap[size]} leading-tight`}>{value}</div>
      {(subtitle || trend) && (
        <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-500">
          {trend && <TrendIcon className="w-3 h-3" />}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
}

/** Format helpers shared by exec pages. */
export function fmtUsd(n: number, digits = 0): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(digits === 0 ? 1 : 2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function fmtUsdFull(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}
