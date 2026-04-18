import { NextRequest, NextResponse } from "next/server";
import { matchCannedResponse } from "@/lib/canned/ai-responses";
import { chatStream, liteLLMConfigured, type ChatMessage } from "@/lib/litellm";
import kpis from "@/lib/canned/kpis.json";
import { listWorkOrders, NCRS } from "@/lib/canned/work-orders";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are John, the JWM shop copilot — a plainspoken, knowledgeable Nashville-made operations assistant for John W. McDougall Co. You answer questions about on-time delivery, scrap rates, NCRs, work orders, and schedule risk, using the data provided as context. Be concise, lead with the answer, include specific numbers and job references. Speak with the quiet confidence of a veteran shop foreman — no corporate fluff. If data would be needed that you don't have, say so plainly.

If returning tabular data, embed it inline using the markers:
|TABLE|
col1,col2,col3
val,val,val
|/TABLE|
Keep tables to <=6 columns and <=10 rows. Otherwise use plain prose.

Keep the full response under 500 tokens.`;

function buildContext(): string {
  const wos = listWorkOrders()
    .slice(0, 10)
    .map((w) => ({
      wo: w.name,
      customer: w.customer,
      project: w.project,
      division: w.division,
      status: w.status,
      due: w.due_date,
      qty: w.qty,
      value: w.total_value,
      material_ready_pct: w.material_ready_pct,
    }));
  const ncrs = NCRS.slice(0, 6).map((n) => ({
    id: n.id,
    wo: n.wo,
    part: n.part,
    workstation: n.workstation,
    status: n.status,
    defect_type: n.defect_type,
    qty: n.qty_affected,
  }));
  return [
    `CURRENT KPIs (as of ${kpis.as_of}):`,
    JSON.stringify(kpis.kpis, null, 0),
    `DIVISION MIX: ${JSON.stringify(kpis.division_mix)}`,
    `WEEKLY SCHEDULE VS COMPLETED: ${JSON.stringify(kpis.weekly)}`,
    `TOP 10 ACTIVE WORK ORDERS:`,
    JSON.stringify(wos, null, 0),
    `RECENT NCRs:`,
    JSON.stringify(ncrs, null, 0),
    `RECENT ACTIVITY: ${JSON.stringify(kpis.activity)}`,
  ].join("\n\n");
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    query?: string;
    question?: string;
    history?: { role: "user" | "assistant"; text: string }[];
    stream?: boolean;
  };
  const question = (body.question || body.query || "").trim();
  if (!question) {
    return NextResponse.json({ error: "missing query" }, { status: 400 });
  }

  // Fallback: return canned JSON (matches legacy API shape).
  if (!liteLLMConfigured()) {
    return NextResponse.json({ ...matchCannedResponse(question), mode: "canned" });
  }

  // Non-streaming JSON path: preserved for compatibility with the existing AIChat
  // client that reads a single JSON response.
  if (body.stream === false || req.headers.get("accept") !== "text/event-stream") {
    const msgs: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: `CONTEXT DATA:\n${buildContext()}` },
      ...(body.history || []).map((h) => ({
        role: h.role,
        content: h.text,
      })) as ChatMessage[],
      { role: "user", content: question },
    ];
    try {
      let full = "";
      let usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | undefined;
      for await (const ev of chatStream({ messages: msgs, max_tokens: 500 })) {
        if (ev.delta) full += ev.delta;
        if (ev.usage) usage = ev.usage;
      }
      const parsed = parseTableMarkers(full);
      return NextResponse.json({
        text: parsed.text,
        table: parsed.table,
        followups: [],
        mode: "live",
        usage,
      });
    } catch (err) {
      console.error("ai/query live call failed, falling back to canned:", err);
      return NextResponse.json({
        ...matchCannedResponse(question),
        mode: "canned-fallback",
        error: String(err),
      });
    }
  }

  // SSE path (for clients that want true token streaming).
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      const msgs: ChatMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: `CONTEXT DATA:\n${buildContext()}` },
        ...(body.history || []).map((h) => ({ role: h.role, content: h.text })) as ChatMessage[],
        { role: "user", content: question },
      ];
      try {
        for await (const ev of chatStream({ messages: msgs, max_tokens: 500 })) {
          if (ev.delta) send({ delta: ev.delta });
          if (ev.done) send({ done: true, usage: ev.usage });
        }
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

/**
 * Extract |TABLE|...|/TABLE| blocks from model output into a structured table.
 * CSV-style inside the markers; first row is header.
 */
function parseTableMarkers(text: string): {
  text: string;
  table?: { columns: string[]; rows: string[][] };
} {
  const m = text.match(/\|TABLE\|([\s\S]*?)\|\/TABLE\|/);
  if (!m) return { text };
  const tableRaw = m[1].trim();
  const lines = tableRaw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return { text: text.replace(m[0], "").trim() };
  }
  const split = (l: string) => l.split(",").map((c) => c.trim());
  const columns = split(lines[0]);
  const rows = lines.slice(1).map(split);
  const cleaned = text.replace(m[0], "").trim();
  return { text: cleaned, table: { columns, rows } };
}
