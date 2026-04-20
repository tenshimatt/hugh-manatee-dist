/**
 * EmbeddedRoutePipeline — server component wrapper that fetches a route by
 * job_id and renders the compact pipeline for dashboards.
 *
 * Silent when no route is found (canned + live both empty) so dashboards
 * don't show a broken tile.
 */
import Link from "next/link";
import { GitBranch, ChevronRight } from "lucide-react";
import { listRoutes, getRoute, statusBadgeClass } from "@/lib/routes";
import { RoutePipeline } from "./RoutePipeline";

export async function EmbeddedRoutePipeline({ jobId }: { jobId: string }) {
  // Try direct name variants, then list + match by job_id.
  const candidateNames = [`ROUTE-${jobId}`, jobId];
  let route: Awaited<ReturnType<typeof getRoute>>["data"] | null = null;
  let source: "live" | "canned" = "canned";

  for (const n of candidateNames) {
    const r = await getRoute(n);
    if (r.data) {
      route = r.data;
      source = r.source;
      break;
    }
  }
  if (!route) {
    const list = await listRoutes();
    const match = list.data.find((r) => r.job_id === jobId);
    if (match) {
      const r = await getRoute(match.name);
      route = r.data;
      source = r.source;
    }
  }

  if (!route) return null;

  return (
    <section className="border border-slate-200 rounded-lg bg-white shadow-sm">
      <header className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-sky-600" /> Route
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadgeClass(route.status)}`}>
            {route.status}
          </span>
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
              source === "live"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-500 border-slate-300"
            }`}
          >
            {source}
          </span>
        </h2>
        <Link
          href={`/engineering/routes/${encodeURIComponent(route.name)}`}
          className="text-xs font-semibold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1"
        >
          {route.name}
          <ChevronRight className="w-3 h-3" />
        </Link>
      </header>
      <RoutePipeline steps={route.steps} variant="compact" />
    </section>
  );
}

export default EmbeddedRoutePipeline;
