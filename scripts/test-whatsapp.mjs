/**
 * Uji jalur WhatsApp saat nomornya SUDAH diisi.
 *
 * Nomor asli belum ada, jadi script ini menambal src/config/site.ts dengan
 * nomor uji, menjalankan pemeriksaan di browser, lalu MENGEMBALIKAN file itu
 * ke keadaan semula di blok finally. Tidak ada nomor karangan yang tertinggal
 * di repositori.
 *
 * Butuh dev server yang sudah jalan (npx astro dev --background).
 *
 * Jalankan: npm run test:whatsapp
 */

import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const PORT = 4331;
const BASE = `http://localhost:${PORT}`;
const CONFIG = 'src/config/site.ts';
const NOMOR_UJI = '6281234567890';

/* Memberi tahu `npm run validate` bahwa nomor uji di bawah memang disengaja.
   Tanpa ini, build menolaknya — dan itu memang yang diinginkan di luar
   harness, supaya nomor uji tidak pernah ikut terbit kalau script ini mati
   sebelum sempat memulihkan file. */
process.env.HWR_UJI_NOMOR = '1';

/**
 * Diuji di atas hasil build, bukan dev server.
 *
 * astro.config.ts mengimpor src/config/site.ts, jadi menambal file itu
 * membuat dev server ikut restart dan koneksi terputus. Build lalu preview
 * juga lebih setia: yang diuji persis keluaran yang akan dipublikasikan.
 */
