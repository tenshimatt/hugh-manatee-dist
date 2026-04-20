import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { listPMs } from "@/lib/canned/pms";
import { ClipboardList, ArrowRight, Briefcase } from "lucide-react";

export default function ArchPMPage() {
  const pms = listPMs();
  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-center gap-2 text-[#e69b40] text-xs font-bold uppercase tracking-widest">
          <ClipboardList className="w-4 h-4" /> Architectural · Project Managers
        </div>
        <h1 className="text-3xl font-bold text-[#064162] tracking-tight">Project Managers</h1>
        <p className="text-slate-500 mt-1 max-w-2xl">
          Each PM has a dashboard mirroring their Smartsheet &ldquo;My Projects&rdquo; home: active projects,
          quick links, forms, upcoming tasks, and budget overview.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pms.map((pm) => (
          <Link key={pm.slug} href={`/arch/pm/${pm.slug}`} className="block group">
            <Card className="hover:border-[#064162] hover:shadow-md transition">
              <CardBody className="pt-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#064162] text-white flex items-center justify-center font-bold text-lg">
                  {pm.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1">
                  <div className="text-lg font-bold text-[#064162] group-hover:underline">{pm.name}</div>
                  <div className="text-sm text-slate-500">{pm.title}</div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                    <Briefcase className="w-3 h-3" />
                    {pm.projects.length} active projects
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#e69b40]" />
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
