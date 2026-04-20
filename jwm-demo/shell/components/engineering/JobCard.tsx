"use client";

import { Card, PRIORITY_BAR, initials, avatarColor } from "@/lib/engineering-pipeline";
import { MessageSquare, Paperclip } from "lucide-react";

export function JobCard({ card, onClick }: { card: Card; onClick: () => void }) {
  const commentCount = card.latestComment ? 1 : 0;
  const hasFolder = card.productionFolder ? 1 : 0;

  return (
    <button
      onClick={onClick}
      className="group relative w-full text-left rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-[#064162]/30 transition-all overflow-hidden"
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ background: PRIORITY_BAR[card.priority] }}
        aria-hidden
      />
      <div className="pl-3 pr-2.5 py-2 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="font-mono text-[12px] font-bold text-[#064162] leading-tight">
            {card.id}
          </div>
          {card.rankedPriority != null && (
            <div className="text-[10px] font-semibold text-slate-400 tabular-nums">
              #{Math.round(card.rankedPriority)}
            </div>
          )}
        </div>
        <div className="text-[12px] text-slate-700 leading-snug line-clamp-2">
          {card.jobName}
        </div>
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex -space-x-1.5">
            {card.assignees.slice(0, 3).map((a) => (
              <span
                key={a}
                title={a}
                className="w-5 h-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-white"
                style={{ background: avatarColor(a) }}
              >
                {initials(a)}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            {commentCount > 0 && (
              <span className="flex items-center gap-0.5">
                <MessageSquare className="w-3 h-3" />
                {commentCount}
              </span>
            )}
            {hasFolder > 0 && (
              <span className="flex items-center gap-0.5">
                <Paperclip className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1 pt-0.5">
          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide bg-[#eaf3f8] text-[#064162]">
            {card.division} Shop
          </span>
          {card.releaseType && (
            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-600">
              {card.releaseType}
            </span>
          )}
          {card.materialType && (
            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium bg-slate-50 text-slate-500 truncate max-w-[120px]">
              {card.materialType}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
