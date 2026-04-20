"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Factory,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Menu,
  ClipboardList,
  CalendarRange,
  Calendar,
  Activity,
  LineChart,
  Users,
  Handshake,
  Send,
  Cog,
  HardHat,
  Wrench,
  Truck,
  Boxes,
  Building2,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sidebar — refactored 2026-04-19 to match Chris Ball's canonical menu order
 * (see Obsidian/PLAUD/PROJECTS/JWM/MENU_ORDER.md). Persona-driven nav with
 * shared cross-cutters below the division split.
 */

const WORKSTATIONS = [
  { slug: "flat-laser-1", label: "Flat Laser #1" },
  { slug: "flat-laser-2", label: "Flat Laser #2" },
  { slug: "cnc-1", label: "CNC Mill #1" },
  { slug: "press-brake-1", label: "Press Brake #1" },
  { slug: "weld-bay-a", label: "Weld Bay A" },
  { slug: "assembly-1", label: "Assembly #1" },
  { slug: "qc", label: "QC Station" },
];

type Child = { href: string; label: string; matchPrefix?: string };

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string, matchPrefix?: string) => {
    const prefix = matchPrefix ?? href;
    return pathname === href || pathname.startsWith(prefix + "/");
  };
  const groupActive = (prefixes: string[]) =>
    prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));

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
        {/* Dashboard (global, top) */}
        <NavLeaf
          href="/dashboard"
          icon={LayoutDashboard}
          label="Dashboard"
          active={pathname === "/dashboard"}
          collapsed={collapsed}
        />

        {/* 1. Executive */}
        <NavGroup
          label="Executive"
          icon={LineChart}
          collapsed={collapsed}
          prefixes={["/exec"]}
          currentPath={pathname}
          defaultOpen={groupActive(["/exec"])}
          items={[
            { href: "/exec/arch", label: "Arch" },
            { href: "/exec/processing", label: "Processing" },
          ]}
          isActive={isActive}
        />

        {/* 2. Architectural */}
        <NavGroup
          label="Architectural"
          icon={Building2}
          collapsed={collapsed}
          prefixes={["/arch", "/estimator"]}
          currentPath={pathname}
          defaultOpen={groupActive(["/arch", "/estimator"]) && !pathname.startsWith("/estimator/quick-quote")}
          items={[
            { href: "/arch/pm", label: "Project Managers" },
            { href: "/arch/projects", label: "Projects" },
            { href: "/arch/estimating", label: "Estimating", matchPrefix: "/estimator" },
            { href: "/arch/sales", label: "Sales and Precon" },
            { href: "/arch/erf", label: "ERF", matchPrefix: "/erf" },
            { href: "/arch/field-daily", label: "Field Daily" },
          ]}
          isActive={isActive}
        />

        {/* 3. Processing */}
        <NavGroup
          label="Processing"
          icon={Workflow}
          collapsed={collapsed}
          prefixes={["/processing", "/estimator/quick-quote"]}
          currentPath={pathname}
          defaultOpen={groupActive(["/processing"]) || pathname.startsWith("/estimator/quick-quote")}
          items={[
            { href: "/processing/ops", label: "Ops + Client Services" },
            {
              href: "/processing/estimating/quick-quote",
              label: "Estimating",
              matchPrefix: "/estimator/quick-quote",
            },
            { href: "/processing/sales", label: "Sales" },
            { href: "/processing/erf", label: "Release to Eng / Shop" },
          ]}
          isActive={isActive}
        />

        {/* 4. Engineering */}
        <NavGroup
          label="Engineering"
          icon={Cog}
          collapsed={collapsed}
          prefixes={["/engineering"]}
          currentPath={pathname}
          defaultOpen={groupActive(["/engineering"])}
          items={[
            { href: "/engineering", label: "Overview", matchPrefix: "/engineering/__exact__" },
            { href: "/engineering/pipeline", label: "Pipeline" },
            { href: "/engineering/routes", label: "Routes" },
            { href: "/engineering/schedule", label: "Resource Planning" },
            { href: "/engineering/acm-flow", label: "ACM Flow" },
            { href: "/engineering/pt-flow", label: "P&T Flow" },
          ]}
          isActive={isActive}
        />

        {/* 5. Shop Floor */}
        <ShopFloorGroup collapsed={collapsed} pathname={pathname} />

        {/* 6. Quality Control */}
        <NavLeaf
          href="/qc"
          icon={ShieldCheck}
          label="Quality Control"
          active={isActive("/qc")}
          collapsed={collapsed}
        />

        {/* 7. Safety */}
        <NavLeaf
          href="/safety"
          icon={HardHat}
          label="Safety"
          active={isActive("/safety")}
          collapsed={collapsed}
        />

        {/* 8. Maintenance */}
        <NavLeaf
          href="/maintenance"
          icon={Wrench}
          label="Maintenance"
          active={isActive("/maintenance")}
          collapsed={collapsed}
        />

        {/* 9. Fleet */}
        <NavGroup
          label="Fleet"
          icon={Truck}
          collapsed={collapsed}
          prefixes={["/fleet"]}
          currentPath={pathname}
          defaultOpen={groupActive(["/fleet"])}
          items={[
            { href: "/fleet", label: "Overview", matchPrefix: "/fleet/__exact__" },
            { href: "/fleet/pool", label: "Pool Vehicles" },
            { href: "/fleet/drivers", label: "Approved Drivers" },
            { href: "/fleet/bookings", label: "Bookings" },
          ]}
          isActive={isActive}
        />

        {/* 10. Inventory (shared) */}
        <NavLeaf
          href="/inventory"
          icon={Boxes}
          label="Inventory"
          active={isActive("/inventory")}
          collapsed={collapsed}
        />
      </nav>
    </aside>
  );
}

