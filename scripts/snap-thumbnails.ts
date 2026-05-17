/**
 * Generate static PNG thumbnails for each portfolio variant.
 *
 * Usage:
 *   1. Make sure the dev server is running:  pnpm dev -p 3000
 *   2. In another terminal:                  pnpm tsx scripts/snap-thumbnails.ts
 *
 * Outputs: public/thumbs/<variant-id>.png  (1280×800 each)
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { VARIANT_IDS } from "../src/variants/registry";

const BASE_URL = process.env.SNAP_BASE_URL ?? "http://localhost:3000";
const OUT_DIR = join(process.cwd(), "public", "thumbs");
const VIEWPORT = { width: 1280, height: 800 };

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  for (const id of VARIANT_IDS) {
    const url = `${BASE_URL}/preview/${id}/`;
    const file = join(OUT_DIR, `${id}.png`);
    process.stdout.write(`  ${id.padEnd(20)} → ${url} … `);
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    // Wait a beat for fonts + animations to settle.
    await page.waitForTimeout(1500);
    await page.screenshot({ path: file, fullPage: false, type: "png" });
    process.stdout.write("ok\n");
  }

  await browser.close();
  console.log(`\nWrote ${VARIANT_IDS.length} thumbnails to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
