/**
 * Kills the legacy stub cookie and returns the user to the landing page.
 * NextAuth sessions are handled by /api/auth/signout (catch-all route).
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function killAndRedirect(req: Request): NextResponse {
  const url = new URL("/", req.url);
  const res = NextResponse.redirect(url);
  res.cookies.set("jwm_session", "", { path: "/", maxAge: 0 });
  return res;
}

export async function GET(req: Request) {
  return killAndRedirect(req);
}

export async function POST(req: Request) {
  return killAndRedirect(req);
}
