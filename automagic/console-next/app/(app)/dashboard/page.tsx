import { api } from "@/lib/api";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ProjectDonut, ClassificationBars, WorkflowBars } from "@/components/dashboard/Charts";
import { DropZone } from "@/components/dashboard/DropZone";
import {
  FileAudio,
  FolderKanban,
  CheckCircle2,
  Activity,
  AlertTriangle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { formatRelative } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await api.stats(24);

  if (!stats) {
    return (
      <Card>
        <CardBody className="p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <div className="text-lg font-semibold text-foreground">Backend unreachable</div>
          <p className="text-sm text-muted mt-1">
            Couldn&apos;t connect to the Automagic API at <code>{process.env.AUTOMAGIC_API_URL || "http://127.0.0.1:3100"}</code>.
            Check that the Express service is running on CT 120.
          </p>
        </CardBody>
      </Card>
    );
  }

  const pipelineSuccess =
    stats.pipeline.stats.total > 0
      ? Math.round((stats.pipeline.stats.success / stats.pipeline.stats.total) * 100)
      : 0;

  const projectDist = stats.distributions.projects.slice(0, 8).map((p) => ({
    name: p.project_folder || "Unfiled",
    value: p.cnt,
  }));

  const classDist = stats.distributions.classifications.map((c) => ({
    name: c.classification,
    value: c.cnt,
  }));

  const wfBreakdown = stats.pipeline.workflows.map((w) => ({
    name: (w.workflowName || "—").replace(/^WF-/, "").slice(0, 20),
    success: w.success,
    error: w.error,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted mt-1">
          Pipeline health and voice-note activity across the last 24 hours.
        </p>
      </header>

      <DropZone />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          k={{
            label: "Transcriptions",
            value: stats.counts.transcriptions,
            icon: FileAudio,
            accent: "sky",
            period: "all time",
          }}
        />
        <KpiCard
          k={{
            label: "Plane Projects",
            value: stats.counts.projects,
            icon: FolderKanban,
            accent: "teal",
            period: `${stats.counts.issues} issues`,
          }}
        />
        <KpiCard
          k={{
            label: "Pipeline Success",
            value: pipelineSuccess,
            unit: "%",
            icon: CheckCircle2,
            accent: pipelineSuccess >= 90 ? "teal" : "gold",
            goodDirection: "up",
            period: `${stats.pipeline.stats.total} runs / 24h`,
          }}
        />
        <KpiCard
          k={{
            label: "Errors / 24h",
            value: stats.pipeline.stats.error,
            icon: Activity,
            accent: stats.pipeline.stats.error === 0 ? "teal" : "gold",
            goodDirection: "down",
            period: `${stats.pipeline.stats.running} running`,
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="am-fade-in">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Project distribution</CardTitle>
            <span className="text-xs text-muted">{projectDist.length} folders</span>
          </CardHeader>
          <CardBody>
            {projectDist.length > 0 ? (
              <ProjectDonut data={projectDist} />
            ) : (
              <div className="text-sm text-muted text-center py-12">No project data yet.</div>
            )}
          </CardBody>
        </Card>

        <Card className="am-fade-in">
          <CardHeader>
            <CardTitle>Classification breakdown</CardTitle>
          </CardHeader>
          <CardBody>
            {classDist.length > 0 ? (
              <ClassificationBars data={classDist} />
            ) : (
              <div className="text-sm text-muted text-center py-12">No classification data yet.</div>
            )}
          </CardBody>
        </Card>

        <Card className="am-fade-in">
          <CardHeader>
            <CardTitle>Workflow runs (24h)</CardTitle>
          </CardHeader>
          <CardBody>
            {wfBreakdown.length > 0 ? (
              <WorkflowBars data={wfBreakdown} />
            ) : (
              <div className="text-sm text-muted text-center py-12">No pipeline activity in last 24h.</div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="am-fade-in">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent transcriptions</CardTitle>
            <Link href="/transcriptions" className="text-xs text-sky-brand-600 hover:underline font-medium">
              View all →
            </Link>
          </CardHeader>
          <CardBody className="px-0">
            <ul className="divide-y divide-border">
              {stats.recent.transcriptions.length === 0 && (
                <li className="px-5 py-4 text-sm text-muted">No transcriptions yet.</li>
              )}
              {stats.recent.transcriptions.map((t) => (
                <li key={t.id} className="px-5 py-3 hover:bg-surface-alt transition-colors">
                  <Link href={`/transcriptions/${t.id}`} className="block">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-foreground truncate">
                          {t.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted">
                          <Clock className="w-3 h-3" />
                          <span>{t.date} {t.time}</span>
                          {t.project_folder && (
                            <>
                              <span>·</span>
                              <Badge tone="sky" className="py-0 text-[10px]">{t.project_folder}</Badge>
                            </>
                          )}
                        </div>
                      </div>
                      {t.classification && (
                        <Badge tone="teal" className="text-[10px]">{t.classification}</Badge>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card className="am-fade-in">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent Plane issues</CardTitle>
            <Link href="/projects" className="text-xs text-sky-brand-600 hover:underline font-medium">
              View projects →
            </Link>
          </CardHeader>
          <CardBody className="px-0">
            <ul className="divide-y divide-border">
              {stats.recent.issues.length === 0 && (
                <li className="px-5 py-4 text-sm text-muted">No issues yet.</li>
              )}
              {stats.recent.issues.map((i) => {
                const tone =
                  i.state_group === "completed" ? "teal"
                  : i.state_group === "started" ? "sky"
                  : i.state_group === "cancelled" ? "slate"
                  : "gold";
                return (
                  <li key={i.id} className="px-5 py-3 hover:bg-surface-alt transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-foreground truncate">{i.name}</div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted">
                          <span>{i.project_identifier || i.project_name}</span>
                          <span>·</span>
                          <span>{formatRelative(i.created_at)}</span>
                        </div>
                      </div>
                      <Badge tone={tone} className="text-[10px]">{i.state_name}</Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      </div>

      {stats.pipeline.lastExecution && (
        <div className="text-xs text-muted text-right">
          Last pipeline execution: {formatRelative(stats.pipeline.lastExecution.startedAt)}
          {" · "}
          <span className="font-mono">{stats.pipeline.lastExecution.id}</span>
        </div>
      )}

    </div>
  );
}
