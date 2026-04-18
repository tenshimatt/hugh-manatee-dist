"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { LogOut, Search, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";

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
            className="h-8 w-8 rounded-full bg-[#064162] text-white flex items-center justify-center text-xs font-bold"
          >
            {avatarInitials}
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
