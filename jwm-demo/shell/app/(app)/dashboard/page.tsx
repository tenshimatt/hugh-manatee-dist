import { KpiCard, type KpiData } from "@/components/dashboard/KpiCard";
import { DivisionMix, WeeklyChart } from "@/components/dashboard/Charts";
import { AnomalyCard } from "@/components/dashboard/AnomalyCard";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import kpisJson from "@/lib/canned/kpis.json";
import anomaly from "@/lib/canned/anomaly.json";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function loadKpis(): Promise<typeof kpisJson & { source?: string }> {
  try {
    const h = await headers();
    const host = h.get("host") || "localhost:3100";
    const proto = h.get("x-forwarded-proto") || "http";
    const res = await fetch(`${proto}://${host}/api/kpis`, { cache: "no-store" });
    if (res.ok) return (await res.json()) as typeof kpisJson & { source?: string };
  } catch (e) {
    console.warn("[dashboard] kpi fetch failed, using canned:", e);
  }
  return { ...kpisJson, source: "canned" } as typeof kpisJson & { source?: string };
}

const kpiIconBadge = (kind: string) => {
  switch (kind) {
    case "WO_RELEASED":
      return { tone: "bg-emerald-50 text-emerald-700", label: "WO Released" };
    case "NCR_RAISED":
      return { tone: "bg-red-50 text-red-700", label: "NCR" };
    case "WO_COMPLETE":
      return { tone: "bg-[#eaf3f8] text-[#064162]", label: "WO Complete" };
    case "RMA_CREATED":
      return { tone: "bg-amber-50 text-amber-700", label: "RMA" };
    default:
      return { tone: "bg-slate-100 text-slate-700", label: kind };
  }
};

export default async function DashboardPage() {
  const data = await loadKpis();

  // Greeting + "as of" compute at request time so the dashboard always looks
  // fresh on the day of the demo. If kpis.json has a recent as_of (< 1 hour
  // old) we trust it; otherwise we render "now" (the canned snapshot was
  // captured last week but the page is otherwise live-ish).
  const now = new Date();
  const cannedAsOf = new Date(data.as_of);
  const asOf = now.getTime() - cannedAsOf.getTime() < 60 * 60 * 1000 ? cannedAsOf : now;
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold text-[#064162] tracking-tight">
            {greeting}, Chris.
          </h1>
          <p className="text-slate-500 mt-1">
            Here&apos;s what&apos;s moving on the shop floor today.
          </p>
        </div>
        <div className="text-xs text-slate-400">
          As of {asOf.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago" })} CDT
        </div>
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {data.kpis.map((k) => (
          <KpiCard key={k.key} k={k as KpiData} />
        ))}
      </div>

      {/* Anomaly banner */}
      <AnomalyCard anomaly={anomaly} />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Division mix (by active WO value)</CardTitle>
          </CardHeader>
          <CardBody>
            <DivisionMix data={data.division_mix} />
          </CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly completed vs scheduled</CardTitle>
          </CardHeader>
          <CardBody>
            <WeeklyChart data={data.weekly} />
          </CardBody>
        </Card>
      </div>

      {/* Activity feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardBody>
          <ul className="divide-y divide-slate-100">
            {data.activity.map((a) => {
              const b = kpiIconBadge(a.kind);
              return (
                <li key={a.id} className="flex items-start gap-3 py-3">
                  <span
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wide flex-shrink-0 ${b.tone}`}
                  >
                    {b.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-800">{a.text}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {a.actor} ·{" "}
                      {new Date(a.at).toLocaleString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
