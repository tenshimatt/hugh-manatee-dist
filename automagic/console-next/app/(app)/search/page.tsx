import { api } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { FileAudio, FolderKanban, Search as SearchIcon } from "lucide-react";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string }>;

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = (sp.q || "").trim();

  const results = q ? await api.search(q, { limit: 50 }) : null;

  const transcriptionHits = results?.transcriptions || [];
  const issueHits = results?.issues || [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Search</h1>
        <p className="text-sm text-muted mt-1">
          Full-text search across all transcriptions and Plane issues (FTS5).
        </p>
      </header>

      <form method="GET">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            name="q"
            defaultValue={q}
            autoFocus
            placeholder="Search titles, summaries, tags, issues…"
            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-surface border border-border text-base text-foreground placeholder:text-muted focus:outline-none focus:border-sky-brand focus:ring-2 focus:ring-sky-brand/20"
          />
        </div>
      </form>

      {!q && (
        <div className="text-center py-16">
          <SearchIcon className="w-10 h-10 text-muted mx-auto mb-3" />
          <div className="text-sm text-muted">Type a query to search.</div>
        </div>
      )}

      {q && !results && (
        <Card>
          <CardBody className="p-6 text-sm text-muted">Search unavailable — backend did not respond.</CardBody>
        </Card>
      )}

      {q && results && transcriptionHits.length === 0 && issueHits.length === 0 && (
        <Card>
          <CardBody className="p-6 text-sm text-muted text-center">
            No results for &ldquo;{q}&rdquo;.
          </CardBody>
        </Card>
      )}

      {transcriptionHits.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileAudio className="w-4 h-4 text-sky-brand" />
            <h2 className="text-sm font-semibold text-foreground">
              Transcriptions ({transcriptionHits.length})
            </h2>
          </div>
          <Card>
            <CardBody className="p-0">
              <ul className="divide-y divide-border">
                {transcriptionHits.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/transcriptions/${t.id}`}
                      className="block px-5 py-3 hover:bg-surface-alt transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-foreground truncate">{t.title}</div>
                          {t.snippet && (
                            <div
                              className="text-xs text-muted mt-1 line-clamp-2"
                              dangerouslySetInnerHTML={{ __html: t.snippet }}
                            />
                          )}
                          <div className="text-[11px] text-muted mt-1">
                            {t.date} {t.time}
                            {t.project_folder && <> · {t.project_folder}</>}
                          </div>
                        </div>
                        {t.classification && (
                          <Badge tone="teal" className="text-[10px]">{t.classification}</Badge>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      )}

      {issueHits.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-teal-brand" />
            <h2 className="text-sm font-semibold text-foreground">
              Plane issues ({issueHits.length})
            </h2>
          </div>
          <Card>
            <CardBody className="p-0">
              <ul className="divide-y divide-border">
                {issueHits.map((i) => {
                  const tone =
                    i.state_group === "completed" ? "teal"
                    : i.state_group === "started" ? "sky"
                    : i.state_group === "cancelled" ? "slate"
                    : "gold";
                  return (
                    <li key={i.id}>
                      <Link
                        href={`/projects/${i.project_id}`}
                        className="block px-5 py-3 hover:bg-surface-alt transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-foreground truncate">{i.name}</div>
                            {i.snippet && (
                              <div
                                className="text-xs text-muted mt-1 line-clamp-2"
                                dangerouslySetInnerHTML={{ __html: i.snippet }}
                              />
                            )}
                            <div className="text-[11px] text-muted mt-1">
                              {i.project_name}
                            </div>
                          </div>
                          <Badge tone={tone} className="text-[10px]">{i.state_name}</Badge>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
