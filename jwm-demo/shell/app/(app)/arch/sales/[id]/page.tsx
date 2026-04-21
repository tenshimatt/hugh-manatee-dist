/**
 * /arch/sales/[id] — single opportunity detail.
 *
 * Reads from getOpportunityById (canned-first with live fallback).
 * Comments thread loaded from ERPNext when the id is a live doc; skipped
 * in canned mode (no thread exists for fabricated rows).
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Handshake, MapPin, User, Building2, FileText, ArrowRight, CheckCircle2, Clock, XCircle } from "lucide-react";
import { getOpportunityById, fmtUsd, stageColour, initials, type SalesStage } from "@/lib/arch-sales";

export const dynamic = "force-dynamic";

function stageIcon(s: SalesStage) {
  if (s === "Won") return <CheckCircle2 className="w-4 h-4" />;
  if (s === "Lost") return <XCircle className="w-4 h-4" />;
  if (s === "Active" || s === "Submitted") return <Clock className="w-4 h-4" />;
  return <Handshake className="w-4 h-4" />;
}

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric", timeZone: "America/Chicago",
  });
}

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opp = await getOpportunityById(decodeURIComponent(id));
  if (!opp) notFound();

  const col = stageColour(opp.stage);
  const showCreateProject = opp.stage === "Won";
  const competingBids = [opp.bid1, opp.bid2, opp.bid3, opp.bid4].filter((b): b is number => b != null && b > 0);

  return (
    <div className="space-y-5 max-w-6xl">
      <Link href="/arch/sales" className="inline-flex items-center gap-2 text-[#064162] font-semibold hover:underline text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Sales Pipeline
      </Link>

      {/* Hero */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div
          className="px-6 py-4 text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
          style={{ backgroundColor: col.bg }}
        >
          {stageIcon(opp.stage)}
          {opp.stage}
          {opp.closeProbability != null && opp.closeProbability > 0 && (
            <span className="ml-auto text-[10px] font-semibold opacity-90">
              {Math.round(opp.closeProbability * 100)}% close probability
            </span>
          )}
        </div>
        <div className="p-6 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-[#064162] tracking-tight">{opp.projectName}</h1>
            <div className="text-sm text-slate-500 mt-1 flex flex-wrap gap-3">
              {opp.company && <span className="inline-flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{opp.company}</span>}
              {(opp.city || opp.state) && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{[opp.city, opp.state].filter(Boolean).join(", ")}</span>}
              {opp.estimator && <span className="inline-flex items-center gap-1"><User className="w-3.5 h-3.5" />{opp.estimator}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Total Bid Value</div>
            <div className="text-3xl font-bold text-[#e69b40] tabular-nums">{fmtUsd(opp.totalBidValue, true)}</div>
            {opp.actualCloseValue != null && opp.actualCloseValue > 0 && (
              <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                Closed at {fmtUsd(opp.actualCloseValue, true)}
              </div>
            )}
          </div>
        </div>

        {/* Won-state create-project CTA */}
        {showCreateProject && (
          <div className="px-6 py-4 border-t border-slate-200 bg-gradient-to-r from-emerald-50 to-white flex items-center gap-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-bold text-emerald-900">This opportunity is won.</div>
              <div className="text-sm text-emerald-800">
                Create a Project record in PMO pre-filled from this sale — contract value, customer, estimator, scope.
              </div>
            </div>
            <Link
              href={`/arch/projects/new?from-opportunity=${encodeURIComponent(opp.id)}`}
              className="inline-flex items-center gap-2 px-4 h-11 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex-shrink-0"
            >
              Create Project <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Money panel */}
      <Panel title="Money">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Mini label="Metal bid" value={fmtUsd(opp.metalBidValue)} />
          <Mini label="Glazing bid" value={fmtUsd(opp.glazingBidValue)} />
          <Mini label="Markup" value={opp.markup != null ? `${(opp.markup * 100).toFixed(1)}%` : "—"} />
          <Mini label="Margin" value={opp.margin != null ? `${(opp.margin * 100).toFixed(1)}%` : "—"} />
          <Mini label="Total NSF" value={opp.totalNsf != null ? `${Math.round(opp.totalNsf).toLocaleString()} sf` : "—"} />
          <Mini label="Forecast close" value={fmtUsd(opp.forecastCloseValue)} />
          <Mini label="Actual close" value={fmtUsd(opp.actualCloseValue)} tone={opp.actualCloseValue ? "green" : "slate"} />
          <Mini label="Customer code" value={opp.customerCode ?? "—"} mono />
        </div>
      </Panel>

      {/* Scope + follow-up two-col */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel title="Scope">
          <div className="space-y-2 text-sm">
            <Row label="Job type" value={opp.jobType} />
            <Row label="Install type" value={opp.installType} />
            <Row label="Contact" value={opp.contactName} />
            {opp.scope && (
              <div className="pt-2 border-t border-slate-100 mt-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Scope note</div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{opp.scope}</p>
              </div>
            )}
          </div>
        </Panel>
        <Panel title="Follow-up">
          <div className="space-y-2 text-sm">
            <Row label="Received" value={fmtDate(opp.receivedDate)} />
            <Row label="Bid date" value={fmtDate(opp.bidDate)} />
            <Row label="Follow-up" value={fmtDate(opp.followUpDate)} />
            <Row label="Won/Lost date" value={fmtDate(opp.wonLostDate)} />
            <Row label="Ball in court" value={opp.ballInCourt} />
          </div>
        </Panel>
      </div>

      {/* Competitive bids */}
      {competingBids.length > 0 && (
        <Panel title={`Competitive bids (${competingBids.length})`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {competingBids.map((b, i) => (
              <Mini key={i} label={`Bid ${i + 1}`} value={fmtUsd(b, true)} />
            ))}
          </div>
          {opp.totalBidValue && competingBids.length > 0 && (
            <div className="text-[11px] text-slate-500 mt-3">
              Our bid {fmtUsd(opp.totalBidValue, true)} vs average competitor {fmtUsd(competingBids.reduce((a, b) => a + b, 0) / competingBids.length, true)}.
            </div>
          )}
        </Panel>
      )}

      {/* Latest comment + link to full thread */}
      {opp.latestComment && (
        <Panel title="Latest comment">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm text-slate-800 italic">
            “{opp.latestComment}”
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            <FileText className="inline w-3 h-3 mr-1 -mt-0.5" />
            18k comments across all opportunities live in ERPNext — full per-opportunity thread wire-up is the next Phase-2 slice.
          </div>
        </Panel>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="px-4 py-2 border-b border-slate-100">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">{title}</h2>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Mini({ label, value, mono, tone }: { label: string; value: string; mono?: boolean; tone?: "green" | "slate" }) {
  const color = tone === "green" ? "text-emerald-700" : "text-[#064162]";
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5">
      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
      <div className={`mt-0.5 text-sm font-bold tabular-nums ${color} ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-slate-800 text-right">{value || "—"}</span>
    </div>
  );
}
