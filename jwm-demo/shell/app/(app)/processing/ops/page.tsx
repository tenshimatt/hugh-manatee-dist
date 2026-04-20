import { SectionStub } from "@/components/chrome/SectionStub";
import { Users } from "lucide-react";

export default function ProcessingOpsPage() {
  return (
    <SectionStub
      eyebrow="Processing · Ops Manager + Client Services"
      title="Ops Manager + Client Services"
      description="Day-to-day Processing ops: client requests, order intake, status calls, and handoff to Estimating."
      icon={Users}
    />
  );
}
