import { NextRequest, NextResponse } from "next/server";
import { matchCannedResponse } from "@/lib/canned/ai-responses";
import { chatStream, liteLLMConfigured, type ChatMessage } from "@/lib/litellm";
import kpis from "@/lib/canned/kpis.json";
import { listWorkOrders, NCRS } from "@/lib/canned/work-orders";
import { listProjects } from "@/lib/canned/active-projects";
import { listPMs } from "@/lib/canned/pms";
import productionSchedule from "@/lib/canned/production-schedule.json";
import anomalyData from "@/lib/canned/anomaly.json";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are John, the JWM shop copilot — a plainspoken, knowledgeable Nashville-made operations assistant for John W. McDougall Co. You answer questions about on-time delivery, scrap rates, NCRs, work orders, the engineering pipeline, project health, budget, and schedule risk, using the data provided as context. Be concise, lead with the answer, include specific numbers and job references. Speak with the quiet confidence of a veteran shop foreman — no corporate fluff. If data would be needed that you don't have, say so plainly.

JWM has two divisions. Always use these names exactly:
- **A Shop** (code 1010) — Architectural division. Panels, facades, ACM, corrugated.
- **T Shop** (code 1040) — Processing division. Started with a Tube laser, hence T Shop.
Engineering, Shop Floor, Inventory, QC, Safety, Maintenance, and Fleet are **shared** between both divisions.

