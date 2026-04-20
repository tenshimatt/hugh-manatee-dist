import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { getPM, QUICK_LINKS } from "@/lib/canned/pms";
import { isLive, listScheduleLines, pctFromRaw } from "@/lib/erpnext-live";
import {
  ClipboardList,
  ChevronRight,
  FileText,
  Box,
  CalendarRange,
  DollarSign,
} from "lucide-react";
import { PMFormsRow } from "@/components/pm-dashboard/PMFormsRow";
import { BudgetChart } from "@/components/pm-dashboard/BudgetChart";

export default async function PMHome({ params }: { params: Promise<{ user: string }> }) {
  const { user } = await params;
  const pmCanned = getPM(user);
  if (!pmCanned) notFound();
  // Clone so we don't mutate the module-level canned data.
  const pm = { ...pmCanned, projects: pmCanned.projects.map((p) => ({ ...p })) };

  // Try to update progress on each of this PM's projects from live Schedule Lines.
  if (isLive()) {
    try {
      const ids = pm.projects.map((p) => p.id);
      const lines = await listScheduleLines(2000, [["job_id", "in", ids]]);
      if (lines.length) {
        const byJob = new Map<string, typeof lines>();
        for (const l of lines) {
          if (!l.job_id) continue;
          const arr = byJob.get(l.job_id);
          if (arr) arr.push(l);
          else byJob.set(l.job_id, [l]);
        }
        for (const p of pm.projects) {
          const rows = byJob.get(p.id);
          if (!rows || !rows.length) continue;
          const need = rows.reduce((a, r) => a + (r.qty_required ?? 0), 0);
          const done = rows.reduce((a, r) => a + (r.qty_completed ?? 0), 0);
          const pctQty = need > 0 ? Math.round((done / need) * 100) : null;
          const pctRaw = pctFromRaw(rows[0].jwm_raw_data);
          const pct = pctRaw ?? pctQty;
          if (pct !== null && Number.isFinite(pct)) p.progress = pct;
        }
      }
    } catch (e) {
      console.warn("[arch/pm] live fetch failed, using canned:", e);
    }
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const vsBadge = (vs: string) => {
    if (vs === "ahead") return <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" title="Ahead" />;
    if (vs === "behind") return <span className="inline-block w-3 h-3 rounded-full bg-red-500" title="Behind" />;
    return <span className="inline-block w-3 h-3 rounded-full bg-amber-400" title="On Track" />;
  };

  return (
    <div className="space-y-5">
      {/* Top bar: PM header + Active Projects tile */}
      <div className="flex items-stretch gap-4">
        <div className="flex-1 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#064162] text-white flex items-center justify-center font-bold text-2xl">
            {pm.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <div className="flex items-center gap-2 text-[#e69b40] text-xs font-bold uppercase tracking-widest">
              <ClipboardList className="w-4 h-4" /> PMO Dashboard — My Projects
            </div>
            <h1 className="text-3xl font-bold text-[#064162] tracking-tight">{pm.name}</h1>
            <p className="text-slate-500 text-sm">
              {pm.title} · <a className="underline" href={`mailto:${pm.email}`}>{pm.email}</a>
              {pm.phone ? ` · ${pm.phone}` : ""}
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-[#e69b40] text-white px-6 py-3 flex flex-col justify-center items-center shadow-sm">
          <div className="text-[11px] uppercase tracking-widest font-bold opacity-90">Active Projects</div>
          <div className="text-4xl font-bold leading-tight">{pm.projects.length}</div>
        </div>
      </div>

      {/* Projects Prioritized */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> Projects Prioritized
          </CardTitle>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr className="text-left">
                  <th className="py-2 pr-3">Project</th>
                  <th className="py-2 pr-3">Short Job ID</th>
                  <th className="py-2 pr-3">Project Links</th>
                  <th className="py-2 pr-3 w-48">Progress</th>
                  <th className="py-2 pr-3">%</th>
                  <th className="py-2 pr-3">VS</th>
                  <th className="py-2 pr-3">Start</th>
                  <th className="py-2 pr-3">End</th>
                  <th className="py-2 pr-3">Ship</th>
                </tr>
              </thead>
              <tbody>
                {pm.projects.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="py-2 pr-3">
                      <Link href={`/arch/projects/${p.id}`} className="font-semibold text-[#064162] hover:underline">
                        {p.jobName}
                      </Link>
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs text-slate-700">{p.id}</td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-2 text-xs">
                        {p.links.map((l) => (
                          <Link key={l.label} href={l.href} className="text-[#0a5480] hover:underline">
                            {l.label}
                          </Link>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 pr-3">
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#064162]"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-2 pr-3 font-semibold">{p.progress}%</td>
                    <td className="py-2 pr-3">{vsBadge(p.vs)}</td>
                    <td className="py-2 pr-3 text-slate-600">{p.start}</td>
                    <td className="py-2 pr-3 text-slate-600">{p.end}</td>
                    <td className="py-2 pr-3 text-slate-600">{p.ship}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Two-column: Quick Links + Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="w-4 h-4" /> Dashboard Quick Links
            </CardTitle>
          </CardHeader>
          <CardBody className="pt-0">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4 text-sm">
              {QUICK_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="flex items-center gap-1 text-[#0a5480] hover:underline"
                  >
                    <ChevronRight className="w-3 h-3 text-[#e69b40]" /> {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarRange className="w-4 h-4" /> Upcoming Tasks
            </CardTitle>
          </CardHeader>
          <CardBody className="pt-0">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr className="text-left">
                  <th className="py-2 pr-3">Due</th>
                  <th className="py-2 pr-3">Task</th>
                  <th className="py-2 pr-3">Project</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {pm.tasks.map((t, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-mono text-xs">{t.due}</td>
                    <td className="py-2 pr-3">{t.task}</td>
                    <td className="py-2 pr-3 font-mono text-xs text-slate-600">{t.project}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={
                          "inline-block text-xs font-semibold px-2 py-0.5 rounded-full " +
                          (t.status === "Blocked"
                            ? "bg-red-100 text-red-700"
                            : t.status === "In Progress"
                            ? "bg-blue-100 text-blue-700"
                            : t.status === "Review"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600")
                        }
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>

      {/* Forms row */}
      <PMFormsRow />

      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Budget Overview
          </CardTitle>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Stat label="Total Budget" value={fmt(pm.budget.total)} />
            <Stat label="Spent" value={fmt(pm.budget.spent)} tone="red" />
            <Stat label="Committed" value={fmt(pm.budget.committed)} tone="amber" />
            <Stat label="Remaining" value={fmt(pm.budget.remaining)} tone="emerald" />
          </div>
          <BudgetChart
            data={pm.projects.map((p) => ({
              name: p.id,
              budget: Math.round(pm.budget.total / pm.projects.length),
              spent: Math.round((pm.budget.spent / pm.projects.length) * (p.progress / 60)),
            }))}
          />
        </CardBody>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "navy",
}: {
  label: string;
  value: string;
  tone?: "navy" | "red" | "amber" | "emerald";
}) {
  const color =
    tone === "red"
      ? "text-red-600"
      : tone === "amber"
      ? "text-amber-600"
      : tone === "emerald"
      ? "text-emerald-600"
      : "text-[#064162]";
  return (
    <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
      <div className="text-[11px] uppercase tracking-widest font-bold text-slate-500">{label}</div>
      <div className={"text-2xl font-bold tabular-nums " + color}>{value}</div>
    </div>
  );
}
