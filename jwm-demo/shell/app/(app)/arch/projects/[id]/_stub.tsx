import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getProject } from "@/lib/canned/active-projects";
import { Card, CardBody } from "@/components/ui/card";

export function SubRouteStub({
  projectId,
  title,
  description,
}: {
  projectId: string;
  title: string;
  description: string;
}) {
  const project = getProject(decodeURIComponent(projectId));
  const label = project ? `${project.jobName} · ${project.id}` : projectId;

  return (
    <div className="space-y-5">
      <Link
        href={`/arch/projects/${encodeURIComponent(projectId)}`}
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#0A2E5C]"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Back to Project
      </Link>
      <header>
        <div className="text-[10px] uppercase tracking-[0.2em] text-[#C9A349] font-bold">
          {label}
        </div>
        <h1 className="text-3xl font-bold text-[#0A2E5C] tracking-tight">{title}</h1>
        <p className="text-slate-500 mt-1 max-w-2xl text-sm">{description}</p>
      </header>
      <Card>
        <CardBody className="py-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A349]/40 bg-[#C9A349]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#8a5716]">
            Coming soon
          </div>
          <p className="mt-4 text-slate-600 max-w-xl mx-auto text-sm">{description}</p>
        </CardBody>
      </Card>
    </div>
  );
}
