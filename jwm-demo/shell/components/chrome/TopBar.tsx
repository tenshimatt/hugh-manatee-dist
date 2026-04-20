"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Bell, LogOut, Search, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Anomaly shape returned by /api/anomaly — superset of what the bell uses.
 * The bell only reads id/title/summary/severity and derives a deep-link
 * from the workstation mentioned in canned evidence ("Laser #2" → /shop/flat-laser-2).
 */
type AnomalyPayload = {
  id: string;
  severity: string;
  title: string;
  summary: string;
  detected_at?: string;
  affected_jobs?: { wo: string; part: string }[];
};

// Very lightweight heuristic: map a title/summary to a workstation slug.
// Good enough for the demo; not wired to a DB column.
function anomalyToSlug(a: AnomalyPayload): string {
  const blob = `${a.title} ${a.summary}`.toLowerCase();
  if (blob.includes("laser #2") || blob.includes("laser 2") || blob.includes("flat-laser-2")) return "flat-laser-2";
  if (blob.includes("laser #1") || blob.includes("laser 1") || blob.includes("flat-laser-1")) return "flat-laser-1";
  if (blob.includes("press brake") || blob.includes("press-brake")) return "press-brake-1";
  if (blob.includes("cnc")) return "cnc-1";
  if (blob.includes("weld")) return "weld-bay-a";
  if (blob.includes("assembly")) return "assembly-1";
  if (blob.includes("shipping")) return "shipping";
  if (blob.includes("qc")) return "qc";
  return "flat-laser-2"; // fallback matches the canned anomaly
}

type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
  return letters || "?";
}

