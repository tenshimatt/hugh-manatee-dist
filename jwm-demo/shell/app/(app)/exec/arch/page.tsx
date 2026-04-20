/**
 * /exec/arch — Executive · Architectural (A Shop) division dashboard.
 *
 * Server component. Reads live exec KPIs from ERPNext (Production Schedule Line
 * aggregates); falls back to canned Smartsheet baselines on any failure.
 *
 * Layout mirrors JWM's Smartsheet "Architectural Current Contracts Dashboard":
 *   • 8 hero KPI tiles (4×2)
 *   • Right rail: Project Budget Overview (6 canned figures)
 *   • Role-grouped dashboard links (Precon, Sales, Office)
 *   • Bottom: Active Projects table
 */
import Link from "next/link";
import {
  LineChart,
  CircleDot,
  FileText,
  Boxes,
  Package,
  Calendar,
  Users,
  Factory,
  LayoutGrid,
} from "lucide-react";
import { getExecKpis } from "@/lib/erpnext-live";
import { KpiTile, fmtUsd, fmtPct } from "@/components/exec/KpiTile";
import { ProjectBudgetOverview } from "@/components/exec/ProjectBudgetOverview";
import { PersonaCardRow } from "@/components/exec/PersonaCardRow";
import { ActiveProjectsTable } from "@/components/exec/ActiveProjectsTable";
import { PMO_ROWS } from "@/lib/pmo-rollup";

export const dynamic = "force-dynamic";

const DASHBOARD_LINKS: Array<{ label: string; href: string; icon: React.ElementType }> = [
  { label: "Panel Dashboard", href: "/arch/panel-dashboard", icon: LayoutGrid },
  { label: "3D Production Schedule", href: "/shop/scheduler", icon: Calendar },
  { label: "Document Manager", href: "/arch/documents", icon: FileText },
  { label: "Architectural Contract List", href: "/arch/projects", icon: Boxes },
  { label: "Scanner Calendar", href: "/arch/scanner-calendar", icon: Calendar },
  { label: "Vendors", href: "/arch/vendors", icon: Users },
  { label: "Machines", href: "/shop/machines", icon: Factory },
];

