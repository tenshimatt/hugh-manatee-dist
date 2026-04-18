import { api } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { FolderKanban, FileAudio } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await api.projects();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Projects</h1>
        <p className="text-sm text-muted mt-1">
          {projects?.length || 0} Plane projects indexed, cross-referenced with PLAUD transcription folders.
        </p>
      </header>

      {!projects || projects.length === 0 ? (
        <Card>
          <CardBody className="p-8 text-center">
            <FolderKanban className="w-8 h-8 text-muted mx-auto mb-3" />
            <div className="text-sm text-muted">
              No Plane projects indexed. The indexer runs every 5 minutes and pulls from the Plane API.
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="am-card hover:border-sky-brand/50 transition-all cursor-pointer am-fade-in h-full">
                <CardBody className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-brand-50 text-teal-brand-600 flex items-center justify-center flex-shrink-0">
                      <FolderKanban className="w-5 h-5" />
                    </div>
                    {p.identifier && (
                      <Badge tone="slate" className="font-mono text-[10px]">{p.identifier}</Badge>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-foreground line-clamp-2 mb-1">
                    {p.name}
                  </h3>
                  {p.description && (
                    <p className="text-xs text-muted line-clamp-2 mb-3">{p.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-strong mt-3 pt-3 border-t border-border">
                    <span className="inline-flex items-center gap-1">
                      <span className="font-semibold text-foreground tabular-nums">{p.total_issues}</span>
                      issue{p.total_issues === 1 ? "" : "s"}
                    </span>
                    {p.transcription_count > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <FileAudio className="w-3 h-3" />
                        <span className="font-semibold text-foreground tabular-nums">{p.transcription_count}</span>
                        voice note{p.transcription_count === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
