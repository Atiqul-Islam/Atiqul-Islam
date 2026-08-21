/**
 * Capture the page at a series of scroll positions, with real time passing
 * between them, and write each frame to disk.
 *
 * This exists because the failure mode on this project was never the code, it
 * was shipping a visual change without looking at it. Headless screenshots
 * through the CDP harness land mid animation because nothing waits; a real
 * browser with real waits is the only way to see what a reader sees.
 *
 *   node filmstrip.mjs <url> <outDir> [frames] [theme]
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const [url, outDir, frames = "8", theme = "dark"] = process.argv.slice(2);
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "networkidle" });
await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
await page.waitForTimeout(1200);

const height = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const n = Number(frames);

for (let i = 0; i < n; i++) {
  const y = Math.round((height * i) / (n - 1));
  await page.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y);
  // Long enough for a scrubbed timeline to settle and any reveal to finish.
  await page.waitForTimeout(1100);
  const file = `${outDir}/frame-${String(i).padStart(2, "0")}.png`;
  await page.screenshot({ path: file });
  console.log(`${file}  scrollY=${y}`);
}

await browser.close();
