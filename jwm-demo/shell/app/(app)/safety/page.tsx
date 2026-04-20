import { SectionStub } from "@/components/chrome/SectionStub";
import { HardHat } from "lucide-react";

export default function SafetyPage() {
  return (
    <SectionStub
      eyebrow="Safety"
      title="Safety"
      description="Incident log, near-miss reports, training records, and audit schedule."
      icon={HardHat}
      phase="Phase 3"
    />
  );
}
