import { Card, CardBody } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export function SectionStub({
  eyebrow,
  title,
  description,
  phase = "Phase 2",
  icon: Icon,
  note,
}: {
  eyebrow: string;
  title: string;
  description: string;
  phase?: string;
  icon: LucideIcon;
  note?: string;
}) {
  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-center gap-2 text-[#e69b40] text-xs font-bold uppercase tracking-widest">
          <Icon className="w-4 h-4" /> {eyebrow}
        </div>
        <h1 className="text-3xl font-bold text-[#064162] tracking-tight">{title}</h1>
        <p className="text-slate-500 mt-1 max-w-2xl">{description}</p>
      </header>
      <Card>
        <CardBody className="py-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e69b40]/40 bg-[#e69b40]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#b37420]">
            Coming in {phase}
          </div>
          <p className="mt-4 text-slate-600 max-w-xl mx-auto">{description}</p>
          {note && (
            <p className="mt-3 text-xs text-slate-400 italic max-w-xl mx-auto">{note}</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
