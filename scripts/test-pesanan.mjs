/**
 * Uji halaman produk dan alur pesanan (Fase 4).
 *
 * Mencakup: 24 rute produk, 404, lapisan tanpa JavaScript, menambah/mengubah/
 * menghapus item, penyimpanan lintas halaman, empty state, keadaan saat nomor
 * WhatsApp masih placeholder, dan aksesibilitas drawer (fokus, Escape, trap).
 *
 * Jalankan: npm run test:pesanan
 */

import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';

const BASE = 'http://localhost:4321';
const fails = [];
const check = (cond, label, detail = '') => {
  if (cond) console.log(`  ✓ ${label}`);
  else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
    fails.push(label);
  }
};

const products = JSON.parse(await readFile('src/content/products.json', 'utf8'));
const browser = await chromium.launch();

/**
 * Dev server Astro sesekali membatalkan navigasi saat rute baru pertama kali
 * dikompilasi. Satu percobaan ulang cukup, dan kegagalan tetap dilaporkan.
 */
async function goto(page, url, opts = { waitUntil: 'domcontentloaded' }) {
  try {
    return await page.goto(url, opts);
  } catch {
    await page.waitForTimeout(300);
    return await page.goto(url, opts);
  }
}

/**
 * Menunggu sampai kondisi terpenuhi.
 *
 * Perubahan di sini melewati store nanostores lalu render Preact, jadi
 * memeriksa DOM tepat setelah klik hampir selalu terlalu cepat.
 */
async function until(fn, timeout = 4000) {
  const t0 = Date.now();
  for (;;) {
    try {
      if (await fn()) return true;
    } catch {
      /* elemen belum ada */
    }
    if (Date.now() - t0 > timeout) return false;
    await new Promise((r) => setTimeout(r, 50));
  }
}

/* ── Semua rute produk ────────────────────────────────────────────── */
console.log(`\n${products.length} rute produk`);
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const bad = [];

  for (const p of products) {
    const res = await goto(page, `${BASE}/produk/${p.id}`, { waitUntil: 'domcontentloaded' });
    if (!res || res.status() !== 200) {
      bad.push(`${p.id} → HTTP ${res?.status()}`);
      continue;
    }
    const info = await page.evaluate(() => ({
      h1: document.querySelectorAll('h1').length,
      title: document.querySelector('h1')?.textContent?.trim(),
      body: document.body.innerText,
      canonical: document.querySelector('link[rel=canonical]')?.getAttribute('href'),
      ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
      desc: document.querySelector('meta[name=description]')?.getAttribute('content'),
    }));
    if (info.h1 !== 1) bad.push(`${p.id}: ${info.h1} buah h1`);
    if (info.title !== p.name) bad.push(`${p.id}: judul "${info.title}"`);
    if (!info.body.includes(p.code)) bad.push(`${p.id}: kode tidak tampil`);
    if (!info.body.includes('/ lusin')) bad.push(`${p.id}: satuan harga tidak tampil`);
    if (!info.body.includes('Minimum pemesanan 1 lusin')) bad.push(`${p.id}: minimum order tidak tampil`);
    if (!info.canonical?.endsWith(`/produk/${p.id}`)) bad.push(`${p.id}: canonical ${info.canonical}`);
    if (!info.ogTitle?.includes(p.name)) bad.push(`${p.id}: og:title`);
    if (!info.desc || info.desc.length < 50) bad.push(`${p.id}: meta description pendek`);
  }

  check(bad.length === 0, `Semua ${products.length} halaman produk lengkap dan benar`, bad.slice(0, 3).join(' | '));

  // Structured data
  await goto(page, `${BASE}/produk/${products[0].id}`, { waitUntil: 'domcontentloaded' });
  const ld = await page.$$eval('script[type="application/ld+json"]', (els) =>
    els.flatMap((e) => {
      const v = JSON.parse(e.textContent);
      return Array.isArray(v) ? v : [v];
    }),
  );
  const types = ld.map((x) => x['@type']);
  check(types.includes('BreadcrumbList'), 'BreadcrumbList ada di structured data');
  check(
    !types.includes('Product'),
    'Product schema TIDAK dipancarkan selama data masih dummy',
    types.join(', '),
  );
  const breadcrumb = ld.find((x) => x['@type'] === 'BreadcrumbList');
  check(breadcrumb?.itemListElement?.length === 4, 'Breadcrumb punya 4 tingkat');

  await page.close();
}

