"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";

type Phase = "idle" | "uploading" | "reading" | "extracting" | "ready";

interface BomChild {
  id: string;
  name: string;
  qty: number;
  material: string;
  cut_method?: string;
  finish: string;
  unit_cost?: number;
  total_cost?: number;
}
interface Assembly {
  id: string;
  name: string;
  qty: number;
  material: string;
  finish: string;
  weight_lb?: number;
  children: BomChild[];
}
interface BomResult {
  estimate_id: string;
  customer: string;
  project_name: string;
  division: string;
  confidence: number;
  source_doc: string;
  pages: number;
  summary: {
    assemblies: number;
    subassemblies: number;
    line_items: number;
    estimated_material_cost: number;
    estimated_labor_hours: number;
    estimated_total: number;
  };
  assemblies: Assembly[];
  notes: string[];
}

const STATUS_LINES = [
  "Reading document structure…",
  "Identified 18 pages, 3 assembly drawings",
  "Extracting bill of materials with AI…",
  "Found 3 assemblies",
  "Identified 27 line items",
  "Matching part numbers to catalog…",
  "Cross-referencing historical JWM projects…",
  "Computing material + labor estimates…",
];

export default function EstimatorPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [statusIdx, setStatusIdx] = useState(0);
  const [bom, setBom] = useState<BomResult | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onDrop(files: FileList | null) {
    if (!files || !files.length) return;
    const file = files[0];
    setFileName(file.name);
    setPhase("uploading");
    await wait(600);
    setPhase("reading");
    await wait(500);
    setPhase("extracting");
    for (let i = 0; i < STATUS_LINES.length; i++) {
      setStatusIdx(i);
      await wait(380);
    }

    const res = await fetch("/api/estimator/extract", { method: "POST" });
    const data = (await res.json()) as BomResult;
    setBom(data);
    setPhase("ready");
  }

  async function createWO() {
    if (!bom) return;
    setCreating(true);
    const res = await fetch("/api/wo/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: bom.customer,
        project: bom.project_name,
        division: bom.division,
        bom_ref: bom.estimate_id,
      }),
    });
    const data = (await res.json()) as { name: string };
    router.push(`/planner/${data.name}`);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-[#064162] tracking-tight">
          Estimator → Bill of Materials
        </h1>
        <p className="text-slate-500 mt-1">
          Drop a customer RFQ or estimate PDF and JWM will extract a structured BOM,
          match parts to the catalog, and scaffold a Work Order.
        </p>
      </header>

      {phase === "idle" && (
        <button
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onDrop(e.dataTransfer.files);
          }}
          className="w-full min-h-[360px] rounded-3xl border-2 border-dashed border-slate-300 bg-white hover:border-[#064162] hover:bg-[#eaf3f8]/40 transition-colors flex flex-col items-center justify-center gap-4 p-10 text-center"
        >
          <div className="h-20 w-20 rounded-2xl bg-[#eaf3f8] flex items-center justify-center">
            <Upload className="w-10 h-10 text-[#064162]" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#064162]">
              Drop an estimate PDF here
            </div>
            <div className="text-slate-500 mt-1">
              Or click to browse · RFQ, drawings, quote PDFs (max 50MB)
            </div>
          </div>
          <div className="flex gap-2 mt-4 text-xs text-slate-400">
            <Badge tone="navy">Architectural</Badge>
            <Badge tone="gold">Processing</Badge>
            <Badge tone="slate">Multi-page</Badge>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={(e) => onDrop(e.target.files)}
          />
          <div className="text-[11px] text-slate-400 mt-2">
            Try demo: drop any PDF to see the canned Opryland Atrium stair extraction.
          </div>
        </button>
      )}

      {(phase === "uploading" || phase === "reading" || phase === "extracting") && (
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-4">
          <div className="jwm-card p-6 flex flex-col items-center justify-center min-h-[400px]">
            <div className="h-16 w-16 rounded-xl bg-[#eaf3f8] flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-[#064162]" />
            </div>
            <div className="font-semibold text-slate-700">{fileName}</div>
            <div className="text-xs text-slate-400 mt-1">
              {phase === "uploading" ? "Uploading…" : "18 pages · 4.2 MB"}
            </div>
            <div className="w-full mt-6 rounded-lg overflow-hidden border border-slate-200 aspect-[3/4] bg-white">
              <div className="h-full shimmer" />
            </div>
          </div>

          <div className="jwm-card p-6 space-y-5">
            <div className="flex items-center gap-2 text-[#064162] font-semibold">
              <Loader2 className="w-4 h-4 animate-spin" /> Extracting BOM with AI
            </div>
            <ul className="space-y-2">
              {STATUS_LINES.slice(0, Math.max(statusIdx + 1, 1)).map((s, i) => (
                <li
                  key={i}
                  className={`flex items-center gap-2 text-sm ${
                    i === statusIdx && phase === "extracting"
                      ? "text-[#064162] font-medium"
                      : "text-slate-600"
                  } fade-in`}
                >
                  {i < statusIdx ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin text-[#e69b40]" />
                  )}
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {phase === "ready" && bom && <BomResultView bom={bom} onCreate={createWO} creating={creating} />}
    </div>
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function BomResultView({
  bom,
  onCreate,
  creating,
}: {
  bom: BomResult;
  onCreate: () => void;
  creating: boolean;
}) {
  return (
    <div className="space-y-4 fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="green">
              <CheckCircle2 className="w-3 h-3" />
              {Math.round(bom.confidence * 100)}% confidence
            </Badge>
            <Badge tone="navy">{bom.division}</Badge>
            <span className="text-xs text-slate-500 font-mono">{bom.estimate_id}</span>
          </div>
          <h2 className="text-xl font-bold text-[#064162] mt-1">{bom.project_name}</h2>
          <div className="text-sm text-slate-500">{bom.customer}</div>
        </div>
        <Button variant="gold" size="lg" onClick={onCreate} disabled={creating}>
          {creating ? "Creating Work Order…" : "Create Work Order"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox label="Assemblies" value={bom.summary.assemblies} />
        <StatBox label="Line items" value={bom.summary.line_items} />
        <StatBox
          label="Material"
          value={formatMoney(bom.summary.estimated_material_cost)}
        />
        <StatBox
          label="Total est."
          value={formatMoney(bom.summary.estimated_total)}
          highlight
        />
      </div>

      <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-4">
        {/* PDF preview placeholder */}
        <div className="jwm-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" /> {bom.source_doc}
          </div>
          <div className="p-4 space-y-3 aspect-[3/4] overflow-y-auto bg-slate-50">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded shadow-sm p-4 text-xs text-slate-600 leading-relaxed border border-slate-200"
              >
                <div className="font-semibold text-[#064162] mb-2">
                  Page {i + 1} / {bom.pages}
                </div>
                <div className="h-2 w-3/4 bg-slate-100 rounded mb-1.5" />
                <div className="h-2 w-full bg-slate-100 rounded mb-1.5" />
                <div className="h-2 w-5/6 bg-slate-100 rounded mb-1.5" />
                <div className="h-2 w-2/3 bg-slate-100 rounded mb-1.5" />
                <div className="h-24 w-full bg-slate-100 rounded mt-3" />
              </div>
            ))}
          </div>
        </div>

        {/* BOM Tree */}
        <div className="jwm-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Extracted bill of materials (editable)
          </div>
          <div className="max-h-[650px] overflow-y-auto">
            {bom.assemblies.map((a) => (
              <AssemblyRow key={a.id} a={a} />
            ))}
          </div>
        </div>
      </div>

      {bom.notes?.length > 0 && (
        <div className="jwm-card p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            AI notes
          </div>
          <ul className="space-y-1.5 text-sm text-slate-700">
            {bom.notes.map((n, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[#e69b40]">•</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        highlight
          ? "bg-[#064162] text-white border-[#064162]"
          : "bg-white border-slate-200"
      }`}
    >
      <div
        className={`text-[11px] uppercase tracking-wide font-semibold ${
          highlight ? "text-white/70" : "text-slate-500"
        }`}
      >
        {label}
      </div>
      <div
        className={`text-xl font-bold mt-1 ${
          highlight ? "text-white" : "text-[#064162]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function AssemblyRow({ a }: { a: Assembly }) {
  const [open, setOpen] = useState(true);
  const total = a.children.reduce((s, c) => s + (c.total_cost || 0), 0);
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
        )}
        <span className="font-mono text-xs text-[#e69b40] font-bold w-10">{a.id}</span>
        <span className="font-semibold text-slate-900 flex-1">{a.name}</span>
        <span className="text-xs text-slate-500">qty {a.qty}</span>
        <span className="text-sm font-semibold text-[#064162] w-24 text-right">
          {formatMoney(total)}
        </span>
      </button>
      {open && (
        <div className="bg-slate-50/50">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500">
                <th className="text-left px-4 py-2 font-semibold w-16">ID</th>
                <th className="text-left px-2 py-2 font-semibold">Part</th>
                <th className="text-left px-2 py-2 font-semibold">Material</th>
                <th className="text-left px-2 py-2 font-semibold">Finish</th>
                <th className="text-right px-2 py-2 font-semibold">Qty</th>
                <th className="text-right px-4 py-2 font-semibold">Price</th>
              </tr>
            </thead>
            <tbody>
              {a.children.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-white">
                  <td className="px-4 py-2 font-mono text-slate-500">{c.id}</td>
                  <td className="px-2 py-2 text-slate-800">{c.name}</td>
                  <td className="px-2 py-2 text-slate-600">{c.material}</td>
                  <td className="px-2 py-2 text-slate-600">{c.finish}</td>
                  <td className="px-2 py-2 text-right text-slate-700">{c.qty}</td>
                  <td className="px-4 py-2 text-right font-mono text-slate-900">
                    {c.total_cost ? formatMoney(c.total_cost) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
