import { NextResponse } from "next/server";
import kpis from "@/lib/canned/kpis.json";
import {
  isLive,
  listWorkOrders,
  getWorkOrderLive,
  listNCRs,
  listScrapStockEntries,
  listRMAs,
  withinDays,
} from "@/lib/erpnext-live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Kpi = (typeof kpis)["kpis"][number];

function cloneKpi(k: Kpi, overrides: Partial<Kpi>): Kpi {
  return { ...k, ...overrides } as Kpi;
}

function fmtAgo(iso: string | undefined): string {
  if (!iso) return "";
  const t = Date.parse(iso.replace(" ", "T") + (iso.endsWith("Z") ? "" : "Z"));
  if (Number.isNaN(t)) return "";
  return new Date(t).toISOString();
}

function mapActivityKind(doctype: string, status?: string): string {
  if (doctype === "Work Order") {
    if (status === "Completed") return "WO_COMPLETE";
    return "WO_RELEASED";
  }
  if (doctype === "NCR") return "NCR_RAISED";
  if (doctype === "RMA") return "RMA_CREATED";
  return "ACTIVITY";
}

export async function GET() {
  if (!isLive()) {
    return NextResponse.json({ ...kpis, source: "canned" });
  }

  try {
    // Parallel fetches (small result counts — 20 WOs, 3 NCRs, ~30 scrap).
    const [wos, ncrs, scrap, rmas] = await Promise.all([
      listWorkOrders(100),
      listNCRs(100),
      listScrapStockEntries(100),
      listRMAs(50).catch(() => []),
    ]);

    // Active WOs
    const activeStatuses = new Set(["Not Started", "In Process"]);
    const active = wos.filter((w) => activeStatuses.has(w.status));

    // On-time: need dates → hydrate only Completed WOs (small set in demo).
    const completed = wos.filter((w) => w.status === "Completed");
    let otdValue = 0;
    let otdFallback = false;
    if (completed.length >= 3) {
      const details = await Promise.all(
        completed.map((w) => getWorkOrderLive(w.name).catch(() => null))
      );
      const dated = details.filter(
        (d): d is NonNullable<typeof d> => !!d && !!d.jwm_baseline_date && !!d.jwm_revised_date
      );
      if (dated.length >= 3) {
        const onTime = dated.filter((d) => (d.jwm_revised_date || "") <= (d.jwm_baseline_date || "")).length;
        otdValue = Math.round((onTime / dated.length) * 1000) / 10;
      } else {
        otdFallback = true;
      }
    } else {
      otdFallback = true;
    }

    // Scrap rate proxy: count scrap events in last 30d.
    const scrap30 = scrap.filter((s) => withinDays(s.modified, 30)).length;

    // Open NCRs: status != Closed
    // NCR list only has name+modified, need to hydrate for status. Small set (3).
    const ncrStatuses = await Promise.all(
      ncrs.map(async (n) => {
        try {
          const url = `${process.env.ERPNEXT_URL?.replace(/\/$/, "")}/api/resource/NCR/${encodeURIComponent(n.name)}`;
          const r = await fetch(url, {
            headers: {
              Authorization: `token ${process.env.ERPNEXT_API_KEY}:${process.env.ERPNEXT_API_SECRET}`,
            },
            cache: "no-store",
          });
          if (!r.ok) return { name: n.name, status: "Open" };
          const j = (await r.json()) as { data: { status?: string } };
          return { name: n.name, status: j.data.status || "Open" };
        } catch {
          return { name: n.name, status: "Open" };
        }
      })
    );
    const openNCRs = ncrStatuses.filter((n) => (n.status || "").toLowerCase() !== "closed").length;

    // Build kpi array preserving order/structure of canned.
    const baseByKey = Object.fromEntries(kpis.kpis.map((k) => [k.key, k as Kpi])) as Record<string, Kpi>;
    const liveKpis: Kpi[] = [
      otdFallback
        ? baseByKey["on_time_delivery"]
        : cloneKpi(baseByKey["on_time_delivery"], {
            value: otdValue,
            delta: 0,
            period: "all completed WOs",
          }),
      cloneKpi(baseByKey["active_work_orders"], {
        value: active.length,
        delta: 0,
        period: "now",
      }),
      cloneKpi(baseByKey["scrap_rate"], {
        value: scrap30,
        unit: "",
        label: "Scrap Events (30d)",
        delta: 0,
        period: "30d",
      }),
      cloneKpi(baseByKey["open_ncrs"], {
        value: openNCRs,
        delta: 0,
        period: "now",
      }),
    ];

    // Build activity feed from recent WO/NCR/RMA mods.
    type ActivityItem = { id: string; at: string; kind: string; text: string; actor: string };
    const items: ActivityItem[] = [];
    for (const w of wos.slice(0, 6)) {
      items.push({
        id: `wo-${w.name}`,
        at: fmtAgo(w.modified),
        kind: mapActivityKind("Work Order", w.status),
        text: `${w.name} — status ${w.status}`,
        actor: "ERPNext",
      });
    }
    for (const n of ncrStatuses.slice(0, 3)) {
      const nf = ncrs.find((x) => x.name === n.name);
      items.push({
        id: `ncr-${n.name}`,
        at: fmtAgo(nf?.modified),
        kind: "NCR_RAISED",
        text: `${n.name} — ${n.status}`,
        actor: "QC",
      });
    }
    for (const r of rmas.slice(0, 3)) {
      items.push({
        id: `rma-${r.name}`,
        at: fmtAgo(r.modified),
        kind: "RMA_CREATED",
        text: `${r.name} — RMA logged`,
        actor: "Service",
      });
    }
    items.sort((a, b) => (a.at < b.at ? 1 : -1));
    const activity = items.slice(0, 10);

    return NextResponse.json({
      as_of: new Date().toISOString(),
      kpis: liveKpis,
      division_mix: kpis.division_mix, // no permitted field to compute live; keep canned.
      weekly: kpis.weekly, // same — historical rollup not available via REST.
      activity: activity.length ? activity : kpis.activity,
      source: "live",
      notes: {
        otd_fallback: otdFallback,
        wo_total: wos.length,
        scrap_30d: scrap30,
        ncr_total: ncrs.length,
      },
    });
  } catch (e) {
    console.error("[kpis] live fetch failed, falling back:", e);
    return NextResponse.json({ ...kpis, source: "canned", error: String(e) });
  }
}
