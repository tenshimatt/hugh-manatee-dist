/**
 * Playwright screenshot runner — Quick Quote flow.
 *
 * Usage:
 *   1. Start the dev server:   bun run dev    (listens on :3100)
 *   2. In another terminal:    bun scripts/shot-quick-quote.ts
 *
 * Writes PNGs to shell/screenshots/quick-quote/.
 * Captures: empty form, copy-from-quote pre-fill, submission preview.
 */
import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const BASE = process.env.SHOT_BASE_URL || "http://localhost:3100";
const OUT = path.join(__dirname, "..", "screenshots", "quick-quote");

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

  const shot = async (file: string) => {
    const out = path.join(OUT, file);
    await page.screenshot({ path: out, fullPage: true });
    console.log(`   saved ${out}`);
  };

  // 1. Empty form
  console.log(`→ /estimator/quick-quote (empty)`);
  await page.goto(`${BASE}/estimator/quick-quote`, {
    waitUntil: "networkidle",
    timeout: 30_000,
  });
  await page.waitForTimeout(800);
  await shot("01-empty-form.png");

  // 2. Click "Copy from quote" to pre-fill lines
  console.log(`→ click Copy from quote`);
  await page.getByRole("button", { name: /Copy from quote/i }).click();
  await page.waitForTimeout(600);
  await shot("02-copy-from-quote.png");

  // 3. Submit — should navigate to preview
  console.log(`→ submit Create Quotation`);
  await page.getByRole("button", { name: /Create Quotation/i }).click();
  await page.waitForURL(/\/estimator\/quick-quote\/preview\//, {
    timeout: 30_000,
  });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  await shot("03-preview.png");

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
