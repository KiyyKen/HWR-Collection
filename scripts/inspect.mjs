/**
 * Potret per-bagian untuk pemeriksaan visual detail.
 *
 * Screenshot full-page halaman panjang terlalu kecil untuk menilai spasi dan
 * tipografi. Script ini memotret tiap section secara terpisah pada satu
 * viewport, jadi masalah detail benar-benar terlihat.
 *
 * Jalankan: node scripts/inspect.mjs <viewport> [route]
 */

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const VIEWPORTS = {
  mobile: { width: 390, height: 844, scale: 2, isMobile: true },
  tablet: { width: 768, height: 1024, scale: 2, isMobile: true },
  desktop: { width: 1440, height: 900, scale: 1, isMobile: false },
};

const name = process.argv[2] ?? 'mobile';
// Git Bash di Windows menerjemahkan argumen berawalan "/" jadi path Windows,
// jadi rute ditulis tanpa garis miring depan dan dinormalkan di sini.
const raw = process.argv[3] ?? '/';
const route = raw.startsWith('/') ? raw : `/${raw}`;
const vp = VIEWPORTS[name];
if (!vp) throw new Error(`Viewport tidak dikenal: ${name}`);

const slug = route === '/' ? 'home' : route.replace(/^\/|\/$/g, '').replace(/\//g, '-');
const OUT = path.join('.shots', `${slug}-${name}`);
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: vp.width, height: vp.height },
  deviceScaleFactor: vp.scale,
  isMobile: vp.isMobile,
  hasTouch: vp.isMobile,
});

await page.goto('http://localhost:4321' + route, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

// Potong halaman jadi blok-blok seukuran layar, bukan per-section, supaya
// jarak ANTAR section ikut terlihat.
const height = await page.evaluate(() => document.documentElement.scrollHeight);
const step = Math.round(vp.height * 0.92);
let i = 0;

for (let y = 0; y < height; y += step) {
  const clipH = Math.min(step, height - y);
  if (clipH < 60) break;
  await page.screenshot({
    path: path.join(OUT, `${String(++i).padStart(2, '0')}.png`),
    fullPage: true,
    clip: { x: 0, y, width: vp.width, height: clipH },
  });
}

await browser.close();
console.log(`${i} potongan ${route} @ ${name} (tinggi halaman ${height}px) → ${OUT}`);
