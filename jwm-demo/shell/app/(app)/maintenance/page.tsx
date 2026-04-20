import { SectionStub } from "@/components/chrome/SectionStub";
import { Wrench } from "lucide-react";

export default function MaintenancePage() {
  return (
    <SectionStub
      eyebrow="Maintenance"
      title="Maintenance"
      description="Equipment log, preventive-maintenance schedule, work-request queue, and downtime tracking."
      icon={Wrench}
      phase="Phase 3"
    />
  );
}
