import { NextRequest, NextResponse } from "next/server";
import cannedBom from "@/lib/canned/estimate-001-bom.json";
import { chat, liteLLMConfigured } from "@/lib/litellm";

export const runtime = "nodejs";
export const maxDuration = 60;

const EXTRACTION_PROMPT = `You are a structured-data extractor for sheet-metal / structural-steel fabrication RFQs and estimate PDFs. Given raw OCR/text extracted from a customer estimate or RFQ, produce a Bill of Materials as strict JSON matching this schema:

{
  "customer": string,
  "project": string,
  "division": "Processing" | "Architectural" | "Mixed",
  "assemblies": [
    {
      "name": string,
      "qty": number,
      "parts": [
        {
          "part_number": string,
          "description": string,
          "qty": number,
          "uom": string,
          "material": string,
          "finish": string,
          "unit_price": number,
          "extended": number
        }
      ]
    }
  ],
  "totals": { "subtotal": number, "tax": number, "shipping": number, "grand_total": number }
}

Rules:
- Infer division: "Architectural" if stairs/railings/facade/balconies; "Processing" if brackets/enclosures/plates for industrial use; "Mixed" if clearly both.
- Preserve all line items. If a column is missing, make your best inference and keep the shape consistent. Use "" for unknown strings and 0 for unknown numbers.
- Return ONLY JSON, no prose, no markdown fences.`;

async function parsePdf(buf: Buffer): Promise<{ text: string; pages: number }> {
  // pdf-parse v2 exposes a PDFParse class (ESM).
  const mod = await import("pdf-parse");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PDFParse = (mod as any).PDFParse || (mod as any).default?.PDFParse;
  if (!PDFParse) throw new Error("pdf-parse: PDFParse class not found");
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  const result = await parser.getText();
  const pages =
    (result.pages && result.pages.length) ||
    result.total ||
    result.numPages ||
    0;
  const text =
    typeof result.text === "string"
      ? result.text
      : Array.isArray(result.pages)
      ? result.pages.map((p: { text?: string }) => p.text || "").join("\n\n")
      : "";
  await parser.destroy?.();
  return { text, pages };
}

export async function POST(req: NextRequest) {
  const wantStream =
    req.headers.get("accept") === "text/event-stream" ||
    req.nextUrl.searchParams.get("stream") === "1";

  // Canned fallback when LiteLLM isn't configured
  if (!liteLLMConfigured()) {
    return NextResponse.json({ ...cannedBom, mode: "canned" });
  }

  // Try to read PDF from multipart body. If no file, return canned (keeps demo working).
  let pdfBuf: Buffer | null = null;
  let pdfName = "";
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const f = form.get("file");
    if (f && f instanceof File) {
      pdfBuf = Buffer.from(await f.arrayBuffer());
      pdfName = f.name;
    }
  }
  if (!pdfBuf) {
    // No PDF uploaded — return canned BOM for the demo shell default flow
    return NextResponse.json({ ...cannedBom, mode: "canned-no-upload" });
  }

  if (wantStream) {
    return streamExtraction(pdfBuf, pdfName);
  }

  try {
    const { text, pages } = await parsePdf(pdfBuf);
    const bom = await extractBom(text);
    return NextResponse.json({
      ...reshape(bom, pdfName, pages),
      mode: "live",
    });
  } catch (err) {
    console.error("estimator extract live failed, returning canned:", err);
    return NextResponse.json({
      ...cannedBom,
      mode: "canned-fallback",
      error: String(err),
    });
  }
}

function streamExtraction(pdfBuf: Buffer, pdfName: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        send({ status: "Reading PDF" });
        const { text, pages } = await parsePdf(pdfBuf);
        send({ status: "Extracting line items", pages, chars: text.length });
        const bom = await extractBom(text);
        send({ status: "Matching parts" });
        const shaped = reshape(bom, pdfName, pages);
        send({ status: "Done", bom: shaped });
      } catch (err) {
        send({ error: String(err) });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function extractBom(pdfText: string): Promise<any> {
  const trimmed = pdfText.slice(0, 60000); // keep under token budget
  const first = await chat({
    messages: [
      { role: "system", content: EXTRACTION_PROMPT },
      { role: "user", content: `PDF TEXT:\n\n${trimmed}` },
    ],
    max_tokens: 4000,
    temperature: 0.1,
    response_format: { type: "json_object" },
  });
  try {
    return JSON.parse(stripFences(first.content));
  } catch {
    // One retry, stricter.
    const retry = await chat({
      messages: [
        {
          role: "system",
          content:
            "You previously produced invalid JSON. Return ONLY a valid JSON object, no prose, no markdown fences. Schema unchanged.",
        },
        { role: "user", content: `Fix this into valid JSON:\n${first.content}` },
      ],
      max_tokens: 4000,
      temperature: 0,
      response_format: { type: "json_object" },
    });
    return JSON.parse(stripFences(retry.content));
  }
}

function stripFences(s: string): string {
  return s
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

/**
 * Reshape the Claude-produced BOM into the structure the estimator UI expects.
 * UI shape: { estimate_id, customer, project_name, division, confidence, source_doc, pages,
 *             summary{...}, assemblies[{id,name,qty,material,finish,children:[{...}]}], notes }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reshape(bom: any, sourceDoc: string, pages: number): Record<string, unknown> {
  const assemblies = Array.isArray(bom.assemblies) ? bom.assemblies : [];
  let lineItems = 0;
  let subassemblies = 0;
  const shapedAssemblies = assemblies.map((a: Record<string, unknown>, i: number) => {
    const parts = Array.isArray(a.parts) ? (a.parts as Record<string, unknown>[]) : [];
    lineItems += parts.length;
    subassemblies += parts.length;
    return {
      id: `A${i + 1}`,
      name: String(a.name || `Assembly ${i + 1}`),
      qty: Number(a.qty) || 1,
      material: String((parts[0]?.material as string) || ""),
      finish: String((parts[0]?.finish as string) || ""),
      children: parts.map((p, j) => ({
        id: `A${i + 1}.${j + 1}`,
        name: String(p.description || p.part_number || `Part ${j + 1}`),
        qty: Number(p.qty) || 1,
        material: String(p.material || ""),
        finish: String(p.finish || ""),
        unit_cost: Number(p.unit_price) || 0,
        total_cost:
          Number(p.extended) ||
          (Number(p.unit_price) || 0) * (Number(p.qty) || 1),
      })),
    };
  });

  const totals = (bom.totals || {}) as Record<string, number>;
  const grand = Number(totals.grand_total) || 0;
  const subtotal = Number(totals.subtotal) || grand;
  return {
    estimate_id: `EST-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
    customer: String(bom.customer || ""),
    project_name: String(bom.project || ""),
    division: String(bom.division || "Architectural"),
    extracted_at: new Date().toISOString(),
    confidence: 0.9,
    source_doc: sourceDoc,
    pages,
    summary: {
      assemblies: shapedAssemblies.length,
      subassemblies,
      line_items: lineItems,
      estimated_material_cost: subtotal,
      estimated_labor_hours: 0,
      estimated_total: grand || subtotal,
    },
    assemblies: shapedAssemblies,
    notes: [],
    // Also include the raw Claude BOM under `raw` so consumers can access
    // the strict schema if they want.
    raw: bom,
  };
}
