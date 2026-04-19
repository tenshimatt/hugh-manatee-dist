/**
 * Quick Quote — types + ERPNext glue.
 *
 * Purpose: let a JWM estimator punch in a short line-item quote (drawing #,
 * description, qty, rate, notes) without ever opening the full Estimator
 * extraction flow. On submit we create a real ERPNext `Quotation` doc using
 * the generic `JWM-QUICK-QUOTE-LINE` Item, keeping the drawing/description
 * data on each Quotation Item row.
 *
 * If ERPNext is not reachable we fall back to a local canned quote id so
 * the demo never dead-ends.
 *
 * Usage (server route):
 *   import { createQuickQuote } from "@/lib/quick-quote";
 *   const { name, stubbed } = await createQuickQuote(payload);
 */

import { createDoc, erpnextConfigured, getList } from "./erpnext";

export const QUICK_QUOTE_ITEM_CODE = "JWM-QUICK-QUOTE-LINE";

export interface QuickQuoteLine {
  drawing_no: string;
  description: string;
  qty: number;
  rate: number;
  uom?: string;
  notes?: string;
}

export interface QuickQuotePayload {
  customer: string;
  division?: "Architectural" | "Processing" | "Mixed" | "";
  project_name?: string;
  valid_till?: string; // ISO yyyy-mm-dd
  terms?: string;
  lines: QuickQuoteLine[];
}

export interface QuickQuoteStored extends QuickQuotePayload {
  name: string;
  subtotal: number;
  grand_total: number;
  created_at: string;
  stubbed: boolean;
}

/** Simple in-memory store for canned/fallback quotes (demo only). */
const LOCAL_STORE = new Map<string, QuickQuoteStored>();

export function getLocalQuote(name: string): QuickQuoteStored | undefined {
  return LOCAL_STORE.get(name);
}

export function allLocalQuotes(): QuickQuoteStored[] {
  return [...LOCAL_STORE.values()].sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );
}

export function computeTotals(lines: QuickQuoteLine[]) {
  const subtotal = lines.reduce((s, l) => s + Number(l.qty || 0) * Number(l.rate || 0), 0);
  // Demo: no tax/shipping applied — grand_total === subtotal.
  return { subtotal, grand_total: subtotal };
}

/** Try to ensure the generic Quick-Quote Item exists in ERPNext. Best effort. */
async function ensureQuickQuoteItem(): Promise<void> {
  if (!erpnextConfigured()) return;
  try {
    const existing = await getList<{ name: string }>("Item", {
      filters: [["item_code", "=", QUICK_QUOTE_ITEM_CODE]],
      fields: ["name"],
      limit_page_length: 1,
    });
    if (existing.length > 0) return;
    await createDoc("Item", {
      item_code: QUICK_QUOTE_ITEM_CODE,
      item_name: "Quick Quote — Generic Line",
      item_group: "Services",
      is_stock_item: 0,
      is_sales_item: 1,
      is_purchase_item: 0,
      description:
        "Generic placeholder Item used by the Quick Quote UI. Real drawing # and spec live on each Quotation Item row (item_name / description / part_number).",
      standard_rate: 0,
    });
  } catch {
    // Non-fatal — Quotation POST will fail loudly if item truly missing.
  }
}

interface ErpQuotationResult {
  name: string;
  grand_total?: number;
}

export async function createQuickQuote(
  p: QuickQuotePayload
): Promise<QuickQuoteStored> {
  const totals = computeTotals(p.lines);

  if (erpnextConfigured()) {
    try {
      await ensureQuickQuoteItem();
      const items = p.lines.map((l) => ({
        item_code: QUICK_QUOTE_ITEM_CODE,
        item_name:
          l.drawing_no && l.description
            ? `${l.drawing_no} — ${l.description}`.slice(0, 140)
            : l.drawing_no || l.description || "Line",
        description:
          (l.notes ? `${l.description}\n\nNotes: ${l.notes}` : l.description) || "",
        part_number: l.drawing_no || undefined,
        qty: Number(l.qty) || 1,
        rate: Number(l.rate) || 0,
        uom: l.uom || "Nos",
        conversion_factor: 1,
      }));
      const payload: Record<string, unknown> = {
        quotation_to: "Customer",
        party_name: p.customer,
        customer_name: p.customer,
        transaction_date: new Date().toISOString().slice(0, 10),
        valid_till:
          p.valid_till ||
          new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
        order_type: "Sales",
        items,
        terms: p.terms || "",
      };
      // Custom div field — only sent if provided, ERPNext will ignore unknown keys gracefully on many versions
      if (p.division) payload["jwm_division"] = p.division;
      if (p.project_name) payload["jwm_project"] = p.project_name;

      const doc = await createDoc<ErpQuotationResult>("Quotation", payload);
      const stored: QuickQuoteStored = {
        ...p,
        name: doc.name,
        subtotal: totals.subtotal,
        grand_total: doc.grand_total ?? totals.grand_total,
        created_at: new Date().toISOString(),
        stubbed: false,
      };
      LOCAL_STORE.set(stored.name, stored);
      return stored;
    } catch (err) {
      // Fall through to canned path
      console.error("[quick-quote] ERPNext create failed, falling back:", err);
    }
  }

  // Canned fallback: mimic Frappe's "SAL-QTN-YYYY-NNNNN" naming.
  const year = new Date().getFullYear();
  const seq = (LOCAL_STORE.size + 31).toString().padStart(5, "0");
  const name = `SAL-QTN-${year}-${seq}`;
  const stored: QuickQuoteStored = {
    ...p,
    name,
    subtotal: totals.subtotal,
    grand_total: totals.grand_total,
    created_at: new Date().toISOString(),
    stubbed: true,
  };
  LOCAL_STORE.set(name, stored);
  return stored;
}
