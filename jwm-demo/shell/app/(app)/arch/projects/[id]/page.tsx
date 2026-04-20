import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getProject, listProjects, type ActiveProject } from "@/lib/canned/active-projects";
import { isLive, listScheduleLines, pctFromRaw, type LivePSLine } from "@/lib/erpnext-live";
import { ProjectHero } from "@/components/project-dashboard/ProjectHero";
import { HealthTile, PercentTile } from "@/components/project-dashboard/HealthTile";
import { TaskStatusDonut } from "@/components/project-dashboard/TaskStatusDonut";
import { ProjectLinksRail } from "@/components/project-dashboard/ProjectLinksRail";
import { BudgetOverviewTile } from "@/components/project-dashboard/BudgetOverviewTile";
import {
  MarginTile,
  MarginIncreaseTile,
} from "@/components/project-dashboard/MarginTile";
import { FieldInstallTable } from "@/components/project-dashboard/FieldInstallTable";
import { BillingsTile } from "@/components/project-dashboard/BillingsTile";
import { ChangeOrderSummary } from "@/components/project-dashboard/ChangeOrderSummary";
import { ProjectScheduleStub } from "@/components/project-dashboard/ProjectScheduleStub";
import { EmbeddedRoutePipeline } from "@/components/route/EmbeddedRoutePipeline";

export const dynamic = "force-dynamic";

/** Merge live schedule lines into a canned project template to produce a
 *  live-flavoured dashboard. Falls back to pure canned on any error. */
async function resolveProject(id: string): Promise<ActiveProject | undefined> {
  const cannedExact = getProject(id);
  // Find a canned template to clone from even if the id isn't in the seed set.
  const template = cannedExact || listProjects()[0];

  if (!isLive()) return cannedExact;

  try {
    const lines = await listScheduleLines(500, [["job_id", "=", id]]);
    if (!lines.length) return cannedExact;
    const first: LivePSLine = lines[0];
    const need = lines.reduce((a, r) => a + (r.qty_required ?? 0), 0);
    const done = lines.reduce((a, r) => a + (r.qty_completed ?? 0), 0);
    const pctQty = need > 0 ? Math.round((done / need) * 100) : null;
    const pctRaw = pctFromRaw(first.jwm_raw_data);
    const percent = pctRaw ?? pctQty ?? cannedExact?.percentComplete ?? 0;

    const ships = lines.map((l) => l.ship_target).filter(Boolean) as string[];
    ships.sort();
    const shipMin = ships[0];

    // Count "tasks" by station/status buckets (rough).
    const complete = lines.filter((l) => (l.qty_remain ?? 0) === 0 && (l.qty_required ?? 0) > 0).length;
    const inProg = lines.filter((l) => (l.qty_completed ?? 0) > 0 && (l.qty_remain ?? 0) > 0).length;
    const notStarted = Math.max(lines.length - complete - inProg, 0);

    const merged: ActiveProject = {
      ...template,
      id,
      jobNumber: id.split("-")[0] ?? template.jobNumber,
      jobName: first.job_name || cannedExact?.jobName || template.jobName,
      percentComplete: percent,
      taskStatus: [
        { status: "Not Started", count: notStarted },
        { status: "In Progress", count: inProg },
        { status: "Complete", count: complete },
      ],
      milestones: shipMin
        ? [...(template.milestones || []), { name: "Ship Target (live)", date: shipMin, status: "upcoming" as const }]
        : template.milestones,
    };
    return merged;
  } catch (e) {
    console.warn("[arch/projects/[id]] live fetch failed, using canned:", e);
    return cannedExact;
  }
}

export default async function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decoded = decodeURIComponent(id);
  const project = await resolveProject(decoded);
  if (!project) notFound();

  return (
    <div className="space-y-5">
      <Link
        href="/arch/projects"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#0A2E5C]"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> All Projects
      </Link>

      <ProjectHero
        jobName={project.jobName}
        jobNumber={project.jobNumber}
        pmName={project.pm.name}
        pmEmail={project.pm.email}
        pmPhone={project.pm.phone}
      />

      <section>
        <div className="text-[10px] uppercase tracking-[0.2em] text-[#C9A349] font-bold mb-2">
          Project Information
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 xl:col-span-9 grid grid-cols-4 gap-4">
            <HealthTile
              title="Project Health"
              status={project.health.status}
              label={project.health.label}
            />
            <PercentTile title="% Complete" value={project.percentComplete} />
            <TaskStatusDonut data={project.taskStatus} />
            <HealthTile
              title="Budget Health"
              status={project.budgetHealth.status}
              label={`Budget's % Spent: ${project.budgetHealth.percentSpent}%`}
            />
          </div>
          <div className="col-span-12 xl:col-span-3">
            <ProjectLinksRail projectId={project.id} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-9 grid grid-cols-3 gap-4">
          <div className="col-span-3 md:col-span-1">
            <BudgetOverviewTile budget={project.budget} />
          </div>
          <div className="col-span-3 md:col-span-1">
            <MarginTile margin={project.margin} />
          </div>
          <div className="col-span-3 md:col-span-1">
            <MarginIncreaseTile marginIncrease={project.marginIncrease} />
          </div>

          <div className="col-span-3 md:col-span-2">
            <BillingsTile billings={project.billings} />
          </div>
          <div className="col-span-3 md:col-span-1">
            <ChangeOrderSummary changeOrders={project.changeOrders} />
          </div>
        </div>

        <div className="col-span-12 xl:col-span-3">
          <FieldInstallTable rows={project.fieldInstall} />
        </div>
      </section>

      <EmbeddedRoutePipeline jobId={decoded} />

      <ProjectScheduleStub milestones={project.milestones} />
    </div>
  );
}
