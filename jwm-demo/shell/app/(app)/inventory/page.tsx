import { SectionStub } from "@/components/chrome/SectionStub";
import { Boxes } from "lucide-react";

export default function InventoryPage() {
  return (
    <SectionStub
      eyebrow="Inventory"
      title="Inventory"
      description="Shared inventory across Architectural and Processing: raw stock, WIP, finished goods, bin locations."
      icon={Boxes}
      note="Chris corrected mid-call 2026-04-19: Inventory is shared, not per-division."
    />
  );
}
