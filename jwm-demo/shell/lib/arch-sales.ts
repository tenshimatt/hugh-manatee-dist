/**
 * Arch Sales opportunity pipeline data layer.
 *
 * Canned-first (1,952 rows) with an ERPNext Opportunity-live fallback hook.
 * Mirrors the pattern in `erpnext-live.ts#getInventory()`:
 *   live path → if empty/error → canned path.
 *
 * Data source: lib/canned/arch-sales.json, parsed by
 *   scripts/parse-arch-sales.py from JWMCD Arch Sales (3).xlsx.
 */

import cannedRaw from "./canned/arch-sales.json";
import { ERPNEXT_URL, erpnextConfigured } from "./erpnext";

export type SalesStage =
  | "Active"
  | "Submitted"
  | "Won"
  | "Lost"
  | "No Bid"
  | "Other";

export interface Opportunity {
  id: string;
  projectName: string;
  stage: SalesStage;
  stageRaw: string | null;
  receivedDate: string | null;
  bidDate: string | null;
  closeProbability: number | null;
  totalBidValue: number | null;
  estimator: string | null;
  ballInCourt: string | null;
  city: string | null;
  state: string | null;
  contactName: string | null;
  company: string | null;
  customerCode: string | null;
  wonLostDate: string | null;
  jobType: string | null;
  installType: string | null;
  metalBidValue: number | null;
  glazingBidValue: number | null;
  markup: number | null;
  margin: number | null;
  totalNsf: number | null;
  actualCloseValue: number | null;
  forecastCloseValue: number | null;
  scope: string | null;
  bid1: number | null;
  bid2: number | null;
  bid3: number | null;
  bid4: number | null;
  followUpDate: string | null;
  year: number | null;
  latestComment: string | null;
}

export interface OpportunityBoard {
  opportunities: Opportunity[];
  source: "live" | "canned";
  fetchedAt: string;
}

/** Normalise the raw stage string to the 5-column kanban bucket. */
export function normaliseStage(raw: string | null | undefined): SalesStage {
  if (!raw) return "Other";
  const s = raw.trim().toLowerCase();
  if (s.startsWith("active") || s === "design" || s === "on hold") return "Active";
  if (s === "submitted") return "Submitted";
  if (s === "won") return "Won";
  if (s === "lost" || s === "replaced with new line") return "Lost";
  if (s === "not bid" || s === "no bid" || s === "no-bid") return "No Bid";
  return "Other";
}

interface CannedRow {
  projectName: string | null;
  stage: string | null;
  receivedDate: string | null;
  bidDate: string | null;
  closeProbability: number | null;
  totalBidValue: number | null;
  estimator: string | null;
  ballInCourt: string | null;
  city: string | null;
  state: string | null;
  contactName: string | null;
  company: string | null;
  customerCode: string | null;
  wonLostDate: string | null;
  jobType: string | null;
  installType: string | null;
  metalBidValue: number | null;
  glazingBidValue: number | null;
  markup: number | null;
  margin: number | null;
  totalNsf: number | null;
  actualCloseValue: number | null;
  forecastCloseValue: number | null;
  scope: string | null;
  bid1: number | null;
  bid2: number | null;
  bid3: number | null;
  bid4: number | null;
  followUpDate: string | null;
  year: number | null;
  latestComment: string | null;
}

function fromCanned(row: CannedRow, idx: number): Opportunity {
  return {
    id: `canned-${idx}`,
    projectName: row.projectName ?? "(unnamed)",
    stage: normaliseStage(row.stage),
    stageRaw: row.stage,
    receivedDate: row.receivedDate,
    bidDate: row.bidDate,
    closeProbability: row.closeProbability,
    totalBidValue: row.totalBidValue,
    estimator: row.estimator,
    ballInCourt: row.ballInCourt,
    city: row.city,
    state: row.state,
    contactName: row.contactName,
    company: row.company,
    customerCode: row.customerCode,
    wonLostDate: row.wonLostDate,
    jobType: row.jobType,
    installType: row.installType,
    metalBidValue: row.metalBidValue,
    glazingBidValue: row.glazingBidValue,
    markup: row.markup,
    margin: row.margin,
    totalNsf: row.totalNsf,
    actualCloseValue: row.actualCloseValue,
    forecastCloseValue: row.forecastCloseValue,
    scope: row.scope,
    bid1: row.bid1,
    bid2: row.bid2,
    bid3: row.bid3,
    bid4: row.bid4,
    followUpDate: row.followUpDate,
    year: row.year,
    latestComment: row.latestComment,
  };
}

