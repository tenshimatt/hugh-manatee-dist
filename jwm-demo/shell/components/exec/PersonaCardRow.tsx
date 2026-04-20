/**
 * Role-grouped dashboard links (Precon Leaders, Sales Managers, Office Managers).
 */
import Link from "next/link";
import { User } from "lucide-react";

export interface PersonaCard {
  name: string;
  role?: string;
  href: string;
}

export interface PersonaCardRowProps {
  title: string;
  subtitle?: string;
  cards: PersonaCard[];
  accent?: "sky" | "violet" | "amber";
}

const accentMap = {
  sky: "border-sky-200 hover:border-sky-400 hover:bg-sky-50/50",
  violet: "border-violet-200 hover:border-violet-400 hover:bg-violet-50/50",
  amber: "border-amber-200 hover:border-amber-400 hover:bg-amber-50/50",
};

export function PersonaCardRow({ title, subtitle, cards, accent = "sky" }: PersonaCardRowProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-800 mb-0.5">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mb-2">{subtitle}</p>}
      <div className="grid gap-2">
        {cards.map((c) => (
          <Link
            key={c.name}
            href={c.href}
            className={`flex items-center gap-3 px-3 py-2 bg-white rounded-md border transition ${accentMap[accent]}`}
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <User className="w-4 h-4 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">{c.name}</div>
              {c.role && <div className="text-[11px] text-slate-500 truncate">{c.role}</div>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
