"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  Activity,
  Menu,
  Sparkles,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

// /search still exists — reachable via the top-bar search form. Keeping the nav
// item here was redundant with that, so it's been dropped.
const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/transcriptions", icon: FileText, label: "Transcriptions" },
  { href: "/projects", icon: FolderKanban, label: "Projects" },
  { href: "/pipeline", icon: Activity, label: "Pipeline" },
  { href: "/admin", icon: Settings, label: "Admin" },
];

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed top-16 left-0 bottom-0 z-20 border-r border-border bg-surface transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <button
        onClick={onToggle}
        aria-label="Toggle sidebar"
        className="flex items-center justify-center w-full h-12 border-b border-border hover:bg-surface-alt text-muted"
      >
        <Menu className="w-4 h-4" />
      </button>
      <nav className="p-2 space-y-1 overflow-y-auto h-[calc(100%-3rem)]">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-sky-brand text-white shadow-sm"
                  : "text-muted-strong hover:bg-surface-alt"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        {!collapsed && (
          <div className="pt-6 px-3">
            <div className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-2">
              Powered by
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-strong">
              <Sparkles className="w-3.5 h-3.5 text-gold-brand" />
              <span>n8n · DeepSeek · Whisper</span>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}
