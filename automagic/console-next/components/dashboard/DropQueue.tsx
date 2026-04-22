"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  AudioLines,
} from "lucide-react";
import { cn } from "@/lib/utils";

type QueueItem = {
  name: string;
  size: number;
  mtime: number;
  error?: string;
};

type QueueResponse = {
  now: number;
  current: QueueItem | null;
  awaiting: QueueItem[];
  processed: QueueItem[];
  errored: QueueItem[];
  counts: { awaiting: number; processed: number; errored: number };
};

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function timeAgo(nowSec: number, mtime: number) {
  const diff = nowSec - mtime;
  if (diff < 0) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function niceName(name: string) {
  return name.replace(/__[a-f0-9]+(?=\.[^.]+$)/i, "").replace(/\.[^.]+$/, "");
}

export function DropQueue() {
  const [q, setQ] = useState<QueueResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setRefreshing(true);
      const r = await fetch("/proxy/queue", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as QueueResponse;
      setQ(data);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  const hasActivity =
    q && (q.current || q.awaiting.length > 0 || q.errored.length > 0);

  return (
    <Card className="am-fade-in">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AudioLines className="w-4 h-4 text-sky-brand-600" />
          Drop queue
          {q && (
            <span className="text-xs font-normal text-muted ml-1">
              {q.counts.awaiting} queued · {q.counts.processed} done · {q.counts.errored} errored
            </span>
          )}
        </CardTitle>
        <button
          onClick={load}
          className="text-muted hover:text-foreground p-1 rounded"
          aria-label="Refresh"
        >
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
        </button>
      </CardHeader>
      <CardBody className="space-y-4">
        {error && (
          <div className="text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5" />
            Queue unreachable: {error}
          </div>
        )}

        {!q && !error && (
          <div className="text-xs text-muted flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading queue…
          </div>
        )}

        {q && !hasActivity && q.processed.length === 0 && (
          <div className="text-sm text-muted text-center py-6">
            No uploads yet. Drag an audio file above to get started.
          </div>
        )}

        {q?.current && (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">
              Processing now
            </div>
            <div className="rounded-lg border border-sky-brand/30 bg-sky-brand-50/40 px-3 py-2 flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-sky-brand-600 animate-spin shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground truncate">
                  {niceName(q.current.name)}
                </div>
                <div className="text-[11px] text-muted">
                  {q.current.size > 0 ? formatBytes(q.current.size) : "—"} ·
                  started {timeAgo(q.now, q.current.mtime)}
                </div>
              </div>
              <Badge tone="sky" className="text-[10px]">
                transcribing
              </Badge>
            </div>
          </div>
        )}

        {q && q.awaiting.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">
              Waiting ({q.awaiting.length})
            </div>
            <ul className="space-y-1.5">
              {q.awaiting.map((f, i) => (
                <li
                  key={f.name}
                  className="rounded-lg border border-border bg-surface-alt px-3 py-2 flex items-center gap-3"
                >
                  <Clock className="w-4 h-4 text-muted shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-foreground truncate">
                      {niceName(f.name)}
                    </div>
                    <div className="text-[11px] text-muted">
                      {formatBytes(f.size)} · uploaded {timeAgo(q.now, f.mtime)}
                    </div>
                  </div>
                  <span className="text-[11px] text-muted">#{i + 1}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {q && q.errored.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">
              Errored ({q.errored.length})
            </div>
            <ul className="space-y-1.5">
              {q.errored.slice(0, 5).map((f) => (
                <li
                  key={f.name}
                  className="rounded-lg border border-red-200 bg-red-50/60 dark:bg-red-500/10 dark:border-red-500/30 px-3 py-2"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-foreground truncate">
                        {niceName(f.name)}
                      </div>
                      <div className="text-[11px] text-muted">
                        {formatBytes(f.size)} · {timeAgo(q.now, f.mtime)}
                      </div>
                      {f.error && (
                        <div className="text-[11px] text-red-700 dark:text-red-300 mt-1 font-mono truncate">
                          {f.error.split("\n").slice(-2).join(" ").slice(0, 200)}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {q && q.processed.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">
              Recently processed ({q.processed.length})
            </div>
            <ul className="space-y-1">
              {q.processed.slice(0, 6).map((f) => (
                <li
                  key={f.name}
                  className="px-3 py-1.5 flex items-center gap-3 text-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-brand-500 shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-foreground">
                    {niceName(f.name)}
                  </span>
                  <span className="text-[11px] text-muted shrink-0">
                    {timeAgo(q.now, f.mtime)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
