import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const BASE = process.env.SHOT_BASE_URL || "http://localhost:3100";
const OUT = path.join(__dirname, "..", "screenshots", "project-dashboard");

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

  await page.goto("/arch/projects", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, "list.png"), fullPage: true });

  await page.goto("/arch/projects/25071-IAD181", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT, "iad181.png"), fullPage: true });

  await browser.close();
  console.log("Wrote screenshots to", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