/* ── 404 ──────────────────────────────────────────────────────────── */
console.log('\nProduk tidak ditemukan');
{
  const page = await browser.newPage();
  const res = await goto(page, `${BASE}/produk/produk-yang-tidak-ada`, {
    waitUntil: 'domcontentloaded',
  });
  check(res?.status() === 404, 'Produk tidak dikenal mengembalikan HTTP 404', `dapat ${res?.status()}`);
  const body = await page.evaluate(() => document.body.innerText);
  check(body.includes('Halaman ini tidak ada'), 'Halaman 404 milik HWR yang tampil, bukan halaman kosong');
  check(
    await page.getByRole('link', { name: 'Buka katalog' }).isVisible(),
    'Halaman 404 menawarkan jalan keluar ke katalog',
  );
  const robots = await page.evaluate(
    () => document.querySelector('meta[name=robots]')?.getAttribute('content'),
  );
  check(robots?.includes('noindex'), 'Halaman 404 tidak diindeks');
  await page.close();
}

/* ── Tanpa JavaScript ─────────────────────────────────────────────── */
console.log('\nTanpa JavaScript');
{
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await goto(page, `${BASE}/produk/${products[0].id}`);

  const body = await page.evaluate(() => document.body.innerText);
  check(body.includes(products[0].name), 'Informasi produk tetap lengkap');
  check(body.includes('Daftar pesanan butuh JavaScript'), 'Penjelasan noscript tampil');
  check(
    (await page.locator('[role="status"]').count()) === 0,
    'Tidak ada sisa kontrol pesanan yang dirender server',
  );
  check(
    (await page.locator('button:has-text("Tambah ke pesanan")').count()) === 0,
    'Tidak ada tombol "Tambah ke pesanan" yang mati',
  );
  await ctx.close();
}

