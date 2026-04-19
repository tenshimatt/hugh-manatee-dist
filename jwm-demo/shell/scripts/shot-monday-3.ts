/**
 * Playwright screenshot runner — Monday-3 deliverables.
 *
 * Usage:
 *   1. Start the dev server:   bun run dev    (listens on :3100)
 *   2. In another terminal:    bun scripts/shot-monday-3.ts
 *
 * Writes PNGs to shell/screenshots/monday-3/.
 */
import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const BASE = process.env.SHOT_BASE_URL || "http://localhost:3100";
const OUT = path.join(__dirname, "..", "screenshots", "monday-3");

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    baseURL: BASE,
  });

  const url = new URL(BASE);
  await ctx.addCookies([
    {
      name: "jwm_session",
      value: "demo-chris-bruce",
      domain: url.hostname,
      path: "/",
      httpOnly: false,
      sameSite: "Lax",
    },
  ]);

  const page = await ctx.newPage();

  const shot = async (route: string, file: string) => {
    const u = `${BASE}${route}`;
    console.log(`→ ${u}`);
    await page.goto(u, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const out = path.join(OUT, file);
    await page.screenshot({ path: out, fullPage: true });
    console.log(`   saved ${out}`);
  };

  await shot("/shop/scheduler", "01-scheduler.png");
  await shot("/shop/efficiency", "02-efficiency-dashboard.png");
  await shot("/shop/efficiency/new", "03-efficiency-new-form.png");
  await shot("/planner/MFG-WO-2026-00024?view=pdr", "04-pdr.png");

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
