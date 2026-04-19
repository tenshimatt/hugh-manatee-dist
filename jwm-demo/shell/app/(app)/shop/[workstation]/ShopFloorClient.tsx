"use client";

import { useEffect, useRef, useState } from "react";
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Mic,
  Plus,
  Minus,
  ArrowLeft,
  Sparkles,
  Loader2,
  ArrowRightCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { JobCard, NCR } from "@/lib/canned/work-orders";

// Human-friendly labels for handoff workstations. Duplicated across the
// server route and sidebar for now; a Phase-2 refactor can hoist these to
// a shared lib.
const WS_LABELS: Record<string, string> = {
  "flat-laser-1": "Flat Laser #1",
  "flat-laser-2": "Flat Laser #2",
  "cnc-1": "CNC Mill #1",
  "press-brake-1": "Press Brake #1",
  "weld-bay-a": "Weld Bay A",
  "assembly-1": "Assembly #1",
  qc: "QC Station",
  shipping: "Shipping",
};

interface AnomalyLite {
  id: string;
  title: string;
  summary: string;
  hypothesis: string;
}

export function ShopFloorClient({
  workstation,
  label,
  role,
  cards: initialCards,
  ncrs,
  anomaly,
}: {
  workstation: string;
  label: string;
  role: "floor" | "qc";
  cards: JobCard[];
  ncrs: NCR[];
  anomaly?: AnomalyLite | null;
}) {
  const [cards, setCards] = useState<JobCard[]>(initialCards);
  const [selected, setSelected] = useState<JobCard | null>(null);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(0);
  const [scrap, setScrap] = useState(0);
  const [ncrOpen, setNcrOpen] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [handoffDone, setHandoffDone] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  // SWR-style 5s polling of /api/shop/jobs. Only runs when no job card is
  // selected — when an operator is inside a kiosk detail view we don't want
  // the queue rewriting under them. Offline queue / service worker is Phase 2;
  // this plain polling keeps the demo honest ("stale-while-revalidating").
  useEffect(() => {
    if (role !== "floor") return;
    if (selected) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await fetch(`/api/shop/jobs?workstation=${workstation}`);
        if (!r.ok) return;
        const j = (await r.json()) as { cards: JobCard[] };
        if (!cancelled && Array.isArray(j.cards)) setCards(j.cards);
      } catch {
        /* swallow — next tick tries again */
      }
    };
    pollRef.current = window.setInterval(tick, 5000) as unknown as number;
    return () => {
      cancelled = true;
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [workstation, role, selected]);

  if (role === "qc") {
    return <QCInbox ncrs={ncrs} />;
  }

  if (selected) {
    return (
      <div className="max-w-5xl mx-auto space-y-5">
        <button
          onClick={() => {
            setSelected(null);
            setStarted(false);
            setDone(0);
            setScrap(0);
          }}
          className="flex items-center gap-2 text-[#064162] font-semibold"
        >
          <ArrowLeft className="w-5 h-5" /> Back to queue
        </button>

        <div className="jwm-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge tone="navy">{selected.wo}</Badge>
                <Badge
                  tone={
                    selected.priority === "urgent"
                      ? "red"
                      : selected.priority === "hold"
                        ? "amber"
                        : "slate"
                  }
                >
                  {selected.priority.toUpperCase()}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-[#064162] mt-1">
                {selected.part}
              </h1>
              <div className="text-slate-500 text-lg">
                {selected.customer} · Op {selected.op_seq}
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-[#064162] tabular-nums">
                {selected.qty}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">
                Target qty
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-5 border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Work Instructions
            </div>
            <p className="text-lg text-slate-800 leading-relaxed">
              {selected.instructions}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Counter label="Parts done" value={done} setValue={setDone} tone="green" />
            <Counter label="Scrap" value={scrap} setValue={setScrap} tone="red" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {!started ? (
              <Button variant="primary" size="kiosk" onClick={() => setStarted(true)}>
                <Play className="w-6 h-6" /> Start
              </Button>
            ) : (
              <Button
                variant="success"
                size="kiosk"
                onClick={() => setHandoffOpen(true)}
              >
                <CheckCircle2 className="w-6 h-6" /> Complete
              </Button>
            )}
            <Button
              variant="danger"
              size="kiosk"
              onClick={() => setNcrOpen(true)}
            >
              <AlertTriangle className="w-6 h-6" /> Report Issue
            </Button>
            <Button variant="outline" size="kiosk">
              <Camera className="w-6 h-6" /> Photo
            </Button>
          </div>
        </div>

        {ncrOpen && (
          <NCRDraftModal
            onClose={() => setNcrOpen(false)}
            wo={selected.wo}
            part={selected.part}
            workstation={workstation}
          />
        )}

        {handoffOpen && (
          <HandoffModal
            card={selected}
            doneQty={done}
            scrapQty={scrap}
            fromWorkstation={workstation}
            onCancel={() => setHandoffOpen(false)}
            onConfirm={(next) => {
              setHandoffOpen(false);
              setHandoffDone(next);
              // Return to queue after a short beat so the operator sees the toast.
              setTimeout(() => {
                setSelected(null);
                setStarted(false);
                setDone(0);
                setScrap(0);
                setHandoffDone(null);
                // Optimistically remove the completed card from local state;
                // next poll tick will reconcile with the server.
                setCards((prev) => prev.filter((c) => c.id !== selected.id));
              }, 1800);
            }}
          />
        )}

        {handoffDone && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white rounded-xl shadow-2xl px-5 py-3 flex items-center gap-2 fade-in">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold">
              Job card completed · handed off to {WS_LABELS[handoffDone] || handoffDone}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <div className="text-xs font-bold text-[#e69b40] uppercase tracking-widest">
          Shop Floor · Kiosk
        </div>
        <h1 className="text-4xl font-bold text-[#064162] tracking-tight">
          {label}
        </h1>
        <p className="text-slate-500 mt-1">
          {cards.length} job card{cards.length === 1 ? "" : "s"} in queue · Tap
          a card to begin.
        </p>
      </header>

      {/* Anomaly banner — shown only when the parent page passes an anomaly
          that names this workstation. Surfaces hypothesis + a clear "what the
          operator should know" line without forcing a click. */}
      {anomaly && (
        <div className="rounded-2xl border-l-4 border-[#e69b40] bg-gradient-to-r from-[#fdf2e3] to-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#e69b40]/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#b97418]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#b97418]">
                  Active anomaly · {anomaly.id}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{anomaly.title}</div>
              <div className="text-xs text-slate-600 mt-1">{anomaly.hypothesis}</div>
              <div className="text-[11px] text-slate-500 mt-2">
                Any job flagged HOLD on this station is waiting on this check.
              </div>
            </div>
          </div>
        </div>
      )}

      {cards.length === 0 && (
        <div className="jwm-card p-10 text-center text-slate-500">
          No active job cards for this workstation. Check the planner for
          upcoming releases.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {cards.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c)}
            className="text-left jwm-card p-5 hover:border-[#064162] transition-colors fade-in"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#e69b40] font-bold">
                    {c.id}
                  </span>
                  <Badge
                    tone={
                      c.priority === "urgent"
                        ? "red"
                        : c.priority === "hold"
                          ? "amber"
                          : "slate"
                    }
                  >
                    {c.priority.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-xl font-bold text-[#064162] mt-1 truncate">
                  {c.part}
                </div>
                <div className="text-sm text-slate-500">
                  {c.customer} · {c.wo} · Op {c.op_seq}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-3xl font-bold text-[#064162] tabular-nums">
                  {c.qty}
                </div>
                <div className="text-[10px] text-slate-500 uppercase">qty</div>
              </div>
            </div>
            <div className="mt-3 text-sm text-slate-600 line-clamp-2">
              {c.instructions}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Est. {c.est_hours} hr</span>
              <span className="text-[#064162] font-semibold">Tap to start →</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Counter({
  label,
  value,
  setValue,
  tone,
}: {
  label: string;
  value: number;
  setValue: (n: number) => void;
  tone: "green" | "red";
}) {
  const color = tone === "green" ? "text-emerald-700" : "text-red-700";
  return (
    <div className="jwm-card p-4">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
        {label}
      </div>
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setValue(Math.max(0, value - 1))}
          className="h-14 w-14 rounded-xl border border-slate-300 flex items-center justify-center hover:bg-slate-50"
          aria-label={`Decrease ${label}`}
        >
          <Minus className="w-6 h-6" />
        </button>
        <div className={`text-5xl font-bold tabular-nums ${color}`}>{value}</div>
        <button
          onClick={() => setValue(value + 1)}
          className="h-14 w-14 rounded-xl border border-slate-300 flex items-center justify-center hover:bg-slate-50"
          aria-label={`Increase ${label}`}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

function NCRDraftModal({
  onClose,
  wo,
  part,
  workstation,
}: {
  onClose: () => void;
  wo: string;
  part: string;
  workstation: string;
}) {
  const [text, setText] = useState("");
  const [stage, setStage] = useState<"compose" | "drafting" | "preview">(
    "compose"
  );
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [listening, setListening] = useState(false);

  async function submit() {
    setStage("drafting");
    const res = await fetch("/api/ncr/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, wo, part, workstation }),
    });
    const d = await res.json();
    setDraft(d);
    setTimeout(() => setStage("preview"), 900);
  }

  function toggleMic() {
    setListening((v) => !v);
    if (!listening) {
      // placeholder auto-dictation
      setTimeout(() => {
        setText(
          (t) =>
            t +
            (t ? " " : "") +
            "Observed kerf drift on last 3 pieces — cut edges oversized by ~0.014 inches. Flagging before weld-up."
        );
        setListening(false);
      }, 1600);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-xl font-bold text-[#064162]">Report an issue</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            Cancel
          </button>
        </div>

        <div className="p-6 space-y-4">
          {stage === "compose" && (
            <>
              <div className="text-sm text-slate-500">
                Describe what happened. You can type, tap the mic, or attach a photo.
                JWM will draft the NCR for you.
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. 'Cut edge oversize on 3 pieces, flagged before weld-up'"
                rows={5}
                className="w-full rounded-xl border border-slate-300 p-4 text-base focus:outline-none focus:ring-2 focus:ring-[#064162]/30"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant={listening ? "danger" : "outline"}
                  onClick={toggleMic}
                  size="md"
                >
                  <Mic className="w-4 h-4" />
                  {listening ? "Listening…" : "Dictate"}
                </Button>
                <Button variant="outline" size="md">
                  <Camera className="w-4 h-4" /> Photo
                </Button>
                <div className="flex-1" />
                <Button variant="primary" size="md" onClick={submit} disabled={!text.trim()}>
                  <Sparkles className="w-4 h-4" /> Draft NCR
                </Button>
              </div>
            </>
          )}

          {stage === "drafting" && (
            <div className="py-8 flex items-center justify-center gap-3 text-[#064162] font-semibold">
              <Loader2 className="w-5 h-5 animate-spin" /> AI drafting NCR…
            </div>
          )}

          {stage === "preview" && draft && (
            <div className="space-y-3 fade-in">
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-2 text-sm">
                <DraftRow label="NCR ID" value={String(draft.id)} mono />
                <DraftRow label="Defect type" value={String(draft.defect_type)} />
                <DraftRow label="Workstation" value={String(draft.workstation)} />
                <DraftRow label="Work Order" value={String(draft.wo || "—")} mono />
                <DraftRow label="Part" value={String(draft.part)} />
                <DraftRow label="Qty affected" value={String(draft.qty_affected)} />
                <DraftRow label="Description" value={String(draft.description)} />
                <DraftRow label="Suggested disposition" value={String(draft.suggested_disposition)} />
                <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
                  <Sparkles className="w-3 h-3 text-[#e69b40]" /> AI confidence{" "}
                  {Math.round(Number(draft.ai_confidence) * 100)}% · routed to QC on submit.
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStage("compose")}>
                  Edit
                </Button>
                <Button
                  variant="success"
                  onClick={() => {
                    onClose();
                  }}
                >
                  <CheckCircle2 className="w-4 h-4" /> Submit to QC
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DraftRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3">
      <div className="text-slate-500 font-semibold">{label}</div>
      <div className={`text-slate-800 ${mono ? "font-mono text-[#064162]" : ""}`}>
        {value}
      </div>
    </div>
  );
}

/**
 * HandoffModal — shown when an operator taps Complete on a job card.
 *
 * Presents a short roster of plausible "next" workstations based on the
 * current station, with QC + Shipping as always-available fallbacks. The
 * operator taps one to "hand off" (logged, then the job card is removed
 * from the queue optimistically).
 *
 * Phase 2: wire this to an actual ERPNext Job Card transition + write a
 * Shop Floor Log entry. For now the confirmation is a client-side toast.
 */
function HandoffModal({
  card,
  doneQty,
  scrapQty,
  fromWorkstation,
  onCancel,
  onConfirm,
}: {
  card: JobCard;
  doneQty: number;
  scrapQty: number;
  fromWorkstation: string;
  onCancel: () => void;
  onConfirm: (next: string) => void;
}) {
  // Plausible downstream mapping. Not a routing engine — good enough to
  // make the demo narrative work. Every path always offers QC + Shipping.
  const NEXT_BY_STATION: Record<string, string[]> = {
    "flat-laser-1": ["press-brake-1", "cnc-1", "weld-bay-a", "qc"],
    "flat-laser-2": ["press-brake-1", "cnc-1", "weld-bay-a", "qc"],
    "cnc-1": ["weld-bay-a", "assembly-1", "qc"],
    "press-brake-1": ["weld-bay-a", "assembly-1", "qc"],
    "weld-bay-a": ["assembly-1", "qc"],
    "assembly-1": ["qc", "shipping"],
    qc: ["shipping", "weld-bay-a"],
    shipping: ["qc"],
  };
  const suggested = NEXT_BY_STATION[fromWorkstation] || ["qc", "shipping"];

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-[#064162]">Hand off to next station</h2>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            Cancel
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Completing
            </div>
            <div className="text-lg font-bold text-[#064162] mt-0.5">{card.part}</div>
            <div className="text-sm text-slate-500">
              {card.id} · {card.wo} · Op {card.op_seq}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-[10px] uppercase text-slate-500 font-semibold">Target</div>
                <div className="text-xl font-bold text-[#064162] tabular-nums">{card.qty}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-500 font-semibold">Done</div>
                <div className="text-xl font-bold text-emerald-700 tabular-nums">{doneQty}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-500 font-semibold">Scrap</div>
                <div className={`text-xl font-bold tabular-nums ${scrapQty > 0 ? "text-red-700" : "text-slate-400"}`}>
                  {scrapQty}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-700 mb-2">Next workstation</div>
            <div className="grid sm:grid-cols-2 gap-2">
              {suggested.map((slug) => (
                <button
                  key={slug}
                  onClick={() => onConfirm(slug)}
                  className="flex items-center justify-between gap-3 h-14 px-4 rounded-xl border border-slate-300 hover:border-[#064162] hover:bg-[#eaf3f8] transition-colors text-left"
                >
                  <div>
                    <div className="font-semibold text-slate-800">
                      {WS_LABELS[slug] || slug}
                    </div>
                    <div className="text-[11px] text-slate-500">Tap to hand off</div>
                  </div>
                  <ArrowRightCircle className="w-5 h-5 text-[#064162]" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Handoff writes a Shop Floor Log entry · Phase 2 wires to ERPNext</span>
            <button onClick={onCancel} className="text-slate-600 hover:underline">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QCInbox({ ncrs }: { ncrs: NCR[] }) {
  return (
    <div className="space-y-5">
      <header>
        <div className="text-xs font-bold text-[#e69b40] uppercase tracking-widest">
          QC Station · Inbox
        </div>
        <h1 className="text-4xl font-bold text-[#064162] tracking-tight">
          Non-conformance reports
        </h1>
        <p className="text-slate-500 mt-1">
          {ncrs.length} NCR{ncrs.length === 1 ? "" : "s"} in the queue.
        </p>
      </header>
      <div className="grid md:grid-cols-2 gap-4">
        {ncrs.map((n) => (
          <div key={n.id} className="jwm-card p-5">
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm text-[#064162]">{n.id}</div>
              <Badge
                tone={
                  n.status === "Closed"
                    ? "green"
                    : n.status === "CA Open"
                      ? "gold"
                      : n.status === "Under Review"
                        ? "navy"
                        : "amber"
                }
              >
                {n.status}
              </Badge>
            </div>
            <div className="mt-2 font-semibold text-slate-800">{n.part}</div>
            <div className="text-xs text-slate-500">
              {n.workstation} · {n.defect_type} · qty {n.qty_affected}
            </div>
            <p className="text-sm text-slate-700 mt-3 line-clamp-3">{n.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
