"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2, Send, Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ErfStatus } from "@/lib/canned/erf";

/**
 * ReleaseActions — the bottom action strip for an ERF detail page.
 *
 * Surfaces the right CTA based on status:
 *  - "Ready to Release" → big green Release-to-Shop button (POST /release)
 *  - Anything else pending → secondary "Mark ready to release" (PATCH status)
 *  - Released → read-only link to the assigned Work Order
 */
export function ReleaseActions({
  erfId,
  status,
  assignedWo,
}: {
  erfId: string;
  status: ErfStatus;
  assignedWo?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [justReleased, setJustReleased] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function release() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/erf/${erfId}/release`, { method: "POST" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setJustReleased(j.wo);
      // Give the operator a beat to see the success state, then refresh.
      setTimeout(() => router.refresh(), 1200);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function markReady() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/erf/${erfId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Ready to Release" }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      router.refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  if (status === "Released" && assignedWo) {
    return (
      <section className="jwm-card p-5 border-l-4 border-[#064162]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#eaf3f8] text-[#064162] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-slate-800">Released to shop floor</div>
            <div className="text-xs text-slate-500">
              Work Order{" "}
              <Link href={`/planner/${assignedWo}`} className="font-mono text-[#064162] underline">
                {assignedWo}
              </Link>{" "}
              created.
            </div>
          </div>
          <Link href={`/planner/${assignedWo}`}>
            <Button variant="outline" size="md">
              Open in Planner →
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  if (justReleased) {
    return (
      <section className="jwm-card p-5 border-l-4 border-emerald-400 bg-emerald-50/40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-emerald-900">
              Released · Work Order {justReleased} created
            </div>
            <div className="text-xs text-emerald-800">
              Job cards are being provisioned for the shop floor.
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="jwm-card p-5 flex items-center justify-between flex-wrap gap-3">
      <div className="text-sm text-slate-600">
        {status === "Ready to Release" ? (
          <>All blockers cleared. Releasing will create a Work Order and populate shop-floor job cards.</>
        ) : (
          <>Not yet ready to release. Clear blockers, then mark ready or release directly.</>
        )}
      </div>
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-red-700">{error}</span>}
        {status !== "Ready to Release" && (
          <Button variant="outline" size="md" onClick={markReady} disabled={busy}>
            Mark ready
          </Button>
        )}
        <Button
          variant={status === "Ready to Release" ? "success" : "primary"}
          size="md"
          onClick={release}
          disabled={busy}
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Releasing…
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Release to shop
            </>
          )}
        </Button>
      </div>
    </section>
  );
}
