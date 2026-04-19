/**
 * Playwright screenshot runner — Phase 1 shop-overhaul surfaces.
 *
 * Usage:
 *   1. Start the dev server:   bun run dev    (listens on :3100)
 *   2. In another terminal:    bun scripts/shot-shop-overhaul.ts
 *
 * Writes PNGs to shell/screenshots/shop-overhaul/. Uses the stub auth
 * endpoint (POST /api/auth/stub) to drop a jwm_session cookie, so no
 * Authentik round-trip is required for screenshotting.
 */
import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const BASE = process.env.SHOT_BASE_URL || "http://localhost:3100";
const OUT = path.join(__dirname, "..", "screenshots", "shop-overhaul");

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    baseURL: BASE,
  });

  // Set the stub session cookie directly — faster and avoids a
  // Playwright/bun set-cookie parsing bug on some versions.
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

  const shot = async (route: string, file: string, waitFor?: string) => {
    const url = `${BASE}${route}`;
    console.log(`→ ${url}`);
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    if (waitFor) {
      await page
        .waitForSelector(waitFor, { timeout: 10_000 })
        .catch(() => console.warn(`   (selector ${waitFor} not found; continuing)`));
    }
    // Tiny settle wait so any fade-in / anomaly fetch lands.
    await page.waitForTimeout(800);
    const out = path.join(OUT, file);
    await page.screenshot({ path: out, fullPage: true });
    console.log(`   saved ${out}`);
  };

  await shot("/shop", "01-shop-overview.png", "text=Today on the floor");
  await shot(
    "/shop/flat-laser-2",
    "02-shop-kiosk-flat-laser-2.png",
    "text=Flat Laser #2"
  );
  await shot("/shop/lead", "03-shop-lead-stub.png", "text=Lead View");
  await shot("/erf", "04-erf-queue.png", "text=ERF queue");
  await shot("/erf/new", "05-erf-new.png", "text=New ERF");
  await shot(
    "/erf/ERF-2026-0047",
    "06-erf-detail-ready.png",
    "text=Ready to Release"
  );
  await shot("/dashboard", "07-dashboard-unchanged.png");

  await browser.close();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
