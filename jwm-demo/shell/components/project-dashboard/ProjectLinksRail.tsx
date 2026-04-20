import Link from "next/link";
import {
  Wallet,
  FileEdit,
  FilePlus,
  TrendingUp,
  Factory,
  ScrollText,
  Calculator,
  ClipboardList,
  CalendarDays,
  Receipt,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function ProjectLinksRail({ projectId }: { projectId: string }) {
  const enc = encodeURIComponent(projectId);
  const links: { href: string; label: string; icon: LucideIcon }[] = [
    { href: `/arch/projects/${enc}/budget`, label: "Budget", icon: Wallet },
    { href: `/arch/projects/${enc}/cor-budget`, label: "Change Order Budget", icon: FilePlus },
    { href: `/arch/projects/${enc}/cors`, label: "Change Order Request Log", icon: FileEdit },
    { href: `/arch/projects/${enc}/forecast`, label: "Forecast", icon: TrendingUp },
    { href: `/arch/projects/${enc}/production`, label: "Production", icon: Factory },
    { href: `/arch/projects/${enc}/charter`, label: "Project Charter", icon: ScrollText },
    { href: `/arch/projects/${enc}/project-schedule`, label: "Project Schedule", icon: CalendarDays },
    { href: `/arch/projects/${enc}/sov`, label: "SOV", icon: Receipt },
    { href: `/arch/projects/${enc}/rom`, label: "ROM", icon: Calculator },
    { href: `/arch/projects/${enc}/field-daily`, label: "Field Daily Report", icon: ClipboardList },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-2 pb-2">
        Project Links
      </div>
      <ul className="space-y-0.5">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                className="flex items-center gap-2 px-2 py-2 text-xs rounded-lg text-slate-700 hover:bg-[#eaf3f8] hover:text-[#0A2E5C] transition-colors group"
              >
                <Icon className="w-3.5 h-3.5 text-[#C9A349]" />
                <span className="flex-1 truncate font-medium">{l.label}</span>
                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-[#0A2E5C]" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
