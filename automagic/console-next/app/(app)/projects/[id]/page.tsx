import { api } from "@/lib/api";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, FolderKanban, FileAudio } from "lucide-react";
import { notFound } from "next/navigation";
import { formatRelative } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATE_GROUPS: Array<{ key: string; label: string; tone: "sky" | "teal" | "gold" | "slate" }> = [
  { key: "backlog", label: "Backlog", tone: "slate" },
  { key: "unstarted", label: "To Do", tone: "gold" },
  { key: "started", label: "In Progress", tone: "sky" },
  { key: "completed", label: "Done", tone: "teal" },
  { key: "cancelled", label: "Cancelled", tone: "slate" },
];

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await api.project(id);
  if (!data) notFound();

  const { project, issues, transcriptions } = data;
  const issuesByGroup: Record<string, typeof issues> = {};
  for (const i of issues) {
    (issuesByGroup[i.state_group] ||= []).push(i);
  }

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
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted flex-wrap">
              {project.identifier && (
                <Badge tone="slate" className="font-mono">{project.identifier}</Badge>
              )}
              <span>{issues.length} issues</span>
              {transcriptions.length > 0 && (
                <>
                  <span>·</span>
                  <span>{transcriptions.length} linked voice note{transcriptions.length === 1 ? "" : "s"}</span>
                </>
              )}
            </div>
          </div>
        </div>
        {project.description && (
          <p className="mt-4 text-sm text-muted-strong">{project.description}</p>
        )}
      </header>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {STATE_GROUPS.map((group) => {
          const items = issuesByGroup[group.key] || [];
          return (
            <div key={group.key} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <Badge tone={group.tone}>{group.label}</Badge>
                <span className="text-xs text-muted tabular-nums">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.length === 0 && (
                  <div className="text-xs text-muted italic px-2 py-3">Empty</div>
                )}
                {items.map((i) => (
                  <Card key={i.id} className="am-fade-in">
                    <CardBody className="p-3">
                      <div className="text-xs font-medium text-foreground leading-snug line-clamp-3">
                        {i.name}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-muted">
                        <span className="font-mono">#{i.sequence_id}</span>
                        {i.priority && i.priority !== "none" && (
                          <>
                            <span>·</span>
                            <Badge tone={i.priority === "urgent" || i.priority === "high" ? "gold" : "slate"} className="py-0 text-[9px]">
                              {i.priority}
                            </Badge>
                          </>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Linked transcriptions */}
      {transcriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Voice notes in this project folder</CardTitle>
          </CardHeader>
          <CardBody className="px-0">
            <ul className="divide-y divide-border">
              {transcriptions.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/transcriptions/${t.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-surface-alt transition-colors"
                  >
                    <FileAudio className="w-4 h-4 text-sky-brand flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground truncate">{t.title}</div>
                      <div className="text-[11px] text-muted">
                        {t.date} {t.time} · {formatRelative(`${t.date}T${t.time}:00`)}
                      </div>
                    </div>
                    {t.classification && (
                      <Badge tone="teal" className="text-[10px]">{t.classification}</Badge>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
