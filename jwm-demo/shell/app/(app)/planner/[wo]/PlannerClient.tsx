"use client";

import { useState } from "react";
import {
  Printer,
  Rocket,
  Calendar,
  User2,
  DollarSign,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import type { WorkOrderDetail } from "@/lib/canned/work-orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import bom from "@/lib/canned/estimate-001-bom.json";

export function PlannerClient({ order: initial }: { order: WorkOrderDetail }) {
  const [order, setOrder] = useState<WorkOrderDetail>(initial);
  const [toast, setToast] = useState<string | null>(null);

  function release() {
    setOrder({ ...order, status: "Released" });
    setToast(`${order.name} released to the shop floor.`);
    setTimeout(() => setToast(null), 3500);
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 fade-in">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold">{toast}</span>
        </div>
      )}

      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="navy">{order.division}</Badge>
            <Badge
              tone={
                order.status === "Released"
                  ? "green"
                  : order.status === "Complete"
                    ? "slate"
                    : order.status === "In Progress"
                      ? "gold"
                      : "amber"
              }
            >
              {order.status}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-[#064162] tracking-tight mt-1">
            {order.name}
          </h1>
          <p className="text-slate-500">{order.project}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => window.open("/sample-traveler.pdf", "_blank")}
          >
            <Printer className="w-4 h-4" /> Print Traveler
          </Button>
          {order.status === "Draft" && (
            <Button variant="gold" size="lg" onClick={release}>
              <Rocket className="w-4 h-4" /> Release to Shop Floor
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetaBox icon={<User2 />} label="Customer" value={order.customer} />
        <MetaBox
          icon={<Calendar />}
          label="Due date"
          value={new Date(order.due_date).toLocaleDateString()}
        />
        <MetaBox
          icon={<DollarSign />}
          label="Total value"
          value={formatMoney(order.total_value)}
        />
        <MetaBox icon={<Rocket />} label="Qty" value={`${order.qty}`} />
      </div>

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-4">
        {/* Routing timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Routing Operations</CardTitle>
          </CardHeader>
          <CardBody>
            <ol className="relative border-l-2 border-slate-200 space-y-5 pl-6 ml-2">
              {order.routing.map((op) => (
                <li key={op.seq} className="relative">
                  <span
                    className={`absolute -left-[34px] top-0 h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 ${
                      op.status === "done"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : op.status === "in_progress"
                          ? "bg-[#e69b40] text-white border-[#e69b40]"
                          : "bg-white text-slate-500 border-slate-300"
                    }`}
                  >
                    {op.seq}
                  </span>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800">
                        {op.op}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Workstation:{" "}
                        <span className="font-mono text-[#064162]">
                          {op.workstation}
                        </span>
                        {" · "}
                        <span>{op.est_hours} hr est.</span>
                      </div>
                    </div>
                    <Badge
                      tone={
                        op.status === "done"
                          ? "green"
                          : op.status === "in_progress"
                            ? "gold"
                            : "slate"
                      }
                    >
                      {op.status.replace("_", " ")}
                    </Badge>
                  </div>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>

        {/* Material readiness + BOM */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Material Readiness</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="flex items-end justify-between mb-2">
                <span className="text-3xl font-bold text-[#064162]">
                  {order.material_ready_pct}%
                </span>
                <span className="text-xs text-slate-500">ready to release</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#064162] to-[#e69b40]"
                  style={{ width: `${order.material_ready_pct}%` }}
                />
              </div>
              <div className="text-xs text-slate-500 mt-3 leading-relaxed">
                Remaining: 304 SS 1/2&quot; plate (arriving 4/19 from Steel &amp; Pipe Supply).
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bill of Materials</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="text-xs text-slate-500 mb-2">
                Linked estimate:{" "}
                <span className="font-mono text-[#064162]">{order.bom_ref}</span>
              </div>
              <div className="max-h-72 overflow-y-auto space-y-1">
                {bom.assemblies.map((a) => (
                  <BomTreeRow key={a.id} a={a} />
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetaBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="jwm-card p-4 flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-[#eaf3f8] text-[#064162] flex items-center justify-center [&_svg]:w-4 [&_svg]:h-4">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </div>
        <div className="font-semibold text-slate-800 truncate">{value}</div>
      </div>
    </div>
  );
}

function BomTreeRow({ a }: { a: (typeof bom.assemblies)[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="text-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 text-left"
      >
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        )}
        <span className="font-mono text-xs text-[#e69b40] font-bold w-8">
          {a.id}
        </span>
        <span className="font-medium text-slate-800 flex-1 truncate">
          {a.name}
        </span>
        <span className="text-xs text-slate-400">×{a.qty}</span>
      </button>
      {open && (
        <ul className="ml-8 py-1 space-y-0.5">
          {a.children.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-2 text-xs text-slate-600 py-0.5"
            >
              <span className="font-mono text-slate-400 w-10">{c.id}</span>
              <span className="flex-1 truncate">{c.name}</span>
              <span className="text-slate-400">×{c.qty}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
