/**
 * ACM Flow (JWM1451-84) — Field Dims → Layout → Sketch → Programming → Released.
 *
 * ACM work is Architectural-only per Chris Ball's transcript (2026-04-20).
 * Filter proxy until an explicit ACM flag lands per card: division === "A"
 * (A Shop = Architectural).
 */
import { CARDS } from "@/lib/engineering-pipeline";
import { CANNED_ENGINEERS } from "@/lib/engineering-schedule";
import { FlowDiagram, type FlowStage } from "@/components/engineering/FlowDiagram";

const ACM_STAGES: FlowStage[] = [
  { key: "field_dims", label: "Field Dims", includes: ["uncategorized", "evaluating", "float"] },
  { key: "layout", label: "Layout (LO)", includes: ["layout", "layout_check"] },
  { key: "sketch", label: "Sketch", includes: ["sketch", "sketch_check", "correction"] },
  { key: "programming", label: "Programming", includes: ["cnc_prog", "laser_prog", "punch_prog", "prog_complete"] },
  { key: "released", label: "Released to Shop", includes: ["release_shop"], accent: "gold" },
];

export default function ACMFlowPage() {
  const cards = CARDS.filter((c) => c.division === "A");
  const acmTeam = CANNED_ENGINEERS.filter((e) => e.discipline === "ACM");

  return (
    <FlowDiagram
      stages={ACM_STAGES}
      cards={cards}
      title="ACM Flow"
      subtitle="Architectural ACM discipline — field dims → layout → sketch → programming → shop release."
      summaryExtra={
        <span className="inline-flex items-baseline gap-1.5">
          <span className="tabular-nums font-bold text-[#064162] text-lg">{acmTeam.length}</span>
          <span className="text-slate-500 text-xs uppercase tracking-wider">ACM engineers</span>
        </span>
      }
    />
  );
}
