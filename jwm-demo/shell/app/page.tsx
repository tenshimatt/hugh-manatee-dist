"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ProjectMarquee } from "@/components/ProjectMarquee";

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [stubLoading, setStubLoading] = useState(false);

  // Primary: real Authentik SSO via NextAuth. Use the official signIn() helper
  // so CSRF token + POST flow are handled correctly; a raw GET hits NextAuth's
  // Configuration error path.
  function signInWithAuthentik() {
    setLoading(true);
    // Post-login default is /shop (shop-floor overview) per the
    // shop-overhaul demo narrative. /dashboard remains available in the nav.
    signIn("authentik", { callbackUrl: "/shop" });
  }

  // Fallback: legacy stub cookie. Kept intentionally for demo resilience
  // (if Authentik / auth.beyondpandora.com is unreachable on demo day).
  async function signInWithStub() {
    setStubLoading(true);
    await fetch("/api/auth/stub", { method: "POST" });
    router.push("/shop");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6 jwm-gradient relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, #fff 0, transparent 30%), radial-gradient(circle at 80% 70%, #e69b40 0, transparent 40%)",
          }}
        />
        <div className="relative w-full max-w-5xl grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
          <div className="text-white space-y-8">
            <div className="flex items-center gap-5">
              <div className="bg-white rounded-2xl p-3 shadow-xl">
                <Image
                  src="/logo-jwm.svg"
                  alt="JWM"
                  width={80}
                  height={80}
                  priority
                />
              </div>
              <div>
                <div className="text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
                  John W. McDougall Co.
                </div>
                <div className="text-[#e69b40] font-semibold tracking-wider text-sm mt-1 uppercase">
                  Est. 1938 · Nashville, TN
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
                A Better Way <br />
                <span className="text-[#e69b40]">to Build</span>
                <br />
                Since 1938.
              </h1>
              <p className="text-lg text-white/80 max-w-lg">
                From monumental staircases to precision-processed panels — now
                running on a shop-floor ERP built for the way you actually work.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> ISO 9001:2015
              </span>
              <span className="text-white/30">·</span>
              <span>AISC Certified Fabricator</span>
              <span className="text-white/30">·</span>
              <span>AWS D1.1 Structural Welding</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-2xl">
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-[#e69b40] font-semibold text-sm">
                <Sparkles className="w-4 h-4" /> Powered by sovereign.ai
              </div>
              <h2 className="text-2xl font-bold text-[#064162]">
                Welcome back.
              </h2>
              <p className="text-slate-500 text-sm">
                Sign in to the JWM shop floor to see today&apos;s jobs, KPIs,
                and AI-drafted insights.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={signInWithAuthentik}
              disabled={loading}
            >
              {loading ? (
                "Redirecting to sovereign.ai…"
              ) : (
                <>
                  Sign in with sovereign.ai
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400 uppercase tracking-wider">
                  or
                </span>
              </div>
            </div>

            <button
              className="w-full h-11 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              onClick={signInWithStub}
              disabled={stubLoading}
            >
              {stubLoading ? "Signing in…" : "Use local ERPNext credentials"}
            </button>

            <div className="mt-6 text-[11px] text-slate-400 leading-relaxed">
              By signing in you accept the JWM Acceptable Use policy. Access is
              SSO-managed by Authentik.
            </div>
          </div>
        </div>
      </div>
      <ProjectMarquee />
      <footer className="bg-[#062f44] text-white/50 text-xs py-3 text-center">
        ERPNext · LiteLLM · Authentik · Traefik · Beyond Pandora
      </footer>
    </div>
  );
}
