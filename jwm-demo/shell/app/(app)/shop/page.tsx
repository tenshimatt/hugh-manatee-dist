import Link from "next/link";
import {
  ArrowRight,
  Factory,
  Flame,
  ShieldCheck,
  Truck,
  Wrench,
  CircleDot,
  Activity,
  Gauge,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { JOB_CARDS, NCRS } from "@/lib/canned/work-orders";
import { isLive, listJobCards } from "@/lib/erpnext-live";

/**
 * /shop — Shop Floor Overview
 *
 * New default landing for post-login shop narrative. Shows every
 * workstation as a large tap-target card with live queue count, urgent/hold
 * flags, and a tiny "pulse" strip (active vs idle). Falls through to the
 * canned JOB_CARDS fixture when ERPNext is not configured.
 *
 * Offline-capable + PPR are Phase-2; this route is server-rendered on
 * each request via SWR-style polling in the client (see page.client).
 */
export const dynamic = "force-dynamic";

interface WorkstationDef {
  slug: string;
  label: string;
  icon: "laser" | "cnc" | "brake" | "weld" | "assembly" | "qc" | "ship";
  role: "floor" | "qc";
  erp_name: string;
}

const WORKSTATIONS: WorkstationDef[] = [
  { slug: "flat-laser-1", label: "Flat Laser #1", icon: "laser", role: "floor", erp_name: "Flat Laser 1" },
  { slug: "flat-laser-2", label: "Flat Laser #2", icon: "laser", role: "floor", erp_name: "Flat Laser 2" },
  { slug: "cnc-1", label: "CNC Mill #1", icon: "cnc", role: "floor", erp_name: "CNC 1" },
  { slug: "press-brake-1", label: "Press Brake #1", icon: "brake", role: "floor", erp_name: "Press Brake 1" },
  { slug: "weld-bay-a", label: "Weld Bay A", icon: "weld", role: "floor", erp_name: "Weld Bay A" },
  { slug: "assembly-1", label: "Assembly #1", icon: "assembly", role: "floor", erp_name: "Assembly 1" },
  { slug: "qc", label: "QC Station", icon: "qc", role: "qc", erp_name: "QC" },
  { slug: "shipping", label: "Shipping", icon: "ship", role: "floor", erp_name: "Shipping" },
];

const ICON: Record<WorkstationDef["icon"], typeof Factory> = {
  laser: Flame,
  cnc: Wrench,
  brake: Factory,
  weld: Activity,
  assembly: Gauge,
  qc: ShieldCheck,
  ship: Truck,
};

interface QueueStat {
  slug: string;
  label: string;
  icon: WorkstationDef["icon"];
  role: WorkstationDef["role"];
  total: number;
  urgent: number;
  hold: number;
  top_part?: string;
  top_customer?: string;
  source: "live" | "canned";
}

async function loadStats(): Promise<{ stats: QueueStat[]; liveCount: number }> {
  const out: QueueStat[] = [];
  let liveCount = 0;

  for (const w of WORKSTATIONS) {
    if (w.role === "qc") {
      out.push({
        slug: w.slug,
        label: w.label,
        icon: w.icon,
        role: w.role,
        total: NCRS.filter((n) => n.status !== "Closed").length,
        urgent: NCRS.filter((n) => n.status === "Under Review" || n.status === "CA Open").length,
        hold: 0,
        source: "canned",
      });
      continue;
    }

    const canned = JOB_CARDS.filter((c) => c.workstation === w.slug);
    let total = canned.length;
    let urgent = canned.filter((c) => c.priority === "urgent").length;
    let hold = canned.filter((c) => c.priority === "hold").length;
    const top = canned[0];
    let source: "live" | "canned" = "canned";

    if (isLive()) {
      try {
        const jobs = await listJobCards(w.erp_name, 50);
        if (jobs.length) {
          total = jobs.length;
          urgent = jobs.filter((j) => j.status === "Work In Progress").length;
          hold = jobs.filter((j) => j.status === "On Hold").length;
          source = "live";
          liveCount++;
        }
      } catch {
        /* ignore — fall through to canned */
      }
    }

    out.push({
      slug: w.slug,
      label: w.label,
      icon: w.icon,
      role: w.role,
      total,
      urgent,
      hold,
      top_part: top?.part,
      top_customer: top?.customer,
      source,
    });
  }

  return { stats: out, liveCount };
}

export default async function ShopOverviewPage() {
  const { stats, liveCount } = await loadStats();
  const totalJobs = stats.reduce((s, x) => s + (x.role === "floor" ? x.total : 0), 0);
  const urgentJobs = stats.reduce((s, x) => s + (x.role === "floor" ? x.urgent : 0), 0);
  const holdJobs = stats.reduce((s, x) => s + (x.role === "floor" ? x.hold : 0), 0);
  const openNcrs = stats.find((s) => s.slug === "qc")?.total ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-[#e69b40] uppercase tracking-widest">
            Shop Floor
          </div>
          <h1 className="text-3xl font-bold text-[#064162] tracking-tight">
            Today on the floor
          </h1>
          <p className="text-slate-500 mt-1">
            {totalJobs} active job cards across {stats.filter((s) => s.role === "floor").length}{" "}
            workstations · {urgentJobs} urgent · {holdJobs} on hold · {openNcrs} open NCR
            {openNcrs === 1 ? "" : "s"}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {liveCount > 0 ? (
            <Badge tone="green" className="gap-1.5">
              <CircleDot className="w-3 h-3" />
              Live ERPNext · {liveCount} station{liveCount === 1 ? "" : "s"}
            </Badge>
          ) : (
            <Badge tone="slate">Canned data</Badge>
          )}
          <Link
            href="/shop/lead"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#064162] hover:underline"
          >
            Lead view
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = ICON[s.icon];
          const isQc = s.role === "qc";
          const hasUrgent = s.urgent > 0;
          const hasHold = s.hold > 0;
          return (
            <Link
              key={s.slug}
              href={`/shop/${s.slug}`}
              className={`group jwm-card p-5 flex flex-col gap-3 border-l-4 hover:shadow-md transition-all ${
                hasUrgent
                  ? "border-red-400"
                  : hasHold
                    ? "border-amber-400"
                    : isQc
                      ? "border-[#064162]"
                      : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                    isQc
                      ? "bg-[#eaf3f8] text-[#064162]"
                      : "bg-slate-100 text-slate-700 group-hover:bg-[#eaf3f8] group-hover:text-[#064162]"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-[#064162] tabular-nums leading-none">
                    {s.total}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-1">
                    {isQc ? "Open NCRs" : "In queue"}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-base font-bold text-slate-900 group-hover:text-[#064162]">
                  {s.label}
                </div>
                {!isQc && s.top_part && (
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    Next: {s.top_part} · {s.top_customer}
                  </div>
                )}
                {isQc && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    {s.urgent} requiring review
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {hasUrgent && (
                  <Badge tone="red" className="text-[10px]">
                    {s.urgent} urgent
                  </Badge>
                )}
                {hasHold && (
                  <Badge tone="amber" className="text-[10px]">
                    {s.hold} hold
                  </Badge>
                )}
                {s.source === "live" && (
                  <Badge tone="green" className="text-[10px] gap-1">
                    <CircleDot className="w-2.5 h-2.5" />
                    Live
                  </Badge>
                )}
                <div className="ml-auto text-xs text-[#064162] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Open →
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick context footer — ties the shop overview back to Planner/QC.
          Important for the demo narrative: "shop sits between ERF on the
          front end and QC on the back end." */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link
          href="/erf"
          className="jwm-card p-4 hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="h-10 w-10 rounded-lg bg-[#fdf2e3] text-[#8a5716] flex items-center justify-center">
            <ArrowRight className="w-5 h-5 rotate-180" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
              Upstream
            </div>
            <div className="text-sm font-bold text-[#064162]">ERF queue</div>
            <div className="text-xs text-slate-500">Work entering the shop</div>
          </div>
        </Link>
        <Link
          href="/planner/WO-2026-00218"
          className="jwm-card p-4 hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="h-10 w-10 rounded-lg bg-[#eaf3f8] text-[#064162] flex items-center justify-center">
            <Gauge className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
              In-flight
            </div>
            <div className="text-sm font-bold text-[#064162]">Planner · WO-2026-00218</div>
            <div className="text-xs text-slate-500">Opryland Monumental Stair</div>
          </div>
        </Link>
        <Link
          href="/qc"
          className="jwm-card p-4 hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
              Downstream
            </div>
            <div className="text-sm font-bold text-[#064162]">QC inbox</div>
            <div className="text-xs text-slate-500">{openNcrs} NCR{openNcrs === 1 ? "" : "s"} open</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
