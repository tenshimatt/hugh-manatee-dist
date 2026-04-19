import Link from "next/link";
import { ArrowRight, ClipboardList, Plus, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listErfs, type Erf, type ErfStatus } from "@/lib/canned/erf";
import { formatMoney } from "@/lib/utils";

/**
 * /erf — Engineering Release Form queue.
 *
 * Two sections: Pending (anything not yet Released) and Recently Released.
 * Pending items are grouped by status and sorted urgent-first. Click any
 * card to open /erf/[id] for detail + release action.
 */
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<ErfStatus, "amber" | "red" | "green" | "slate" | "gold" | "navy"> = {
  Draft: "slate",
  "Pending Drawings": "amber",
  "Pending Material": "amber",
  "Pending Approval": "gold",
  "Ready to Release": "green",
  Released: "navy",
};

const PRIORITY_ORDER = { urgent: 0, normal: 1, low: 2 } as const;

export default function ErfQueuePage() {
  const all = listErfs();
  const pending = all
    .filter((e) => e.status !== "Released")
    .sort((a, b) => {
      const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (p !== 0) return p;
      return a.target_release.localeCompare(b.target_release);
    });
  const released = all.filter((e) => e.status === "Released");

  const readyToRelease = pending.filter((e) => e.status === "Ready to Release").length;
  const blocked = pending.filter((e) => e.blockers.length > 0).length;
  const totalValue = pending.reduce((s, e) => s + (e.est_value || 0), 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-[#e69b40] uppercase tracking-widest">
            Engineering Release
          </div>
          <h1 className="text-3xl font-bold text-[#064162] tracking-tight">
            ERF queue
          </h1>
          <p className="text-slate-500 mt-1">
            {pending.length} pending · {readyToRelease} ready to release · {blocked}{" "}
            blocked · {formatMoney(totalValue)} in the pipeline
          </p>
        </div>
        <Link href="/erf/new">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4" />
            New ERF
          </Button>
        </Link>
      </header>

      {/* Summary tiles — quick at-a-glance counts */}
      <div className="grid sm:grid-cols-3 gap-4">
        <SummaryTile
          icon={CheckCircle2}
          label="Ready to release"
          value={readyToRelease}
          tone="green"
          help="All blockers cleared; drawings + material confirmed."
        />
        <SummaryTile
          icon={Clock}
          label="In progress"
          value={pending.length - readyToRelease}
          tone="slate"
          help="Drafts, pending drawings/material/approval."
        />
        <SummaryTile
          icon={AlertTriangle}
          label="Blocked"
          value={blocked}
          tone="amber"
          help="At least one open blocker."
        />
      </div>

      {/* Pending section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#064162]">Pending queue</h2>
          <div className="text-xs text-slate-500">Sorted urgent-first, then by target release</div>
        </div>
        {pending.length === 0 ? (
          <div className="jwm-card p-8 text-center text-slate-500">
            No pending ERFs. Nice.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {pending.map((e) => (
              <ErfCard key={e.id} erf={e} />
            ))}
          </div>
        )}
      </section>

      {/* Released section */}
      {released.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#064162]">Recently released</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {released.map((e) => (
              <ErfCard key={e.id} erf={e} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  tone,
  help,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: number;
  tone: "green" | "slate" | "amber";
  help: string;
}) {
  const bg = tone === "green" ? "bg-emerald-50 text-emerald-700" : tone === "amber" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700";
  return (
    <div className="jwm-card p-4 flex items-start gap-3">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${bg}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">{label}</div>
        <div className="text-3xl font-bold text-[#064162] tabular-nums leading-none mt-1">
          {value}
        </div>
        <div className="text-[11px] text-slate-500 mt-1">{help}</div>
      </div>
    </div>
  );
}

function ErfCard({ erf }: { erf: Erf }) {
  return (
    <Link
      href={`/erf/${erf.id}`}
      className={`jwm-card p-5 hover:shadow-md transition-all group border-l-4 ${
        erf.priority === "urgent"
          ? "border-red-400"
          : erf.blockers.length > 0
            ? "border-amber-400"
            : erf.status === "Ready to Release"
              ? "border-emerald-400"
              : "border-slate-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-[#eaf3f8] text-[#064162] flex items-center justify-center flex-shrink-0">
          <ClipboardList className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] text-[#e69b40] font-bold">{erf.id}</span>
            <Badge tone={STATUS_TONE[erf.status]} className="text-[10px]">
              {erf.status}
            </Badge>
            {erf.priority === "urgent" && (
              <Badge tone="red" className="text-[10px]">URGENT</Badge>
            )}
            {erf.assigned_wo && (
              <Badge tone="navy" className="text-[10px] font-mono">{erf.assigned_wo}</Badge>
            )}
          </div>
          <div className="text-base font-bold text-slate-900 mt-1 line-clamp-2 group-hover:text-[#064162]">
            {erf.title}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {erf.customer} · {erf.division} · {erf.line_items.length} line{erf.line_items.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          {erf.est_value && (
            <div className="text-sm font-bold text-[#064162] tabular-nums">
              {formatMoney(erf.est_value)}
            </div>
          )}
          <div className="text-[10px] text-slate-500 uppercase mt-0.5">Target</div>
          <div className="text-xs text-slate-700 font-semibold">{erf.target_release}</div>
        </div>
      </div>
      {erf.blockers.length > 0 && (
        <div className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span className="line-clamp-2">{erf.blockers[0]}</span>
        </div>
      )}
      <div className="mt-3 flex items-center justify-end text-xs text-[#064162] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
        Open ERF <ArrowRight className="w-3.5 h-3.5 ml-1" />
      </div>
    </Link>
  );
}