function loadCanned(): Opportunity[] {
  const rows = cannedRaw as unknown as CannedRow[];
  return rows.map(fromCanned);
}

// ---------- ERPNext live path ----------

interface LiveOpportunity {
  name: string;
  customer_name?: string;
  party_name?: string;
  status?: string;
  transaction_date?: string;
  expected_closing?: string;
  probability?: number;
  opportunity_amount?: number;
  // JWM custom fields (best-effort — may or may not exist yet).
  jwm_project_name?: string;
  jwm_stage?: string;
  jwm_estimator?: string;
  jwm_ball_in_court?: string;
  jwm_city?: string;
  jwm_state?: string;
  jwm_job_type?: string;
  jwm_install_type?: string;
  jwm_total_bid_value?: number;
  jwm_metal_bid_value?: number;
  jwm_glazing_bid_value?: number;
  jwm_markup?: number;
  jwm_margin?: number;
  jwm_total_nsf?: number;
  jwm_actual_close_value?: number;
  jwm_forecast_close_value?: number;
  jwm_scope?: string;
  jwm_contact_name?: string;
  jwm_customer_code?: string;
  jwm_won_lost_date?: string;
  jwm_year?: number;
  jwm_latest_comment?: string;
}

function fromLive(row: LiveOpportunity): Opportunity {
  return {
    id: row.name,
    projectName: row.jwm_project_name || row.customer_name || row.name,
    stage: normaliseStage(row.jwm_stage || row.status),
    stageRaw: row.jwm_stage ?? row.status ?? null,
    receivedDate: row.transaction_date ?? null,
    bidDate: row.expected_closing ?? null,
    closeProbability: typeof row.probability === "number" ? row.probability / 100 : null,
    totalBidValue: row.jwm_total_bid_value ?? row.opportunity_amount ?? null,
    estimator: row.jwm_estimator ?? null,
    ballInCourt: row.jwm_ball_in_court ?? null,
    city: row.jwm_city ?? null,
    state: row.jwm_state ?? null,
    contactName: row.jwm_contact_name ?? null,
    company: row.customer_name ?? row.party_name ?? null,
    customerCode: row.jwm_customer_code ?? null,
    wonLostDate: row.jwm_won_lost_date ?? null,
    jobType: row.jwm_job_type ?? null,
    installType: row.jwm_install_type ?? null,
    metalBidValue: row.jwm_metal_bid_value ?? null,
    glazingBidValue: row.jwm_glazing_bid_value ?? null,
    markup: row.jwm_markup ?? null,
    margin: row.jwm_margin ?? null,
    totalNsf: row.jwm_total_nsf ?? null,
    actualCloseValue: row.jwm_actual_close_value ?? null,
    forecastCloseValue: row.jwm_forecast_close_value ?? null,
    scope: row.jwm_scope ?? null,
    bid1: null, bid2: null, bid3: null, bid4: null,
    followUpDate: null,
    year: row.jwm_year ?? null,
    latestComment: row.jwm_latest_comment ?? null,
  };
}

