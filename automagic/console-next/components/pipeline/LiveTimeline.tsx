"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";

type Execution = {
  id: string;
  workflowId: string;
  workflowName: string;
  startedAt: string;
  stoppedAt: string | null;
  status: string;
  mode: string;
};

export function LiveTimeline({ initial }: { initial: Execution[] }) {
  const [executions, setExecutions] = useState(initial);
  const [sseConnected, setSseConnected] = useState(false);

  useEffect(() => {
    const es = new EventSource("/proxy/sse");

    es.onopen = () => setSseConnected(true);
    es.onerror = () => setSseConnected(false);
    es.onmessage = async (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === "heartbeat" || msg.type === "reindex") {
          const r = await fetch("/proxy/pipeline?limit=50");
          if (r.ok) {
            const j = await r.json();
            setExecutions(j.executions || []);
          }
        }
      } catch {
        /* ignore */
      }
    };

    return () => es.close();
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted">
          {executions.length} recent executions
        </div>
        <div
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full text-[11px] font-medium border",
            sseConnected
              ? "bg-teal-brand-50 border-teal-brand/30 text-teal-brand-600"
              : "bg-surface-alt border-border text-muted"
          )}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              sseConnected ? "bg-teal-brand am-pulse-dot" : "bg-muted"
            )}
          />
          {sseConnected ? "Live" : "Disconnected"}
        </div>
      </div>

      <ul className="space-y-2">
        {executions.length === 0 && (
          <li className="text-sm text-muted text-center py-6">No executions yet.</li>
        )}
        {executions.map((e) => {
          const isSuccess = e.status === "success";
          const isError = e.status === "error" || e.status === "failed";
          const isRunning = e.status === "running" || !e.stoppedAt;
          const Icon = isSuccess ? CheckCircle2 : isError ? XCircle : Clock;
          const tone = isSuccess ? "text-teal-brand-600" : isError ? "text-red-600" : "text-gold-brand-600";

          const duration =
            e.stoppedAt && e.startedAt
              ? Math.round((new Date(e.stoppedAt).getTime() - new Date(e.startedAt).getTime()) / 1000)
              : null;

          return (
            <li
              key={e.id}
              className="am-card px-4 py-3 flex items-center gap-3 am-fade-in"
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", tone)} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground truncate">
                  {e.workflowName || e.workflowId}
                </div>
                <div className="text-[11px] text-muted">
                  {formatRelative(e.startedAt)}
                  {duration !== null && <> · {duration}s</>}
                  {isRunning && (
                    <>
                      {" · "}
                      <span className="text-sky-brand-600 font-medium">running</span>
                    </>
                  )}
                </div>
              </div>
              <Badge
                tone={isSuccess ? "teal" : isError ? "red" : "gold"}
                className="text-[10px]"
              >
                {e.status}
              </Badge>
              <code className="hidden md:inline text-[10px] text-muted font-mono">{e.id}</code>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function PipelineHealthBanner({
  stats,
}: {
  stats: { total: number; success: number; error: number; running: number };
}) {
  const successRate = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0;
  return (
    <div className="am-card p-5 flex items-center gap-4">
      <Activity className="w-6 h-6 text-sky-brand-600" />
      <div className="flex-1">
        <div className="text-sm font-semibold text-foreground">
          {stats.total} executions in last 24h
        </div>
        <div className="text-xs text-muted">
          {stats.success} success · {stats.error} errors · {stats.running} running · {successRate}% success rate
        </div>
      </div>
    </div>
  );
}
