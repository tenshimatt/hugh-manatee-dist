/**
 * DataSourceBadge — single, consistent visual tag used on every surface
 * that reads data, so nobody has to guess whether what they're looking at
 * is real production data, a one-time seed from a JWM xlsx drop, or a
 * placeholder we built to show UX shape.
 *
 * States (matches lib/data-sources.ts):
 *   live          — ERPNext in real time (reads on every request)
 *   seeded        — Data lives in ERPNext but was hand-seeded from a JWM
 *                   xlsx drop; not updated from any running system
 *   canned        — In-code fallback; no ERPNext record yet
 *   awaiting_jwm  — Placeholder only; waiting on specific input from JWM
 */
import type { ReactNode } from "react";
import { CircleDot, Database, Coffee, Clock } from "lucide-react";

export type SourceState = "live" | "seeded" | "canned" | "awaiting_jwm";

const META: Record<
  SourceState,
  { label: string; className: string; icon: ReactNode; description: string }
> = {
  live: {
    label: "Live ERPNext",
    className: "bg-emerald-50 text-emerald-800 border-emerald-300",
    icon: <CircleDot className="w-3 h-3" />,
    description: "Reading from ERPNext in real time",
  },
  seeded: {
    label: "Seeded",
    className: "bg-sky-50 text-sky-800 border-sky-300",
    icon: <Database className="w-3 h-3" />,
    description: "In ERPNext, hand-seeded from a JWM xlsx drop — not live system of record",
  },
  canned: {
    label: "Canned",
    className: "bg-slate-100 text-slate-700 border-slate-300",
    icon: <Coffee className="w-3 h-3" />,
    description: "In-code placeholder — no ERPNext record yet",
  },
  awaiting_jwm: {
    label: "Awaiting JWM",
    className: "bg-amber-50 text-amber-800 border-amber-400",
    icon: <Clock className="w-3 h-3" />,
    description: "Waiting on data from Chris / JWM before this goes live",
  },
};

export interface DataSourceBadgeProps {
  state: SourceState;
  detail?: string;
  className?: string;
  compact?: boolean;
}

export function DataSourceBadge({ state, detail, className = "", compact = false }: DataSourceBadgeProps) {
  const m = META[state];
  return (
    <span
      title={detail ? `${m.description} — ${detail}` : m.description}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-semibold ${m.className} ${className}`}
    >
      {m.icon}
      {!compact && m.label}
      {detail && !compact && <span className="font-normal opacity-80 ml-1">· {detail}</span>}
    </span>
  );
}

export function sourceLabel(state: SourceState): string {
  return META[state].label;
}