async function fetchLive(): Promise<Opportunity[]> {
  if (!erpnextConfigured()) return [];
  try {
    const fields = JSON.stringify([
      "name", "customer_name", "party_name", "status", "transaction_date",
      "expected_closing", "probability", "opportunity_amount",
      "jwm_project_name", "jwm_stage", "jwm_estimator", "jwm_ball_in_court",
      "jwm_city", "jwm_state", "jwm_job_type", "jwm_install_type",
      "jwm_total_bid_value", "jwm_metal_bid_value", "jwm_glazing_bid_value",
      "jwm_markup", "jwm_margin", "jwm_total_nsf",
      "jwm_actual_close_value", "jwm_forecast_close_value", "jwm_scope",
      "jwm_contact_name", "jwm_customer_code", "jwm_won_lost_date",
      "jwm_year", "jwm_latest_comment",
    ]);
    const url = `${ERPNEXT_URL}/api/resource/Opportunity?fields=${encodeURIComponent(fields)}&limit_page_length=2500&order_by=transaction_date%20desc`;
    const ctl = new AbortController();
    const tid = setTimeout(() => ctl.abort(), 5000);
    const res = await fetch(url, { cache: "no-store", signal: ctl.signal });
    clearTimeout(tid);
    if (!res.ok) return [];
    const body = (await res.json()) as { data?: LiveOpportunity[] };
    return (body.data ?? []).map(fromLive);
  } catch {
    return [];
  }
}

/** Load the opportunity board. Prefers live when it returns rows; else canned. */
export async function getOpportunities(): Promise<OpportunityBoard> {
  const canned = loadCanned();
  try {
    const live = await fetchLive();
    if (live.length > 0) {
      return { opportunities: live, source: "live", fetchedAt: new Date().toISOString() };
    }
  } catch {
    /* swallow */
  }
  return { opportunities: canned, source: "canned", fetchedAt: new Date().toISOString() };
}

// ---------- Formatting helpers ----------

export function fmtUsd(n: number | null | undefined, compact = true): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  if (compact) {
    if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  }
  return `$${Math.round(n).toLocaleString()}`;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function stageColour(stage: SalesStage): { bg: string; fg: string; border: string } {
  switch (stage) {
    case "Active":    return { bg: "bg-blue-500/15",   fg: "text-blue-300",   border: "border-blue-500/40" };
    case "Submitted": return { bg: "bg-amber-500/15",  fg: "text-amber-300",  border: "border-amber-500/40" };
    case "Won":       return { bg: "bg-emerald-500/15",fg: "text-emerald-300",border: "border-emerald-500/40" };
    case "Lost":      return { bg: "bg-rose-500/15",   fg: "text-rose-300",   border: "border-rose-500/40" };
    case "No Bid":    return { bg: "bg-slate-500/15",  fg: "text-slate-300",  border: "border-slate-500/40" };
    default:          return { bg: "bg-zinc-500/15",   fg: "text-zinc-300",   border: "border-zinc-500/40" };
  }
}

export interface SalesKpis {
  activeCount: number;
  activeValue: number;
  submittedCount: number;
  submittedValue: number;
  wonCount: number;
  wonValue: number;
  lostCount: number;
  winRate12mo: number; // 0..1
  totalCount: number;
  totalPipeline: number;  // active + submitted $
}

export function computeKpis(opps: Opportunity[]): SalesKpis {
  let activeCount = 0, activeValue = 0;
  let submittedCount = 0, submittedValue = 0;
  let wonCount = 0, wonValue = 0;
  let lostCount = 0;
  let won12 = 0, lost12 = 0;
  const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000;
  for (const o of opps) {
    const v = o.totalBidValue ?? 0;
    switch (o.stage) {
      case "Active":    activeCount++; activeValue += v; break;
      case "Submitted": submittedCount++; submittedValue += v; break;
      case "Won":       wonCount++; wonValue += (o.actualCloseValue ?? v); break;
      case "Lost":      lostCount++; break;
      default: break;
    }
    const d = o.wonLostDate ? Date.parse(o.wonLostDate) : NaN;
    if (Number.isFinite(d) && d >= cutoff) {
      if (o.stage === "Won") won12++;
      else if (o.stage === "Lost") lost12++;
    }
  }
  const winRate12mo = won12 + lost12 > 0 ? won12 / (won12 + lost12) : 0;
  return {
    activeCount, activeValue,
    submittedCount, submittedValue,
    wonCount, wonValue,
    lostCount,
    winRate12mo,
    totalCount: opps.length,
    totalPipeline: activeValue + submittedValue,
  };
}
