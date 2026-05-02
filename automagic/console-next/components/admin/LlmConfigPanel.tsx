"use client";

import { useState } from "react";
import { Check, Loader2, Zap, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ModelPricing } from "@/lib/api";

type Tone = "sky" | "teal" | "gold" | "green" | "slate";

interface Provider {
  label: string;
  tone: Tone;
  models: { value: string; label: string }[];
}

const PROVIDERS: Record<string, Provider> = {
  DeepSeek: {
    label: "DeepSeek",
    tone: "teal",
    models: [
      { value: "deepseek-v4-pro", label: "DeepSeek V4 Pro" },
      { value: "deepseek/deepseek-reasoner", label: "DeepSeek R1" },
    ],
  },
  Anthropic: {
    label: "Anthropic",
    tone: "sky",
    models: [
      { value: "anthropic/claude-opus-4-7", label: "Claude Opus 4.7" },
      { value: "anthropic/claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
      { value: "anthropic/claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
    ],
  },
  OpenAI: {
    label: "OpenAI",
    tone: "gold",
    models: [
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "o3-mini", label: "o3-mini" },
    ],
  },
  Google: {
    label: "Google",
    tone: "green",
    models: [
      { value: "gemini/gemini-2.5-pro-preview-03-25", label: "Gemini 2.5 Pro" },
      { value: "gemini/gemini-2.5-flash-preview-04-17", label: "Gemini 2.5 Flash" },
    ],
  },
  Ollama: {
    label: "Ollama (local)",
    tone: "slate",
    models: [
      { value: "ollama_chat/gpt-oss:20b", label: "GPT-OSS 20B" },
      { value: "ollama_chat/qwen3:8b", label: "Qwen3 8B" },
      { value: "ollama_chat/gemma4:e4b", label: "Gemma4 E4B" },
    ],
  },
};

function detectProvider(model: string | null): string {
  if (!model) return "DeepSeek";
  if (model.startsWith("deepseek")) return "DeepSeek";
  if (model.startsWith("anthropic") || model.includes("claude")) return "Anthropic";
  if (model.startsWith("gpt") || model.startsWith("o3") || model.startsWith("o1")) return "OpenAI";
  if (model.startsWith("gemini")) return "Google";
  if (model.startsWith("ollama")) return "Ollama";
  return "DeepSeek";
}

function PriceTag({ modelId, pricing }: { modelId: string; pricing: ModelPricing }) {
  const p = pricing[modelId];
  if (!p) return null;

  // Ollama = free
  if (p.input === 0 && p.output === 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
        <Zap className="w-3 h-3" />
        Free
      </span>
    );
  }

  const fmt = (n: number) =>
    n >= 1 ? `$${n.toFixed(2)}` : n >= 0.01 ? `$${n.toFixed(3)}` : `$${n.toFixed(4)}`;

  return (
    <span className="flex items-center gap-1.5 text-xs text-muted">
      <span title="Input price per 1M tokens" className="text-sky-brand/80">{fmt(p.input)}</span>
      <span className="text-muted/50">·</span>
      <span title="Output price per 1M tokens" className="text-amber-400/80">{fmt(p.output)}</span>
      <span className="text-muted/50">/1M</span>
      {p.source === "provider-docs" && (
        <Database className="w-2.5 h-2.5 text-muted/40" aria-label="Pricing from provider docs" />
      )}
    </span>
  );
}

interface Props {
  initial: { provider: string | null; model: string | null };
  pricing: ModelPricing;
}

export function LlmConfigPanel({ initial, pricing }: Props) {
  const initProvider = initial.provider ?? detectProvider(initial.model);
  const [provider, setProvider] = useState(initProvider);
  const [model, setModel] = useState(
    initial.model ?? PROVIDERS[initProvider]?.models[0]?.value ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleProviderChange(p: string) {
    setProvider(p);
    setModel(PROVIDERS[p]?.models[0]?.value ?? "");
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const r = await fetch("/api/admin/llm-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, model }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${r.status}`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const pDef = PROVIDERS[provider];

  return (
    <div className="space-y-5">
      {/* Provider selector */}
      <div>
        <label className="block text-xs uppercase tracking-wider text-muted font-semibold mb-2">
          Provider
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PROVIDERS).map(([key, def]) => (
            <button
              key={key}
              onClick={() => handleProviderChange(key)}
              className={[
                "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                provider === key
                  ? "bg-sky-brand text-white border-sky-brand shadow-sm"
                  : "bg-surface border-border text-muted-strong hover:bg-surface-alt",
              ].join(" ")}
            >
              {def.label}
            </button>
          ))}
        </div>
      </div>

      {/* Model selector */}
      <div>
        <label className="block text-xs uppercase tracking-wider text-muted font-semibold mb-2">
          Model
        </label>
        <div className="flex flex-col gap-1.5">
          {pDef?.models.map((m) => (
            <button
              key={m.value}
              onClick={() => { setModel(m.value); setSaved(false); }}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all",
                model === m.value
                  ? "bg-sky-brand/10 border-sky-brand text-foreground"
                  : "bg-surface border-border text-muted-strong hover:bg-surface-alt",
              ].join(" ")}
            >
              <span className="flex-1 text-sm">{m.label}</span>
              <span className="font-mono text-xs text-muted hidden sm:block">{m.value}</span>
              <PriceTag modelId={m.value} pricing={pricing} />
              {model === m.value && (
                <Check className="w-3.5 h-3.5 text-sky-brand flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted mt-2 flex items-center gap-1">
          <span className="text-sky-brand/80 font-medium">Blue</span> = input &nbsp;·&nbsp;
          <span className="text-amber-400/80 font-medium">Amber</span> = output &nbsp;·&nbsp;
          per 1M tokens &nbsp;·&nbsp;
          <Database className="w-2.5 h-2.5 inline" /> = from provider docs, not LiteLLM
        </p>
      </div>

      {/* Current selection + save */}
      <div className="flex items-center gap-3 pt-1">
        <Badge tone={pDef?.tone ?? "slate"}>{provider}</Badge>
        <span className="font-mono text-xs text-muted truncate">{model}</span>
        <div className="flex-1" />
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-sky-brand text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {saving ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
          ) : saved ? (
            <><Check className="w-3.5 h-3.5" /> Saved</>
          ) : (
            "Apply"
          )}
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <p className="text-xs text-muted border-t border-border pt-3">
        Saves the active provider and model. To apply to the live pipeline, update the
        model string in n8n WF-1a and WF-1b nodes.
      </p>
    </div>
  );
}