When the user's question maps to a live page in the app, you can recommend a link. Known routes:
- /exec/arch — Architectural Current Contracts dashboard (Sales, Pipeline, Backlog)
- /arch/pm and /arch/pm/{slug} — PMO "My Projects" home per PM (cole-norona, marc-ribar, dillon-bowman, matt-rasmussen)
- /arch/projects and /arch/projects/{id} — per-project dashboard (health, budget, margin, Field Install, COR)
- /engineering/pipeline — the engineering kanban (12 stages × 316 real job cards)
- /engineering/routes — per-job station sequences (Route DocType). 3 seeded: ROUTE-25071-IAD181 (active, 6 steps), ROUTE-24060-BM01 (active, NCR finishing side-branch), ROUTE-25067-FS02 (draft, 7 steps)
- /shop — shop floor overview
- /shop/scheduler — Drew's grid-shaped production schedule (THE view the team loved)
- /shop/ship-schedule — Drew's ship schedule with auto bottleneck detection (red 5+, amber 3-4, normal 1-2 jobs per ship date)
- /shop/efficiency — per-operator efficiency dashboard
- /shop/flat-laser-2 — workstation kiosk (currently flagged with an active anomaly)
- /qc — quality control
- /erf — engineering request form

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

  // Active projects (Dashboard-grade summaries)
  const projects = listProjects().map((p) => ({
    id: p.id,
    jobName: p.jobName,
    pm: p.pm.name,
    percentComplete: p.percentComplete,
    health: p.health.status,
    budgetHealth: p.budgetHealth.status,
    budgetPctSpent: p.budgetHealth.percentSpent,
    contract: p.budget.contract,
    remaining: p.budget.remaining,
    marginCurrent: p.margin?.current,
  }));

  // PMs with project counts
  const pms = listPMs().map((pm) => ({
    name: pm.name,
    slug: pm.slug,
    email: pm.email,
    title: pm.title,
    activeProjects: pm.projects.length,
    topProjects: pm.projects.slice(0, 3).map((pr) => `${pr.id} ${pr.jobName}`),
  }));

  // Engineering pipeline — stage counts and division mix from the 316 real cards
  const sched = productionSchedule as Array<Record<string, unknown>>;
  const stageCounts: Record<string, number> = {};
  const pmCounts: Record<string, number> = {};
  let aShop = 0;
  let tShop = 0;
  for (const row of sched) {
    const stage = String(row.stage || "unknown");
    stageCounts[stage] = (stageCounts[stage] || 0) + 1;
    const division = String(row.division || "");
    if (division === "A Shop" || division === "1010") aShop++;
    if (division === "T Shop" || division === "1040") tShop++;
    const pm = String(row.pm || "").trim();
    if (pm) pmCounts[pm] = (pmCounts[pm] || 0) + 1;
  }
  const topPMs = Object.entries(pmCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, count]) => `${name}: ${count}`);

  // Active anomaly
  const anom = anomalyData as {
    id: string;
    severity: string;
    title: string;
    summary: string;
    hypothesis: string;
    affected_jobs: { wo: string; scrap_cost: number }[];
  };
  const scrapCost = anom.affected_jobs.reduce((s, j) => s + j.scrap_cost, 0);

  return [
    `CURRENT KPIs (as of ${kpis.as_of}):`,
    JSON.stringify(kpis.kpis, null, 0),
    `DIVISION MIX (KPI): ${JSON.stringify(kpis.division_mix)}`,
    `WEEKLY SCHEDULE VS COMPLETED: ${JSON.stringify(kpis.weekly)}`,

    `ACTIVE PROJECTS (per-project dashboard data):`,
    JSON.stringify(projects, null, 0),

    `PROJECT MANAGERS (PMO):`,
    JSON.stringify(pms, null, 0),

    `ENGINEERING PIPELINE (316 real jobs from Production Schedule):`,
    `Stage counts: ${JSON.stringify(stageCounts)}`,
    `Division split: A Shop ${aShop} · T Shop ${tShop}`,
    `Top PMs by card count: ${topPMs.join(", ")}`,

    `ACTIVE ANOMALY ${anom.id} (${anom.severity}): ${anom.title}. ${anom.summary} Hypothesis: ${anom.hypothesis} Affected jobs: ${anom.affected_jobs.length}. Total scrap cost: $${scrapCost.toLocaleString()}. Surfaced at /shop/flat-laser-2.`,

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

  // Cost-aware model routing: Haiku for the common case, Sonnet on complex
  // queries (analytical keywords, or > 300 chars). Overrideable per request via
  // body.model. Cuts daily chat cost ~10x on everyday questions.
  const needsSonnet =
    question.length > 300 ||
    /\b(why|how|explain|compare|contrast|analy[sz]e|diagnose|root cause|trend|forecast)\b/i.test(
      question,
    );
  const chosenModel =
    (body as { model?: string }).model ||
    (needsSonnet
      ? process.env.LITELLM_MODEL_SONNET || "anthropic/claude-sonnet-4-6"
      : process.env.LITELLM_MODEL_HAIKU || "anthropic/claude-haiku-4-5");

  // Non-streaming JSON path: preserved for compatibility with the existing AIChat
  // client that reads a single JSON response.
  if (body.stream === false || req.headers.get("accept") !== "text/event-stream") {
    const msgs: ChatMessage[] = [
      // Both system messages cached ephemerally (5-min TTL). Saves ~50% of
      // input tokens on repeated chat-drawer queries within the window.
      { role: "system", content: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }] },
      { role: "system", content: [{ type: "text", text: `CONTEXT DATA:\n${buildContext()}`, cache_control: { type: "ephemeral" } }] },
      ...(body.history || []).map((h) => ({
        role: h.role,
        content: h.text,
      })) as ChatMessage[],
      { role: "user", content: question },
    ];
    try {
      let full = "";
      let usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | undefined;
      for await (const ev of chatStream({ messages: msgs, max_tokens: 500, model: chosenModel })) {
        if (ev.delta) full += ev.delta;
        if (ev.usage) usage = ev.usage;
      }
      const parsed = parseTableMarkers(full);
      return NextResponse.json({
        text: parsed.text,
        table: parsed.table,
        followups: [],
        mode: "live",
        model: chosenModel,
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
        for await (const ev of chatStream({ messages: msgs, max_tokens: 500, model: chosenModel })) {
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
