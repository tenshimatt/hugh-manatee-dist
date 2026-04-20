// Stub — Phase-2 engineering resource schedule.
// Full implementation tracked as JWM1451-83.
// Foundation work (seed employees + nav tile) is JWM1451-86 / JWM1451-94.
import { Users } from "lucide-react";
import { SectionStub } from "@/components/chrome/SectionStub";

export default function EngineeringSchedulePage() {
  return (
    <SectionStub
      eyebrow="Engineering / Resource Planning"
      title="Resource Planning"
      description="14 engineers across ACM and Plate & Tube disciplines. Manager + IC capacity; drag work onto a person to book them."
      icon={Users}
      note="Roster seeded in ERPNext (Employee DocType, department=Engineering). UI drag-book flow arrives in Phase 2 — tracked as JWM1451-83."
    />
  );
}
