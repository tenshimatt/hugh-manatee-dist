"use client";

import { useCallback, useRef, useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, FileAudio, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type UploadStatus = "queued" | "uploading" | "done" | "error";

type UploadItem = {
  id: string;
  file: File;
  title: string;
  status: UploadStatus;
  progress: number;
  message?: string;
  dropId?: string;
};

const ACCEPTED = [".mp3", ".m4a", ".wav", ".ogg", ".flac", ".webm", ".mp4", ".aac", ".opus"];
const MAX_BYTES = 500 * 1024 * 1024;

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function deriveTitle(filename: string) {
  return filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
}

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export function DropZone() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const incoming = Array.from(files);
    const next: UploadItem[] = [];
    for (const f of incoming) {
      const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
      if (!ACCEPTED.includes(ext)) {
        next.push({
          id: newId(),
          file: f,
          title: deriveTitle(f.name),
          status: "error",
          progress: 0,
          message: `Unsupported type (${ext || "no extension"})`,
        });
        continue;
      }
      if (f.size > MAX_BYTES) {
        next.push({
          id: newId(),
          file: f,
          title: deriveTitle(f.name),
          status: "error",
          progress: 0,
          message: `Too large (${formatBytes(f.size)} > 500 MB)`,
        });
        continue;
      }
      next.push({
        id: newId(),
        file: f,
        title: deriveTitle(f.name),
        status: "queued",
        progress: 0,
      });
    }
    setItems((prev) => [...next, ...prev]);
    for (const it of next) if (it.status === "queued") upload(it.id, it.file);
  }, []);

  const upload = useCallback((id: string, file: File) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: "uploading" } : it))
    );

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/proxy-upload", true);

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const pct = Math.round((e.loaded / e.total) * 100);
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, progress: pct } : it))
      );
    };

    xhr.onerror = () => {
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, status: "error", message: "Network error" }
            : it
        )
      );
    };

    xhr.onload = () => {
      let body: { ok?: boolean; dropId?: string; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText || "{}");
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && body.ok) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === id
              ? { ...it, status: "done", progress: 100, dropId: body.dropId, message: "Queued for transcription" }
              : it
          )
        );
      } else {
        setItems((prev) =>
          prev.map((it) =>
            it.id === id
              ? {
                  ...it,
                  status: "error",
                  message: body.error || `HTTP ${xhr.status}`,
                }
              : it
          )
        );
      }
    };

    setItems((prev) => {
      const it = prev.find((x) => x.id === id);
      const title = it?.title || deriveTitle(file.name);
      const fd = new FormData();
      fd.append("file", file, file.name);
      fd.append("title", title);
      xhr.send(fd);
      return prev;
    });
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const remove = (id: string) =>
    setItems((prev) => prev.filter((it) => it.id !== id));

  return (
    <Card className="am-fade-in">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Drop audio to transcribe</CardTitle>
        <span className="text-xs text-muted">n8n auto-runs the pipeline</span>
      </CardHeader>
      <CardBody className="space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative rounded-xl border-2 border-dashed transition-all cursor-pointer",
            "flex flex-col items-center justify-center gap-2 py-10 px-6 text-center",
            dragging
              ? "border-sky-brand-500 bg-sky-brand-50/60"
              : "border-border hover:border-sky-brand-400 hover:bg-surface-alt"
          )}
        >
          <div className="w-12 h-12 rounded-full bg-sky-brand-50 text-sky-brand-600 flex items-center justify-center">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="text-sm font-semibold text-foreground">
            {dragging ? "Release to upload" : "Drag & drop audio files here"}
          </div>
          <div className="text-xs text-muted">
            or click to choose · mp3, m4a, wav, ogg, flac, webm · up to 500 MB
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED.join(",")}
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </div>

        {items.length > 0 && (
          <ul className="space-y-2">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface-alt px-3 py-2"
              >
                <div className="shrink-0">
                  {it.status === "uploading" && (
                    <Loader2 className="w-4 h-4 text-sky-brand-500 animate-spin" />
                  )}
                  {it.status === "queued" && (
                    <FileAudio className="w-4 h-4 text-muted" />
                  )}
                  {it.status === "done" && (
                    <CheckCircle2 className="w-4 h-4 text-teal-brand-500" />
                  )}
                  {it.status === "error" && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-foreground truncate">
                      {it.title || it.file.name}
                    </div>
                    <div className="text-[11px] text-muted shrink-0">
                      {formatBytes(it.file.size)}
                    </div>
                  </div>
                  {it.status === "uploading" && (
                    <div className="mt-1 h-1.5 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full bg-sky-brand-500 transition-all"
                        style={{ width: `${it.progress}%` }}
                      />
                    </div>
                  )}
                  {it.status !== "uploading" && (
                    <div className="text-[11px] text-muted mt-0.5 flex items-center gap-2">
                      {it.status === "done" && (
                        <Badge tone="teal" className="text-[10px] py-0">
                          queued
                        </Badge>
                      )}
                      {it.status === "error" && (
                        <Badge tone="red" className="text-[10px] py-0">
                          error
                        </Badge>
                      )}
                      <span className="truncate">{it.message || ""}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(it.id);
                  }}
                  className="shrink-0 text-muted hover:text-foreground p-1"
                  aria-label="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {items.some((i) => i.status === "done") && (
          <div className="flex items-center justify-between text-xs text-muted">
            <span>
              Files land in <code className="text-foreground">PLAUD_NOTES/_drops/</code> on
              CT 107. n8n picks them up every minute.
            </span>
            <Button variant="ghost" size="sm" onClick={() => setItems([])}>
              Clear finished
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