export default async function ExecArchPage() {
  const kpis = await getExecKpis("Architectural");

  // Spectrum vs Smartsheet drift aggregate — Σ |spectrumDelta| over active projects.
  const activeRows = PMO_ROWS.filter((r) => !r.archived);
  const driftAbsTotal = activeRows.reduce(
    (s, r) => s + Math.abs(r.spectrumDelta ?? 0),
    0,
  );
  const driftOver10k = activeRows.filter(
    (r) => Math.abs(r.spectrumDelta ?? 0) > 10_000,
  ).length;
  const maxAbsDrift = activeRows.reduce(
    (m, r) => Math.max(m, Math.abs(r.spectrumDelta ?? 0)),
    0,
  );
  const driftAccent: "amber" | "rose" | "slate" =
    maxAbsDrift > 250_000 ? "rose" : maxAbsDrift > 50_000 ? "amber" : "slate";

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider font-semibold text-sky-700 mb-1">
            Executive · Architectural
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <LineChart className="w-6 h-6 text-sky-600" />
            Architectural Current Contracts Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            A Shop (1010) — division exec view. Pipeline, WIP, margin, and project health
            derived live from the ERPNext Production Schedule.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span
            className={`px-2 py-1 rounded-full border ${
              kpis.source === "live"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-600 border-slate-300"
            }`}
          >
            <CircleDot className="w-3 h-3 inline-block mr-1 -mt-0.5" />
            {kpis.source === "live" ? "Live ERPNext" : "Canned fallback"}
          </span>
        </div>
      </div>

      {/* Hero: KPI tiles + Budget Overview */}
      <div className="grid grid-cols-12 gap-4 mb-6">
        <div className="col-span-12 lg:col-span-8 grid grid-cols-4 gap-3">
          <KpiTile
            label="Sales (Pending + Active + Neg)"
            value={fmtUsd(kpis.totalSalesPending)}
            subtitle="Open + submitted quotes"
            accent="sky"
            source="canned"
            size="lg"
          />
          <KpiTile
            label="Total SF out there (not Lost)"
            value={fmtUsd(kpis.totalSfOutThere)}
            subtitle="Square-foot exposure"
            accent="violet"
            source="canned"
            size="lg"
          />
          <KpiTile
            label="Pipeline Unbilled"
            value={fmtUsd(kpis.pipelineUnbilled)}
            subtitle={`${kpis.scheduleLineCount.toLocaleString()} schedule lines`}
            accent="amber"
            source={kpis.source}
            size="lg"
          />
          <KpiTile
            label="ACM / Remnant Margin %"
            value={fmtPct(kpis.acmMarginPct)}
            subtitle="Target 30% floor"
            accent="emerald"
            source="canned"
            size="lg"
          />
          <KpiTile
            label="Backlog"
            value={fmtUsd(kpis.backlog)}
            subtitle="Work not yet started"
            accent="slate"
            source="canned"
            size="lg"
          />
          <KpiTile
            label="Combined Margin of Active"
            value={fmtPct(kpis.combinedMarginPct)}
            subtitle="Across active projects"
            accent="emerald"
            source="canned"
            size="lg"
          />
          <KpiTile
            label="Cost to Come"
            value={fmtUsd(kpis.costToCome)}
            subtitle="Remaining spend to completion"
            accent="rose"
            source="canned"
            size="lg"
          />
          <KpiTile
            label="Total Active Projects"
            value={kpis.totalActiveProjects}
            subtitle="Distinct jobs in production schedule"
            accent="sky"
            source={kpis.source}
            trend="up"
            size="lg"
          />
          <Link href="/exec/spectrum-drift" className="col-span-4 block group">
            <KpiTile
              label="Spectrum drift"
              value={fmtUsd(driftAbsTotal)}
              subtitle={`${driftOver10k} project${driftOver10k === 1 ? "" : "s"} with >$10k drift · click to reconcile`}
              accent={driftAccent}
              source="canned"
              size="lg"
            />
          </Link>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <ProjectBudgetOverview data={kpis.budgetOverview} />
        </div>
      </div>

      {/* Dashboard Links + Persona Rows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Dashboard Links</h3>
          <div className="grid gap-1.5">
            {DASHBOARD_LINKS.map((l) => {
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-800 transition"
                >
                  <Icon className="w-4 h-4 text-slate-500" />
                  {l.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
          <PersonaCardRow
            title="Precon + Estimating Leaders"
            subtitle="Division heads for preconstruction & estimation"
            accent="violet"
            cards={[
              { name: "Mike Noterra", role: "VP Precon", href: "/arch/pm/mike-noterra" },
              { name: "Caleb Fanice", role: "Sr Estimator", href: "/arch/pm/caleb-fanice" },
              { name: "Kevin Florde", role: "Estimating Lead", href: "/arch/pm/kevin-florde" },
            ]}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex flex-col gap-4">
          <PersonaCardRow
            title="Sales Precon & Estimating Managers"
            accent="amber"
            cards={[
              { name: "Stephen Daniels", role: "Sales Manager", href: "/arch/pm/stephen-daniels" },
              { name: "Harrison Hardman", role: "Precon Manager", href: "/arch/pm/harrison-hardman" },
            ]}
          />
          <PersonaCardRow
            title="Office Manager Dashboards"
            accent="sky"
            cards={[
              { name: "Kim Sullivan", role: "Office Manager", href: "/arch/pm/kim-sullivan" },
            ]}
          />
        </div>
      </div>

      {/* Active projects table */}
      <ActiveProjectsTable projects={kpis.projects} division="Architectural" source={kpis.source} />

      <div className="mt-6 text-[11px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-3 h-3" />
          {kpis.scheduleLineCount.toLocaleString()} Schedule Lines · {kpis.totalActiveProjects} Jobs
        </div>
        <div>Refreshed {new Date(kpis.fetchedAt).toLocaleTimeString()}</div>
      </div>
    </div>
  );
}
