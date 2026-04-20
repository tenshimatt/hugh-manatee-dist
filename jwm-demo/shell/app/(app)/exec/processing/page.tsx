/**
 * /exec/processing — Executive · Processing (T Shop) division dashboard.
 *
 * Symmetric with /exec/arch. Filters ERPNext Production Schedule by shop=Processing.
 * T Shop carries a smaller schedule-line footprint — live count will be modest.
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

export const dynamic = "force-dynamic";

const DASHBOARD_LINKS: Array<{ label: string; href: string; icon: React.ElementType }> = [
  { label: "Quick Quote Queue", href: "/processing/quick-quote", icon: LayoutGrid },
  { label: "3D Production Schedule", href: "/shop/scheduler", icon: Calendar },
  { label: "Document Manager", href: "/processing/documents", icon: FileText },
  { label: "Processing Contract List", href: "/processing/projects", icon: Boxes },
  { label: "Scanner Calendar", href: "/processing/scanner-calendar", icon: Calendar },
  { label: "Vendors", href: "/processing/vendors", icon: Users },
  { label: "Machines", href: "/shop/machines", icon: Factory },
];

export default async function ExecProcessingPage() {
  const kpis = await getExecKpis("Processing");

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider font-semibold text-amber-700 mb-1">
            Executive · Processing
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <LineChart className="w-6 h-6 text-amber-600" />
            Processing Current Contracts Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            T Shop (1040) — tube laser + fabrication. Quick-quote velocity, shop load,
            and ops throughput from the ERPNext Production Schedule.
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

      <div className="grid grid-cols-12 gap-4 mb-6">
        <div className="col-span-12 lg:col-span-8 grid grid-cols-4 gap-3">
          <KpiTile label="Sales (Pending + Active + Neg)" value={fmtUsd(kpis.totalSalesPending)} subtitle="Open + submitted quotes" accent="amber" source="canned" />
          <KpiTile label="Total SF out there (not Lost)" value={fmtUsd(kpis.totalSfOutThere)} subtitle="Square-foot exposure" accent="violet" source="canned" />
          <KpiTile label="Pipeline Unbilled" value={fmtUsd(kpis.pipelineUnbilled)} subtitle={`${kpis.scheduleLineCount.toLocaleString()} schedule lines`} accent="sky" source={kpis.source} />
          <KpiTile label="Margin %" value={fmtPct(kpis.acmMarginPct)} subtitle="Target 25% floor" accent="emerald" source="canned" />
          <KpiTile label="Backlog" value={fmtUsd(kpis.backlog)} subtitle="Work not yet started" accent="slate" source="canned" />
          <KpiTile label="Combined Margin of Active" value={fmtPct(kpis.combinedMarginPct)} subtitle="Across active projects" accent="emerald" source="canned" />
          <KpiTile label="Cost to Come" value={fmtUsd(kpis.costToCome)} subtitle="Remaining spend to completion" accent="rose" source="canned" />
          <KpiTile label="Total Active Projects" value={kpis.totalActiveProjects} subtitle="Distinct jobs in production schedule" accent="amber" source={kpis.source} trend="up" />
        </div>

        <div className="col-span-12 lg:col-span-4">
          <ProjectBudgetOverview data={kpis.budgetOverview} />
        </div>
      </div>

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
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition"
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
            title="Processing Leaders"
            subtitle="Tube laser + structural fab"
            accent="violet"
            cards={[
              { name: "Stephen Daniels", role: "Shop Superintendent", href: "/processing/pm/stephen-daniels" },
              { name: "Kevin Florde", role: "Quick-Quote Lead", href: "/processing/pm/kevin-florde" },
            ]}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
          <PersonaCardRow
            title="Office Manager Dashboards"
            accent="sky"
            cards={[
              { name: "Kim Sullivan", role: "Office Manager", href: "/processing/pm/kim-sullivan" },
            ]}
          />
        </div>
      </div>

      <ActiveProjectsTable projects={kpis.projects} division="Processing" source={kpis.source} />

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