export function TopBar({ onOpenAI }: { onOpenAI: () => void }) {
  const [aiLive, setAiLive] = useState<boolean | null>(null);
  const [dataLive, setDataLive] = useState<boolean | null>(null);
  // Real logged-in user from NextAuth session (Authentik OIDC). Null if the
  // visitor arrived via the stub fallback cookie — then we fall back to the
  // hardcoded demo identity ("Chris Ball") so the chrome still reads right.
  const [user, setUser] = useState<SessionUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [anomaly, setAnomaly] = useState<AnomalyPayload | null>(null);
  const [anomalyDismissedId, setAnomalyDismissedId] = useState<string | null>(
    null
  );
  const [anomalyOpen, setAnomalyOpen] = useState(false);
  const anomalyPollRef = useRef<number | null>(null);

  // Poll /api/anomaly every 60s. SWR/polling chosen over SSE/webhooks so
  // offline-capable fallback is trivial — service worker / queue is Phase 2.
  useEffect(() => {
    let cancelled = false;
    const fetchAnomaly = () => {
      fetch("/api/anomaly")
        .then((r) => (r.ok ? r.json() : null))
        .then((j: AnomalyPayload | null) => {
          if (cancelled || !j || !j.id) return;
          setAnomaly(j);
        })
        .catch(() => {});
    };
    fetchAnomaly();
    anomalyPollRef.current = window.setInterval(fetchAnomaly, 60_000) as unknown as number;
    return () => {
      cancelled = true;
      if (anomalyPollRef.current) window.clearInterval(anomalyPollRef.current);
    };
  }, []);

  useEffect(() => {
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((j: { live: boolean }) => setAiLive(!!j.live))
      .catch(() => setAiLive(false));
    fetch("/api/data/status")
      .then((r) => r.json())
      .then((j: { live: boolean }) => setDataLive(!!j.live))
      .catch(() => setDataLive(false));
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((j: { user?: SessionUser } | null) => {
        if (j && j.user) setUser(j.user);
      })
      .catch(() => {});
  }, []);

  const displayName = user?.name || "Chris Ball";
  const avatarInitials = initials(displayName);
  const isSsoSession = !!user;
  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-4">
      <Link href="/dashboard" className="flex items-center gap-3">
        <Image
          src="/logo-jwm.svg"
          alt="JWM"
          width={44}
          height={44}
          className="w-11 h-11"
          priority
        />
        <div className="hidden sm:block leading-tight">
          <div className="text-[15px] font-bold text-[#064162] tracking-tight">
            John W. McDougall Co.
          </div>
          <div className="text-[11px] text-slate-500">
            A Better Way to Build Since 1938
          </div>
        </div>
      </Link>

      <div className="flex-1 max-w-xl mx-auto hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            aria-label="Search"
            placeholder="Search WOs, customers, parts…   ⌘K"
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-100 border border-transparent focus:border-slate-300 focus:bg-white focus:outline-none text-sm"
          />
        </div>
      </div>

      {aiLive !== null && (
        <span
          title={aiLive ? "Live AI via LiteLLM gateway" : "Offline demo mode — canned responses"}
          className={
            "hidden md:inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full text-[11px] font-medium border " +
            (aiLive
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-slate-100 border-slate-200 text-slate-600")
          }
        >
          <span
            className={
              "w-1.5 h-1.5 rounded-full " + (aiLive ? "bg-emerald-500" : "bg-slate-400")
            }
          />
          {aiLive ? "AI: Live" : "AI: Canned"}
        </span>
      )}

      {dataLive !== null && (
        <span
          title={dataLive ? "Reading from live ERPNext backend" : "Using canned JSON fixtures"}
          className={
            "hidden md:inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full text-[11px] font-medium border " +
            (dataLive
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-slate-100 border-slate-200 text-slate-600")
          }
        >
          <span
            className={
              "w-1.5 h-1.5 rounded-full " + (dataLive ? "bg-emerald-500" : "bg-slate-400")
            }
          />
          {dataLive ? "Data: Live" : "Data: Canned"}
        </span>
      )}

      {/* Anomaly bell — surfaces whatever /api/anomaly last returned.
          Click to reveal a compact pop-over with severity + deep-link to the
          implicated workstation kiosk. Dismiss keeps it quiet until a new
          anomaly.id appears. */}
      {anomaly && anomaly.id !== anomalyDismissedId && (
        <div className="relative">
          <button
            aria-label={`Anomaly: ${anomaly.title}`}
            onClick={() => setAnomalyOpen((v) => !v)}
            className={
              "relative inline-flex items-center justify-center h-10 w-10 rounded-full transition-colors " +
              (anomaly.severity === "warn" || anomaly.severity === "High"
                ? "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200")
            }
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#e69b40] ring-2 ring-white" />
          </button>
          {anomalyOpen && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-40 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-white">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Anomaly · {anomaly.id}
                </div>
                <div className="text-sm font-semibold text-slate-800 mt-0.5">
                  {anomaly.title}
                </div>
                <div className="text-xs text-slate-500 mt-1">{anomaly.summary}</div>
              </div>
              <div className="p-3 flex items-center gap-2">
                <Link
                  href={`/shop/${anomalyToSlug(anomaly)}`}
                  onClick={() => setAnomalyOpen(false)}
                  className="flex-1 text-center h-9 inline-flex items-center justify-center rounded-lg bg-[#064162] text-white text-sm font-semibold hover:bg-[#0a5480]"
                >
                  Open workstation
                </Link>
                <button
                  onClick={() => {
                    setAnomalyDismissedId(anomaly.id);
                    setAnomalyOpen(false);
                  }}
                  className="h-9 px-3 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <Button variant="outline" size="sm" onClick={onOpenAI} className="gap-2">
        <Sparkles className="w-4 h-4 text-[#e69b40]" />
        <span className="hidden sm:inline">Ask John</span>
      </Button>

      <div className="relative">
        <button
          aria-label="User menu"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full pl-1 pr-3 h-10 hover:bg-slate-100"
        >
          <span
            title={user?.email ?? "Local demo session"}
            className="h-8 w-8 rounded-full bg-[#064162] text-white flex items-center justify-center text-xs font-bold overflow-hidden ring-2 ring-white"
          >
            {displayName === "Chris Ball" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/team/chris-ball.jpg"
                alt="Chris Ball"
                className="h-full w-full object-cover"
              />
            ) : (
              avatarInitials
            )}
          </span>
          <span className="hidden md:inline text-sm font-medium text-slate-700">
            {displayName}
          </span>
          <User className="md:hidden w-4 h-4 text-slate-600" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-12 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-40">
            <div className="px-3 py-2 border-b border-slate-100">
              <div className="text-sm font-semibold text-slate-800">{displayName}</div>
              {user?.email && (
                <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
              )}
              <div className="text-[10px] text-slate-400 mt-1">
                {isSsoSession ? "Signed in via sovereign.ai" : "Local demo session"}
              </div>
            </div>
            <a
              href={
                isSsoSession
                  ? "/api/auth/signout?callbackUrl=/"
                  : "/api/auth/stub/signout"
              }
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