function NavLeaf({
  href,
  icon: Icon,
  label,
  active,
  collapsed,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active?: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium transition-colors",
        active ? "bg-[#064162] text-white" : "text-slate-700 hover:bg-slate-100"
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function NavGroup({
  label,
  icon: Icon,
  collapsed,
  prefixes,
  currentPath,
  defaultOpen,
  items,
  isActive,
}: {
  label: string;
  icon: LucideIcon;
  collapsed: boolean;
  prefixes: string[];
  currentPath: string;
  defaultOpen: boolean;
  items: Child[];
  isActive: (href: string, matchPrefix?: string) => boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const parentActive = prefixes.some(
    (p) => currentPath === p || currentPath.startsWith(p + "/")
  );

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium transition-colors",
          parentActive && !open
            ? "bg-[#064162] text-white"
            : parentActive
              ? "text-[#064162] bg-[#eaf3f8]"
              : "text-slate-700 hover:bg-slate-100"
        )}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{label}</span>
            {open ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </>
        )}
      </button>
      {!collapsed && open && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
          {items.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={cn(
                "block text-sm px-2 py-1.5 rounded-lg",
                isActive(c.href, c.matchPrefix)
                  ? "text-[#064162] bg-[#eaf3f8] font-semibold"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              {c.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ShopFloorGroup({
  collapsed,
  pathname,
}: {
  collapsed: boolean;
  pathname: string;
}) {
  const [open, setOpen] = useState(pathname.startsWith("/shop"));
  const active = pathname === "/shop" || pathname.startsWith("/shop/");

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium transition-colors",
          active && !open
            ? "bg-[#064162] text-white"
            : active
              ? "text-[#064162] bg-[#eaf3f8]"
              : "text-slate-700 hover:bg-slate-100"
        )}
      >
        <Factory className="w-5 h-5 flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">Shop Floor</span>
            {open ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </>
        )}
      </button>
      {!collapsed && open && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
          <ShopChild href="/shop" label="Overview" exact pathname={pathname} />
          <ShopChild
            href="/shop/scheduler"
            label="Scheduler"
            icon={CalendarRange}
            pathname={pathname}
          />
          <ShopChild
            href="/shop/efficiency"
            label="Efficiency"
            icon={Activity}
            pathname={pathname}
          />
          <ShopChild
            href="/shop/lead"
            label="Lead View"
            pathname={pathname}
            pill="P2"
          />
          <ShopChild
            href="/shop/ship-schedule"
            label="Ship Schedule"
            icon={Calendar}
            pathname={pathname}
          />
          <ShopChild
            href="/shop/shipping"
            label="Shipping"
            icon={Send}
            pathname={pathname}
          />
          <div className="pt-1 pb-0.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
            Workstations
          </div>
          {WORKSTATIONS.map((w) => (
            <ShopChild
              key={w.slug}
              href={`/shop/${w.slug}`}
              label={w.label}
              pathname={pathname}
              exact
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ShopChild({
  href,
  label,
  icon: Icon,
  pathname,
  exact,
  pill,
}: {
  href: string;
  label: string;
  icon?: LucideIcon;
  pathname: string;
  exact?: boolean;
  pill?: string;
}) {
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 text-sm px-2 py-1.5 rounded-lg",
        active
          ? "text-[#064162] bg-[#eaf3f8] font-semibold"
          : "text-slate-600 hover:bg-slate-50"
      )}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{label}</span>
      {pill && (
        <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-[#e69b40]">
          {pill}
        </span>
      )}
    </Link>
  );
}

// Suppress unused-import warnings for icons reserved for future stubs.
void FileText;
void ClipboardList;
void Users;
void Handshake;
void Send;
