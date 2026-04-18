"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Hammer,
  Factory,
  ShieldCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const WORKSTATIONS = [
  { slug: "flat-laser-1", label: "Flat Laser #1" },
  { slug: "flat-laser-2", label: "Flat Laser #2" },
  { slug: "cnc-1", label: "CNC Mill #1" },
  { slug: "press-brake-1", label: "Press Brake #1" },
  { slug: "weld-bay-a", label: "Weld Bay A" },
  { slug: "assembly-1", label: "Assembly #1" },
  { slug: "qc", label: "QC Station" },
  { slug: "shipping", label: "Shipping" },
];

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const [shopOpen, setShopOpen] = useState(pathname.startsWith("/shop"));

  const NavItem = ({
    href,
    icon: Icon,
    label,
    active,
  }: {
    href: string;
    icon: typeof LayoutDashboard;
    label: string;
    active?: boolean;
  }) => (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium transition-colors",
        active
          ? "bg-[#064162] text-white"
          : "text-slate-700 hover:bg-slate-100"
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  return (
    <aside
      className={cn(
        "fixed top-16 left-0 bottom-0 z-20 border-r border-slate-200 bg-white transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <button
        onClick={onToggle}
        aria-label="Toggle sidebar"
        className="flex items-center justify-center w-full h-12 border-b border-slate-200 hover:bg-slate-50 text-slate-500"
      >
        <Menu className="w-4 h-4" />
      </button>
      <nav className="p-2 space-y-1 overflow-y-auto h-[calc(100%-3rem)]">
        <NavItem
          href="/dashboard"
          icon={LayoutDashboard}
          label="Dashboard"
          active={pathname === "/dashboard"}
        />
        <NavItem
          href="/estimator"
          icon={FileText}
          label="Estimator"
          active={pathname.startsWith("/estimator")}
        />
        <NavItem
          href="/planner/WO-2026-00218"
          icon={Hammer}
          label="Planner"
          active={pathname.startsWith("/planner")}
        />
        <div>
          <button
            onClick={() => setShopOpen((v) => !v)}
            className={cn(
              "w-full flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium transition-colors",
              pathname.startsWith("/shop")
                ? "bg-[#064162] text-white"
                : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <Factory className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Shop Floor</span>
                {shopOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </>
            )}
          </button>
          {!collapsed && shopOpen && (
            <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
              {WORKSTATIONS.map((w) => (
                <Link
                  key={w.slug}
                  href={`/shop/${w.slug}`}
                  className={cn(
                    "block text-sm px-2 py-1.5 rounded-lg",
                    pathname === `/shop/${w.slug}`
                      ? "text-[#064162] bg-[#eaf3f8] font-semibold"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {w.label}
                </Link>
              ))}
            </div>
          )}
        </div>
        <NavItem href="/qc" icon={ShieldCheck} label="QC" active={pathname.startsWith("/qc")} />
        <NavItem
          href="/admin"
          icon={Settings}
          label="Admin"
          active={pathname.startsWith("/admin")}
        />
      </nav>
    </aside>
  );
}
