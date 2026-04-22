import { api, parseTags } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Clock, FileAudio, ChevronRight, ExternalLink } from "lucide-react";
import { toObsidianUri } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  project?: string;
  tag?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
}>;

export default async function TranscriptionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = parseInt(sp.page || "1");
  const limit = 25;

  const [list, filters] = await Promise.all([
    api.transcriptions({
      page,
      limit,
      project: sp.project,
      tag: sp.tag,
      dateFrom: sp.dateFrom,
      dateTo: sp.dateTo,
    }),
    api.filters(),
  ]);

  const total = list?.total || 0;
  const results = list?.results || [];
  const totalPages = Math.ceil(total / limit);

  const filterUrl = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { ...sp, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v && k !== "page") params.set(k, v);
    }
    return `/transcriptions?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transcriptions</h1>
          <p className="text-sm text-muted mt-1">
            {total.toLocaleString()} voice notes indexed from PLAUD_NOTES.
          </p>
        </div>
      </header>

      {/* Filter bar */}
      <Card>
        <CardBody className="p-4">
          <form method="GET" className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wide">Project</label>
              <select
                name="project"
                defaultValue={sp.project || ""}
                className="h-9 px-3 rounded-xl bg-surface-alt border border-border text-sm text-foreground focus:outline-none focus:border-sky-brand"
              >
                <option value="">All projects</option>
                {filters?.projects.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wide">Tag</label>
              <select
                name="tag"
                defaultValue={sp.tag || ""}
                className="h-9 px-3 rounded-xl bg-surface-alt border border-border text-sm text-foreground focus:outline-none focus:border-sky-brand"
              >
                <option value="">All tags</option>
                {filters?.tags.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wide">From</label>
              <input
                type="date"
                name="dateFrom"
                defaultValue={sp.dateFrom || ""}
                className="h-9 px-3 rounded-xl bg-surface-alt border border-border text-sm text-foreground focus:outline-none focus:border-sky-brand"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wide">To</label>
              <input
                type="date"
                name="dateTo"
                defaultValue={sp.dateTo || ""}
                className="h-9 px-3 rounded-xl bg-surface-alt border border-border text-sm text-foreground focus:outline-none focus:border-sky-brand"
              />
            </div>
            <button
              type="submit"
              className="h-9 px-4 rounded-xl bg-sky-brand text-white text-sm font-semibold hover:bg-sky-brand-600 shadow-sm"
            >
              Apply
            </button>
            {(sp.project || sp.tag || sp.dateFrom || sp.dateTo) && (
              <Link
                href="/transcriptions"
                className="h-9 px-3 rounded-xl text-sm font-medium text-muted-strong hover:bg-surface-alt flex items-center"
              >
                Clear
              </Link>
            )}
          </form>
        </CardBody>
      </Card>

      {/* Results */}
      <Card>
        <CardBody className="p-0">
          {results.length === 0 ? (
            <div className="p-8 text-center">
              <FileAudio className="w-8 h-8 text-muted mx-auto mb-3" />
              <div className="text-sm text-muted">No transcriptions match these filters.</div>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {results.map((t) => {
                const tags = parseTags(t.tags);
                const domainTags = tags.filter((x) => x !== "voice-note" && x !== "plaud");
                const obsidianUri = toObsidianUri(t.filepath);
                return (
                  <li key={t.id} className="group flex items-center gap-4 px-5 py-4 hover:bg-surface-alt transition-colors">
                    <Link
                      href={`/transcriptions/${t.id}`}
                      className="flex items-center gap-4 min-w-0 flex-1"
                    >
                      <div className="w-10 h-10 rounded-xl bg-sky-brand-50 text-sky-brand-600 flex items-center justify-center flex-shrink-0">
                        <FileAudio className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-foreground truncate">{t.title}</div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted flex-wrap">
                          <Clock className="w-3 h-3" />
                          <span>{t.date} {t.time}</span>
                          {t.duration_mins !== null && <><span>·</span><span>{t.duration_mins}min</span></>}
                          {t.project_folder && (
                            <>
                              <span>·</span>
                              <Badge tone="sky" className="py-0 text-[10px]">{t.project_folder}</Badge>
                            </>
                          )}
                          {domainTags.slice(0, 4).map((tag) => (
                            <Badge key={tag} tone="slate" className="py-0 text-[10px]">#{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </Link>
                    {obsidianUri && (
                      <a
                        href={obsidianUri}
                        className="p-1.5 rounded text-muted hover:text-sky-brand-600 hover:bg-sky-brand-50 flex-shrink-0"
                        title="Open in Obsidian"
                        aria-label="Open in Obsidian"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <Link
                      href={`/transcriptions/${t.id}`}
                      className="flex-shrink-0"
                      aria-label="Open detail"
                    >
                      <ChevronRight className="w-4 h-4 text-muted group-hover:text-foreground" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted">
            Page {page} of {totalPages} · {total.toLocaleString()} results
          </div>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={filterUrl({ page: String(page - 1) })}
                className="h-9 px-4 rounded-xl border border-border bg-surface text-sm font-medium text-foreground hover:bg-surface-alt"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={filterUrl({ page: String(page + 1) })}
                className="h-9 px-4 rounded-xl bg-sky-brand text-white text-sm font-semibold hover:bg-sky-brand-600"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
