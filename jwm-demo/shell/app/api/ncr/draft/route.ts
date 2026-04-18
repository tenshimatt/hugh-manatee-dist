import { NextRequest, NextResponse } from "next/server";
import { chat, liteLLMConfigured, type ChatMessage } from "@/lib/litellm";

export const runtime = "nodejs";

const NCR_PROMPT = `You draft a Non-Conformance Report from a shop-floor operator's raw observation.

Return STRICT JSON only (no prose, no fences) with these fields:
{
  "title": string,                         // <= 15 words, plain English
  "category": "Dimensional" | "Material" | "Process" | "Finish" | "Other",
  "severity": "Minor" | "Major" | "Critical",
  "description": string,                   // operator observation expanded into a clear NCR narrative
  "suspected_cause": string,               // hypothesis based on observation
  "recommended_disposition": "Rework" | "Scrap" | "Use As Is" | "Return to Supplier",
  "quarantine_qty": number | "TBD",
  "investigator_recommended": "Work Center Lead" | "Quality Manager" | "Engineering"
}

Guidance:
- Severity: Minor = cosmetic or single unit, in-spec rework; Major = multiple units or functional risk; Critical = customer-visible failure risk, safety, or widespread contamination.
- Be specific. Quote numbers the operator provided. Do not invent measurements.`;

interface NCRAIFields {
  title: string;
  category: string;
  severity: string;
  description: string;
  suspected_cause: string;
  recommended_disposition: string;
  quarantine_qty: number | string;
  investigator_recommended: string;
}

function cannedDraft(body: {
  text?: string;
  workstation?: string;
  wo?: string;
  part?: string;
  photos?: string[];
}) {
  const text = (body.text || "").trim();
  const workstation = body.workstation || "unspecified workstation";
  const qtyMatch = text.match(/\b(\d+)\s*(pc|pcs|pieces?|parts?)?\b/i);
  const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
  let defectType = "General non-conformance";
  if (/porosity|pinhole|gas/i.test(text)) defectType = "Weld porosity";
  else if (/burr|edge|finish|scratch/i.test(text)) defectType = "Surface finish";
  else if (/bend|angle|radius|form/i.test(text)) defectType = "Dimensional — form";
  else if (/kerf|cut|slag|dross|laser/i.test(text)) defectType = "Dimensional — cut";
  else if (/oversize|undersize|tolerance|out of spec/i.test(text))
    defectType = "Dimensional — tolerance";

  return {
    id: `NCR-DRAFT-${Date.now().toString(36).toUpperCase()}`,
    status: "Draft from Floor",
    workstation,
    wo: body.wo || "",
    part: body.part || "Unspecified",
    defect_type: defectType,
    qty_affected: qty,
    description: text || "(no description provided)",
    suggested_disposition:
      defectType.startsWith("Dimensional")
        ? "Rework (verify against spec before continuing)"
        : "Segregate for QC review",
    photos: body.photos || [],
    raised_at: new Date().toISOString(),
    ai_confidence: 0.82,
    mode: "canned",
  };
}

function stripFences(s: string): string {
  return s.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    text?: string;
    observation?: string;
    workstation?: string;
    wo?: string;
    part?: string;
    operation?: string;
    photos?: string[];
    photo_data_url?: string;
  };

  const observation = (body.observation || body.text || "").trim();

  if (!liteLLMConfigured()) {
    return NextResponse.json(cannedDraft(body));
  }

  const userParts: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [
    {
      type: "text",
      text: [
        `Workstation: ${body.workstation || "unspecified"}`,
        `Operation: ${body.operation || "unspecified"}`,
        `Work Order: ${body.wo || "unspecified"}`,
        `Part: ${body.part || "unspecified"}`,
        `Operator observation: ${observation || "(no text provided)"}`,
      ].join("\n"),
    },
  ];
  if (body.photo_data_url) {
    userParts.push({
      type: "image_url",
      image_url: { url: body.photo_data_url },
    });
  }

  const messages: ChatMessage[] = [
    { role: "system", content: NCR_PROMPT },
    { role: "user", content: userParts },
  ];

  try {
    const res = await chat({
      messages,
      max_tokens: 700,
      temperature: 0.2,
      response_format: { type: "json_object" },
    });
    let parsed: NCRAIFields;
    try {
      parsed = JSON.parse(stripFences(res.content)) as NCRAIFields;
    } catch {
      const retry = await chat({
        messages: [
          { role: "system", content: NCR_PROMPT + "\n\nReturn ONLY valid JSON." },
          { role: "user", content: userParts },
        ],
        max_tokens: 700,
        temperature: 0,
        response_format: { type: "json_object" },
      });
      parsed = JSON.parse(stripFences(retry.content)) as NCRAIFields;
    }

    const qty =
      typeof parsed.quarantine_qty === "number"
        ? parsed.quarantine_qty
        : 0;

    return NextResponse.json({
      id: `NCR-DRAFT-${Date.now().toString(36).toUpperCase()}`,
      status: "Draft from Floor",
      workstation: body.workstation || "unspecified",
      wo: body.wo || "",
      part: body.part || "Unspecified",
      title: parsed.title,
      category: parsed.category,
      severity: parsed.severity,
      defect_type: `${parsed.category} — ${parsed.title}`,
      description: parsed.description,
      suspected_cause: parsed.suspected_cause,
      suggested_disposition: parsed.recommended_disposition,
      investigator_recommended: parsed.investigator_recommended,
      qty_affected: qty || 0,
      quarantine_qty: parsed.quarantine_qty,
      photos: body.photos || [],
      raised_at: new Date().toISOString(),
      ai_confidence: 0.9,
      mode: "live",
      usage: res.usage,
    });
  } catch (err) {
    console.error("ncr/draft live failed, using canned:", err);
    return NextResponse.json({
      ...cannedDraft(body),
      mode: "canned-fallback",
      error: String(err),
    });
  }
}
