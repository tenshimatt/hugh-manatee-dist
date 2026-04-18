import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/admin/reset
 *
 * Resets the demo session so a fresh walkthrough can start.
 * - Clears the jwm_session cookie (signed-in state)
 * - Intentionally does NOT mutate ERPNext data — we don't want to
 *   risk trashing backend state mid-demo. If a future need arises,
 *   wire a safe, idempotent ERPNext reset here behind an env gate.
 *
 * The client is responsible for clearing localStorage (chat history,
 * etc.) and redirecting to `/`.
 */
export async function POST() {
  const res = NextResponse.json({
    ok: true,
    cleared: ["jwm_session"],
    at: new Date().toISOString(),
  });
  // Expire the session cookie
  res.cookies.set("jwm_session", "", {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 0,
  });
  return res;
}
