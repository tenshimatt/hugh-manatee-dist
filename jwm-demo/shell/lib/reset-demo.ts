/**
 * Reset the demo session.
 *
 * Flow:
 *  1. POST /api/admin/reset — clears server cookie (jwm_session)
 *  2. Clear every localStorage/sessionStorage key (chat history, UI state)
 *  3. Expire any client-visible cookies for a truly fresh session
 *  4. Redirect to `redirectTo` (default `/`)
 */
export async function resetDemo(opts: {
  redirectTo?: string;
  delayMs?: number;
} = {}): Promise<void> {
  const { redirectTo = "/", delayMs = 400 } = opts;

  // 1. Server-side reset (best-effort)
  try {
    await fetch("/api/admin/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
      cache: "no-store",
    });
  } catch {
    // non-fatal — we still clear the client
  }

  // 2. Clear client storage
  try {
    window.localStorage.clear();
    window.sessionStorage.clear();
  } catch {
    /* private-mode or disabled storage */
  }

  // 3. Expire any non-HttpOnly cookies visible to JS
  try {
    for (const c of document.cookie.split(";")) {
      const name = c.split("=")[0]?.trim();
      if (!name) continue;
      document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
    }
  } catch {
    /* no-op */
  }

  // 4. Redirect after a short delay so the toast has time to read
  await new Promise((r) => setTimeout(r, delayMs));
  window.location.href = redirectTo;
}
