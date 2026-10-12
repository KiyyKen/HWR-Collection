/**
 * Pengukuran performa di atas hasil build, bukan dev server.
 *
 * Dev server mengirim modul mentah dan sumber peta; angkanya tidak ada
 * hubungannya dengan yang akan diterima pengunjung. Script ini membangun
 * situs, menjalankan `astro preview`, lalu mengukur tiap rute dua kali:
 *
 *   mobile  — 390px, CPU 4× lebih lambat, jaringan seperti 4G lemah
 *   desktop — 1440px, tanpa throttle
 *
 * Yang diukur: LCP, CLS, FCP, byte yang benar-benar diunduh per jenis,
 * jumlah permintaan, dan total tugas panjang (indikator blocking).
 *
 * Jalankan: npm run perf [rute...]
 */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const PORT = 4333;
const BASE = `http://localhost:${PORT}`;

const RUTE = process.argv.slice(2).length
  ? process.argv.slice(2).map((r) => '/' + r.replace(/^\/+/, ''))
  : ['/', '/katalog', '/katalog/jeans', '/produk/jeans-anak-reguler', '/404'];

const PROFIL = {
  mobile: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    cpu: 4,
    // 4G lemah: 1,6 Mbps turun, 750 Kbps naik, latensi 150ms.
    net: { offline: false, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8, latency: 150 },
  },
  desktop: {
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    cpu: 1,
    net: null,
  },
};

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { shell: true, stdio: 'ignore' });
    p.on('exit', (c) => (c === 0 ? resolve() : reject(new Error(`${cmd} keluar dengan kode ${c}`))));
    p.on('error', reject);
  });
}

async function tungguSiap(url, timeout = 60000) {
  const t0 = Date.now();
  for (;;) {
    try {
      if ((await fetch(url)).ok) return true;
    } catch {
      /* belum siap */
    }
    if (Date.now() - t0 > timeout) return false;
    await new Promise((r) => setTimeout(r, 300));
  }
}

const kb = (b) => `${(b / 1024).toFixed(1)} KB`;

/**
 * Ukuran terkompresi dari file di dist/.
 *
 * `astro preview` mengirim file apa adanya, jadi content-length di jaringan
 * adalah ukuran mentah — bukan yang akan diterima pengunjung dari server
 * yang mengaktifkan gzip/brotli. Angka yang dipakai menilai diambil dari
 * disk supaya mewakili keadaan produksi.
 */
const cacheGzip = new Map();
function gzipOf(urlPath) {
  if (cacheGzip.has(urlPath)) return cacheGzip.get(urlPath);
  let size = 0;
  try {
    size = gzipSync(readFileSync(path.join('dist', urlPath.replace(/^\/+/, '')))).length;
  } catch {
    size = 0;
  }
  cacheGzip.set(urlPath, size);
  return size;
}

/** Ambang yang dipakai menilai — Core Web Vitals "baik", JS dalam gzip. */
const AMBANG = { lcp: 2500, cls: 0.1, js: 30 * 1024 };

let browser;
let preview;
const masalah = [];

