"use client";

import { useEffect, useState } from "react";
import {
  Database,
  ExternalLink,
  FileText,
  RotateCcw,
  Sparkles,
  ServerCog,
  Keyboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { resetDemo } from "@/lib/reset-demo";

export default function AdminPage() {
  const [resetting, setResetting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [erpnextUrl, setErpnextUrl] = useState("");

  useEffect(() => {
    setErpnextUrl(document.cookie.match(/erpnext_url=([^;]+)/)?.[1] ?? "");
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  async function doReset() {
    const ok = window.confirm(
      "This will clear chat history, reset signed-in state, and reload demo. Continue?"
    );
    if (!ok) return;
    setResetting(true);
    setToast("Demo reset. Fresh session.");
    await resetDemo({ redirectTo: "/", delayMs: 900 });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <div className="flex items-center gap-2 text-[#e69b40] text-xs font-bold uppercase tracking-widest">
          <ServerCog className="w-4 h-4" /> Admin
        </div>
        <h1 className="text-3xl font-bold text-[#064162] tracking-tight">
          Demo control panel
        </h1>
        <p className="text-slate-500 mt-1">
          Tools for running the live demo. Safe to use during a pitch.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="md:col-span-2 border-[#e69b40]/40">
          <CardHeader>
            <CardTitle>Reset demo data</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-sm text-slate-600">
              Clears the sign-in session, chat history, and local UI state so
              the next demo starts fresh. Does not touch ERPNext records.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={doReset}
                disabled={resetting}
              >
                <RotateCcw
                  className={`w-4 h-4 ${resetting ? "animate-spin" : ""}`}
                />
                {resetting ? "Resetting…" : "Reset demo data"}
              </Button>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <Keyboard className="w-3.5 h-3.5" />
                Shortcut:
                <kbd className="px-1.5 py-0.5 rounded border border-slate-300 bg-slate-50 font-mono text-[11px]">
                  ⌘
                </kbd>
                <kbd className="px-1.5 py-0.5 rounded border border-slate-300 bg-slate-50 font-mono text-[11px]">
                  Shift
                </kbd>
                <kbd className="px-1.5 py-0.5 rounded border border-slate-300 bg-slate-50 font-mono text-[11px]">
                  R
                </kbd>
              </span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ERPNext backend</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge tone={erpnextUrl ? "green" : "amber"}>
                {erpnextUrl ? "Wired" : "Canned data"}
              </Badge>
              <span className="text-xs text-slate-500">
                Set ERPNEXT_URL to switch to live.
              </span>
            </div>
            <p className="text-sm text-slate-600">
              Drill straight into the raw ERPNext Desk at any time. Useful for
              showing Chris &ldquo;there&apos;s nothing behind the curtain&rdquo;.
            </p>
            <Button
              variant="primary"
              onClick={() =>
                window.open("https://jwm-erp.beyondpandora.com", "_blank")
              }
            >
              <Database className="w-4 h-4" /> View raw ERPNext
              <ExternalLink className="w-3 h-3" />
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demo script</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-sm text-slate-600">
              Cheat sheet for the pitch flow: landing → dashboard (anomaly) →
              estimator (drop PDF) → planner (release WO) → shop (start + NCR) →
              QC (close loop).
            </p>
            <Button
              variant="outline"
              onClick={() => window.open("/demo-script.pdf", "_blank")}
            >
              <FileText className="w-4 h-4" /> Open runbook
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI / LiteLLM</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge tone="amber">Stubbed</Badge>
              <span className="text-xs text-slate-500">Canned responses</span>
            </div>
            <p className="text-sm text-slate-600">
              Chat, NCR drafting, and estimator extraction currently return
              canned responses. Wire LITELLM_URL + LITELLM_KEY env vars to go live.
            </p>
            <Button variant="ghost">
              <Sparkles className="w-4 h-4 text-[#e69b40]" /> Env configuration →
            </Button>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System</CardTitle>
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Stat label="Shell version" value="0.1.0" />
            <Stat label="Next.js" value="16 / App Router" />
            <Stat label="Bound to" value="0.0.0.0:3100" />
            <Stat label="Env" value="local" />
          </dl>
        </CardBody>
      </Card>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[#064162] text-white text-sm px-4 py-2 shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-sm text-[#064162]">{value}</div>
    </div>
  );
}
