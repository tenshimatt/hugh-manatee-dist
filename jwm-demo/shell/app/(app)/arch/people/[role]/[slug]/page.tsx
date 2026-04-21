/**
 * /arch/people/[role]/[slug] — single-person dashboard.
 *
 * Reuses the layout pattern from /arch/pm/[user] but generalised: any role
 * gets KPI tiles + recent items + role-specific quick links.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, ArrowRight } from "lucide-react";
import { getPerson, ROLE_LABELS, type RoleKey } from "@/lib/canned/people";

export const dynamic = "force-dynamic";

export default async function PersonDashboardPage({
  params,
}: {
  params: Promise<{ role: string; slug: string }>;
}) {
  const { role, slug } = await params;
  const person = getPerson(decodeURIComponent(slug));
  if (!person || person.role !== (decodeURIComponent(role) as RoleKey)) notFound();

  return (
    <div className="space-y-5 max-w-6xl">
      <Link href="/arch/people" className="inline-flex items-center gap-2 text-[#064162] font-semibold hover:underline text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to People
      </Link>

      {/* Hero */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-3 bg-[#064162] text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Users className="w-4 h-4" /> {ROLE_LABELS[person.role]}
        </div>
        <div className="p-6 flex items-center gap-4">
          <span className="w-14 h-14 rounded-full bg-[#064162] text-white flex items-center justify-center text-xl font-bold ring-4 ring-[#fdf2e3]">
            {person.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-[#064162] tracking-tight">{person.name}</h1>
            <div className="text-sm text-slate-500 mt-0.5">{person.title}</div>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {person.metrics.map((m) => {
          const color =
            m.tone === "navy" ? "text-[#064162]" :
            m.tone === "gold" ? "text-[#e69b40]" :
            m.tone === "green" ? "text-emerald-700" :
            m.tone === "amber" ? "text-amber-700" :
            m.tone === "red" ? "text-rose-700" :
            "text-slate-700";
          return (
            <div key={m.label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{m.label}</div>
              <div className={`mt-0.5 text-2xl font-bold tabular-nums ${color}`}>{m.value}</div>
              {m.sub && <div className="text-[11px] text-slate-500 mt-0.5">{m.sub}</div>}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recent */}
        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="px-4 py-2 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Recent</h2>
          </header>
          <div className="p-4 space-y-2">
            {person.recent.length === 0 && (
              <div className="text-sm text-slate-500 text-center py-6">Nothing recent.</div>
            )}
            {person.recent.map((r) => (
              <Link
                key={r.id}
                href={r.href || "#"}
                className="flex items-start justify-between gap-3 px-3 py-2 rounded-lg border border-slate-200 hover:border-[#064162]/40 hover:bg-[#fdf2e3]/40"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[#064162]">{r.title}</div>
                  {r.meta && <div className="text-[11px] text-slate-500 mt-0.5">{r.meta}</div>}
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="px-4 py-2 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Quick Links</h2>
          </header>
          <div className="p-2">
            {person.links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-[#fdf2e3]/60 hover:text-[#064162]"
              >
                {l.label}
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
