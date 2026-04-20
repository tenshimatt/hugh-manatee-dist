/**
 * /engineering/routes/[id] — Route editor.
 * Server component fetches full route + renders interactive client editor.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CircleDot } from "lucide-react";
import { getRoute, statusBadgeClass } from "@/lib/routes";
import { RouteEditorClient } from "@/components/route/RouteEditorClient";

export const dynamic = "force-dynamic";

export default async function RouteEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, source } = await getRoute(decodeURIComponent(id));
  if (!data) notFound();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <Link
          href="/engineering/routes"
          className="text-sm text-sky-700 hover:text-sky-900 inline-flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Routes
        </Link>
      </div>

      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{data.route_name}</h1>
          <div className="flex items-center gap-2 mt-1 text-sm">
            <span className="font-mono text-slate-600">Job {data.job_id}</span>
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${statusBadgeClass(data.status)}`}>
              {data.status}
            </span>
          </div>
          {data.description && <p className="text-sm text-slate-700 mt-2 max-w-xl">{data.description}</p>}
        </div>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full border ${
            source === "live"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-600 border-slate-300"
          }`}
        >
          <CircleDot className="w-3 h-3 inline-block mr-1 -mt-0.5" />
          {source === "live" ? "Live ERPNext" : "Canned fallback"}
        </span>
      </div>

      <RouteEditorClient initialRoute={data} isLive={source === "live"} />

      {data.notes && (
        <section className="mt-6 p-4 rounded-lg border border-slate-200 bg-slate-50">
          <h2 className="text-sm font-semibold text-slate-800 mb-1">Notes</h2>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{data.notes}</p>
        </section>
      )}
    </div>
  );
}