function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { shell: true, stdio: 'ignore', ...opts });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} keluar dengan kode ${code}`))));
    p.on('error', reject);
  });
}

async function tungguSiap(url, timeout = 30000) {
  const t0 = Date.now();
  for (;;) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      /* belum siap */
    }
    if (Date.now() - t0 > timeout) return false;
    await new Promise((r) => setTimeout(r, 300));
  }
}

const fails = [];
const check = (cond, label, detail = '') => {
  if (cond) console.log(`  ✓ ${label}`);
  else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
    fails.push(label);
  }
};

const asli = await readFile(CONFIG, 'utf8');
const ditambal = asli.replace(
  'whatsappNumber: PLACEHOLDER as string,',
  `whatsappNumber: '${NOMOR_UJI}' as string,`,
);

if (ditambal === asli) {
  console.error(
    `Tidak menemukan baris whatsappNumber di ${CONFIG}. Jalur WhatsApp tidak diuji.`,
  );
  process.exit(1);
}

let browser;
let preview;
try {
  await writeFile(CONFIG, ditambal);

  console.log('Membangun ulang dengan nomor uji…');
  await run('npx', ['astro', 'build']);

  // Preview server dikelola CLI: kalau ada sisa dari uji sebelumnya, CLI
  // menolak start kedua dan --port diabaikan. Hentikan dulu.
  await run('npx', ['astro', 'preview', 'stop']).catch(() => {});

  preview = spawn('npx', ['astro', 'preview', '--port', String(PORT)], {
    shell: true,
    stdio: 'ignore',
  });
  if (!(await tungguSiap(BASE))) throw new Error('astro preview tidak siap');

  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const products = JSON.parse(await readFile('src/content/products.json', 'utf8'));
  const p1 = products[0];
  const p2 = products[12];

  console.log('\nNomor WhatsApp terisi');

  await page.goto(`${BASE}/produk/${p1.id}`, { waitUntil: 'networkidle' });

  const langsung = page.getByRole('link', { name: /Pesan 1 lusin via WhatsApp/i });
  check(await langsung.isVisible(), 'Tautan pesan langsung aktif di halaman produk');

  const href1 = await langsung.getAttribute('href');
  check(href1?.startsWith(`https://wa.me/${NOMOR_UJI}?text=`), 'Tautan memakai nomor dari konfigurasi', href1?.slice(0, 40));

  const pesan1 = decodeURIComponent(href1.split('?text=')[1]);
  check(pesan1.includes(`1. ${p1.name} ${p1.code} — 1 lusin`), 'Pesan memuat nama, kode, dan jumlah');
  check(pesan1.startsWith('Halo HWR Collection, saya ingin memesan:'), 'Pesan dibuka dengan sapaan');
  check(pesan1.includes('Mohon info ketersediaan dan total pesanannya.'), 'Pesan meminta konfirmasi penjual');

  // Jumlah di stepper ikut memengaruhi tautan langsung
  await page.getByRole('button', { name: /tambah jumlah lusin/i }).click();
  await page.waitForTimeout(200);
  const href2 = await page.getByRole('link', { name: /Pesan 2 lusin via WhatsApp/i }).getAttribute('href');
  check(
    decodeURIComponent(href2.split('?text=')[1]).includes('— 2 lusin'),
    'Tautan langsung mengikuti jumlah di stepper',
  );

  // Pesanan berisi beberapa produk
  await page.getByRole('button', { name: 'Tambah ke pesanan' }).click();
  await page.goto(`${BASE}/produk/${p2.id}`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Tambah ke pesanan' }).click();
  await page.waitForTimeout(300);

  await page.getByRole('button', { name: /Buka daftar pesanan/i }).click();
  const drawer = page.locator('[role="dialog"]');
  await drawer.waitFor();

  await drawer.locator('textarea').fill('Tolong dikirim minggu ini');
  await page.waitForTimeout(200);

  const waDrawer = drawer.getByRole('link', { name: /Pesan via WhatsApp/i });
  check(await waDrawer.isVisible(), 'Tombol WhatsApp di drawer jadi tautan aktif');

  const pesan3 = decodeURIComponent((await waDrawer.getAttribute('href')).split('?text=')[1]);
  console.log('\n--- pesan yang dihasilkan ---');
  console.log(pesan3);
  console.log('----------------------------\n');

  check(pesan3.includes(`1. ${p1.name} ${p1.code} — 2 lusin`), 'Baris pertama bernomor dan lengkap');
  check(pesan3.includes(`2. ${p2.name} ${p2.code} — 1 lusin`), 'Baris kedua bernomor dan lengkap');
  check(pesan3.includes('Estimasi total:'), 'Pesan menyertakan estimasi total');
  check(pesan3.includes('Catatan: Tolong dikirim minggu ini'), 'Catatan ikut terkirim');
  check(
    pesan3.split('\n\n').length >= 5,
    'Pesan dipisah per blok supaya mudah dibaca di WhatsApp',
  );

  // Produk berharga "mulai dari" membuat total ditandai sebagai batas bawah
  const mulai = products.find((x) => x.priceType === 'mulai');
  await page.keyboard.press('Escape');
  await page.goto(`${BASE}/produk/${mulai.id}`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Tambah ke pesanan' }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /Buka daftar pesanan/i }).click();
  await drawer.waitFor();
  const pesan4 = decodeURIComponent(
    (await drawer.getByRole('link', { name: /Pesan via WhatsApp/i }).getAttribute('href')).split(
      '?text=',
    )[1],
  );
  check(
    pesan4.includes('Estimasi total: mulai dari'),
    'Total ditandai "mulai dari" kalau ada produk berharga mulai',
  );

  // Header juga memakai nomor yang sama
  await page.keyboard.press('Escape');
  const headerWa = await page
    .locator('header a[href*="wa.me"]')
    .first()
    .getAttribute('href');
  check(headerWa?.includes(NOMOR_UJI), 'Tombol WhatsApp di header memakai nomor yang sama');
} finally {
  await browser?.close();
  preview?.kill();
  await run('npx', ['astro', 'preview', 'stop']).catch(() => {});

  await writeFile(CONFIG, asli);
  const kembali = await readFile(CONFIG, 'utf8');
  if (kembali !== asli) {
    console.error(`\nGAGAL memulihkan ${CONFIG}. Periksa file itu secara manual.`);
    process.exitCode = 1;
  } else {
    console.log(`\n${CONFIG} dipulihkan ke sentinel placeholder.`);
  }

  // dist/ masih memuat nomor uji sampai di-build ulang.
  console.log('Membangun ulang dengan konfigurasi asli…');
  await run('npx', ['astro', 'build']).catch(() => {
    console.error('Build ulang gagal. Jalankan "npm run build" sebelum memakai dist/.');
  });
}

console.log(fails.length ? `\n${fails.length} uji gagal.` : '\nSemua uji WhatsApp lulus.');
if (fails.length) process.exitCode = 1;
