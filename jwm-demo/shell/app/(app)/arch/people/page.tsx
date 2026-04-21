/**
 * /arch/people — role-grouped people directory.
 *
 * Mirrors the per-person dashboard layout Chris already had in Smartsheet.
 * Each card → /arch/people/[role]/[slug].
 */
import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";
import { PEOPLE, ROLE_PLURAL, type RoleKey } from "@/lib/canned/people";

export const dynamic = "force-dynamic";

const ROLE_ORDER: RoleKey[] = ["manager", "precon", "fm", "fx", "office"];

export default function PeopleIndexPage() {
  const grouped = ROLE_ORDER.map((role) => ({
    role,
    label: ROLE_PLURAL[role],
    members: PEOPLE.filter((p) => p.role === role),
  })).filter((g) => g.members.length > 0);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-[#e69b40] text-xs font-bold uppercase tracking-widest">
          <Users className="w-4 h-4" /> Architectural · People
        </div>
        <h1 className="text-3xl font-bold text-[#064162] tracking-tight">
          Role-based dashboards
        </h1>
        <p className="text-slate-500 mt-1 max-w-3xl">
          One dashboard per person, grouped by role. Same shape as Chris&rsquo;s Smartsheet
          per-role boards — Field Managers, FX Designers, Precon Leaders, Sales/Precon
          Managers, Office Managers.
        </p>
      </header>

      {grouped.map((g) => (
        <section key={g.role}>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
            {g.label} · {g.members.length}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {g.members.map((p) => (
              <Link
                key={p.slug}
                href={`/arch/people/${p.role}/${p.slug}`}
                className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-[#064162]/40 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-[#064162] text-white flex items-center justify-center text-sm font-bold">
                    {p.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#064162] truncate">{p.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{p.title}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#064162]" />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  {p.metrics.slice(0, 4).map((m) => (
                    <div key={m.label} className="rounded bg-slate-50 px-2 py-1.5">
                      <div className="text-[9px] font-bold uppercase text-slate-400 truncate">{m.label}</div>
                      <div className="text-sm font-bold text-[#064162] tabular-nums">{m.value}</div>
                    </div>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
