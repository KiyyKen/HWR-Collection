/**
 * Potret alur pesan, bukan halaman diam.
 *
 * Halaman kosong sudah terpotret oleh `npm run shoot`. Yang tidak pernah
 * terlihat di sana justru momen-momen penentu: sesaat setelah produk masuk
 * daftar, bar pesanan di mobile, dan isi drawer. Script ini memotret itu.
 *
 * Jalankan: npm run journey
 */
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';

const BASE = 'http://localhost:4321';
const OUT = '.shots/journey';
const produk = JSON.parse(await readFile('src/content/products.json', 'utf8'));

const layar = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1440, height: 900 },
};

const browser = await chromium.launch();

for (const [nama, viewport] of Object.entries(layar)) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const snap = (n) => page.screenshot({ path: `${OUT}/${nama}-${n}.png` });

  await page.goto(`${BASE}/produk/${produk[0].id}`, { waitUntil: 'networkidle' });
  await snap('1-produk');

  await page.getByRole('button', { name: 'Tambah ke pesanan' }).click();
  await page.waitForTimeout(900);
  await snap('2-setelah-tambah');

  // Produk kedua, supaya daftar berisi lebih dari satu baris.
  await page.goto(`${BASE}/produk/${produk[12].id}`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Tambah ke pesanan' }).click();
  await page.waitForTimeout(600);

  await page.goto(`${BASE}/katalog`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await snap('3-katalog-dengan-pesanan');

  /*
    Pintu masuk daftar pesanan berbeda per lebar layar, dan namanya ikut
    berbeda: di mobile yang ada bar bawah ("Lihat pesanan"), di ≥768px
    tombol header ("Buka daftar pesanan"). Mencari salah satu namanya
    membuat script ini menggantung selama 30 detik di viewport yang lain —
    dan potret drawer mobile tidak pernah benar-benar diperbarui.

    Yang dipakai: atribut yang memang dimiliki keduanya, disaring ke yang
    sedang terlihat.
  */
  await page.locator('[data-buka-pesanan]:visible').first().click();
  await page.waitForTimeout(700);
  await snap('4-drawer');

  await ctx.close();
}

await browser.close();
console.log(`Potret alur tersimpan di ${OUT}/`);
