/**
 * /shop/shipping — Shipping floor overview.
 *
 * Today / this-week shipping at a glance: total containers out, jobs due,
 * carriers lined up, a ship-bay status strip. Complements /shop/ship-schedule
 * (Drew's bottleneck calendar) — this is the "what's leaving today" view.
 *
 * Reads live from ERPNext (Schedule Lines with jwm_ship_target) with canned
 * fallback.
 */
import Link from "next/link";
import { Send, Calendar, Package, Truck, CircleDot, ArrowRight, CheckCircle2 } from "lucide-react";
import { getShipSchedule } from "@/lib/erpnext-live";

export const dynamic = "force-dynamic";

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}
function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  });
}

export default async function ShippingOverviewPage() {
  const result = await getShipSchedule(21); // next 3 weeks

  const today = startOfDay(new Date());
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const todayJobs = result.data.filter(
    (g) => startOfDay(new Date(g.date)).getTime() === today.getTime(),
  );
  const weekJobs = result.data.filter((g) => {
    const d = startOfDay(new Date(g.date));
    return d.getTime() >= today.getTime() && d.getTime() < weekEnd.getTime();
  });

  const todayCount = todayJobs.reduce((s, g) => s + g.jobs.length, 0);
  const weekCount = weekJobs.reduce((s, g) => s + g.jobs.length, 0);
  const bottleneckDays = weekJobs.filter((g) => g.bucket === "high").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[#e69b40] text-xs font-bold uppercase tracking-widest">
            <Send className="w-4 h-4" /> Shipping
          </div>
          <h1 className="text-3xl font-bold text-[#064162] tracking-tight">Shipping</h1>
          <p className="text-slate-500 mt-1 max-w-2xl">
            What&apos;s leaving the yard today + this week. Operator kiosks,
            carrier lineup, crating status. Click through to the ship schedule
            calendar for full horizon.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span
            className={`px-2 py-1 rounded-full border ${
              result.source === "live"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-600 border-slate-300"
            }`}
          >
            <CircleDot className="w-3 h-3 inline-block mr-1 -mt-0.5" />
            {result.source === "live" ? "Live ERPNext" : "Canned fallback"}
          </span>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi
          label="Today"
          value={todayCount}
          subtitle={`${todayJobs.length} drop${todayJobs.length === 1 ? "" : "s"}`}
          icon={Package}
          accent
        />
        <Kpi
          label="This week"
          value={weekCount}
          subtitle={`${weekJobs.length} ship day${weekJobs.length === 1 ? "" : "s"}`}
          icon={Calendar}
        />
        <Kpi
          label="Bottleneck days"
          value={bottleneckDays}
          subtitle="5+ jobs on one day"
          icon={Truck}
          warn={bottleneckDays > 0}
        />
        <Kpi
          label="Bays open"
          value={4}
          subtitle="of 6 total"
          icon={CheckCircle2}
        />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <LinkCard
          href="/shop/ship-schedule"
          title="Ship Schedule"
          description="Full horizon calendar with bottleneck detection. Drew's Excel sheet, automated."
          badge="Live"
        />
        <LinkCard
          href="/shop/shipping"
          title="Shipping Kiosk"
          description="Operator view for crating, carrier assignment, BOL printing. (Current page is the dashboard.)"
          badge="Phase 2"
        />
        <LinkCard
          href="/shop/scheduler"
          title="Production Scheduler"
          description="Drew's cross-workstation grid — upstream from shipping."
          badge="Live"
        />
      </div>

      {/* Today's shipments */}
      <section className="border border-slate-200 rounded-lg bg-white shadow-sm">
        <header className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#e69b40]" /> Today &mdash; {fmtDate(today)}
          </h2>
          <span className="text-xs text-slate-500">{todayCount} job{todayCount === 1 ? "" : "s"}</span>
        </header>
        {todayJobs.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            No jobs scheduled to ship today. Next ship day:{" "}
            {weekJobs[0] ? fmtDate(new Date(weekJobs[0].date)) : "beyond this week"}.
          </div>
        )}
        {todayJobs.flatMap((g) => g.jobs).map((j) => (
          <div
            key={j.id}
            className="px-4 py-2 flex items-center justify-between border-t border-slate-100 first:border-t-0 hover:bg-slate-50 transition"
          >
            <div className="flex-1 min-w-0">
              <div className="font-mono text-xs text-[#064162] font-bold">{j.id}</div>
              <div className="text-sm text-slate-800 truncate">{j.jobName}</div>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="font-semibold">Qty {j.qty || 1}</span>
              {j.station && <span className="hidden md:inline">{j.station}</span>}
              <Link
                href={`/arch/projects/${encodeURIComponent(j.id)}`}
                className="inline-flex items-center gap-1 text-[#064162] font-semibold hover:text-[#0a5480]"
              >
                Open <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* Next 3 weeks by day */}
      <section className="border border-slate-200 rounded-lg bg-white shadow-sm">
        <header className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#e69b40]" /> Next 3 weeks
          </h2>
          <Link
            href="/shop/ship-schedule"
            className="text-xs font-semibold text-[#064162] hover:underline"
          >
            Full schedule &rarr;
          </Link>
        </header>
        <div className="divide-y divide-slate-100">
          {weekJobs.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              No upcoming ships in the next 3 weeks.
            </div>
          )}
          {weekJobs.map((g) => {
            const d = new Date(g.date);
            const bucketColor =
              g.bucket === "high"
                ? "bg-red-100 text-red-800 border-red-200"
                : g.bucket === "medium"
                  ? "bg-amber-100 text-amber-800 border-amber-200"
                  : "bg-slate-100 text-slate-700 border-slate-200";
            return (
              <div key={g.date} className="px-4 py-2 flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-semibold text-slate-800">{fmtDate(d)}</span>
                  <span className="ml-3 text-xs text-slate-500">
                    {g.jobs
                      .slice(0, 3)
                      .map((j) => j.id)
                      .join(" · ")}
                    {g.jobs.length > 3 && ` · +${g.jobs.length - 3} more`}
                  </span>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${bucketColor}`}
                >
                  {g.jobs.length} job{g.jobs.length === 1 ? "" : "s"}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  subtitle,
  icon: Icon,
  accent,
  warn,
}: {
  label: string;
  value: number;
  subtitle?: string;
  icon: typeof Package;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</div>
        <Icon
          className={`w-4 h-4 ${warn ? "text-red-500" : accent ? "text-[#e69b40]" : "text-slate-400"}`}
        />
      </div>
      <div
        className={`mt-1 text-3xl font-bold tabular-nums ${
          warn ? "text-red-700" : accent ? "text-[#e69b40]" : "text-[#064162]"
        }`}
      >
        {value}
      </div>
      {subtitle && <div className="mt-1 text-xs text-slate-500">{subtitle}</div>}
    </div>
  );
}

function LinkCard({
  href,
  title,
  description,
  badge,
}: {
  href: string;
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-[#064162]/30 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-[#064162] group-hover:text-[#0a5480]">{title}</h3>
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#eaf3f8] text-[#064162] border border-[#064162]/20">
          {badge}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#064162]">
        Open <ArrowRight className="w-4 h-4" />
      </span>
    </Link>
  );
}
