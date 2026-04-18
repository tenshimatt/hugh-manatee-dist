import { NextResponse } from "next/server";
import canned from "@/lib/canned/anomaly.json";
import scrapData from "@/lib/canned/scrap-events.json";
import { chat, liteLLMConfigured } from "@/lib/litellm";
import { isLive, getScrapEventsHydrated, withinDays } from "@/lib/erpnext-live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ScrapEvent {
  event_id?: string;
  at?: string;
  workstation: string;
  part: string;
  reject_reason: string;
  qty: number;
  cost: number;
  wo?: string;
  customer?: string;
  operator?: string;
}

async function buildLiveScrapEvents(): Promise<{ window_days: number; events: ScrapEvent[] } | null> {
  try {
    const entries = await getScrapEventsHydrated(40);
    const recent = entries.filter((e) => withinDays(e.modified, 14));
    if (recent.length === 0) return null;
    const events: ScrapEvent[] = recent.flatMap((e) => {
      const items = e.items || [];
      return items.map((it, idx) => ({
        event_id: `${e.name}-${idx}`,
        at: e.posting_date || e.modified,
        workstation: e.jwm_workstation || "Unknown",
        part: it.item_code || it.item_name || "Unknown",
        reject_reason: (e.remarks || "unspecified").replace(/^\[[^\]]*\]\s*/, "").slice(0, 120),
        qty: Number(it.qty || 0),
        cost: Number(it.basic_rate || 0),
      }));
    });
    return events.length ? { window_days: 14, events } : null;
  } catch (err) {
    console.warn("[anomaly] live scrap fetch failed:", err);
    return null;
  }
}

const ANOMALY_PROMPT = `You analyze shop-floor scrap/reject events to detect operational anomalies. Look for:
- Workstation patterns (one station dominating recent rejects)
- Part / material patterns (same part failing repeatedly)
- Operator patterns (one operator accounting for a spike)
- Temporal clusters (rejects accelerating in a short window)

For each anomaly, output:
{
  "title": string,                  // one-line headline
  "workstation": string,
  "affected_jobs": [                // list of affected part/WO references
    { "wo": string, "customer": string, "part": string, "scrap_qty": number, "scrap_cost": number }
  ],
  "hypothesis": string,             // what you think is causing it
  "recommended_action": string,     // specific check or intervention
  "severity": "Low" | "Medium" | "High"
}

Return STRICT JSON ONLY with shape { "anomalies": [ ... ] }, sorted by severity descending. No prose, no markdown fences.

Limit your response to the TOP 3 anomalies. Keep hypothesis and recommended_action under 200 chars each. Include at most 8 affected_jobs per anomaly.`;

function stripFences(s: string): string {
  return s.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
}

export async function GET() {
  if (!liteLLMConfigured()) {
    return NextResponse.json({ ...canned, mode: "canned", source: "canned" });
  }

  // Prefer live ERPNext scrap data; fall back to canned fixtures if empty/err.
  let dataset: { window_days: number; events: ScrapEvent[] } = scrapData as typeof scrapData;
  let dataSource: "live" | "canned" = "canned";
  if (isLive()) {
    const live = await buildLiveScrapEvents();
    if (live && live.events.length >= 3) {
      dataset = live;
      dataSource = "live";
    }
  }

  try {
    const res = await chat({
      messages: [
        { role: "system", content: ANOMALY_PROMPT },
        {
          role: "user",
          content: `Recent scrap events (last ${dataset.window_days} days):\n${JSON.stringify(
            dataset.events
          )}`,
        },
      ],
      max_tokens: 4000,
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    let parsedRaw: string;
    try {
      JSON.parse(stripFences(res.content));
      parsedRaw = stripFences(res.content);
    } catch {
      console.warn("anomaly: first JSON parse failed, retrying. content head:", res.content.slice(0, 200), "tail:", res.content.slice(-200));
      const retry = await chat({
        messages: [
          { role: "system", content: ANOMALY_PROMPT + "\n\nReturn ONLY valid JSON. Be concise." },
          {
            role: "user",
            content: `Recent scrap events:\n${JSON.stringify(dataset.events)}`,
          },
        ],
        max_tokens: 4000,
        temperature: 0,
        response_format: { type: "json_object" },
      });
      parsedRaw = stripFences(retry.content);
    }
    const parsed = JSON.parse(parsedRaw) as {
      anomalies: Array<{
        title: string;
        workstation: string;
        affected_jobs: Array<{
          wo?: string;
          customer?: string;
          part: string;
          scrap_qty: number;
          scrap_cost: number;
        }>;
        hypothesis: string;
        recommended_action: string;
        severity: string;
      }>;
    };

    const top = parsed.anomalies?.[0];
    if (!top) {
      return NextResponse.json({ ...canned, mode: "canned-fallback", source: dataSource });
    }

    // Map to the UI Anomaly shape.
    return NextResponse.json({
      id: `ANOM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
      severity: top.severity === "High" ? "warn" : top.severity === "Medium" ? "warn" : "info",
      title: top.title,
      summary: `${top.affected_jobs.length} affected items · ${top.workstation}`,
      detected_at: new Date().toISOString(),
      hypothesis: top.hypothesis,
      evidence: deriveEvidence(top, dataset.events),
      affected_jobs: top.affected_jobs.map((j) => ({
        wo: j.wo || "-",
        customer: j.customer || "-",
        part: j.part,
        scrap_qty: j.scrap_qty,
        scrap_cost: j.scrap_cost,
      })),
      recommendations: [top.recommended_action],
      mode: "live",
      source: dataSource,
      all_anomalies: parsed.anomalies,
      usage: res.usage,
    });
  } catch (err) {
    console.error("anomaly live failed, using canned:", err);
    return NextResponse.json({
      ...canned,
      mode: "canned-fallback",
      source: "canned",
      error: String(err),
    });
  }
}

function deriveEvidence(
  top: { workstation: string; affected_jobs: Array<{ part: string }> },
  events: Array<{ workstation: string; part: string; reject_reason: string; cost: number; qty: number }>
): string[] {
  const ws = events.filter((e) => e.workstation === top.workstation);
  const totalCost = ws.reduce((s, e) => s + e.cost * e.qty, 0);
  const totalQty = ws.reduce((s, e) => s + e.qty, 0);
  const partSet = new Set(top.affected_jobs.map((j) => j.part));
  const affectedEvents = ws.filter((e) => partSet.has(e.part));
  const reasons = Array.from(new Set(affectedEvents.map((e) => e.reject_reason))).slice(0, 3);
  return [
    `${totalQty} scrap units across ${ws.length} events on ${top.workstation} in the 14-day window`,
    `Total scrap cost attributable to this workstation: $${totalCost.toLocaleString()}`,
    reasons.length ? `Common reject reasons: ${reasons.join("; ")}` : "",
    `Affected part numbers: ${Array.from(partSet).join(", ")}`,
  ].filter(Boolean);
}