/* ── Alur pesanan ─────────────────────────────────────────────────── */
console.log('\nAlur pesanan (mobile)');
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));

  const bar = page.locator('.fixed.inset-x-0.bottom-0');
  const drawer = page.locator('[role="dialog"]');

  // Pesanan kosong: tidak ada pintu masuk yang menggantung
  await goto(page, `${BASE}/katalog`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  check(!(await bar.isVisible()), 'Pesanan kosong: bar bawah tidak muncul');
  check(
    (await page.getByRole('button', { name: /daftar pesanan/i }).count()) === 0,
    'Pesanan kosong: tombol pesanan tidak muncul di header',
  );

  // Tambah produk pertama
  await goto(page, `${BASE}/produk/${products[0].id}`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Tambah ke pesanan' }).click();
  check(await until(() => bar.isVisible()), 'Bar bawah muncul setelah produk ditambahkan');
  check(await until(async () => (await bar.innerText()).includes('1 produk')), 'Bar bawah menampilkan 1 produk');
  check(
    await until(async () =>
      (await page.locator('[role="status"]').innerText()).includes('1 lusin'),
    ),
    'Status di halaman produk menyebut jumlah yang sudah masuk',
  );

  // Tambah jumlah lewat stepper lalu tambahkan lagi
  await page.getByRole('button', { name: /tambah jumlah lusin/i }).click();
  await page.getByRole('button', { name: 'Tambah ke pesanan' }).click();
  check(
    await until(async () =>
      (await page.locator('[role="status"]').innerText()).includes('3 lusin'),
    ),
    'Menambahkan produk yang sama menjumlahkan lusinnya (1 + 2 = 3)',
  );

  // Produk kedua dari halaman lain
  await goto(page, `${BASE}/produk/${products[6].id}`, { waitUntil: 'networkidle' });
  check(
    await until(async () => (await bar.innerText()).includes('1 produk')),
    'Pesanan bertahan saat pindah halaman',
  );
  await page.getByRole('button', { name: 'Tambah ke pesanan' }).click();
  check(await until(async () => (await bar.innerText()).includes('2 produk')), 'Produk kedua masuk daftar');
  check(await until(async () => (await bar.innerText()).includes('4 lusin')), 'Total lusin dijumlahkan benar');

  // Satu pintu masuk saja di mobile: bar bawah. Tombol header khusus layar
  // lebar, supaya baris header 390px tidak berebut ruang.
  check(
    (await page.getByRole('button', { name: /Buka daftar pesanan/i }).count()) === 0,
    'Mobile: pintu masuk pesanan hanya bar bawah, tidak digandakan di header',
  );
  check(
    (await page.getByRole('button', { name: /^Lihat pesanan$/ }).count()) === 0,
    'Mobile: tautan "Lihat pesanan" di halaman produk tidak menggandakan bar bawah',
  );
  {
    const kotak = await bar.getByRole('button').boundingBox();
    check(
      !!kotak && kotak.height >= 44,
      'Bar bawah memenuhi target sentuh 44px',
      kotak ? `${Math.round(kotak.height)}px` : 'tidak terukur',
    );
  }

  // Buka drawer
  await bar.getByRole('button').click();
  check(await until(() => drawer.isVisible()), 'Drawer terbuka dari bar bawah');
  check(
    (await drawer.getAttribute('aria-modal')) === 'true',
    'Drawer memakai aria-modal',
  );
  check(
    (await page.locator('#judul-pesanan').innerText()) === 'Daftar pesanan',
    'Drawer punya judul yang dirujuk aria-labelledby',
  );
  check((await drawer.locator('li').count()) === 2, 'Drawer menampilkan dua baris pesanan');
  check(
    await page.evaluate(() => getComputedStyle(document.body).overflow === 'hidden'),
    'Halaman di belakang drawer tidak ikut menggulir',
  );

  // Ubah jumlah di dalam drawer
  const rows = drawer.locator('li');
  const sebelum = await rows.first().innerText();
  await rows.first().getByRole('button', { name: /tambah jumlah lusin/i }).click();
  check(
    await until(async () => (await rows.first().innerText()) !== sebelum),
    'Jumlah bisa diubah dari dalam drawer',
  );
  check(
    await until(async () => (await drawer.innerText()).includes('5 lusin')),
    'Ringkasan ikut berubah setelah jumlah diubah',
  );

  // Ketik jumlah langsung
  const angka = rows.first().locator('input[type=number]');
  await angka.fill('12');
  await angka.blur();
  check(
    await until(async () => (await drawer.innerText()).includes('13 lusin')),
    'Jumlah bisa diketik langsung (12 + 1 = 13 lusin)',
  );

  /*
    Tombol kirim punya dua wujud, dan yang berlaku ditentukan konfigurasi:
    tautan wa.me kalau nomor toko sudah diisi, tombol mati berpenjelasan
    kalau belum. Uji ini dulu hanya mengenal wujud kedua, jadi ia gagal
    justru pada hari nomor aslinya masuk. Sekarang keduanya diperiksa, dan
    yang menentukan dibaca dari src/config/site.ts, bukan diasumsikan.
  */
  const siteSrc = await readFile('src/config/site.ts', 'utf8');
  const nomorToko = siteSrc.match(/^\s*whatsappNumber: '(\d+)'/m)?.[1] ?? null;
  const waTautan = drawer.locator('a[href*="wa.me"]');

  if (nomorToko) {
    check((await waTautan.count()) > 0, 'Drawer membuat tautan wa.me setelah nomor diisi');
    const href = await waTautan.first().getAttribute('href');
    check(href?.includes(`wa.me/${nomorToko}`) ?? false, 'Tautan memakai nomor dari konfigurasi', href ?? '');
    /* Ringkasan drawer menyebut TOTAL (13 lusin); pesannya memerinci per
       produk (12 dan 1). Yang diperiksa rinciannya, karena itu yang dipakai
       penjual saat menyiapkan barang. */
    const pesan = decodeURIComponent(href?.split('text=')[1] ?? '');
    check(pesan.includes('12 lusin'), 'Pesan membawa jumlah baris yang baru diubah', pesan.slice(0, 90));
    check(/\n2\. .+ 1 lusin/.test(pesan), 'Pesan memerinci produk kedua, bukan cuma totalnya');
    check(
      !(await drawer.innerText()).includes('Nomor WhatsApp toko belum diisi'),
      'Penjelasan tombol mati tidak lagi tampil',
    );
  } else {
    const waBtn = drawer.getByRole('button', { name: /Pesan via WhatsApp/i });
    check(await waBtn.isDisabled(), 'Tombol WhatsApp nonaktif selama nomor belum diisi');
    check(
      (await drawer.innerText()).includes('Nomor WhatsApp toko belum diisi'),
      'Drawer menjelaskan kenapa tombol nonaktif',
    );
    check((await waTautan.count()) === 0, 'Tidak ada tautan wa.me palsu yang dibuat');
  }

  // Hapus satu baris
  await rows.last().getByRole('button', { name: /^Hapus/i }).click();
  check(
    await until(async () => (await drawer.locator('li').count()) === 1),
    'Baris bisa dihapus dari drawer',
  );

  // Kosongkan
  await drawer.getByRole('button', { name: 'Kosongkan daftar' }).click();
  check(
    await until(async () => (await drawer.innerText()).includes('Daftar pesanan masih kosong')),
    'Empty state muncul setelah daftar dikosongkan',
  );
  check(
    await until(() => drawer.getByRole('link', { name: 'Buka katalog' }).isVisible()),
    'Empty state menawarkan jalan ke katalog',
  );

  check(errors.length === 0, 'Tidak ada console error', errors.slice(0, 2).join(' | '));
  await ctx.close();
}

/* ── Aksesibilitas drawer ─────────────────────────────────────────── */
console.log('\nKeyboard & fokus');
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  await goto(page, `${BASE}/produk/${products[0].id}`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Tambah ke pesanan' }).click();

  const trigger = page.getByRole('button', { name: /Buka daftar pesanan/i });
  check(await until(() => trigger.isVisible()), 'Tombol pesanan muncul di header desktop');

  await trigger.focus();
  await page.keyboard.press('Enter');
  const drawer = page.locator('[role="dialog"]');
  check(await until(() => drawer.isVisible()), 'Drawer bisa dibuka lewat keyboard');

  check(
    await until(() =>
      page.evaluate(
        () => document.activeElement?.textContent?.includes('Tutup daftar pesanan') ?? false,
      ),
    ),
    'Fokus pindah ke tombol tutup saat drawer terbuka',
  );

  // Jebakan fokus: Tab berkali-kali tidak boleh keluar dari panel
  let keluar = false;
  for (let i = 0; i < 25; i += 1) {
    await page.keyboard.press('Tab');
    const di = await page.evaluate(() =>
      document.querySelector('[role="dialog"]')?.contains(document.activeElement),
    );
    if (!di) {
      keluar = true;
      break;
    }
  }
  check(!keluar, 'Fokus tidak bisa keluar dari drawer selama terbuka');

  // Shift+Tab juga terjebak
  for (let i = 0; i < 25; i += 1) await page.keyboard.press('Shift+Tab');
  check(
    await page.evaluate(() =>
      document.querySelector('[role="dialog"]')?.contains(document.activeElement),
    ),
    'Shift+Tab juga tetap di dalam drawer',
  );

  // Escape menutup dan mengembalikan fokus
  await page.keyboard.press('Escape');
  check(await until(async () => !(await drawer.isVisible())), 'Escape menutup drawer');
  check(
    await until(() =>
      page.evaluate(() => document.activeElement?.textContent?.includes('Pesanan') ?? false),
    ),
    'Fokus kembali ke tombol yang membuka drawer',
  );
  check(
    await until(() =>
      page.evaluate(() => getComputedStyle(document.body).overflow !== 'hidden'),
    ),
    'Penguncian gulir dilepas setelah drawer ditutup',
  );

  // Target sentuh di dalam drawer
  await trigger.click();
  await until(() => drawer.isVisible());
  const kecil = await page.$$eval('[role="dialog"] button, [role="dialog"] a', (els) =>
    els
      .map((el) => ({ r: el.getBoundingClientRect(), t: (el.textContent || '').trim().slice(0, 28) }))
      .filter(({ r }) => r.width > 1 && r.height > 1 && (r.height < 44 || r.width < 24))
      .map(({ r, t }) => `"${t}" ${Math.round(r.width)}x${Math.round(r.height)}`),
  );
  check(kecil.length === 0, 'Semua target sentuh di drawer minimal 44px', kecil.slice(0, 3).join(', '));

  await ctx.close();
}

/* ── Penyimpanan ──────────────────────────────────────────────────── */
console.log('\nPenyimpanan');
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  await goto(page, `${BASE}/produk/${products[2].id}`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Tambah ke pesanan' }).click();
  await page.reload({ waitUntil: 'networkidle' });
  check(
    await until(() => page.getByRole('button', { name: /Buka daftar pesanan/i }).isVisible()),
    'Pesanan bertahan setelah halaman dimuat ulang',
  );

  // Data rusak di localStorage tidak boleh membuat halaman error
  await page.evaluate(() => {
    localStorage.setItem('hwr.pesanan.v1', '{"bukan":"array"}');
  });
  await page.reload({ waitUntil: 'networkidle' });
  let rusak = [];
  page.on('pageerror', (e) => rusak.push(String(e)));
  await page.waitForTimeout(300);
  check(rusak.length === 0, 'localStorage rusak tidak membuat halaman error');
  check(
    (await page.getByRole('button', { name: /Buka daftar pesanan/i }).count()) === 0,
    'Pesanan rusak diabaikan, bukan ditampilkan setengah jadi',
  );

  await page.evaluate(() => {
    localStorage.setItem(
      'hwr.pesanan.v1',
      JSON.stringify([{ id: 'x', code: 'X-01', name: 'X', pricePerDozen: 1000, priceType: 'tetap', qty: -5 }]),
    );
  });
  await page.reload({ waitUntil: 'networkidle' });
  await until(() => page.getByRole('button', { name: /Buka daftar pesanan/i }).isVisible());
  await page.getByRole('button', { name: /Buka daftar pesanan/i }).click();
  check(
    await until(async () => (await page.locator('[role="dialog"] input[type=number]').inputValue()) === '1'),
    'Jumlah tidak masuk akal dijepit ke minimum 1 lusin',
  );

  await ctx.close();
}

/* ── Hidrasi tertunda ───────────────────────────────────────────────── */
{
  console.log('\nHidrasi tertunda');
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  // Kunjungan pertama: daftar pesanan kosong, jadi framework tidak boleh
  // ikut diunduh sama sekali (lihat src/directives/pesanan.ts).
  const jsDiminta = [];
  page.on('request', (r) => {
    if (r.resourceType() === 'script' && /OrderButton|preact|nanostores|QtyStepper/i.test(r.url())) {
      jsDiminta.push(r.url());
    }
  });

  await goto(page, `${BASE}/katalog`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  check(
    jsDiminta.length === 0,
    'Katalog tidak mengunduh island pesanan saat daftar masih kosong',
    jsDiminta.join(', '),
  );
  check(
    (await page.getByRole('button', { name: /Buka daftar pesanan/i }).count()) === 0,
    'Tidak ada tombol pesanan saat daftar kosong',
  );

  // Produk pertama masuk: tombol harus muncul tanpa reload, artinya island
  // header benar-benar terhidrasi oleh siaran dari store.
  await goto(page, `${BASE}/produk/${products[0].id}`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Tambah ke pesanan' }).click();
  check(
    await until(() => page.getByRole('button', { name: /Buka daftar pesanan/i }).isVisible(), 6000),
    'Tombol pesanan muncul tanpa reload setelah produk pertama ditambahkan',
  );

  // Kunjungan berikutnya ke katalog: sekarang ada isinya, jadi island
  // dihidrasi dari localStorage.
  await goto(page, `${BASE}/katalog`, { waitUntil: 'networkidle' });
  check(
    await until(() => page.getByRole('button', { name: /Buka daftar pesanan/i }).isVisible(), 6000),
    'Tombol pesanan ikut muncul di katalog setelah daftar berisi',
  );
  check(
    await until(async () => (await page.locator('[data-pesanan-bar], header').first().innerText()).includes('1')),
    'Jumlah lusin ikut terbawa antar halaman',
  );

  await ctx.close();
}

await browser.close();
console.log(fails.length ? `\n${fails.length} uji gagal.` : '\nSemua uji pesanan lulus.');
if (fails.length) process.exitCode = 1;
