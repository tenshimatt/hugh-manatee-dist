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
  ClipboardList,
  GanttChart,
  CalendarRange,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sidebar — reorganised 2026-04-17 for the shop-overhaul demo.
 *
 * Ordering rationale: the demo narrative now opens on /shop (shop floor
 * overview), so Shop Floor moves to the top. ERF (Engineering Release Form)
 * sits directly below it because it's the gate that feeds work onto the
 * shop floor. Everything else (Dashboard, Estimator, Planner, QC, Admin)
 * is demoted one slot.
 */
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
        {/* --- Shop Floor (top-level, expandable) --- */}
        <div>
          <button
            onClick={() => setShopOpen((v) => !v)}
            className={cn(
              "w-full flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium transition-colors",
              pathname === "/shop" || pathname.startsWith("/shop/")
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
              <Link
                href="/shop"
                className={cn(
                  "block text-sm px-2 py-1.5 rounded-lg",
                  pathname === "/shop"
                    ? "text-[#064162] bg-[#eaf3f8] font-semibold"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                Overview
              </Link>
              <Link
                href="/shop/scheduler"
                className={cn(
                  "flex items-center gap-1.5 text-sm px-2 py-1.5 rounded-lg",
                  pathname === "/shop/scheduler"
                    ? "text-[#064162] bg-[#eaf3f8] font-semibold"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                Scheduler
              </Link>
              <Link
                href="/shop/efficiency"
                className={cn(
                  "flex items-center gap-1.5 text-sm px-2 py-1.5 rounded-lg",
                  pathname === "/shop/efficiency" || pathname.startsWith("/shop/efficiency/")
                    ? "text-[#064162] bg-[#eaf3f8] font-semibold"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <Activity className="w-3.5 h-3.5" />
                Efficiency
              </Link>
              <Link
                href="/shop/lead"
                className={cn(
                  "flex items-center gap-1.5 text-sm px-2 py-1.5 rounded-lg",
                  pathname === "/shop/lead"
                    ? "text-[#064162] bg-[#eaf3f8] font-semibold"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <GanttChart className="w-3.5 h-3.5" />
                Lead View
                <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-[#e69b40]">
                  P2
                </span>
              </Link>
              <div className="pt-1 pb-0.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Workstations
              </div>
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

        {/* --- ERF (Engineering Release Form) --- */}
        <NavItem
          href="/erf"
          icon={ClipboardList}
          label="ERF"
          active={pathname === "/erf" || pathname.startsWith("/erf/")}
        />

        {/* --- Dashboard --- */}
        <NavItem
          href="/dashboard"
          icon={LayoutDashboard}
          label="Dashboard"
          active={pathname === "/dashboard"}
        />

        {/* --- Estimator --- */}
        <NavItem
          href="/estimator"
          icon={FileText}
          label="Estimator"
          active={pathname === "/estimator"}
        />
        {!collapsed && pathname.startsWith("/estimator") && (
          <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
            <Link
              href="/estimator"
              className={cn(
                "block text-sm px-2 py-1.5 rounded-lg",
                pathname === "/estimator"
                  ? "text-[#064162] bg-[#eaf3f8] font-semibold"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              PDF Extract
            </Link>
            <Link
              href="/estimator/quick-quote"
              className={cn(
                "block text-sm px-2 py-1.5 rounded-lg",
                pathname === "/estimator/quick-quote" ||
                  pathname.startsWith("/estimator/quick-quote/")
                  ? "text-[#064162] bg-[#eaf3f8] font-semibold"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              Quick Quote
            </Link>
          </div>
        )}

        {/* --- Planner --- */}
        <NavItem
          href="/planner/WO-2026-00218"
          icon={Hammer}
          label="Planner"
          active={pathname.startsWith("/planner")}
        />

        {/* --- QC --- */}
        <NavItem href="/qc" icon={ShieldCheck} label="QC" active={pathname.startsWith("/qc")} />

        {/* --- Admin --- */}
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
