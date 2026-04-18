"use client";

import { useState } from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

export function Shell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <main
        className={cn(
          "pt-16 transition-all duration-200",
          collapsed ? "pl-16" : "pl-60"
        )}
      >
        <div className="p-6 max-w-[1600px] mx-auto">{children}</div>
        <footer className="px-6 py-6 text-center text-xs text-muted border-t border-border mt-12">
          Automagic Console · n8n on CT 107 · Plane on CT 106 · LiteLLM gateway on CT 123
        </footer>
      </main>
    </div>
  );
}
