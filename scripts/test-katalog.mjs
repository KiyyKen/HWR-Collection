/**
 * Uji perilaku katalog: filter kategori, cari, urutkan, state URL,
 * empty state, keyboard, dan progressive enhancement.
 *
 * Jalankan: npm run test:katalog
 */

import { chromium } from 'playwright';

const BASE = 'http://localhost:4321';
const fails = [];
const ok = (label) => console.log(`  ✓ ${label}`);
const check = (cond, label, detail = '') => {
  if (cond) ok(label);
  else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
    fails.push(label);
  }
};

const browser = await chromium.launch();

/* ── Tanpa JavaScript ─────────────────────────────────────────────── */
console.log('\nTanpa JavaScript');
{
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/katalog`);
  check((await page.locator('[data-produk]').count()) === 24, '24 produk tetap dirender');
  check(
    !(await page.locator('[data-toolbar]').first().isVisible()),
    'Kontrol cari/urut disembunyikan (tidak ada kontrol mati)',
  );

  const filterNav = page.locator('nav[aria-label="Filter kategori"]');
  await filterNav.getByRole('link', { name: /^Jeans/ }).click();
  await page.waitForLoadState('domcontentloaded');
  check(page.url().endsWith('/katalog/jeans'), 'Filter kategori bekerja lewat link biasa');
  check((await page.locator('[data-produk]').count()) === 6, 'Kategori Jeans berisi 6 produk');

  await ctx.close();
}

/* ── Dengan JavaScript ────────────────────────────────────────────── */
console.log('\nDengan JavaScript');
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(`${BASE}/katalog`, { waitUntil: 'networkidle' });

  const cari = page.locator('[data-cari]');
  const urut = page.locator('[data-urut]');
  const jumlah = page.locator('[data-jumlah]');
  const kosong = page.locator('[data-kosong]');
  const visible = () => page.locator('[data-produk]:not([hidden])');

  check(await cari.isVisible(), 'Kontrol cari muncul setelah JS jalan');
  check((await jumlah.textContent())?.includes('24'), 'Jumlah awal 24 produk');

  // Cari berdasarkan nama
  await cari.fill('cargo');
  check((await visible().count()) === 4, 'Cari "cargo" → 4 produk', `dapat ${await visible().count()}`);
  check(page.url().includes('cari=cargo'), 'Query string mencatat pencarian');

  // Cari berdasarkan kode artikel
  await cari.fill('J-04');
  check((await visible().count()) === 1, 'Cari kode "J-04" → 1 produk');
  check(
    (await visible().first().textContent())?.includes('Cutbray'),
    'Produk yang cocok adalah Jeans Anak Cutbray',
  );

  // Empty state
  await cari.fill('zzzz');
  check(await kosong.isVisible(), 'Empty state muncul saat tidak ada hasil');
  check(
    (await kosong.textContent())?.includes('zzzz'),
    'Empty state menyebutkan kata yang dicari',
  );
  check(
    (await jumlah.textContent())?.includes('Tidak ada'),
    'Status mengumumkan kalimat utuh, bukan angka telanjang',
  );
  check(!(await page.locator('#daftar-produk').isVisible()), 'Grid disembunyikan saat kosong');

  // Pemulihan dari empty state
  await page.locator('[data-hapus]').click();
  check((await visible().count()) === 24, 'Tombol "Hapus pencarian" mengembalikan semua produk');
  check(
    await cari.evaluate((el) => el === document.activeElement),
    'Fokus pindah ke kolom cari setelah dihapus',
  );
  check(!page.url().includes('cari='), 'Query string dibersihkan saat pencarian kosong');

  // Urutkan
  await urut.selectOption('harga-naik');
  const naik = await page.$$eval('[data-produk]:not([hidden])', (els) =>
    els.map((e) => Number(e.dataset.harga)),
  );
  check(
    naik.every((v, i) => i === 0 || naik[i - 1] <= v),
    'Urut harga terendah benar',
    naik.slice(0, 4).join(', '),
  );
  check(page.url().includes('urut=harga-naik'), 'Query string mencatat pengurutan');

  await urut.selectOption('harga-turun');
  const turun = await page.$$eval('[data-produk]:not([hidden])', (els) =>
    els.map((e) => Number(e.dataset.harga)),
  );
  check(
    turun.every((v, i) => i === 0 || turun[i - 1] >= v),
    'Urut harga tertinggi benar',
    turun.slice(0, 4).join(', '),
  );

  // Urutan DOM ikut berubah, bukan hanya CSS order (penting untuk keyboard)
  const domOrderMatchesVisual = await page.$$eval('[data-produk]:not([hidden])', (els) =>
    els.every((e) => getComputedStyle(e).order === '0'),
  );
  check(domOrderMatchesVisual, 'Pengurutan memindahkan node DOM, bukan properti order CSS');

  // State dibaca ulang dari URL
  await page.goto(`${BASE}/katalog?cari=kolor&urut=harga-turun`, { waitUntil: 'networkidle' });
  check((await cari.inputValue()) === 'kolor', 'Kolom cari terisi dari URL');
  check((await urut.inputValue()) === 'harga-turun', 'Pengurutan terbaca dari URL');
  check((await visible().count()) === 4, 'Hasil sesuai filter dari URL');

  // Link produk. Halaman /produk/<id> sendiri baru dibangun di Fase 4, jadi
  // yang diuji di sini adalah bentuk dan kelengkapan tautannya.
  await page.goto(`${BASE}/katalog`, { waitUntil: 'networkidle' });
  const hrefs = await page.$$eval('[data-produk] :is(h2,h3) a', (els) => els.map((e) => e.getAttribute('href')));
  check(hrefs.length === 24, 'Setiap produk punya tepat satu link');
  check(
    hrefs.every((h) => /^\/produk\/[a-z0-9-]+$/.test(h ?? '')),
    'Semua link produk berbentuk /produk/<id>',
    hrefs.find((h) => !/^\/produk\/[a-z0-9-]+$/.test(h ?? '')) ?? '',
  );
  check(new Set(hrefs).size === 24, 'Tidak ada link produk yang duplikat');
  check(
    (await page.$$eval('[data-produk] a', (els) => els.length)) === 24,
    'Tepat satu link per sel (tidak ada link ganda ke tujuan yang sama)',
  );

  // Kembali ke katalog memulihkan filter dari URL
  await page.goto(`${BASE}/katalog?cari=cargo`, { waitUntil: 'networkidle' });
  check((await visible().count()) === 4, 'Filter dari URL diterapkan sebelum berpindah');
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.goBack({ waitUntil: 'networkidle' });
  check(page.url().includes('cari=cargo'), 'Kembali ke katalog memulihkan URL berfilter');
  check((await visible().count()) === 4, 'Filter benar-benar diterapkan ulang setelah kembali');

  // Keyboard: kolom cari dan select bisa dioperasikan penuh
  await page.goto(`${BASE}/katalog`, { waitUntil: 'networkidle' });
  await cari.focus();
  await page.keyboard.type('hawai');
  check((await visible().count()) === 4, 'Mengetik lewat keyboard memfilter');
  // Focus ring ada di pembungkus (focus-within), bukan di input itu sendiri.
  const ring = await cari.evaluate((el) => {
    const cs = getComputedStyle(el.closest('label'));
    return cs.outlineStyle !== 'none' && cs.outlineWidth !== '0px';
  });
  check(ring, 'Kotak cari punya focus ring terlihat saat input fokus');

  check(errors.length === 0, 'Tidak ada console error', errors.slice(0, 2).join(' | '));

  await ctx.close();
}

/* ── Kategori aktif ───────────────────────────────────────────────── */
console.log('\nHalaman kategori');
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/katalog/cargo`, { waitUntil: 'networkidle' });

  const current = page.locator('[aria-current="page"]');
  check((await current.count()) >= 1, 'Kategori aktif ditandai aria-current');
  check(
    (await current.first().textContent())?.includes('Cargo'),
    'Kategori aktif yang benar ditandai',
  );
  check((await page.locator('[data-produk]').count()) === 4, 'Kategori Cargo berisi 4 produk');
  check(
    (await page.locator('h1').textContent()) === 'Celana Cargo',
    'Judul halaman memakai nama kategori',
  );

  // Cari di dalam kategori
  // Kategori Cargo punya dua produk "pendek": CG-02 dan CG-04.
  await page.locator('[data-cari]').fill('pendek');
  check(
    (await page.locator('[data-produk]:not([hidden])').count()) === 2,
    'Cari di dalam kategori hanya menjangkau produk kategori itu',
  );

  // Empty state di kategori menawarkan jalan keluar ke semua kategori
  await page.locator('[data-cari]').fill('zzzz');
  check(
    await page.getByRole('link', { name: 'Cari di semua kategori' }).isVisible(),
    'Empty state kategori menawarkan pencarian di semua kategori',
  );

  await page.close();
}

await browser.close();

console.log(
  fails.length ? `\n${fails.length} uji gagal.` : '\nSemua uji katalog lulus.',
);
if (fails.length) process.exitCode = 1;
