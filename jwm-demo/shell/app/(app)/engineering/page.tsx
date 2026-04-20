import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { Cog, KanbanSquare, PencilRuler, Code2, ChevronRight, GitBranch, Users } from "lucide-react";
import { CARDS, STAGES } from "@/lib/engineering-pipeline";

const PROG_STAGES = new Set(["cnc_prog", "laser_prog", "punch_prog"]);
const DRAFT_STAGES = new Set(["layout", "layout_check", "sketch", "sketch_check", "correction"]);

export default function EngineeringLandingPage() {
  const total = CARDS.length;
  const inPipeline = CARDS.filter((c) => c.stage !== "release_shop").length;
  const programming = CARDS.filter((c) => PROG_STAGES.has(c.stage)).length;
  const drafting = CARDS.filter((c) => DRAFT_STAGES.has(c.stage)).length;

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-[#e69b40] text-xs font-bold uppercase tracking-widest">
          <Cog className="w-4 h-4" /> Engineering
        </div>
        <h1 className="text-3xl font-bold text-[#064162] tracking-tight">Engineering</h1>
        <p className="text-slate-500 mt-1 max-w-2xl">
          Drafting workbench, programming queues, and release pipeline — shared across Architectural and
          Processing divisions. This is where every ERF becomes shop-ready.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Total Jobs" value={total} />
        <Kpi label="Active in Pipeline" value={inPipeline} accent />
        <Kpi label="In Drafting" value={drafting} />
        <Kpi label="In Programming" value={programming} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SubView
          href="/engineering/pipeline"
          icon={KanbanSquare}
          title="Pipeline"
          description={`Kanban across ${STAGES.length} stages — the engineering production schedule. Replaces Drew's Smartsheet card view.`}
          badge={`${inPipeline} active`}
          ready
        />
        <SubView
          href="/engineering/routes"
          icon={GitBranch}
          title="Routes"
          description="Per-job station sequence defined at estimate time. NCR loop-back and side-branches visualised. Embedded on every Project Dashboard."
          badge="3 seeded"
          ready
        />
        <SubView
          href="/engineering/pt-flow"
          icon={Code2}
          title="P&T Flow"
          description="Plate & Tube discipline — parts drawn, programmed, released. Serves both A and T Shop."
          badge={`${programming} queued`}
          ready
        />
        <SubView
          href="/engineering/acm-flow"
          icon={PencilRuler}
          title="ACM Flow"
          description="Architectural ACM discipline — field dims → layout → sketch → programming → release."
          badge={`${drafting} active`}
          ready
        />
        <SubView
          href="/engineering/schedule"
          icon={Users}
          title="Resource Planning"
          description="15 engineers across ACM and Plate & Tube disciplines. Manager + IC capacity bars; drag cards onto a person or heatmap cell to book them."
          badge="15 engineers"
          ready
        />
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <Card>
      <CardBody className="pt-5">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</div>
        <div
          className={`mt-1 text-3xl font-bold tabular-nums ${
            accent ? "text-[#e69b40]" : "text-[#064162]"
          }`}
        >
          {value}
        </div>
      </CardBody>
    </Card>
  );
}

function SubView({
  href,
  icon: Icon,
  title,
  description,
  badge,
  ready,
}: {
  href: string;
  icon: typeof Cog;
  title: string;
  description: string;
  badge: string;
  ready?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-[#064162]/30 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#eaf3f8] text-[#064162]">
          <Icon className="w-5 h-5" />
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            ready
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-[#fdf2e3] text-[#8a5716] border border-[#f3d7a8]"
          }`}
        >
          {ready ? "Live" : "Phase 2"}
        </span>
      </div>
      <h3 className="mt-3 text-lg font-bold text-[#064162] group-hover:text-[#0a5480]">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">{badge}</span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#064162]">
          Open <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}
