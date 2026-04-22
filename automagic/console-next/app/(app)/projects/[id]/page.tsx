import { api } from "@/lib/api";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ArrowLeft,
  FolderKanban,
  FileAudio,
  ExternalLink,
  Circle,
} from "lucide-react";
import { notFound } from "next/navigation";
import {
  formatRelative,
  toPlaneIssueUrl,
  toPlaneProjectUrl,
  toObsidianUri,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATE_TONE: Record<string, "sky" | "teal" | "gold" | "slate"> = {
  backlog: "slate",
  unstarted: "gold",
  started: "sky",
  completed: "teal",
  cancelled: "slate",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await api.project(id);
  if (!data) notFound();

  const { project, issues, transcriptions, links } = data;
  const projectPlaneUrl = toPlaneProjectUrl(project.id);

  // Build a map: issue_id → transcription[] (best confidence first)
  const tById = new Map(transcriptions.map((t) => [t.id, t]));
  const issueToTranscripts: Record<string, { t: (typeof transcriptions)[number]; confidence: number }[]> = {};
  for (const l of links) {
    const t = tById.get(l.transcription_id);
    if (!t) continue;
    (issueToTranscripts[l.issue_id] ||= []).push({ t, confidence: l.confidence });
  }
  for (const k in issueToTranscripts) {
    issueToTranscripts[k].sort((a, b) => b.confidence - a.confidence);
  }

  // Voice notes in this project folder that link to no issue here
  const linkedTIds = new Set(links.map((l) => l.transcription_id));
  const orphanTranscripts = transcriptions.filter((t) => !linkedTIds.has(t.id));

  return (
    <div className="space-y-6">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-strong hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to projects
      </Link>

      <header>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-brand-50 text-teal-brand-600 flex items-center justify-center flex-shrink-0">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
              {project.identifier && (
                <Badge tone="slate" className="font-mono">{project.identifier}</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted flex-wrap">
              <span>{issues.length} issues</span>
              {transcriptions.length > 0 && (
                <>
                  <span>·</span>
                  <span>{transcriptions.length} voice note{transcriptions.length === 1 ? "" : "s"}</span>
                </>
              )}
              {links.length > 0 && (
                <>
                  <span>·</span>
                  <span>{links.length} correlation{links.length === 1 ? "" : "s"}</span>
                </>
              )}
            </div>
          </div>
          {projectPlaneUrl && (
            <a
              href={projectPlaneUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl bg-sky-brand text-white text-sm font-semibold hover:bg-sky-brand-600 flex-shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in Plane
            </a>
          )}
        </div>
        {project.description && (
          <p className="mt-4 text-sm text-muted-strong">{project.description}</p>
        )}
      </header>

      {/* Issues list with linked voice notes per issue */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Issues</CardTitle>
          <span className="text-xs text-muted">Sorted by status · click to open in Plane</span>
        </CardHeader>
        <CardBody className="px-0">
          {issues.length === 0 ? (
            <div className="px-5 py-6 text-sm text-muted text-center">No issues in this project.</div>
          ) : (
            <ul className="divide-y divide-border">
              {issues.map((i) => {
                const linked = issueToTranscripts[i.id] || [];
                const issueUrl = toPlaneIssueUrl(i.project_id, i.id);
                const tone = STATE_TONE[i.state_group] || "slate";
                return (
                  <li key={i.id} className="px-5 py-3">
                    <div className="flex items-start gap-3">
                      <Circle className={`w-2.5 h-2.5 mt-1.5 flex-shrink-0 fill-current text-${tone === "sky" ? "sky-brand" : tone === "teal" ? "teal-brand" : tone === "gold" ? "gold-brand" : "muted"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {issueUrl ? (
                            <a
                              href={issueUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-foreground hover:text-sky-brand-600 hover:underline"
                            >
                              {i.name}
                            </a>
                          ) : (
                            <span className="text-sm font-medium text-foreground">{i.name}</span>
                          )}
                          <span className="text-[10px] font-mono text-muted">#{i.sequence_id}</span>
                        </div>
                        {linked.length > 0 && (
                          <ul className="mt-1.5 ml-1 space-y-0.5 border-l-2 border-sky-brand/30 pl-3">
                            {linked.map(({ t, confidence }) => {
                              const obsidianUri = toObsidianUri(t.filepath);
                              return (
                                <li key={t.id} className="flex items-center gap-2 text-[12px] group">
                                  <FileAudio className="w-3 h-3 text-sky-brand-600 flex-shrink-0" />
                                  <Link
                                    href={`/transcriptions/${t.id}`}
                                    className="text-muted-strong hover:text-sky-brand-600 hover:underline truncate"
                                  >
                                    {t.title}
                                  </Link>
                                  <span className="text-[10px] text-muted shrink-0" title={`Correlation confidence ${(confidence * 100).toFixed(0)}%`}>
                                    {(confidence * 100).toFixed(0)}%
                                  </span>
                                  {obsidianUri && (
                                    <a
                                      href={obsidianUri}
                                      className="text-muted hover:text-sky-brand-600 shrink-0 opacity-0 group-hover:opacity-100"
                                      title="Open in Obsidian"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                      <Badge tone={tone} className="text-[10px] flex-shrink-0">{i.state_name}</Badge>
                      {i.priority && i.priority !== "none" && (
                        <Badge
                          tone={i.priority === "urgent" || i.priority === "high" ? "gold" : "slate"}
                          className="py-0 text-[10px] flex-shrink-0"
                        >
                          {i.priority}
                        </Badge>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* Project-folder transcriptions not yet linked to any issue here */}
      {orphanTranscripts.length > 0 && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Voice notes in this folder, not yet tied to an issue</CardTitle>
            <span className="text-xs text-muted">{orphanTranscripts.length}</span>
          </CardHeader>
          <CardBody className="px-0">
            <ul className="divide-y divide-border">
              {orphanTranscripts.map((t) => {
                const obsidianUri = toObsidianUri(t.filepath);
                return (
                  <li key={t.id} className="px-5 py-3 flex items-center gap-3 group hover:bg-surface-alt">
                    <FileAudio className="w-4 h-4 text-sky-brand flex-shrink-0" />
                    <Link
                      href={`/transcriptions/${t.id}`}
                      className="min-w-0 flex-1 block"
                    >
                      <div className="text-sm font-medium text-foreground truncate group-hover:text-sky-brand-600">
                        {t.title}
                      </div>
                      <div className="text-[11px] text-muted">
                        {t.date} {t.time} · {formatRelative(`${t.date}T${t.time}:00`)}
                      </div>
                    </Link>
                    {obsidianUri && (
                      <a
                        href={obsidianUri}
                        className="p-1 rounded text-muted hover:text-sky-brand-600"
                        title="Open in Obsidian"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
