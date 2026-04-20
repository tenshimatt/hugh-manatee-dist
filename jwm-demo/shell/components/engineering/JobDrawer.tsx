"use client";

import { useEffect } from "react";
import { Card, fmtDate, PRIORITY_BAR, PRIORITY_LABEL, STAGES, initials, avatarColor } from "@/lib/engineering-pipeline";
import { X } from "lucide-react";

export function JobDrawer({ card, onClose }: { card: Card | null; onClose: () => void }) {
  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, onClose]);

  if (!card) return null;
  const stageLabel = STAGES.find((s) => s.key === card.stage)?.label ?? card.stage;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Job ${card.id}`}>
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
      />
      <aside className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-2xl overflow-y-auto border-l border-slate-200">
        <header className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-start justify-between gap-4 z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ background: PRIORITY_BAR[card.priority] }}
                aria-label={`Priority ${PRIORITY_LABEL[card.priority]}`}
              />
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                {PRIORITY_LABEL[card.priority]} Priority · {card.division} Shop
              </span>
            </div>
            <h2 className="font-mono text-xl font-bold text-[#064162]">{card.id}</h2>
            <p className="text-slate-700 font-medium">{card.jobName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100 text-slate-500"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-6 space-y-5">
          <Row label="Current Stage" value={stageLabel} />
          <Row label="Station Status" value={card.station || "—"} />
          <Row label="PM" value={card.pm} />
          <Row label="Engineering Manager" value={card.engManager || "—"} />
          <Row label="Drafter" value={card.drafter || "—"} />
          <Row label="Checker" value={card.checker || "—"} />

          {card.assignees.length > 0 && (
            <div>
              <Label>Team</Label>
              <div className="flex flex-wrap gap-2">
                {card.assignees.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 pl-0.5 pr-2.5 py-0.5 text-xs text-slate-700"
                  >
                    <span
                      className="w-5 h-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                      style={{ background: avatarColor(a) }}
                    >
                      {initials(a)}
                    </span>
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Row label="Address" value={card.address} mono />

          {card.description && (
            <div>
              <Label>Description</Label>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{card.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Row label="Ship Target" value={fmtDate(card.shipTarget)} />
            <Row label="Release to Shop Target" value={fmtDate(card.releaseToShopTarget)} />
            <Row label="Released to Shop Actual" value={fmtDate(card.releasedToShopActual)} />
            <Row label="Week to Ship" value={card.weekToShip || "—"} />
            <Row label="Drafting Hours" value={String(card.draftingHours ?? "—")} />
            <Row label="Shop Hours" value={String(card.shopHours ?? "—")} />
          </div>

          {card.materialType && <Row label="Material Type" value={card.materialType} />}
          {card.requiredProcesses && (
            <div>
              <Label>Required Processes</Label>
              <div className="flex flex-wrap gap-1.5">
                {card.requiredProcesses.split(/[\n,]/).filter(Boolean).map((p) => (
                  <span key={p} className="rounded bg-[#eaf3f8] text-[#064162] text-xs px-2 py-0.5">
                    {p.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {card.miscMaterials && (
            <div>
              <Label>Misc Materials</Label>
              <pre className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 whitespace-pre-wrap font-mono">
                {card.miscMaterials}
              </pre>
            </div>
          )}

          {card.productionFolder && (
            <div>
              <Label>Production Folder</Label>
              <code className="block text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono break-all">
                {card.productionFolder}
              </code>
            </div>
          )}

          {card.latestComment && (
            <div>
              <Label>Latest Comment</Label>
              <p className="text-sm text-slate-700 italic">{card.latestComment}</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
      {children}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className={`text-sm text-slate-800 ${mono ? "font-mono text-xs" : ""} whitespace-pre-wrap`}>
        {value || "—"}
      </div>
    </div>
  );
}
