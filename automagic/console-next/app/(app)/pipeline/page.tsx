import { api } from "@/lib/api";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LiveTimeline, PipelineHealthBanner } from "@/components/pipeline/LiveTimeline";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const data = await api.pipeline(50);

  const executions = data?.executions || [];
  const stats = data?.stats || { total: 0, success: 0, error: 0, running: 0 };
  const breakdown = data?.breakdown || [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
        <p className="text-sm text-muted mt-1">
          Live n8n workflow executions. Auto-refreshes via SSE.
        </p>
      </header>

      <PipelineHealthBanner stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Execution timeline</CardTitle>
            </CardHeader>
            <CardBody>
              <LiveTimeline initial={executions} />
            </CardBody>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Workflow breakdown (24h)</CardTitle>
          </CardHeader>
          <CardBody className="px-0">
            {breakdown.length === 0 ? (
              <div className="px-5 py-4 text-sm text-muted">No workflow activity.</div>
            ) : (
              <ul className="divide-y divide-border">
                {breakdown.map((w) => {
                  const rate = w.total > 0 ? Math.round((w.success / w.total) * 100) : 0;
                  return (
                    <li key={w.workflowId} className="px-5 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium text-foreground truncate">
                          {w.workflowName || w.workflowId}
                        </div>
                        <Badge tone={rate >= 90 ? "teal" : rate >= 50 ? "gold" : "red"} className="text-[10px]">
                          {rate}%
                        </Badge>
                      </div>
                      <div className="mt-2 w-full bg-surface-alt rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-teal-brand rounded-full"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <div className="mt-1 text-[11px] text-muted">
                        {w.success}/{w.total} success · {w.error} errors
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
