import { ShopFloorClient } from "./ShopFloorClient";
import { JOB_CARDS, NCRS, type JobCard } from "@/lib/canned/work-orders";
import { isLive, listJobCards } from "@/lib/erpnext-live";
import cannedAnomaly from "@/lib/canned/anomaly.json";

export const dynamic = "force-dynamic";

const WS_META: Record<string, { label: string; role: "floor" | "qc" }> = {
  "flat-laser-1": { label: "Flat Laser #1", role: "floor" },
  "flat-laser-2": { label: "Flat Laser #2", role: "floor" },
  "cnc-1": { label: "CNC Mill #1", role: "floor" },
  "press-brake-1": { label: "Press Brake #1", role: "floor" },
  "weld-bay-a": { label: "Weld Bay A", role: "floor" },
  "assembly-1": { label: "Assembly #1", role: "floor" },
  qc: { label: "QC Station", role: "qc" },
  shipping: { label: "Shipping", role: "floor" },
};

const SLUG_TO_ERP: Record<string, string> = {
  "flat-laser-1": "Flat Laser 1",
  "flat-laser-2": "Flat Laser 2",
  "cnc-1": "CNC 1",
  "press-brake-1": "Press Brake 1",
  "weld-bay-a": "Weld Bay A",
  "assembly-1": "Assembly 1",
  qc: "QC",
  shipping: "Shipping",
};

export default async function ShopPage({
  params,
}: {
  params: Promise<{ workstation: string }>;
}) {
  const { workstation } = await params;
  const meta = WS_META[workstation] || { label: workstation, role: "floor" };
  const cannedCards = JOB_CARDS.filter((c) => c.workstation === workstation);

  let cards: JobCard[] = cannedCards;
  if (isLive() && SLUG_TO_ERP[workstation]) {
    try {
      const jobs = await listJobCards(SLUG_TO_ERP[workstation], 50);
      if (jobs.length) {
        cards = jobs.map((j) => ({
          id: j.name,
          wo: "-",
          op_seq: 0,
          part: j.name,
          customer: "JWM",
          qty: 0,
          workstation,
          priority: j.status === "Work In Progress" ? "urgent" : "normal",
          est_hours: 0,
          instructions: `ERPNext Job Card ${j.name} (${j.status || "Open"}).`,
        }));
      }
    } catch (e) {
      console.warn("[shop] live fetch failed, using canned:", e);
    }
  }

  // Only surface the anomaly banner to the specific workstation it names.
  // Mirror the heuristic used by /shop and TopBar so the three surfaces agree.
  const anomaly = cannedAnomaly as unknown as {
    id: string;
    severity: string;
    title: string;
    summary: string;
    hypothesis: string;
    detected_at: string;
    evidence: string[];
    affected_jobs: { wo: string; customer: string; part: string; scrap_qty: number; scrap_cost: number }[];
    recommendations: string[];
  };
  const blob = `${anomaly.title} ${anomaly.summary}`.toLowerCase();
  let flagged = false;
  if (workstation === "flat-laser-2" && (blob.includes("laser #2") || blob.includes("laser 2"))) flagged = true;
  if (workstation === "flat-laser-1" && (blob.includes("laser #1") || blob.includes("laser 1"))) flagged = true;

  return (
    <ShopFloorClient
      workstation={workstation}
      label={meta.label}
      role={meta.role}
      cards={cards}
      ncrs={meta.role === "qc" ? NCRS : []}
      anomaly={flagged ? anomaly : null}
    />
  );
}
