import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Wallet,
  FileEdit,
  FilePlus,
  TrendingUp,
  Factory,
  ScrollText,
  CalendarDays,
  Receipt,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SubtabKey =
  | "budget"
  | "cor-budget"
  | "cors"
  | "forecast"
  | "production"
  | "charter"
  | "project-schedule"
  | "sov";

type TabDef = { key: SubtabKey; href: string; label: string; icon: LucideIcon };

function tabs(projectId: string): TabDef[] {
  const enc = encodeURIComponent(projectId);
  return [
    { key: "budget",           href: `/arch/projects/${enc}/budget`,           label: "Budget",                icon: Wallet },
    { key: "cor-budget",       href: `/arch/projects/${enc}/cor-budget`,       label: "Change Order Budget",   icon: FilePlus },
    { key: "cors",             href: `/arch/projects/${enc}/cors`,             label: "Change Order Log",      icon: FileEdit },
    { key: "forecast",         href: `/arch/projects/${enc}/forecast`,         label: "Forecast",              icon: TrendingUp },
    { key: "production",       href: `/arch/projects/${enc}/production`,       label: "Production",            icon: Factory },
    { key: "charter",          href: `/arch/projects/${enc}/charter`,          label: "Project Charter",       icon: ScrollText },
    { key: "project-schedule", href: `/arch/projects/${enc}/project-schedule`, label: "Project Schedule",      icon: CalendarDays },
    { key: "sov",              href: `/arch/projects/${enc}/sov`,              label: "SOV",                   icon: Receipt },
  ];
}

export function SubtabChrome({
  projectId,
  jobNumber,
  jobName,
  active,
  title,
  description,
  children,
}: {
  projectId: string;
  jobNumber: string;
  jobName: string;
  active: SubtabKey;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const enc = encodeURIComponent(projectId);
  const ts = tabs(projectId);

  return (
    <div className="space-y-5">
      <Link
        href={`/arch/projects/${enc}`}
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#0A2E5C]"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Back to Project
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#C9A349] font-bold">
            {jobNumber} · {jobName}
          </div>
          <h1 className="text-3xl font-bold text-[#0A2E5C] tracking-tight">{title}</h1>
          {description ? (
            <p className="text-slate-500 mt-1 max-w-2xl text-sm">{description}</p>
          ) : null}
        </div>
      </header>

      <nav
        aria-label="Project sub-sections"
        className="bg-white border border-slate-200 rounded-xl p-1 overflow-x-auto"
      >
        <ul className="flex gap-1 min-w-max">
          {ts.map((t) => {
            const isActive = t.key === active;
            const Icon = t.icon;
            return (
              <li key={t.key}>
                <Link
                  href={t.href}
                  aria-current={isActive ? "page" : undefined}
                  className={
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors " +
                    (isActive
                      ? "bg-[#0A2E5C] text-white shadow-sm"
                      : "text-slate-600 hover:bg-[#eaf3f8] hover:text-[#0A2E5C]")
                  }
                >
                  <Icon className={"w-3.5 h-3.5 " + (isActive ? "text-[#C9A349]" : "text-[#C9A349]")} />
                  <span>{t.label}</span>
                  {!isActive ? <ChevronRight className="w-3 h-3 text-slate-300" /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div>{children}</div>
    </div>
  );
}

/** Helper: pull canned project by id; defaults the chrome header even if
 *  the id is unknown (live flavoured URLs can have job ids that aren't seeded). */
export function resolveChromeHeader(
  projectId: string,
  project: { jobNumber?: string; jobName?: string } | undefined,
) {
  const jobNumber = project?.jobNumber || projectId.split("-")[0] || projectId;
  const jobName = project?.jobName || "JWM Project";
  return { jobNumber, jobName };
}
