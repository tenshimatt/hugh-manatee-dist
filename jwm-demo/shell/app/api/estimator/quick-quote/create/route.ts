/**
 * POST /api/estimator/quick-quote/create
 *
 * Body: QuickQuotePayload (see lib/quick-quote.ts)
 * Creates an ERPNext Quotation (or falls back to a canned SAL-QTN id) and
 * returns { ok, name, stubbed, grand_total }.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createQuickQuote,
  type QuickQuotePayload,
  type QuickQuoteLine,
} from "@/lib/quick-quote";

export const runtime = "nodejs";

function sanitizeLines(raw: unknown): QuickQuoteLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((l) => {
      const r = l as Record<string, unknown>;
      return {
        drawing_no: String(r.drawing_no ?? "").trim(),
        description: String(r.description ?? "").trim(),
        qty: Number(r.qty ?? 0),
        rate: Number(r.rate ?? 0),
        uom: r.uom ? String(r.uom) : undefined,
        notes: r.notes ? String(r.notes) : undefined,
      } as QuickQuoteLine;
    })
    .filter(
      (l) => (l.drawing_no || l.description) && l.qty > 0 && l.rate >= 0
    );
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Partial<QuickQuotePayload>;

  const customer = String(body.customer ?? "").trim();
  if (!customer) {
    return NextResponse.json(
      { ok: false, error: "customer_required" },
      { status: 400 }
    );
  }
  const lines = sanitizeLines(body.lines);
  if (lines.length === 0) {
    return NextResponse.json(
      { ok: false, error: "at_least_one_line_required" },
      { status: 400 }
    );
  }

  const payload: QuickQuotePayload = {
    customer,
    division: (body.division as QuickQuotePayload["division"]) || "",
    project_name: body.project_name?.toString() || "",
    valid_till: body.valid_till?.toString() || "",
    terms: body.terms?.toString() || "",
    lines,
  };

  try {
    const stored = await createQuickQuote(payload);
    return NextResponse.json({
      ok: true,
      name: stored.name,
      stubbed: stored.stubbed,
      grand_total: stored.grand_total,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 502 }
    );
  }
}
