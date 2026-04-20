import { SectionStub } from "@/components/chrome/SectionStub";
import { Send } from "lucide-react";

export default function ProcessingERFPage() {
  return (
    <SectionStub
      eyebrow="Processing · Release to Eng / Shop"
      title="Release to Engineering / Shop"
      description="Processing-flow mirror of the Architectural ERF: release packets flowing from Processing Estimating into Engineering and Shop Floor."
      icon={Send}
      note="Will reuse the ERF pattern from /arch/erf, scoped to Processing jobs."
    />
  );
}
