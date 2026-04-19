/**
 * GET /api/estimator/quick-quote/get?name=SAL-QTN-2026-00031
 *
 * Returns a stored quote. Looks in the local (canned/fallback) store first —
 * if not found and ERPNext is configured, fetches the Quotation doc from
 * ERPNext and shapes it back into a QuickQuoteStored.
 */

import { NextRequest, NextResponse } from "next/server";
import { getLocalQuote, QUICK_QUOTE_ITEM_CODE } from "@/lib/quick-quote";
import { erpnextConfigured, getDoc } from "@/lib/erpnext";

export const runtime = "nodejs";

interface ErpQuotation {
  name: string;
  customer_name?: string;
  party_name?: string;
  transaction_date?: string;
  valid_till?: string;
  grand_total?: number;
  net_total?: number;
  terms?: string;
  jwm_division?: string;
  jwm_project?: string;
  items?: Array<{
    item_code?: string;
    item_name?: string;
    description?: string;
    part_number?: string;
    qty?: number;
    rate?: number;
    uom?: string;
    amount?: number;
  }>;
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name") || "";
  if (!name) {
    return NextResponse.json({ ok: false, error: "name_required" }, { status: 400 });
  }

  const local = getLocalQuote(name);
  if (local) return NextResponse.json({ ok: true, quote: local });

  if (!erpnextConfigured()) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  try {
    const doc = await getDoc<ErpQuotation>("Quotation", name);
    const lines = (doc.items || [])
      .filter((it) => it.item_code === QUICK_QUOTE_ITEM_CODE)
      .map((it) => ({
        drawing_no: it.part_number || "",
        description:
          // strip "drawing — " prefix from item_name if we prepended it
          (it.item_name && it.part_number && it.item_name.startsWith(it.part_number + " — ")
            ? it.item_name.slice(it.part_number.length + 3)
            : it.item_name) || it.description || "",
        qty: Number(it.qty || 0),
        rate: Number(it.rate || 0),
        uom: it.uom,
      }));
    return NextResponse.json({
      ok: true,
      quote: {
        name: doc.name,
        customer: doc.party_name || doc.customer_name || "",
        division: doc.jwm_division || "",
        project_name: doc.jwm_project || "",
        valid_till: doc.valid_till || "",
        terms: doc.terms || "",
        subtotal: Number(doc.net_total || 0),
        grand_total: Number(doc.grand_total || 0),
        lines,
        created_at: doc.transaction_date || new Date().toISOString(),
        stubbed: false,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 404 }
    );
  }
}
