"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
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
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { JobCard, NCR } from "@/lib/canned/work-orders";
import { useBarcodeScanner } from "@/lib/useBarcodeScanner";

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
  severity?: string;
  title: string;
  summary: string;
  hypothesis: string;
  detected_at?: string;
  evidence?: string[];
  affected_jobs?: { wo: string; customer: string; part: string; scrap_qty: number; scrap_cost: number }[];
  recommendations?: string[];
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
  const [handoffDeviation, setHandoffDeviation] = useState<{ type: string; reason: string } | null>(null);
  const [handoffPhotoCount, setHandoffPhotoCount] = useState(0);
  const [anomalyOpen, setAnomalyOpen] = useState(false);
  const [ipadHint, setIpadHint] = useState(false);
  const [scanToast, setScanToast] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const scanToastTimerRef = useRef<number | null>(null);

  // Barcode scanner — USB keyboard-wedge scanners emit a rapid burst of
  // keystrokes terminated by Enter. We match the scanned code against
  // JC-id, WO number, or part name in the current queue. If we're already
  // inside a selected card, a scan is ignored (the operator is mid-task).
  const { active: scannerActive } = useBarcodeScanner(
    (code) => {
      const raw = code.trim();
      if (!raw) return;
      // Case-insensitive exact match against the common identifiers.
      const needle = raw.toUpperCase();
      const match = cards.find((c) => {
        return (
          c.id.toUpperCase() === needle ||
          c.wo.toUpperCase() === needle ||
          c.part.toUpperCase() === needle
        );
      });
      if (match) {
        setSelected(match);
        setStarted(false);
        setDone(0);
        setScrap(0);
        setScanToast(`Scanned ${match.id} — ${match.part}`);
      } else {
        setScanToast(`No job card matching ${raw}`);
      }
      if (scanToastTimerRef.current) {
        window.clearTimeout(scanToastTimerRef.current);
      }
      scanToastTimerRef.current = window.setTimeout(
        () => setScanToast(null),
        2800,
      ) as unknown as number;
    },
    { disabled: role !== "floor" || !!selected },
  );

  useEffect(() => {
    return () => {
      if (scanToastTimerRef.current) {
        window.clearTimeout(scanToastTimerRef.current);
      }
    };
  }, []);

  // iPad-range hint — shows on viewports 1024-1280px (iPad landscape
  // territory) and remembers dismissal in localStorage. Intentionally subtle:
  // a small pill, not a modal, so the operator can ignore it.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => {
      const w = window.innerWidth;
      const dismissed =
        window.localStorage.getItem("jwm.kiosk.ipad_hint_dismissed") === "1";
      setIpadHint(!dismissed && w >= 1024 && w < 1280);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  function dismissIpadHint() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("jwm.kiosk.ipad_hint_dismissed", "1");
    }
    setIpadHint(false);
  }

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
            onConfirm={(next, deviation, photos) => {
              setHandoffOpen(false);
              setHandoffDone(next);
              setHandoffDeviation(deviation ?? null);
              setHandoffPhotoCount(photos?.length ?? 0);
              // Return to queue after a short beat so the operator sees the toast.
              setTimeout(() => {
                setSelected(null);
                setStarted(false);
                setDone(0);
                setScrap(0);
                setHandoffDone(null);
                setHandoffDeviation(null);
                setHandoffPhotoCount(0);
                // Optimistically remove the completed card from local state;
                // next poll tick will reconcile with the server.
                setCards((prev) => prev.filter((c) => c.id !== selected.id));
              }, deviation ? 2600 : 1800);
            }}
          />
        )}

        {handoffDone && (
          <div
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 ${
              handoffDeviation ? "bg-amber-600" : "bg-emerald-600"
            } text-white rounded-xl shadow-2xl px-5 py-3 flex items-center gap-2 fade-in max-w-[90vw]`}
          >
            {handoffDeviation ? (
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="font-semibold">
              {handoffDeviation
                ? `Deviated · ${handoffDeviation.reason} → ${WS_LABELS[handoffDone] || handoffDone}${
                    handoffPhotoCount > 0 ? ` · ${handoffPhotoCount} photo${handoffPhotoCount === 1 ? "" : "s"}` : ""
                  }`
                : `Job card completed${
                    handoffPhotoCount > 0 ? ` + ${handoffPhotoCount} photo${handoffPhotoCount === 1 ? "" : "s"}` : ""
                  } · handed off to ${WS_LABELS[handoffDone] || handoffDone}`}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 relative">
      {/* Scanner-ready pill — visible for ~3s after the kiosk loads so the
          operator knows barcode scans are live. Auto-hides to avoid clutter. */}
      {scannerActive && (
        <div
          className="fixed top-3 right-3 z-40 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-sm pointer-events-none fade-in"
          aria-live="polite"
        >
          <span aria-hidden>{"\u{1F52B}"}</span> Scanner ready
        </div>
      )}

      {/* Scan result toast — success (matched JC) or miss. */}
      {scanToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#064162] text-white rounded-xl shadow-2xl px-5 py-3 flex items-center gap-2 fade-in max-w-[90vw]"
          role="status"
        >
          <span aria-hidden>{"\u{1F52B}"}</span>
          <span className="font-semibold">{scanToast}</span>
        </div>
      )}

      {/* iPad-range (1024-1280) one-time helper pill. Dismissal persists in
          localStorage so ops only see it once per device. */}
      {ipadHint && (
        <button
          type="button"
          onClick={dismissIpadHint}
          className="hidden lg:flex xl:hidden absolute top-0 right-0 z-10 items-center gap-2 rounded-full border border-[#064162]/20 bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#064162] shadow-sm hover:bg-[#eaf3f8]"
          aria-label="Dismiss iPad hint"
        >
          Optimized for iPad. Tap to dismiss.
        </button>
      )}

      <header className="mb-2">
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
        <button
          type="button"
          onClick={() => setAnomalyOpen(true)}
          className="w-full text-left rounded-2xl border-l-4 border-[#e69b40] bg-gradient-to-r from-[#fdf2e3] to-white p-4 shadow-sm hover:from-[#fbe6c8] hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#e69b40]/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#b97418]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#b97418]">
                  Active anomaly · {anomaly.id}
                </span>
                <span className="text-[10px] text-slate-500">Click for details</span>
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{anomaly.title}</div>
              <div className="text-xs text-slate-600 mt-1">{anomaly.hypothesis}</div>
              <div className="text-[11px] text-slate-500 mt-2">
                Any job flagged HOLD on this station is waiting on this check.
              </div>
            </div>
          </div>
        </button>
      )}

      {anomaly && anomalyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setAnomalyOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-[#fdf2e3] to-white border-b border-[#e69b40]/30 p-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="h-11 w-11 rounded-xl bg-[#e69b40]/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-[#b97418]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#b97418]">
                      {anomaly.severity ? anomaly.severity.toUpperCase() : "ACTIVE"} · {anomaly.id}
                    </span>
                    {anomaly.detected_at && (
                      <span className="text-[10px] text-slate-500">
                        Detected {new Date(anomaly.detected_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">{anomaly.title}</h2>
                  <p className="text-sm text-slate-600 mt-1">{anomaly.summary}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAnomalyOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl leading-none px-2"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-5">
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Hypothesis</h3>
                <p className="text-sm text-slate-700 leading-relaxed">{anomaly.hypothesis}</p>
              </section>

              {anomaly.evidence && anomaly.evidence.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Evidence</h3>
                  <ul className="space-y-1.5">
                    {anomaly.evidence.map((e, i) => (
                      <li key={i} className="text-sm text-slate-700 flex gap-2">
                        <span className="text-[#b97418] flex-shrink-0">•</span>
                        <span>{e}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {anomaly.affected_jobs && anomaly.affected_jobs.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Affected Jobs · {anomaly.affected_jobs.length} · Scrap cost ${anomaly.affected_jobs.reduce((s, j) => s + j.scrap_cost, 0).toLocaleString()}
                  </h3>
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-600 text-xs">
                        <tr>
                          <th className="text-left px-3 py-2 font-semibold">WO</th>
                          <th className="text-left px-3 py-2 font-semibold">Customer</th>
                          <th className="text-left px-3 py-2 font-semibold">Part</th>
                          <th className="text-right px-3 py-2 font-semibold">Scrap Qty</th>
                          <th className="text-right px-3 py-2 font-semibold">Scrap $</th>
                        </tr>
                      </thead>
                      <tbody>
                        {anomaly.affected_jobs.map((j) => (
                          <tr key={j.wo} className="border-t border-slate-100">
                            <td className="px-3 py-2 font-mono text-xs text-[#064162] font-bold">{j.wo}</td>
                            <td className="px-3 py-2">{j.customer}</td>
                            <td className="px-3 py-2 text-slate-600">{j.part}</td>
                            <td className="px-3 py-2 text-right">{j.scrap_qty}</td>
                            <td className="px-3 py-2 text-right font-mono">${j.scrap_cost.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {anomaly.recommendations && anomaly.recommendations.length > 0 && (
                <section className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">Recommended Actions</h3>
                  <ol className="space-y-1.5 list-decimal list-inside">
                    {anomaly.recommendations.map((r, i) => (
                      <li key={i} className="text-sm text-emerald-900">{r}</li>
                    ))}
                  </ol>
                </section>
              )}

              <div className="flex gap-2 pt-2">
                <Button className="flex-1 bg-[#064162] hover:bg-[#0a5a85]" onClick={() => setAnomalyOpen(false)}>
                  Acknowledge &amp; close
                </Button>
                <Button variant="outline" onClick={() => setAnomalyOpen(false)}>
                  Dismiss
                </Button>
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

      {/* Queue grid — iPad-landscape (lg, 1024+) gets 3 columns; 1280+ gets
          4; 1536+ gets 5. Denser layout per 2026-04-20 demo ask ("flat laser
          needs a lot more represented on the screen"). Card padding dropped
          from p-5 → p-4 to fit more cards without visual crowding. */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {cards.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c)}
            className="text-left jwm-card p-4 hover:border-[#064162] transition-colors fade-in"
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
  const ringColor = tone === "green" ? "focus-within:ring-emerald-400" : "focus-within:ring-red-400";
  return (
    <div className="jwm-card p-4">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
        {label}
      </div>
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setValue(Math.max(0, value - 1))}
          className="h-16 w-16 rounded-xl border border-slate-300 flex items-center justify-center hover:bg-slate-50 active:bg-slate-100"
          aria-label={`Decrease ${label}`}
        >
          <Minus className="w-6 h-6" />
        </button>
        <div className={`flex-1 flex justify-center ${ringColor} rounded-xl focus-within:ring-2`}>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={value}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") {
                setValue(0);
                return;
              }
              const n = parseInt(raw, 10);
              if (!Number.isNaN(n) && n >= 0) setValue(n);
            }}
            onFocus={(e) => e.currentTarget.select()}
            aria-label={`${label} — type a number`}
            className={`w-32 text-5xl font-bold tabular-nums text-center bg-transparent outline-none ${color} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          />
        </div>
        <button
          onClick={() => setValue(value + 1)}
          className="h-16 w-16 rounded-xl border border-slate-300 flex items-center justify-center hover:bg-slate-50 active:bg-slate-100"
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
  onConfirm: (
    next: string,
    deviation?: { type: string; reason: string },
    photos?: string[],
  ) => void;
}) {
  // Optional photo capture — up to MAX_PHOTOS images stored as data URLs in
  // local component state. On iPad Safari + Android Chrome the `capture`
  // attribute opens the rear camera directly; on desktop it falls back to a
  // standard file picker. Phase-2 ticket will attach these to the ERPNext
  // Job Card via the File DocType + generate CV tags server-side.
  const MAX_PHOTOS = 4;
  const [photos, setPhotos] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  function handlePhotoFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const remaining = MAX_PHOTOS - photos.length;
    const toRead = files.slice(0, remaining);
    toRead.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setPhotos((prev) => (prev.length >= MAX_PHOTOS ? prev : [...prev, reader.result as string]));
        }
      };
      reader.readAsDataURL(f);
    });
    // Reset the input so the same file can be chosen again if removed.
    e.target.value = "";
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }
  // Default next-station per route. Always offers QC + Shipping as fallback.
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
  const defaultNext = suggested[0];
  const alternatives = suggested.slice(1);

  // Deviation options — JWM team's 2026-04-20 demo ask: "when he clicks
  // complete deviate it somewhere else... we never have to lie to the system."
  // Operator picks a deviation type + reason; the job doesn't just advance
  // down the default route, it branches per the captured reason.
  const [deviateMode, setDeviateMode] = useState(false);
  const [deviateType, setDeviateType] = useState<string>("finishing");
  const [deviateReason, setDeviateReason] = useState<string>("Burrs on cut edge");

  const DEVIATE_TYPES: { key: string; label: string; sendsTo: string; tone: string }[] = [
    { key: "finishing", label: "Finishing (fix + rejoin route)", sendsTo: "weld-bay-a", tone: "amber" },
    { key: "qc-hold", label: "QC Hold (escalate inspection)", sendsTo: "qc", tone: "red" },
    { key: "rework", label: "Rework (send back upstream)", sendsTo: fromWorkstation, tone: "slate" },
  ];
  const REASONS = [
    "Burrs on cut edge",
    "Dimension out of tolerance",
    "Material defect",
    "Surface finish NCR",
    "Missed op upstream",
    "Wrong part pulled",
    "Other — see comment",
  ];

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

          {/* Optional photo capture — rear camera on tablet/phone, file picker
              on desktop. Up to MAX_PHOTOS. Stored as data URLs; Phase-2 uploads
              to ERPNext File DocType attached to the Job Card + auto-tags via
              CV on the backend. */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-slate-700">
                Attach photos <span className="text-slate-400 font-normal">(optional)</span>
              </div>
              <div className="text-[11px] text-slate-500">
                {photos.length}/{MAX_PHOTOS}
              </div>
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handlePhotoFiles}
              className="hidden"
              aria-label="Capture or attach photos"
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={photos.length >= MAX_PHOTOS}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-slate-300 text-slate-600 hover:border-[#064162] hover:bg-[#eaf3f8] hover:text-[#064162] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
            >
              <Camera className="w-5 h-5" />
              {photos.length === 0
                ? "Take photo / attach image"
                : photos.length >= MAX_PHOTOS
                  ? "Max photos attached"
                  : "Add another photo"}
            </button>
            {photos.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {photos.map((src, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Attached photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      aria-label={`Remove photo ${i + 1}`}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white text-sm leading-none flex items-center justify-center hover:bg-black/80"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {photos.length > 0 && (
              <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#e69b40]" />
                Photos auto-tagged and attached to job card on handoff.
              </div>
            )}
          </div>

          {!deviateMode && (
            <>
              {/* Default next-station — big primary button */}
              <div>
                <div className="text-sm font-semibold text-slate-700 mb-2">Next station (per route)</div>
                <button
                  onClick={() => onConfirm(defaultNext, undefined, photos.length > 0 ? photos : undefined)}
                  className="w-full flex items-center justify-between gap-3 h-20 px-5 rounded-xl border-2 border-[#064162] bg-[#064162] text-white hover:bg-[#0a5480] transition-colors text-left"
                >
                  <div>
                    <div className="text-[10px] uppercase tracking-wider opacity-70">Hand off to</div>
                    <div className="text-2xl font-bold">{WS_LABELS[defaultNext] || defaultNext}</div>
                  </div>
                  <ArrowRightCircle className="w-10 h-10" />
                </button>
              </div>

              {/* Alternative route-valid stations */}
              {alternatives.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-2">Or another station on the route</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {alternatives.map((slug) => (
                      <button
                        key={slug}
                        onClick={() => onConfirm(slug, undefined, photos.length > 0 ? photos : undefined)}
                        className="h-11 px-3 rounded-lg border border-slate-300 hover:border-[#064162] hover:bg-[#eaf3f8] text-sm font-semibold text-slate-700 transition-colors"
                      >
                        {WS_LABELS[slug] || slug}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Deviate button — surfaces the alt flow */}
              <div className="border-t border-slate-200 pt-4">
                <button
                  onClick={() => setDeviateMode(true)}
                  className="w-full flex items-center justify-between gap-3 h-14 px-4 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-700" />
                    <div>
                      <div className="text-sm font-bold text-amber-900">Something's not right — deviate</div>
                      <div className="text-[11px] text-amber-700">Burrs, dimension off, wrong part, missed op upstream…</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-amber-700" />
                </button>
              </div>
            </>
          )}

          {deviateMode && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-900">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-bold">Deviate from route</span>
                <span className="text-[11px] text-slate-500 ml-auto">
                  Captures the actual flow — no need to lie to the system
                </span>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-700 mb-1.5">How do we handle it?</div>
                <div className="grid gap-2">
                  {DEVIATE_TYPES.map((d) => (
                    <button
                      key={d.key}
                      onClick={() => setDeviateType(d.key)}
                      className={`flex items-center justify-between gap-3 h-12 px-4 rounded-lg border-2 text-left text-sm font-semibold transition-all ${
                        deviateType === d.key
                          ? "border-amber-500 bg-amber-50 text-amber-900"
                          : "border-slate-200 hover:border-slate-400 text-slate-700"
                      }`}
                    >
                      <span>{d.label}</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        → {WS_LABELS[d.sendsTo] || d.sendsTo}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-700 mb-1.5">Reason</div>
                <select
                  value={deviateReason}
                  onChange={(e) => setDeviateReason(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:border-[#064162] focus:outline-none"
                >
                  {REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setDeviateMode(false)}
                  className="h-12 px-4 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    const type = DEVIATE_TYPES.find((d) => d.key === deviateType);
                    if (!type) return;
                    onConfirm(
                      type.sendsTo,
                      { type: deviateType, reason: deviateReason },
                      photos.length > 0 ? photos : undefined,
                    );
                  }}
                  className="flex-1 h-12 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700"
                >
                  Confirm deviation
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Handoff writes a Shop Floor Log entry · deviation logs to route history</span>
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
