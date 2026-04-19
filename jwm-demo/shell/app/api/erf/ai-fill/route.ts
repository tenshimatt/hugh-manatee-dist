import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/erf/ai-fill — "Help me fill this" stub.
 *
 * Returns canned field suggestions based on a short customer/project hint
 * the operator types into the new-ERF form. Intentionally NOT wired to the
 * Ask-John LiteLLM endpoint — different system prompt + output shape, and
 * the canned version is faster + demo-reliable.
 *
 * TODO: wire to LiteLLM /api/ai/query with an ERF-specific system prompt
 * that accepts {customer, project, notes} and returns structured ErfLineItem[]
 * + target_release date + division + priority. Phase 2.
 */

interface AiFillInput {
  customer?: string;
  project?: string;
  notes?: string;
}

interface AiFillResponse {
  division: "Architectural" | "Processing";
  priority: "low" | "normal" | "urgent";
  target_release: string;
  suggested_title: string;
  line_items: Array<{
    part: string;
    qty: number;
    uom: string;
    gauge?: string;
    material?: string;
  }>;
  rationale: string;
  source: "canned";
}

// Canned suggestion library — keyed off substrings found in the customer/project
// text. Fall-through default is a generic Architectural release.
const PATTERNS: Array<{
  match: RegExp;
  body: Omit<AiFillResponse, "suggested_title" | "target_release" | "source">;
}> = [
  {
    match: /opry|ryman|atrium|stair|stringer/i,
    body: {
      division: "Architectural",
      priority: "urgent",
      line_items: [
        { part: "Outer Stringer Plate", qty: 2, uom: "ea", gauge: "1/2\"", material: "A36" },
        { part: "Inner Stringer Plate", qty: 2, uom: "ea", gauge: "1/2\"", material: "A36" },
        { part: "Tread Pan (typ)", qty: 18, uom: "ea", gauge: "14ga", material: "CRS" },
        { part: "Handrail Pipe, 1.5\" sch40", qty: 120, uom: "lf", material: "A500" },
      ],
      rationale:
        "Pattern match: monumental-stair release. Standard 4-line stringer + tread + handrail kit from historical ERF-2026-0047.",
    },
  },
  {
    match: /nissan|railing|baluster/i,
    body: {
      division: "Architectural",
      priority: "normal",
      line_items: [
        { part: "Baluster, 5/8\" sq bar", qty: 320, uom: "ea", material: "A36" },
        { part: "Top Rail, 2x1 tube", qty: 180, uom: "lf", material: "A500" },
        { part: "Base Plate 4x4x3/8", qty: 40, uom: "ea", material: "A36" },
      ],
      rationale:
        "Pattern match: exterior railing retrofit. Baluster + top rail + base plate per historical Nissan HQ ERF.",
    },
  },
  {
    match: /vanderbilt|hvac|enclosure|panel/i,
    body: {
      division: "Processing",
      priority: "normal",
      line_items: [
        { part: "Enclosure Side Panel (L)", qty: 24, uom: "ea", gauge: "16ga", material: "CRS" },
        { part: "Enclosure Side Panel (R)", qty: 24, uom: "ea", gauge: "16ga", material: "CRS" },
        { part: "Top Cap w/ louvers", qty: 12, uom: "ea", gauge: "14ga", material: "CRS" },
      ],
      rationale: "Pattern match: HVAC enclosure. Standard L/R side panel + louvered cap bundle.",
    },
  },
  {
    match: /music city|mcc|facade|sunshade|acm/i,
    body: {
      division: "Architectural",
      priority: "normal",
      line_items: [
        { part: "Sunshade Blade, ACM 3mm", qty: 64, uom: "ea", material: "ACM" },
        { part: "Attachment Bracket", qty: 128, uom: "ea", gauge: "3/16\"", material: "A36" },
      ],
      rationale: "Pattern match: ACM facade. Sunshade blades + attachment brackets per MCC historical.",
    },
  },
];

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as AiFillInput;
  const blob = `${body.customer || ""} ${body.project || ""} ${body.notes || ""}`;

  const match = PATTERNS.find((p) => p.match.test(blob));
  const today = new Date();
  const release = new Date(today.getTime() + 7 * 86400_000).toISOString().slice(0, 10);
  const title =
    (body.project && body.project.slice(0, 80)) ||
    (body.customer ? `${body.customer} — New Release` : "New Engineering Release");

  const payload: AiFillResponse = match
    ? {
        ...match.body,
        suggested_title: title,
        target_release: release,
        source: "canned",
      }
    : {
        division: "Architectural",
        priority: "normal",
        line_items: [
          { part: "TBD — awaiting drawings", qty: 0, uom: "ea" },
        ],
        rationale:
          "No pattern match. Defaulting to Architectural/normal with a single TBD line. Edit manually.",
        suggested_title: title,
        target_release: release,
        source: "canned",
      };

  // Simulated "thinking" latency so the UX feels AI-ish, ~500ms.
  await new Promise((r) => setTimeout(r, 500));

  return NextResponse.json(payload);
}
