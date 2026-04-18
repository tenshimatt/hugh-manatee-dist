"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RefreshCw, Search, User, Waves } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

type PipelineHealth = {
  success: number;
  error: number;
  total: number;
};

export function TopBar() {
  const [health, setHealth] = useState<PipelineHealth | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch("/proxy/stats?hours=24", { cache: "no-store" });
        if (!r.ok) throw new Error("fetch failed");
        const j = await r.json();
        if (!cancelled) {
          setHealth({
            success: j.pipeline?.stats?.success ?? 0,
            error: j.pipeline?.stats?.error ?? 0,
            total: j.pipeline?.stats?.total ?? 0,
          });
          setLastSync(j.pipeline?.lastExecution?.startedAt ?? null);
        }
      } catch {
        if (!cancelled) setHealth({ success: 0, error: 0, total: 0 });
      }
    }
    load();
    const t = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  async function triggerReindex() {
    setRefreshing(true);
    try {
      await fetch("/proxy/reindex", { method: "POST" });
    } catch {
      /* ignore */
    } finally {
      setTimeout(() => setRefreshing(false), 800);
    }
  }

  const successRate =
    health && health.total > 0
      ? Math.round((health.success / health.total) * 100)
      : null;

  const healthy = successRate !== null && successRate >= 90;

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-16 bg-surface border-b border-border flex items-center px-4 gap-4">
      <Link href="/dashboard" className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl am-gradient flex items-center justify-center shadow-sm">
          <Waves className="w-5 h-5 text-white" />
        </div>
        <div className="hidden sm:block leading-tight">
          <div className="text-[15px] font-bold text-foreground tracking-tight">
            Automagic
          </div>
          <div className="text-[11px] text-muted">
            Voice → Action Pipeline
          </div>
        </div>
      </Link>

      <div className="flex-1 max-w-xl mx-auto hidden md:block">
        <form action="/search" method="GET">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              name="q"
              aria-label="Search transcriptions and issues"
              placeholder="Search transcriptions, issues, tags…"
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface-alt border border-transparent focus:border-border-strong focus:bg-surface focus:outline-none text-sm text-foreground placeholder:text-muted"
            />
          </div>
        </form>
      </div>

      {health !== null && (
        <span
          title={
            healthy
              ? `${successRate}% success · ${health.total} runs / 24h`
              : health.total === 0
                ? "No pipeline activity in last 24h"
                : `${successRate}% success · ${health.error} errors`
          }
          className={cn(
            "hidden md:inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full text-[11px] font-medium border",
            healthy
              ? "bg-teal-brand-50 border-teal-brand/30 text-teal-brand-600"
              : health.total === 0
                ? "bg-surface-alt border-border text-muted"
                : "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300"
          )}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full am-pulse-dot",
              healthy
                ? "bg-teal-brand"
                : health.total === 0
                  ? "bg-muted"
                  : "bg-amber-500"
            )}
          />
          {successRate !== null ? `Pipeline ${successRate}%` : "Pipeline —"}
        </span>
      )}

      <button
        onClick={triggerReindex}
        aria-label="Reindex"
        title={lastSync ? `Last sync: ${new Date(lastSync).toLocaleString()}` : "Trigger reindex"}
        className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-muted-strong hover:bg-surface-alt transition-colors"
      >
        <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
      </button>

      <ThemeToggle />

      <div className="flex items-center gap-2 pl-2 border-l border-border">
        <span
          className="h-8 w-8 rounded-full am-gradient text-white flex items-center justify-center text-xs font-bold"
          title="Signed in via Authentik SSO"
        >
          <User className="w-4 h-4" />
        </span>
      </div>
    </header>
  );
}
