import { admin } from "@/lib/api";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExcludedProjectsPanel } from "@/components/admin/ExcludedProjectsPanel";
import { Settings, Brain, Key, ShieldOff } from "lucide-react";

export const dynamic = "force-dynamic";

function maskKey(key: string | null): string {
  if (!key) return "—";
  if (key.length <= 8) return "••••••••";
  return key.slice(0, 6) + "••••••••••••" + key.slice(-4);
}

function providerColor(provider: string | null): string {
  if (!provider) return "secondary";
  const p = provider.toLowerCase();
  if (p.includes("deepseek")) return "default";
  if (p.includes("anthropic")) return "secondary";
  if (p.includes("openai")) return "default";
  return "secondary";
}

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

      {/* AI Provider Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Provider
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-1">
                Provider
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={providerColor(llmConfig?.provider ?? null) as "default" | "secondary"}>
                  {llmConfig?.provider ?? "Unknown"}
                </Badge>
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-1">
                Model
              </div>
              <div className="font-mono text-sm text-foreground">
                {llmConfig?.model ?? "—"}
              </div>
              <div className="text-xs text-muted mt-0.5">
                Routed via LiteLLM gateway (CT 123)
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-1 flex items-center gap-1">
                <Key className="w-3 h-3" />
                API Key
              </div>
              <div className="font-mono text-sm text-foreground">
                {maskKey(llmConfig?.apiKeyHint ?? null)}
              </div>
              <div className="text-xs text-muted mt-0.5">
                Stored in LiteLLM env on CT 123
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border text-xs text-muted">
            Model is read from the active n8n WF-1a workflow nodes. To change provider/model,
            update the LiteLLM config on CT 123 and patch the model name in the n8n workflow.
          </div>
        </CardBody>
      </Card>

      {/* Excluded Projects Card */}
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
