import { getProject } from "@/lib/canned/active-projects";
import { cannedCharter } from "@/lib/canned/project-subtabs/charter";
import {
  SubtabChrome,
  resolveChromeHeader,
} from "@/components/project-dashboard/SubtabChrome";
import { Card, CardBody } from "@/components/ui/card";
import { DataSourceFootnote } from "@/components/project-dashboard/DataSourceFootnote";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decoded = decodeURIComponent(id);
  const project = getProject(decoded);
  const { jobNumber, jobName } = resolveChromeHeader(decoded, project);
  const contractValue = project?.budget.contract ?? 0;
  const data = cannedCharter({
    jobNumber,
    jobName,
    contractValue,
    pmName: project?.pm.name ?? "Unassigned",
  });

  return (
    <SubtabChrome
      projectId={decoded}
      jobNumber={jobNumber}
      jobName={jobName}
      active="charter"
      title="Project Charter"
      description="Signed charter, scope of work, stakeholders, deliverables, and risks."
    >
      <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            Contract Status
          </div>
          <div className="mt-1">
            <span className="inline-flex items-center rounded-full border bg-emerald-100 text-emerald-700 border-emerald-200 px-3 py-1 text-xs font-bold">
              {data.contractStatus}
            </span>
          </div>
        </div>
        <div className="text-xs text-slate-500">
          Derived from the A-Shop Project Charter template.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.sections.map((sec) => (
          <Card key={sec.heading}>
            <CardBody>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                {sec.heading}
              </div>
              {sec.lead ? (
                <p className="text-sm text-slate-600 leading-relaxed mb-3">{sec.lead}</p>
              ) : null}
              {sec.fields?.length ? (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  {sec.fields.map((f) => (
                    <div
                      key={f.label}
                      className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-1.5"
                    >
                      <dt className="text-slate-500 font-semibold">{f.label}</dt>
                      <dd className="text-slate-800 text-right">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {sec.paragraphs?.length ? (
                <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-700 mt-2">
                  {sec.paragraphs.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              ) : null}
            </CardBody>
          </Card>
        ))}
      </div>

      <DataSourceFootnote
        source="canned"
        note="Charter is a document artefact — Phase-2: surface signed PDF from document-management system."
      />
    </SubtabChrome>
  );
}
