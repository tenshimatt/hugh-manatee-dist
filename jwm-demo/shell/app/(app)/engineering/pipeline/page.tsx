import PipelineClient from "./PipelineClient";
import { CARDS as CANNED_CARDS, type Card as JobCardData } from "@/lib/engineering-pipeline";
import { isLive, listScheduleLines, stationToStage, type LivePSLine } from "@/lib/erpnext-live";

export const dynamic = "force-dynamic";

/** Convert a raw Production Schedule Line into the kanban Card shape.
 *  Unknown / missing bits fall back to conservative defaults so the UI
 *  never renders "undefined". */
function lineToCard(l: LivePSLine): JobCardData {
  const shop = (l.shop || "").toLowerCase();
  const division: "A" | "T" = shop.startsWith("arch") ? "A" : "T";
  const stage = stationToStage(l.station) as JobCardData["stage"];
  return {
    id: l.name,
    jobName: l.job_name || l.job_id || l.name,
    pm: "",
    stage,
    priority: "low",
    rankedPriority: null,
    division,
    department: l.shop || "Unknown",
    assignees: [],
    materialType: "",
    releaseType: "",
    description: "",
    miscMaterials: "",
    address: "",
    productionFolder: "",
    shipTarget: l.ship_target || null,
    releaseToShopTarget: null,
    releasedToShopActual: null,
    station: l.station || "",
    draftingHours: null,
    shopHours: l.est_hours ?? null,
    requiredProcesses: "",
    latestComment: "",
    engManager: "",
    drafter: "",
    checker: "",
    weekToShip: "",
  };
}

async function loadCards(): Promise<JobCardData[] | undefined> {
  if (!isLive()) return undefined;
  try {
    const lines = await listScheduleLines(2000);
    if (!lines.length) return undefined;
    // Cap per division at 500 to keep kanban snappy.
    const arch: LivePSLine[] = [];
    const proc: LivePSLine[] = [];
    for (const l of lines) {
      const shop = (l.shop || "").toLowerCase();
      if (shop.startsWith("arch")) {
        if (arch.length < 500) arch.push(l);
      } else {
        if (proc.length < 500) proc.push(l);
      }
    }
    return [...arch, ...proc].map(lineToCard);
  } catch (e) {
    console.warn("[engineering/pipeline] live fetch failed, using canned:", e);
    return undefined;
  }
}

export default async function EngineeringPipelinePage() {
  const cards = await loadCards();
  return <PipelineClient cards={cards ?? (CANNED_CARDS as JobCardData[])} />;
}
