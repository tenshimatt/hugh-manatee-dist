/**
 * Playwright screenshot runner — Monday pre-demo review (2026-04-20).
 *
 * Captures the 3 new P0 pages + supporting routes for Matt's pre-demo
 * review against the deployed prod URL.
 *
 * Usage:
 *   bun scripts/shot-monday-review.ts
 *
 * Env:
 *   SHOT_BASE_URL   (default: https://jwm-demo.beyondpandora.com)
 *   SHOT_OUT_DIR    (default: ../../Obsidian/PLAUD/PROJECTS/JWM/screenshots/new-build)
 *
 * Notes:
 *   The public site sits behind Authentik at the Traefik layer. If the
 *   browser is bounced to /outpost.goauthentik.io, we fall back to capturing
 *   whatever rendered (login page) and log a warning — Matt can re-run
 *   locally with a valid jwm_session cookie.
 */
import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const BASE = process.env.SHOT_BASE_URL || "https://jwm-demo.beyondpandora.com";
const OUT =
  process.env.SHOT_OUT_DIR ||
  path.join(
    __dirname,
    "..",
    "..",
    "..",
    "Obsidian",
    "PLAUD",
    "PROJECTS",
    "JWM",
    "screenshots",
    "new-build",
  );

type Shot = {
  route: string;
  file: string;
  width?: number;
  height?: number;
};

const SHOTS: Shot[] = [
  { route: "/exec/arch", file: "exec-arch.png", width: 1600, height: 900 },
  { route: "/arch/pm", file: "pm-list.png", width: 1600, height: 900 },
  { route: "/arch/pm/cole-norona", file: "pm-cole-norona.png", width: 1600, height: 900 },
  { route: "/arch/projects", file: "projects-list.png", width: 1600, height: 900 },
  {
    route: "/arch/projects/25071-IAD181",
    file: "project-dashboard-iad181.png",
    width: 1600,
    height: 900,
  },
  {
    route: "/engineering/pipeline",
    file: "engineering-pipeline.png",
    width: 1920,
    height: 1080,
  },
  { route: "/shop/scheduler", file: "shop-scheduler.png", width: 1920, height: 1080 },
  { route: "/shop/flat-laser-2", file: "shop-flat-laser-2.png", width: 1600, height: 900 },
  { route: "/dashboard", file: "dashboard.png", width: 1600, height: 900 },
];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  console.log(`BASE=${BASE}`);
  console.log(`OUT=${OUT}`);

  const browser = await chromium.launch();
  const results: { file: string; status: string; note?: string }[] = [];

  for (const s of SHOTS) {
    const ctx = await browser.newContext({
      viewport: { width: s.width || 1600, height: s.height || 900 },
      deviceScaleFactor: 1,
      baseURL: BASE,
      ignoreHTTPSErrors: true,
    });

    // Best-effort session cookie (harmless if unused).
    try {
      const u = new URL(BASE);
      await ctx.addCookies([
        {
          name: "jwm_session",
          value: "demo-chris-bruce",
          domain: u.hostname,
          path: "/",
          httpOnly: false,
          sameSite: "Lax",
        },
      ]);
    } catch {}

    const page = await ctx.newPage();
    const url = `${BASE}${s.route}`;
    console.log(`→ ${url}`);
    try {
      const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await page
        .waitForLoadState("networkidle", { timeout: 20_000 })
        .catch(() => {});
      await page.waitForTimeout(1500);

      const finalUrl = page.url();
      const redirectedToAuth =
        /authentik|outpost\.goauthentik|sign_in|login/i.test(finalUrl) &&
        !finalUrl.startsWith(BASE + s.route);

      const out = path.join(OUT, s.file);
      await page.screenshot({ path: out, fullPage: true });

      if (redirectedToAuth) {
        console.log(`   WARN auth redirect → saved login page @ ${out}`);
        results.push({
          file: s.file,
          status: "auth-redirect",
          note: `final=${finalUrl}`,
        });
      } else if (!resp || !resp.ok()) {
        console.log(`   WARN http ${resp?.status()} — saved anyway @ ${out}`);
        results.push({
          file: s.file,
          status: `http-${resp?.status() ?? "err"}`,
        });
      } else {
        console.log(`   OK ${out}`);
        results.push({ file: s.file, status: "ok" });
      }
    } catch (e: any) {
      console.error(`   FAIL ${s.route}: ${e?.message || e}`);
      results.push({ file: s.file, status: "fail", note: String(e?.message || e) });
    } finally {
      await ctx.close();
    }
  }

  await browser.close();

  console.log("\n--- summary ---");
  for (const r of results) {
    console.log(`${r.status.padEnd(14)} ${r.file}${r.note ? "  (" + r.note + ")" : ""}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
