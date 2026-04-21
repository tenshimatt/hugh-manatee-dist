import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertTriangle, ClipboardList, Calendar, User, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getErf, type ErfStatus } from "@/lib/canned/erf";
import { formatMoney } from "@/lib/utils";
import { ReleaseActions } from "./ReleaseActions";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<ErfStatus, "amber" | "red" | "green" | "slate" | "gold" | "navy"> = {
  Draft: "slate",
  "Pending Drawings": "amber",
  "Pending Material": "amber",
  "Pending Approval": "gold",
  "Ready to Release": "green",
  Released: "navy",
};

export default async function ErfDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const erf = getErf(id);
  if (!erf) notFound();

  const lineTotal = erf.line_items.reduce((s, l) => s + (l.qty || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        href="/arch/erf"
        className="inline-flex items-center gap-2 text-[#064162] font-semibold hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to ERF queue
      </Link>

      <header className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm text-[#e69b40] font-bold">{erf.id}</span>
          <Badge tone={STATUS_TONE[erf.status]}>{erf.status}</Badge>
          {erf.priority === "urgent" && <Badge tone="red">URGENT</Badge>}
          {erf.assigned_wo && (
            <Link href={`/planner/${erf.assigned_wo}`} className="inline-flex">
              <Badge tone="navy" className="font-mono hover:underline">
                {erf.assigned_wo}
              </Badge>
            </Link>
          )}
        </div>
        <h1 className="text-3xl font-bold text-[#064162] tracking-tight">{erf.title}</h1>
        <p className="text-slate-500">
          {erf.customer} · {erf.project}
        </p>
      </header>

      {erf.blockers.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" /> Open blockers
          </div>
          <ul className="space-y-1 text-sm text-amber-900">
            {erf.blockers.map((b, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-amber-600">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <MetaCard icon={Tag} label="Division" value={erf.division} />
        <MetaCard icon={Calendar} label="Target release" value={erf.target_release} />
        <MetaCard
          icon={User}
          label="Submitted by"
          value={`${erf.submitted_by} · ${new Date(erf.submitted_at).toLocaleDateString()}`}
        />
        {erf.est_value && (
          <MetaCard
            icon={ClipboardList}
            label="Estimated value"
            value={formatMoney(erf.est_value)}
          />
        )}
      </div>

      {erf.notes && (
        <section className="jwm-card p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Notes
          </div>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{erf.notes}</p>
        </section>
      )}

      <section className="jwm-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#064162]">Line items</h2>
          <div className="text-xs text-slate-500">
            {erf.line_items.length} line{erf.line_items.length === 1 ? "" : "s"} · {lineTotal} total qty
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr className="text-left">
                <th className="px-3 py-2 font-semibold">Part</th>
                <th className="px-3 py-2 font-semibold text-right">Qty</th>
                <th className="px-3 py-2 font-semibold">UOM</th>
                <th className="px-3 py-2 font-semibold">Gauge</th>
                <th className="px-3 py-2 font-semibold">Material</th>
              </tr>
            </thead>
            <tbody>
              {erf.line_items.map((l, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-800 font-medium">{l.part}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{l.qty}</td>
                  <td className="px-3 py-2 text-slate-600">{l.uom}</td>
                  <td className="px-3 py-2 text-slate-600">{l.gauge || "—"}</td>
                  <td className="px-3 py-2 text-slate-600">{l.material || "—"}</td>
                </tr>
              ))}
              {erf.line_items.length === 0 && (
                <tr className="border-t border-slate-100">
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                    No line items.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ReleaseActions erfId={erf.id} status={erf.status} assignedWo={erf.assigned_wo} />
    </div>
  );
}

function MetaCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Tag;
  label: string;
  value: string;
}) {
  return (
    <div className="jwm-card p-4 flex items-start gap-3">
      <div className="h-9 w-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </div>
        <div className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{value}</div>
      </div>
    </div>
  );
}
