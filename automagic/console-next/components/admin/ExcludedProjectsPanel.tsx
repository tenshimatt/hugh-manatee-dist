"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  initial: string[];
}

export function ExcludedProjectsPanel({ initial }: Props) {
  const [list, setList] = useState<string[]>(initial);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    const id = input.trim().toUpperCase();
    if (!id || list.includes(id)) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/excluded-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: id }),
      });
      if (!r.ok) throw new Error(await r.text());
      setList(await r.json());
      setInput("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(identifier: string) {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(
        `/api/admin/excluded-projects/${encodeURIComponent(identifier)}`,
        { method: "DELETE" }
      );
      if (!r.ok) throw new Error(await r.text());
      setList(await r.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {list.length === 0 && (
          <span className="text-sm text-muted italic">No excluded projects</span>
        )}
        {list.map((id) => (
          <span
            key={id}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-alt text-sm font-mono text-foreground"
          >
            {id}
            <button
              onClick={() => remove(id)}
              disabled={busy}
              aria-label={`Remove ${id}`}
              className="text-muted hover:text-red-400 transition-colors disabled:opacity-40"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="PROJECT_IDENTIFIER"
          className="font-mono text-sm px-3 py-1.5 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-sky-brand w-48"
        />
        <button
          onClick={add}
          disabled={busy || !input.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-brand text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <p className="text-xs text-muted">
        Adding a project immediately removes it from the local index and stops future syncs.
        Removing it from this list re-enables sync on the next 5-minute cycle.
      </p>
    </div>
  );
}
