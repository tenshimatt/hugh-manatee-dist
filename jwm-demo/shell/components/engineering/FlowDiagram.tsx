/**
 * FlowDiagram — horizontal stage flow viz for ACM + P&T engineering.
 *
 * Renders a left-to-right sequence of stage nodes with counts + arrows,
 * plus a kanban-style row of stage sub-columns below. Reused by both the
 * ACM flow (5 stages) and P&T flow (3 stages) pages.
 *
 * Intentionally self-contained — does NOT import the heavier Pipeline
 * kanban column from /engineering/pipeline (that view stays untouched).
 */
"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { Card as JobCardData } from "@/lib/engineering-pipeline";
import { PRIORITY_BAR, initials, avatarColor } from "@/lib/engineering-pipeline";

export interface FlowStage {
  key: string;        // slug
  label: string;      // display
  /** Which Card.stage slugs map into this flow stage. */
  includes: string[];
  /** Optional accent colour — default JWM navy. */
  accent?: "gold" | "navy";
}

export function FlowDiagram({
  stages,
  cards,
  title,
  subtitle,
  summaryExtra,
}: {
  stages: FlowStage[];
  cards: JobCardData[];
  title: string;
  subtitle: string;
  summaryExtra?: React.ReactNode;
}) {
  const byStage = new Map<string, JobCardData[]>();
  for (const s of stages) byStage.set(s.key, []);
  for (const c of cards) {
    for (const s of stages) {
      if (s.includes.includes(c.stage)) {
        byStage.get(s.key)!.push(c);
        break;
      }
    }
  }
  const releasedKey = stages[stages.length - 1]?.key;
  const releasedThisWeek = byStage.get(releasedKey)?.length ?? 0;

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-[#e69b40] text-xs font-bold uppercase tracking-widest">
          <CheckCircle2 className="w-4 h-4" /> Engineering Flow
        </div>
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#064162] tracking-tight">{title}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>
          </div>
          <nav className="text-xs text-slate-500">
            <Link href="/engineering" className="hover:text-[#064162]">Engineering</Link>
            <span className="mx-1">/</span>
            <span className="text-slate-700 font-semibold">{title}</span>
          </nav>
        </div>
      </header>

      {/* Summary strip */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-4 flex-wrap text-sm">
        {summaryExtra}
        {stages.map((s) => {
          const count = byStage.get(s.key)?.length ?? 0;
          return (
            <span key={s.key} className="inline-flex items-baseline gap-1.5">
              <span className="tabular-nums font-bold text-[#064162] text-lg">{count}</span>
              <span className="text-slate-500 text-xs uppercase tracking-wider">{s.label}</span>
            </span>
          );
        })}
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="w-3 h-3" /> {releasedThisWeek} released
        </span>
      </div>

      {/* Flow diagram */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {stages.map((s, i) => {
            const count = byStage.get(s.key)?.length ?? 0;
            const gold = s.accent === "gold" || i === stages.length - 1;
            return (
              <div key={s.key} className="flex items-center gap-2 flex-1 min-w-[120px]">
                <div
                  className={`flex-1 rounded-xl shadow-sm text-white text-center py-3 px-2 ${
                    gold ? "bg-[#e69b40]" : "bg-[#064162]"
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                    Step {i + 1}
                  </div>
                  <div className="font-bold text-sm leading-tight mt-0.5">{s.label}</div>
                  <div className="text-2xl font-bold tabular-nums mt-1">{count}</div>
                </div>
                {i < stages.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-slate-400 shrink-0" aria-hidden />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Kanban sub-view */}
      <div className="flex-1 overflow-x-auto bg-slate-50 rounded-xl border border-slate-200 p-3">
        <div className="inline-flex gap-3 min-w-full">
          {stages.map((s, i) => {
            const items = byStage.get(s.key) ?? [];
            const gold = s.accent === "gold" || i === stages.length - 1;
            return (
              <section
                key={s.key}
                className="flex flex-col w-72 shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm"
                aria-label={s.label}
              >
                <header
                  className={`flex items-center justify-between px-3 h-10 rounded-t-xl text-white ${
                    gold ? "bg-[#e69b40]" : "bg-[#064162]"
                  }`}
                >
                  <h2 className="text-[11px] font-bold uppercase tracking-wider truncate">
                    {s.label}
                  </h2>
                  <span className="inline-flex items-center justify-center min-w-[22px] h-5 rounded-full bg-white/20 text-[10px] font-bold px-1.5">
                    {items.length}
                  </span>
                </header>
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-[520px]">
                  {items.length === 0 ? (
                    <div className="text-[11px] text-center py-4 italic text-slate-400">
                      No jobs
                    </div>
                  ) : (
                    items.slice(0, 30).map((c) => <FlowMiniCard key={c.id} card={c} />)
                  )}
                  {items.length > 30 && (
                    <div className="text-[10px] text-center py-1 text-slate-500">
                      + {items.length - 30} more
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FlowMiniCard({ card }: { card: JobCardData }) {
  return (
    <div
      className="relative rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden"
      title={`${card.id} · ${card.jobName}`}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ background: PRIORITY_BAR[card.priority] }}
        aria-hidden
      />
      <div className="pl-3 pr-2 py-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="font-mono text-[11px] font-bold text-[#064162]">{card.id}</div>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500">
            {card.division} Shop
          </span>
        </div>
        <div className="text-[11px] text-slate-700 leading-snug line-clamp-1 mt-0.5">
          {card.jobName}
        </div>
        <div className="flex -space-x-1.5 mt-1">
          {card.assignees.slice(0, 3).map((a) => (
            <span
              key={a}
              title={a}
              className="w-4 h-4 rounded-full text-[8px] font-bold text-white flex items-center justify-center ring-1 ring-white"
              style={{ background: avatarColor(a) }}
            >
              {initials(a)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
