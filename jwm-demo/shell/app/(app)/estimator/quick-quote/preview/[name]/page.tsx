/**
 * /estimator/quick-quote/preview/[name]
 *
 * Read-only preview of a created Quotation. Hydrates from the
 * /api/estimator/quick-quote/get endpoint (local store → ERPNext fallback).
 */

"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  FileOutput,
  ArrowLeft,
  Printer,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";

interface PreviewLine {
  drawing_no: string;
  description: string;
  qty: number;
  rate: number;
  uom?: string;
}
interface PreviewQuote {
  name: string;
  customer: string;
  division?: string;
  project_name?: string;
  valid_till?: string;
  terms?: string;
  subtotal: number;
  grand_total: number;
  lines: PreviewLine[];
  created_at: string;
  stubbed: boolean;
}

export default function QuickQuotePreviewPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const [quote, setQuote] = useState<PreviewQuote | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/estimator/quick-quote/get?name=${encodeURIComponent(name)}`,
          { cache: "no-store" }
        );
        const data = (await res.json()) as {
          ok: boolean;
          quote?: PreviewQuote;
          error?: string;
        };
        if (cancelled) return;
        if (!data.ok || !data.quote) {
          setErr(data.error || "not_found");
          return;
        }
        setQuote(data.quote);
      } catch (e) {
        if (!cancelled) setErr(String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [name]);

  if (err) {
    return (
      <div className="space-y-4">
        <Link
          href="/estimator/quick-quote"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[#064162]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Quick Quote
        </Link>
        <div className="jwm-card p-8 text-center">
          <div className="text-red-600 font-semibold">Couldn&apos;t load quote {name}</div>
          <div className="text-sm text-slate-500 mt-1">{err}</div>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="jwm-card p-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#064162]" />
        <div className="text-sm text-slate-500">Loading {name}…</div>
      </div>
    );
  }

  const erpUrl = process.env.NEXT_PUBLIC_ERPNEXT_URL
    ? `${process.env.NEXT_PUBLIC_ERPNEXT_URL}/app/quotation/${quote.name}`
    : `https://jwm-erp.beyondpandora.com/app/quotation/${quote.name}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Link
          href="/estimator/quick-quote"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[#064162]"
        >
          <ArrowLeft className="w-4 h-4" /> New quote
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print
          </Button>
          {!quote.stubbed && (
            <a href={erpUrl} target="_blank" rel="noreferrer">
              <Button variant="primary">
                <ExternalLink className="w-4 h-4" /> Open in ERPNext
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Banner */}
      <div
        className={`rounded-2xl p-5 border flex items-center gap-4 ${
          quote.stubbed
            ? "bg-amber-50 border-amber-200"
            : "bg-emerald-50 border-emerald-200"
        }`}
      >
        <div
          className={`h-12 w-12 rounded-xl flex items-center justify-center ${
            quote.stubbed ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-xs uppercase tracking-wide font-semibold text-slate-500">
              Quotation created
            </div>
            {quote.stubbed ? (
              <Badge tone="amber">Canned fallback — ERPNext offline</Badge>
            ) : (
              <Badge tone="green">Live in ERPNext</Badge>
            )}
          </div>
          <div className="text-xl font-bold text-[#064162] mt-0.5 font-mono">
            {quote.name}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide font-semibold text-slate-500">
            Grand total
          </div>
          <div className="text-2xl font-bold text-[#064162]">
            {formatMoney(quote.grand_total)}
          </div>
        </div>
      </div>

      {/* Header details */}
      <div className="jwm-card p-5 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Detail label="Customer" value={quote.customer || "—"} />
        <Detail label="Division" value={quote.division || "—"} />
        <Detail label="Project" value={quote.project_name || "—"} />
        <Detail label="Valid till" value={quote.valid_till || "—"} />
      </div>

      {/* Lines */}
      <div className="jwm-card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center gap-2">
          <FileOutput className="w-4 h-4 text-[#064162]" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Line items ({quote.lines.length})
          </span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 bg-slate-50 text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-2.5 font-semibold w-36">Drawing #</th>
              <th className="text-left px-2 py-2.5 font-semibold">Description</th>
              <th className="text-right px-2 py-2.5 font-semibold w-20">Qty</th>
              <th className="text-left px-2 py-2.5 font-semibold w-20">UoM</th>
              <th className="text-right px-2 py-2.5 font-semibold w-28">Rate</th>
              <th className="text-right px-4 py-2.5 font-semibold w-32">Ext.</th>
            </tr>
          </thead>
          <tbody>
            {quote.lines.map((l, i) => {
              const ext = l.qty * l.rate;
              return (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs text-[#064162]">
                    {l.drawing_no || "—"}
                  </td>
                  <td className="px-2 py-3 text-slate-800">{l.description || "—"}</td>
                  <td className="px-2 py-3 text-right text-slate-700">{l.qty}</td>
                  <td className="px-2 py-3 text-slate-600">{l.uom || "Nos"}</td>
                  <td className="px-2 py-3 text-right font-mono text-slate-700">
                    {formatMoney(l.rate)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                    {formatMoney(ext)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50">
              <td colSpan={5} className="px-4 py-3 text-right font-semibold text-slate-700">
                Subtotal
              </td>
              <td className="px-4 py-3 text-right font-mono text-slate-900">
                {formatMoney(quote.subtotal)}
              </td>
            </tr>
            <tr className="bg-[#064162] text-white">
              <td colSpan={5} className="px-4 py-3 text-right font-semibold">
                Grand total
              </td>
              <td className="px-4 py-3 text-right font-mono font-bold">
                {formatMoney(quote.grand_total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Terms */}
      {quote.terms && (
        <div className="jwm-card p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Terms
          </div>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{quote.terms}</p>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide font-semibold text-slate-500">
        {label}
      </div>
      <div className="text-base font-semibold text-slate-900 mt-0.5">{value}</div>
    </div>
  );
}
