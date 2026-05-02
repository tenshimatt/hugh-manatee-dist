import { admin } from "@/lib/api";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ExcludedProjectsPanel } from "@/components/admin/ExcludedProjectsPanel";
import { LlmConfigPanel } from "@/components/admin/LlmConfigPanel";
import { Settings, Brain, ShieldOff } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [llmConfig, excludedProjects] = await Promise.all([
    admin.llmConfig(),
    admin.excludedProjects(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Admin
        </h1>
        <p className="text-sm text-muted mt-1">
          Active AI provider, model configuration, and pipeline exclusions.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Provider
          </CardTitle>
        </CardHeader>
        <CardBody>
          <LlmConfigPanel
            initial={{ provider: llmConfig?.provider ?? null, model: llmConfig?.model ?? null }}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldOff className="w-4 h-4" />
            Excluded Plane Projects
          </CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-muted mb-4">
            Projects in this list are skipped during Plane sync — they will not appear in
            the project list or generate 403 errors in the index logs.
          </p>
          <ExcludedProjectsPanel initial={excludedProjects ?? []} />
        </CardBody>
      </Card>
    </div>
  );
}
