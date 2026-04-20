/**
 * Playwright screenshots for the Router/Route build.
 * Target: /Users/mattwright/pandora/Obsidian/PROJECTS/JWM/screenshots/router-build/
 *
 * Usage:  bun scripts/shot-router-build.ts
 */
import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const BASE = process.env.SHOT_BASE_URL || "https://jwm-demo.beyondpandora.com";
const OUT =
  process.env.SHOT_OUT_DIR ||
  "/Users/mattwright/pandora/Obsidian/PROJECTS/JWM/screenshots/router-build";

type Shot = { route: string; file: string; width?: number; height?: number };

const SHOTS: Shot[] = [
  { route: "/engineering/routes", file: "01-routes-list.png", width: 1600, height: 900 },
  {
    route: "/engineering/routes/ROUTE-24060-BM01",
    file: "02-route-editor-ncr-branch.png",
    width: 1600,
    height: 1200,
  },
  {
    route: "/engineering/routes/ROUTE-25071-IAD181",
    file: "03-route-editor-active.png",
    width: 1600,
    height: 1100,
  },
  {
    route: "/engineering/routes/ROUTE-25067-FS02",
    file: "04-route-editor-draft.png",
    width: 1600,
    height: 1100,
  },
  {
    route: "/arch/projects/25071-IAD181",
    file: "05-project-dashboard-embedded-pipeline.png",
    width: 1600,
    height: 1400,
  },
  {
    route: "/arch/projects/24060-BM01",
    file: "06-project-dashboard-bm01-ncr.png",
    width: 1600,
    height: 1400,
  },
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
    console.log(`-> ${url}`);
    try {
      const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
      await page.waitForTimeout(1500);
      const finalUrl = page.url();
      const auth = /authentik|outpost\.goauthentik|sign_in|login/i.test(finalUrl) && !finalUrl.startsWith(BASE + s.route);
      const out = path.join(OUT, s.file);
      await page.screenshot({ path: out, fullPage: true });
      if (auth) {
        console.log(`   WARN auth redirect -> saved login page @ ${out}`);
        results.push({ file: s.file, status: "auth-redirect", note: `final=${finalUrl}` });
      } else if (!resp || !resp.ok()) {
        console.log(`   WARN http ${resp?.status()} saved anyway @ ${out}`);
        results.push({ file: s.file, status: `http-${resp?.status() ?? "err"}` });
      } else {
        console.log(`   OK ${out}`);
        results.push({ file: s.file, status: "ok" });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`   FAIL ${s.route}: ${msg}`);
      results.push({ file: s.file, status: "fail", note: msg });
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