try {
  console.log('Membangun…');
  await run('npx', ['astro', 'build']);

  await run('npx', ['astro', 'preview', 'stop']).catch(() => {});
  preview = spawn('npx', ['astro', 'preview', '--port', String(PORT)], {
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (!(await tungguSiap(BASE))) throw new Error('astro preview tidak siap');

  browser = await chromium.launch();

  for (const [nama, profil] of Object.entries(PROFIL)) {
    console.log(`\n${nama.toUpperCase()}`);
    console.log(
      '  rute'.padEnd(34) + 'LCP'.padStart(8) + 'CLS'.padStart(8) + 'JS gz'.padStart(10) +
        'CSS gz'.padStart(9) + 'gambar'.padStart(10) + 'req'.padStart(5) + 'blok'.padStart(7) + '  LCP el',
    );

    for (const rute of RUTE) {
      const context = await browser.newContext({
        viewport: profil.viewport,
        deviceScaleFactor: profil.deviceScaleFactor,
        isMobile: profil.isMobile,
        hasTouch: profil.hasTouch,
      });
      const page = await context.newPage();

      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      if (profil.net) await cdp.send('Network.emulateNetworkConditions', profil.net);
      if (profil.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: profil.cpu });

      // Vitals direkam lewat observer yang dipasang sebelum halaman jalan;
      // getEntriesByType() saja melewatkan LCP dan layout-shift.
      await page.addInitScript(() => {
        window.__vitals = { lcp: 0, cls: 0, long: 0, lcpEl: '' };
        new PerformanceObserver((list) => {
          const e = list.getEntries().at(-1);
          window.__vitals.lcp = e.startTime;
          window.__vitals.lcpEl = e.element?.tagName ?? '';
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver((list) => {
          for (const s of list.getEntries()) if (!s.hadRecentInput) window.__vitals.cls += s.value;
        }).observe({ type: 'layout-shift', buffered: true });
        new PerformanceObserver((list) => {
          for (const l of list.getEntries()) window.__vitals.long += Math.max(0, l.duration - 50);
        }).observe({ type: 'longtask', buffered: true });
      });

      const byte = { js: 0, css: 0, gambar: 0, font: 0, lain: 0 };
      const gz = { js: 0, css: 0 };
      let req = 0;
      const errors = [];

      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      page.on('pageerror', (e) => errors.push(String(e)));

      cdp.on('Network.loadingFinished', () => {});
      page.on('response', async (res) => {
        req += 1;
        const tipe = res.request().resourceType();
        let size = 0;
        try {
          size = Number((await res.headerValue('content-length')) ?? 0);
          if (!size) size = (await res.body().catch(() => Buffer.alloc(0))).length;
        } catch {
          /* respons tanpa body */
        }
        const jalur = new URL(res.url()).pathname;
        if (tipe === 'script') {
          byte.js += size;
          gz.js += gzipOf(jalur);
        } else if (tipe === 'stylesheet') {
          byte.css += size;
          gz.css += gzipOf(jalur);
        } else if (tipe === 'image') byte.gambar += size;
        else if (tipe === 'font') byte.font += size;
        else byte.lain += size;
      });

      await page.goto(BASE + rute, { waitUntil: 'load' });

      // CLS dan LCP butuh waktu settle; gulir sekali untuk memicu lazy-load
      // dan pergeseran yang mungkin terjadi setelah gambar bawah masuk.
      await page.waitForTimeout(600);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(900);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);

      const m = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        return {
          ...window.__vitals,
          fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0,
          ttfb: nav?.responseStart ?? 0,
          dom: document.querySelectorAll('*').length,
        };
      });

      const baris =
        `  ${rute}`.padEnd(34) +
        `${Math.round(m.lcp)}ms`.padStart(8) +
        m.cls.toFixed(3).padStart(8) +
        kb(gz.js).padStart(10) +
        kb(gz.css).padStart(9) +
        kb(byte.gambar).padStart(10) +
        String(req).padStart(5) +
        `${Math.round(m.long)}ms`.padStart(7) +
        `  ${m.lcpEl.toLowerCase()}`;
      console.log(baris);

      if (nama === 'mobile') {
        if (m.lcp > AMBANG.lcp) masalah.push(`${rute}: LCP ${Math.round(m.lcp)}ms > ${AMBANG.lcp}ms`);
        if (m.cls > AMBANG.cls) masalah.push(`${rute}: CLS ${m.cls.toFixed(3)} > ${AMBANG.cls}`);
        if (gz.js > AMBANG.js) masalah.push(`${rute}: JS ${kb(gz.js)} gzip > ${kb(AMBANG.js)}`);
      }
      for (const e of errors) masalah.push(`${rute} (${nama}): console error — ${e.slice(0, 120)}`);

      await context.close();
    }
  }
} finally {
  await browser?.close();
  preview?.kill();
  await run('npx', ['astro', 'preview', 'stop']).catch(() => {});
}

if (masalah.length) {
  console.log(`\n${masalah.length} hal di luar ambang:`);
  for (const m of masalah) console.log(`  ✗ ${m}`);
  process.exitCode = 1;
} else {
  console.log('\n✓ Semua rute di dalam ambang: LCP < 2,5s, CLS < 0,1, JS < 30 KB (mobile ter-throttle).');
}
