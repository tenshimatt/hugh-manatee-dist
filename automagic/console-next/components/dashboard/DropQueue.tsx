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
  ExternalLink,
  Info,
} from "lucide-react";
import { cn, toObsidianUri } from "@/lib/utils";

type QueueResult = {
  markdownPath?: string;
  title?: string;
  projectFolder?: string | null;
  tags?: string[];
  finishedAt?: string;
};

type QueueItem = {
  name: string;
  size: number;
  mtime: number;
  error?: string;
  result?: QueueResult;
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

function diagnoseError(err: string): { summary: string; action: string } {
  const e = err.toLowerCase();
  if (e.includes("whisper") || e.includes("audio/transcriptions")) {
    if (e.includes("500")) {
      return {
        summary: "Whisper refused the file (HTTP 500).",
        action:
          "Usually: file is too short, corrupt, or an unreadable container. Try re-exporting as plain mp3/wav. To inspect: `journalctl -u whisper-api -n 40` on PCT 146.",
      };
    }
    if (e.includes("timeout") || e.includes("connection")) {
      return {
        summary: "Whisper API unreachable.",
        action:
          "Check `whisper-api` on PCT 146: `pct exec 146 -- systemctl status whisper-api`. GPU may be stuck — restart it.",
      };
    }
  }
  if (e.includes("scp") || e.includes("permission denied")) {
    return {
      summary: "Transport CT 120 → CT 107 failed.",
      action:
        "SSH key between containers is broken. Verify `/root/.ssh/id_ed25519` on CT 120 + `/root/.ssh/authorized_keys` on CT 107.",
    };
  }
  if (e.includes("litellm") || e.includes("anthropic") || e.includes("4000")) {
    return {
      summary: "LiteLLM gateway refused the request.",
      action:
        "Check LiteLLM on 10.90.10.23:4000 + verify LITELLM_API_KEY on CT 107 still matches. Budget exhaustion also presents this way.",
    };
  }
  if (e.includes("empty transcript")) {
    return {
      summary: "Whisper succeeded but returned no text.",
      action: "Audio was silence or too quiet. Nothing to salvage — delete or re-record.",
    };
  }
  return {
    summary: "Unclassified processor error.",
    action:
      "Full log: `ssh root@10.90.10.7 journalctl -u automagic-drops-processor -n 80 --no-pager`. File is parked in `_drops/_errored/` for manual review.",
  };
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
            <ul className="space-y-2">
              {q.errored.slice(0, 5).map((f) => {
                const diag = f.error ? diagnoseError(f.error) : null;
                return (
                  <li
                    key={f.name}
                    className="rounded-lg border border-red-200 bg-red-50/60 dark:bg-red-500/10 dark:border-red-500/30 px-3 py-2.5"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-foreground truncate">
                          {niceName(f.name)}
                        </div>
                        <div className="text-[11px] text-muted">
                          {formatBytes(f.size)} · {timeAgo(q.now, f.mtime)}
                        </div>
                        {diag && (
                          <div className="mt-2 space-y-1">
                            <div className="text-[12px] text-red-700 dark:text-red-300 font-medium">
                              {diag.summary}
                            </div>
                            <div className="text-[11px] text-muted flex items-start gap-1.5">
                              <Info className="w-3 h-3 shrink-0 mt-0.5" />
                              <span>{diag.action}</span>
                            </div>
                          </div>
                        )}
                        {f.error && (
                          <details className="mt-1.5">
                            <summary className="text-[10px] text-muted cursor-pointer hover:text-foreground">
                              Raw error
                            </summary>
                            <pre className="text-[10px] text-red-700 dark:text-red-300 mt-1 whitespace-pre-wrap break-words font-mono">
                              {f.error}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {q && q.processed.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">
              Recently processed ({q.processed.length})
            </div>
            <ul className="space-y-1">
              {q.processed.slice(0, 6).map((f) => {
                const title = f.result?.title || niceName(f.name);
                const obsidianUri = toObsidianUri(f.result?.markdownPath);
                const folder = f.result?.projectFolder;
                return (
                  <li key={f.name}>
                    {obsidianUri ? (
                      <a
                        href={obsidianUri}
                        className="group px-3 py-1.5 flex items-center gap-3 text-sm rounded hover:bg-surface-alt transition-colors"
                        title="Open in Obsidian"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-brand-500 shrink-0" />
                        <span className="min-w-0 flex-1 truncate text-foreground group-hover:text-sky-brand-600 group-hover:underline">
                          {title}
                        </span>
                        {folder && (
                          <span className="text-[10px] text-muted shrink-0">
                            {folder}
                          </span>
                        )}
                        <span className="text-[11px] text-muted shrink-0">
                          {timeAgo(q.now, f.mtime)}
                        </span>
                        <ExternalLink className="w-3 h-3 text-muted group-hover:text-sky-brand-600 shrink-0" />
                      </a>
                    ) : (
                      <div
                        className="px-3 py-1.5 flex items-center gap-3 text-sm"
                        title="No Obsidian path recorded (older drop — sidecar missing)"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-brand-500 shrink-0" />
                        <span className="min-w-0 flex-1 truncate text-foreground">
                          {title}
                        </span>
                        <span className="text-[11px] text-muted shrink-0">
                          {timeAgo(q.now, f.mtime)}
                        </span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
