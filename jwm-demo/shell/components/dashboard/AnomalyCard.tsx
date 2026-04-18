"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";

interface Anomaly {
  id: string;
  title: string;
  summary: string;
  hypothesis: string;
  evidence: string[];
  affected_jobs: {
    wo: string;
    customer: string;
    part: string;
    scrap_qty: number;
    scrap_cost: number;
  }[];
  recommendations: string[];
}

export function AnomalyCard({ anomaly }: { anomaly: Anomaly }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left rounded-2xl p-5 border-l-4 border-[#e69b40] bg-gradient-to-r from-[#fdf2e3] to-white shadow-sm hover:shadow-md transition-shadow fade-in"
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#e69b40]/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-[#b97418]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#b97418]">
                Anomaly detected
              </span>
              <span className="text-[11px] text-slate-400">· {anomaly.id}</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              {anomaly.title}
            </h3>
            <p className="text-sm text-slate-600 mt-1">{anomaly.summary}</p>
            <div className="mt-2 text-xs text-[#064162] font-semibold">
              Click to investigate →
            </div>
          </div>
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-6 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 text-[#b97418] text-xs font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" /> Anomaly · {anomaly.id}
                </div>
                <h2 className="text-2xl font-bold text-[#064162] mt-1">
                  {anomaly.title}
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <section>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  Hypothesis
                </h3>
                <p className="mt-2 text-slate-700 leading-relaxed">
                  {anomaly.hypothesis}
                </p>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  Evidence
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                  {anomaly.evidence.map((e, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-[#e69b40]">•</span>
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  Affected Jobs
                </h3>
                <div className="mt-2 rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-left">
                        <th className="px-3 py-2 font-semibold text-slate-600">WO</th>
                        <th className="px-3 py-2 font-semibold text-slate-600">Customer</th>
                        <th className="px-3 py-2 font-semibold text-slate-600">Part</th>
                        <th className="px-3 py-2 font-semibold text-slate-600 text-right">Scrap</th>
                        <th className="px-3 py-2 font-semibold text-slate-600 text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {anomaly.affected_jobs.map((j) => (
                        <tr key={j.wo} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-mono text-[#064162]">{j.wo}</td>
                          <td className="px-3 py-2">{j.customer}</td>
                          <td className="px-3 py-2 text-slate-600">{j.part}</td>
                          <td className="px-3 py-2 text-right">{j.scrap_qty}</td>
                          <td className="px-3 py-2 text-right text-red-700 font-semibold">
                            {formatMoney(j.scrap_cost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  Recommendations
                </h3>
                <ol className="mt-2 space-y-1.5 text-sm text-slate-700 list-decimal list-inside">
                  {anomaly.recommendations.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ol>
              </section>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Dismiss
                </Button>
                <Button variant="gold">Create Maintenance WO</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
