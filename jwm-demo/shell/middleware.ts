/**
 * Next.js middleware — guard the `(app)` group routes.
 *
 * Accepts EITHER:
 *   1. A valid NextAuth session (Authentik SSO) — primary auth
 *   2. The legacy `jwm_session` cookie from /api/auth/stub — demo fallback
 *
 * Dual-accept keeps the demo resilient: if Authentik is down on demo day,
 * the "Use local ERPNext credentials" button still grants access.
 *
 * Unauthenticated users are redirected to "/" with ?next=<original path>
 * so the landing page can optionally bounce them back after sign-in.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/admin",
  "/estimator",
  "/planner",
  "/qc",
  "/shop",
  "/erf",
];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!isProtected(pathname)) return NextResponse.next();

  // Fallback: legacy stub cookie still grants access.
  if (req.cookies.get("jwm_session")) return NextResponse.next();

  // Primary: NextAuth session cookie.
  // In production (HTTPS) the cookie is `__Secure-authjs.session-token`.
  // In dev (HTTP) it is `authjs.session-token`.
  const nextAuthCookie =
    req.cookies.get("__Secure-authjs.session-token") ||
    req.cookies.get("authjs.session-token");
  if (nextAuthCookie) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Match everything except Next internals, API routes, and public assets.
  matcher: ["/((?!_next/|api/|favicon.ico|logo-jwm.svg|assets/|public/).*)"],
};
