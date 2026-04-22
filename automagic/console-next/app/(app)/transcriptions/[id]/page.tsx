import { api, parseTags } from "@/lib/api";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, FileAudio, FolderKanban, Tag, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toObsidianUri, toPlaneIssueUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TranscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await api.transcription(id);
  if (!t) notFound();

  const tags = parseTags(t.tags);
  const domainTags = tags.filter((x) => x !== "voice-note" && x !== "plaud");

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/transcriptions"
        className="inline-flex items-center gap-1 text-sm text-muted-strong hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to transcriptions
      </Link>

      <header>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-brand-50 text-sky-brand-600 flex items-center justify-center flex-shrink-0">
            <FileAudio className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {t.date} {t.time}
              </span>
              {t.duration_mins !== null && (
                <>
                  <span>·</span>
                  <span>{t.duration_mins} minutes</span>
                </>
              )}
              {t.project_folder && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <FolderKanban className="w-3.5 h-3.5" />
                    {t.project_folder}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {domainTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Tag className="w-4 h-4 text-muted" />
          {domainTags.map((tag) => (
            <Badge key={tag} tone="sky">#{tag}</Badge>
          ))}
        </div>
      )}

      {t.executive_summary && (
        <Card className="am-fade-in">
          <CardHeader>
            <CardTitle>Executive summary</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {t.executive_summary}
            </p>
          </CardBody>
        </Card>
      )}

      <Card className="am-fade-in">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>File</CardTitle>
          {toObsidianUri(t.filepath) && (
            <a
              href={toObsidianUri(t.filepath) || "#"}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-sky-brand text-white text-xs font-semibold hover:bg-sky-brand-600"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in Obsidian
            </a>
          )}
        </CardHeader>
        <CardBody>
          <code className="text-xs text-muted-strong bg-surface-alt px-2 py-1 rounded break-all">
            {t.filepath}
          </code>
          {t.file_size_bytes > 0 && (
            <div className="text-xs text-muted mt-2">
              {(t.file_size_bytes / 1024).toFixed(1)} KB
            </div>
          )}
        </CardBody>
      </Card>

      {t.linked_issues && t.linked_issues.length > 0 && (
        <Card className="am-fade-in">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Linked Plane issues</CardTitle>
            <span className="text-xs text-muted">{t.linked_issues.length} linked</span>
          </CardHeader>
          <CardBody className="px-0">
            <ul className="divide-y divide-border">
              {t.linked_issues.map((i) => {
                const tone =
                  i.state_group === "completed" ? "teal"
                  : i.state_group === "started" ? "sky"
                  : i.state_group === "cancelled" ? "slate"
                  : "gold";
                const planeUrl = toPlaneIssueUrl(i.project_id, i.id);
                return (
                  <li key={i.id} className="px-5 py-3 hover:bg-surface-alt">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-foreground">{i.name}</div>
                      </div>
                      <Badge tone={tone}>{i.state_name}</Badge>
                      {planeUrl && (
                        <a
                          href={planeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded text-muted hover:text-sky-brand-600"
                          title="Open in Plane"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
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
