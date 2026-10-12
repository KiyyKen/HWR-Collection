/**
 * Verifikasi visual — pola dari skill webapp-testing.
 *
 * Mengambil screenshot full-page di tiga viewport, mencatat console error,
 * dan memeriksa overflow horizontal (penyebab paling umum layout rusak di
 * ponsel). Halaman tidak dianggap selesai hanya karena build berhasil.
 *
 * Jalankan: npm run shoot -- [path...]
 */

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:4321';
const OUT = process.env.SHOOT_OUT ?? '.shots';

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844, scale: 2 },
  { name: 'tablet', width: 768, height: 1024, scale: 2 },
  { name: 'desktop', width: 1440, height: 900, scale: 1 },
];

// Git Bash di Windows menerjemahkan argumen berawalan "/" jadi path Windows,
// jadi rute ditulis tanpa garis miring depan dan dinormalkan di sini.
const args = process.argv.slice(2).map((p) => (p.startsWith('/') ? p : `/${p}`));
const paths = args.length ? args : ['/'];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
let problems = 0;

for (const viewport of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.scale,
    isMobile: viewport.name === 'mobile',
    hasTouch: viewport.name !== 'desktop',
  });

  for (const route of paths) {
    const page = await context.newPage();
    const errors = [];
    // Status 404 halaman itu sendiri ikut muncul sebagai console error;
    // itu bukan kesalahan kode, jadi tidak dihitung.
    const noise = /status of 404/i;
    page.on('console', (m) => m.type() === 'error' && !noise.test(m.text()) && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));

    const res = await page.goto(BASE + route, { waitUntil: 'networkidle' });
    // 404 bukan kegagalan: halaman 404 sendiri perlu ikut diperiksa.
    // Yang benar-benar gagal adalah tidak ada respons atau error server.
    if (!res || res.status() >= 500) {
      console.log(`  ✗ ${route} → HTTP ${res?.status() ?? 'gagal'}`);
      problems += 1;
      await page.close();
      continue;
    }
    const status = res.status() === 200 ? '' : ` [HTTP ${res.status()}]`;

    // Tunggu font variable terpakai sebelum memotret, supaya lebar teks benar.
    await page.evaluate(() => document.fonts.ready);

    const slug = route === '/' ? 'home' : route.replace(/^\/|\/$/g, '').replace(/\//g, '-');
    const file = path.join(OUT, `${slug}--${viewport.name}.png`);
    await page.screenshot({ path: file, fullPage: true });

    const audit = await page.evaluate(() => {
      const doc = document.documentElement;
      const overflow = doc.scrollWidth > doc.clientWidth + 1;
      const offenders = [];
      if (overflow) {
        for (const el of document.querySelectorAll('body *')) {
          const r = el.getBoundingClientRect();
          if (r.right > doc.clientWidth + 1 || r.left < -1) {
            offenders.push(`${el.tagName.toLowerCase()}.${el.className?.toString().slice(0, 60)}`);
            if (offenders.length >= 5) break;
          }
        }
      }
      const h1 = document.querySelectorAll('h1').length;
      const imgsNoAlt = [...document.images].filter((i) => !i.alt).length;
      return { overflow, offenders, scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, h1, imgsNoAlt };
    });

    const flags = [];
    if (audit.overflow) flags.push(`overflow-x ${audit.scrollWidth}>${audit.clientWidth}: ${audit.offenders.join(', ')}`);
    if (audit.h1 !== 1) flags.push(`jumlah <h1> = ${audit.h1}`);
    if (audit.imgsNoAlt) flags.push(`${audit.imgsNoAlt} gambar tanpa alt`);
    if (errors.length) flags.push(`console: ${errors.slice(0, 3).join(' | ')}`);

    problems += flags.length;
    console.log(`  ${flags.length ? '✗' : '✓'} ${viewport.name.padEnd(7)} ${route}${status}${flags.length ? '\n      ' + flags.join('\n      ') : ''}`);

    await page.close();
  }

  await context.close();
}

await browser.close();
console.log(problems ? `\n${problems} masalah ditemukan.` : '\nTidak ada masalah otomatis yang terdeteksi.');
