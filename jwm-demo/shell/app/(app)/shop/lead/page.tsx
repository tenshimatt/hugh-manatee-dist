import Link from "next/link";
import { ArrowLeft, GanttChart, Info, Clock, Users, Calendar } from "lucide-react";

/**
 * /shop/lead — Lead / Foreman view (PHASE 2 STUB).
 *
 * Final form: WO-by-workstation Gantt with drag-to-reschedule, operator
 * assignment, and WIP visualisation pulling from ERPNext Job Cards +
 * Shop Floor Log. Listed in the sidebar so the link doesn't 404 and the
 * demo narrative can reference "the lead's Gantt" without building it.
 *
 * Scope is intentionally minimal — this is a stub, not a mockup of a
 * Gantt. See /Users/mattwright/pandora/jwm-demo/docs/shop-overhaul-report.md
 * for the Phase 2 plan.
 */
export default function LeadViewStub() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-[#064162] font-semibold hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Shop Floor
      </Link>

      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="text-xs font-bold text-[#e69b40] uppercase tracking-widest">
            Shop Floor · Lead
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#f3d7a8] bg-[#fdf2e3] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8a5716]">
            Phase 2
          </span>
        </div>
        <h1 className="text-3xl font-bold text-[#064162] tracking-tight">
          Lead View — Advanced Gantt
        </h1>
        <p className="text-slate-500">
          The lead/foreman scheduling surface. Not in the Phase-1 demo slice.
          This page exists so the sidebar link doesn&apos;t 404 and the demo
          narrative has a landing point when someone asks &ldquo;what does the lead
          see?&rdquo;
        </p>
      </header>

      <section className="jwm-card p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-[#eaf3f8] text-[#064162] flex items-center justify-center flex-shrink-0">
            <GanttChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#064162]">What this will become</h2>
            <p className="text-sm text-slate-600 mt-1">
              A WO-by-workstation Gantt pulling ERPNext Job Cards + Shop Floor
              Log, with drag-to-reschedule, operator assignment, and live WIP
              colouring. Think Asprova / Dynamics Scheduling, but narrow and
              opinionated for a 50-seat fab shop.
            </p>
          </div>
        </div>

        <ul className="grid sm:grid-cols-2 gap-3 pt-2">
          <FeatureRow
            icon={Clock}
            title="Live Gantt"
            body="Each row a workstation, each block a Job Card. Colour = priority × slip risk."
          />
          <FeatureRow
            icon={Users}
            title="Operator assignment"
            body="Drag operator pills onto a block. Validates skills matrix (WPS, cert expiry)."
          />
          <FeatureRow
            icon={Calendar}
            title="Drag-to-reschedule"
            body="Moving a block auto-adjusts downstream ops and surfaces material shortfalls."
          />
          <FeatureRow
            icon={Info}
            title="Anomaly inlay"
            body="When the Laser #2 anomaly fires, the affected blocks flash amber until cleared."
          />
        </ul>
      </section>

      <section className="jwm-card p-5 bg-slate-50/50 border-dashed">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
          For now
        </div>
        <div className="text-sm text-slate-700">
          Use the <Link href="/shop" className="text-[#064162] font-semibold underline">Shop Floor
          Overview</Link> to see all workstation queues at a glance, or tap a
          workstation card to open its kiosk. The queue counts there are the
          same data the Gantt will visualise.
        </div>
      </section>
    </div>
  );
}

function FeatureRow({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Clock;
  title: string;
  body: string;
}) {
  return (
    <li className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white">
      <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-800">{title}</div>
        <div className="text-xs text-slate-500 mt-0.5">{body}</div>
      </div>
    </li>
  );
}
