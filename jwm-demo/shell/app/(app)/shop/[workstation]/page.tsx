import { ShopFloorClient } from "./ShopFloorClient";
import { JOB_CARDS, NCRS, type JobCard } from "@/lib/canned/work-orders";
import { isLive, listJobCards } from "@/lib/erpnext-live";

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

  return (
    <ShopFloorClient
      workstation={workstation}
      label={meta.label}
      role={meta.role}
      cards={cards}
      ncrs={meta.role === "qc" ? NCRS : []}
    />
  );
}
