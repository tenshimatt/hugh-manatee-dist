import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNum(n: number, fractionDigits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: fractionDigits,
  }).format(n);
}

export function formatPct(n: number, d = 1) {
  return `${n.toFixed(d)}%`;
}

// Build an Obsidian deep-link for a PLAUD_NOTES-relative path (e.g. "PROJECTS/Automagic/foo.md").
// Vault defaults to "Obsidian"; PLAUD notes live under `PLAUD/` inside that vault.
// Drops the ".md" extension — Obsidian handles both forms but the no-ext form is canonical.
// Build a URL to the Plane issue detail page. Vars default to the Beyond Pandora workspace.
export function toPlaneIssueUrl(projectId: string | null | undefined, issueId: string | null | undefined): string | null {
  if (!projectId || !issueId) return null;
  const base = process.env.NEXT_PUBLIC_PLANE_URL || "https://plane.beyondpandora.com";
  const workspace = process.env.NEXT_PUBLIC_PLANE_WORKSPACE || "beyond-pandora";
  return `${base}/${workspace}/projects/${projectId}/issues/${issueId}`;
}

export function toPlaneProjectUrl(projectId: string | null | undefined): string | null {
  if (!projectId) return null;
  const base = process.env.NEXT_PUBLIC_PLANE_URL || "https://plane.beyondpandora.com";
  const workspace = process.env.NEXT_PUBLIC_PLANE_WORKSPACE || "beyond-pandora";
  return `${base}/${workspace}/projects/${projectId}/issues`;
}

export function toObsidianUri(plaudRelPath: string | null | undefined): string | null {
  if (!plaudRelPath) return null;
  const vault = process.env.NEXT_PUBLIC_OBSIDIAN_VAULT || "Obsidian";
  const subdir = process.env.NEXT_PUBLIC_OBSIDIAN_PLAUD_SUBDIR || "PLAUD";
  const clean = plaudRelPath.replace(/^\/+/, "").replace(/\.md$/i, "");
  const full = subdir ? `${subdir}/${clean}` : clean;
  return `obsidian://open?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(full)}`;
}

export function formatRelative(iso: string | null | undefined) {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const diff = Date.now() - then;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toISOString().slice(0, 10);
}
