/**
 * P&T Flow (JWM1451-85) — Parts Drawn → Programmed → Released.
 *
 * Plate & Tube works across BOTH divisions (A and T shop). Per Chris Ball's
 * transcript (2026-04-20), P&T serves architectural curtain-wall structural
 * backers AND the processing division proper.
 */
import { CARDS } from "@/lib/engineering-pipeline";
import { CANNED_ENGINEERS } from "@/lib/engineering-schedule";
import { FlowDiagram, type FlowStage } from "@/components/engineering/FlowDiagram";

const PT_STAGES: FlowStage[] = [
  {
    key: "parts_drawn",
    label: "Parts Drawn",
    includes: [
      "uncategorized",
      "evaluating",
      "float",
      "layout",
      "layout_check",
      "sketch",
      "sketch_check",
      "correction",
    ],
  },
  {
    key: "programmed",
    label: "Programmed",
    includes: ["cnc_prog", "laser_prog", "punch_prog", "prog_complete"],
  },
  { key: "released", label: "Released to Shop", includes: ["release_shop"], accent: "gold" },
];

export default function PTFlowPage() {
  // P&T spans both divisions; we show everything for now. When canonical
  // per-card P&T flag lands we'll narrow this.
  const cards = CARDS;
  const ptTeam = CANNED_ENGINEERS.filter((e) => e.discipline === "P&T");

  return (
    <FlowDiagram
      stages={PT_STAGES}
      cards={cards}
      title="P&T Flow"
      subtitle="Plate & Tube discipline — parts drawn → programmed → shop release. Serves both A Shop and T Shop."
      summaryExtra={
        <span className="inline-flex items-baseline gap-1.5">
          <span className="tabular-nums font-bold text-[#064162] text-lg">{ptTeam.length}</span>
          <span className="text-slate-500 text-xs uppercase tracking-wider">P&amp;T engineers</span>
        </span>
      }
    />
  );
}
