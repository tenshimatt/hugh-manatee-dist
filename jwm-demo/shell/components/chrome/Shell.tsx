"use client";

import { useState } from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { AIChat, AIChatFAB } from "./AIChat";
import { ResetShortcut } from "./ResetShortcut";
import { cn } from "@/lib/utils";

export function Shell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar onOpenAI={() => setAiOpen(true)} />
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />
      <main
        className={cn(
          "pt-16 transition-all duration-200",
          sidebarCollapsed ? "pl-16" : "pl-60",
          aiOpen ? "sm:pr-[420px]" : ""
        )}
      >
        <div className="p-6 max-w-[1600px] mx-auto">{children}</div>
        <footer className="px-6 py-6 text-center text-xs text-slate-400 border-t border-slate-200 mt-12">
          Powered by sovereign.ai · ERPNext + LiteLLM + n8n · © John W. McDougall Co.
        </footer>
      </main>
      <AIChat open={aiOpen} onClose={() => setAiOpen(false)} />
      <AIChatFAB open={aiOpen} onClick={() => setAiOpen(true)} />
      <ResetShortcut />
    </div>
  );
}
