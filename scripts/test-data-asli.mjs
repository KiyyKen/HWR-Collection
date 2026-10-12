/**
 * Gladi bersih: apa yang terjadi saat data asli masuk?
 *
 * Seluruh struktur placeholder di proyek ini punya dua keadaan — kosong dan
 * terisi — tapi selama ini hanya keadaan kosong yang pernah dilihat. Script
 * ini mengisi SEMUANYA sementara (nomor, alamat, peta, jam buka, logo,
 * kebijakan grosir, satu produk yang ditandai bukan dummy lagi), membangun
 * situs, memeriksa hasilnya, lalu MEMULIHKAN setiap file di blok finally.
 *
 * Nilai yang dipakai sengaja ditulis "Uji" supaya tidak pernah bisa dikira
 * data sungguhan kalau sampai terlihat. Tidak ada yang tertinggal: file
 * dipulihkan, logo uji dihapus, dan dist/ dibangun ulang.
 *
 * Jalankan: npm run test:data
 */

import { chromium } from 'playwright';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const PORT = 4332;
const BASE = `http://localhost:${PORT}`;
const CONFIG = 'src/config/site.ts';
const PRODUCTS = 'src/content/products.json';
const LOGO = 'public/logo-uji.svg';

/** Nilai uji. Semuanya mengandung kata "Uji" kecuali yang formatnya terikat. */
/* Lihat catatan yang sama di scripts/test-whatsapp.mjs. */
process.env.HWR_UJI_NOMOR = '1';

const UJI = {
  /* Domain uji. Selama `site.url` masih `.example`, robots.txt memancarkan
     Disallow dan seluruh canonical menunjuk alamat yang tidak ada — artinya
     bentuk akhir canonical, Open Graph, dan sitemap tidak pernah teruji
     sampai domainnya diisi. Di sinilah keadaan itu dijalankan. */
  domain: 'https://hwr-uji.test',
  nomor: '6281234567890',
  alamat: 'Jalan Uji Coba No. 1',
  kelurahan: 'Kelurahan Uji',
  kecamatan: 'Kecamatan Uji',
  kota: 'Kota Uji',
  provinsi: 'Provinsi Uji',
  kodePos: '00000',
  maps: 'https://maps.google.com/?q=Uji',
  embed: 'https://www.google.com/maps/embed?pb=uji',
  telepon: '021-0000000',
  email: 'uji@example.com',
  jam: 'Senin–Sabtu 08.00–17.00, Minggu tutup',
  jamLd: 'Mo-Sa 08:00-17:00',
  ukuran: 'Boleh pilih ukuran dalam satu lusin (uji)',
  warna: 'Boleh campur warna dalam satu lusin (uji)',
  model: 'Boleh campur model (uji)',
  ekspedisi: 'Ekspedisi Uji',
  kodi: 'Harga kodi tersedia (uji)',
  eceran: 'Melayani eceran (uji)',
  proses: '1–2 hari kerja (uji)',
  reseller: 'Harga khusus reseller (uji)',
  bayar: 'Transfer bank (uji)',
};

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { shell: true, stdio: 'ignore' });
    p.on('exit', (c) => (c === 0 ? resolve() : reject(new Error(`${cmd} keluar dengan kode ${c}`))));
    p.on('error', reject);
  });
}

async function tungguSiap(url, timeout = 30000) {
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

const fails = [];
const check = (cond, label, detail = '') => {
  if (cond) console.log(`  ✓ ${label}`);
  else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
    fails.push(label);
  }
};

/**
 * Ganti satu baris `nama: <apa pun>,` di dalam sumber TypeScript.
 *
 * Menolak nama yang muncul lebih dari sekali. `payment` ada dua — satu di
 * `orderFlow`, satu di `wholesalePolicy` — dan mengganti yang pertama saja
 * membuat uji ini lolos tanpa pernah menyentuh field yang dimaksud. Untuk
 * kasus begitu, sebutkan `setelah` sebagai penanda blok.
 */
function ganti(src, nama, nilaiBaru, setelah = null) {
  const mulai = setelah ? src.indexOf(setelah) : 0;
  if (mulai < 0) throw new Error(`Tidak menemukan penanda "${setelah}" di ${CONFIG}`);

  const kepala = src.slice(0, mulai);
  const ekor = src.slice(mulai);
  const re = new RegExp(`(\\n\\s*${nama}:\\s*)[^\\n]*`);
  const jumlah = (ekor.match(new RegExp(re.source, 'g')) ?? []).length;

  if (jumlah === 0) throw new Error(`Tidak menemukan field "${nama}" di ${CONFIG}`);
  if (jumlah > 1)
    throw new Error(
      `Field "${nama}" muncul ${jumlah} kali di ${CONFIG} — sebutkan penanda blok supaya yang diganti tidak salah`,
    );

  return kepala + ekor.replace(re, `$1${nilaiBaru},`);
}

const configAsli = await readFile(CONFIG, 'utf8');
const produkAsli = await readFile(PRODUCTS, 'utf8');

let config = configAsli;
config = ganti(config, 'url', `'${UJI.domain}'`);
config = ganti(config, 'whatsappNumber', `'${UJI.nomor}' as string`);
config = ganti(config, 'logo', `'/logo-uji.svg' as string | null`);
config = ganti(config, 'addressLine', `'${UJI.alamat}' as string`);
config = ganti(config, 'village', `'${UJI.kelurahan}' as string`);
config = ganti(config, 'district', `'${UJI.kecamatan}' as string`);
config = ganti(config, 'city', `'${UJI.kota}' as string`);
config = ganti(config, 'province', `'${UJI.provinsi}' as string`);
config = ganti(config, 'postalCode', `'${UJI.kodePos}' as string`);
config = ganti(config, 'mapsUrl', `'${UJI.maps}' as string`);
config = ganti(config, 'mapsEmbedUrl', `'${UJI.embed}' as string`);
config = ganti(config, 'phone', `'${UJI.telepon}' as string`);
config = ganti(config, 'email', `'${UJI.email}' as string`);
config = ganti(config, 'summary', `'${UJI.jam}' as string`);
config = ganti(config, 'openingHours', `['${UJI.jamLd}'] as readonly string[]`);
config = ganti(config, 'mixedSizes', `'${UJI.ukuran}' as string | null`);
config = ganti(config, 'mixedColors', `'${UJI.warna}' as string | null`);
config = ganti(config, 'mixedModels', `'${UJI.model}' as string | null`);
config = ganti(config, 'couriers', `'${UJI.ekspedisi}' as string | null`);
config = ganti(config, 'bulkTier', `'${UJI.kodi}' as string | null`);
config = ganti(config, 'retail', `'${UJI.eceran}' as string | null`);
config = ganti(config, 'processingTime', `'${UJI.proses}' as string | null`);
config = ganti(config, 'reseller', `'${UJI.reseller}' as string | null`);
config = ganti(config, 'payment', `'${UJI.bayar}' as string | null`, 'wholesalePolicy: {');

/** Satu produk diperlakukan sebagai data asli: dummy false, tanpa shape. */
const produk = JSON.parse(produkAsli);
const target = produk[0];
delete target.shape;
target.dummy = false;

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 28" width="120" height="28">
  <rect width="120" height="28" fill="#17233B"/>
  <text x="8" y="20" font-family="sans-serif" font-size="16" fill="#FFFFFF">LOGO UJI</text>
</svg>`;

let browser;
let preview;
try {
  await writeFile(CONFIG, config);
  await writeFile(PRODUCTS, JSON.stringify(produk, null, 2) + '\n');
  await writeFile(LOGO, logoSvg);

  console.log('Memeriksa data…');
  await run('node', ['scripts/validate-data.mjs']);
  console.log('  ✓ npm run validate lolos dengan data terisi');

  console.log('Membangun dengan data uji…');
  await run('npx', ['astro', 'build']);

  // Preview server dikelola CLI: kalau ada sisa dari uji sebelumnya, CLI
  // menolak start kedua dan --port diabaikan. Hentikan dulu.
  await run('npx', ['astro', 'preview', 'stop']).catch(() => {});

  preview = spawn('npx', ['astro', 'preview', '--port', String(PORT)], {
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  preview.stdout?.on('data', (d) => (log += d));
  preview.stderr?.on('data', (d) => (log += d));
  if (!(await tungguSiap(BASE, 60000))) {
    throw new Error(`astro preview tidak siap.\n${log.trim() || '(tidak ada keluaran)'}`);
  }

  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE, { waitUntil: 'networkidle' });

  console.log('\nMerek');
  const logo = page.locator('header img').first();
  check(await logo.isVisible(), 'Logo asli dipakai di header');
  check((await logo.getAttribute('src')) === '/logo-uji.svg', 'Logo diambil dari konfigurasi');
  check(
    (await page.locator('header').getByText('Collection', { exact: true }).count()) === 0,
    'Wordmark sementara tidak ikut tampil di samping logo',
  );
  check(
    (await page.locator('link[rel="icon"][type="image/svg+xml"]').count()) === 1,
    'Favicon SVG terpasang',
  );

  console.log('\nLokasi toko');
  const teks = await page.locator('main').innerText();
  check(teks.includes(UJI.alamat), 'Alamat tampil');
  check(teks.includes(`${UJI.kelurahan}, ${UJI.kecamatan}`), 'Kelurahan & kecamatan tampil');
  check(
    teks.includes(`${UJI.kota}, ${UJI.provinsi} ${UJI.kodePos}`),
    'Kota, provinsi, kode pos tampil satu baris',
  );
  check(teks.includes(UJI.jam), 'Jam buka tampil');
  check(!teks.includes('menunggu data dari pemilik'), 'Tidak ada lagi penanda "menunggu data"');

  const maps = page.getByRole('link', { name: 'Buka di Google Maps' });
  check(await maps.isVisible(), 'Tombol Google Maps jadi tautan aktif');
  check((await maps.getAttribute('href')) === UJI.maps, 'Tautan Maps dari konfigurasi');

  const arah = page.getByRole('link', { name: /Petunjuk arah ke toko/i });
  check(await arah.isVisible(), 'Tautan petunjuk arah muncul setelah ada alamat');
  const arahHref = (await arah.getAttribute('href')) ?? '';
  check(
    arahHref.startsWith('https://www.google.com/maps/dir/?api=1&destination='),
    'Petunjuk arah memakai alamat, bukan koordinat karangan',
  );
  check(
    decodeURIComponent(arahHref).includes(UJI.alamat),
    'Alamat toko ikut di dalam tautan arah',
  );

  check((await page.locator('iframe[title*="Peta"]').count()) === 1, 'Peta sematan menggantikan kotak kosong');

  console.log('\nKebijakan grosir');
  for (const [label, nilai] of [
    ['Pilihan ukuran', UJI.ukuran],
    ['Pilihan warna', UJI.warna],
    ['Campur model', UJI.model],
    ['Ekspedisi', UJI.ekspedisi],
    ['Harga kodi / karton', UJI.kodi],
    ['Eceran satuan', UJI.eceran],
    ['Waktu proses', UJI.proses],
    ['Harga reseller', UJI.reseller],
    ['Pembayaran', UJI.bayar],
  ]) {
    check(teks.includes(nilai), `Baris "${label}" terisi`);
  }
  check(
    !teks.includes('Menunggu konfirmasi pemilik'),
    'Tidak ada lagi baris "menunggu konfirmasi pemilik"',
  );

  console.log('\nKontak');
  const footer = await page.locator('footer').innerText();
  check(footer.includes(UJI.nomor), 'Nomor WhatsApp tampil di footer');
  check(footer.includes(UJI.telepon), 'Telepon muncul setelah diisi');
  check(footer.includes(UJI.email), 'Email muncul setelah diisi');

  console.log('\nStructured data');
  const ld = JSON.parse(await page.locator('script[type="application/ld+json"]').first().innerText());
  const store = ld.find((x) => x['@type'] === 'Store');
  check(store?.address?.addressLocality === UJI.kota, 'JSON-LD Store memuat kota');
  check(
    store?.address?.streetAddress === `${UJI.alamat}, ${UJI.kelurahan}, ${UJI.kecamatan}`,
    'JSON-LD Store memuat jalan, kelurahan, dan kecamatan',
    store?.address?.streetAddress,
  );
  check(store?.openingHours?.[0] === UJI.jamLd, 'JSON-LD Store memuat jam buka');
  check(store?.telephone === UJI.telepon, 'JSON-LD Store memuat telepon');

  await page.goto(`${BASE}/produk/${target.id}`, { waitUntil: 'networkidle' });
  const ldProduk = JSON.parse(
    await page.locator('script[type="application/ld+json"]').first().innerText(),
  );
  const schemaProduk = ldProduk.find((x) => x['@type'] === 'Product');
  check(!!schemaProduk, 'Schema Product aktif sendiri saat dummy: false');
  check(schemaProduk?.sku === target.code, 'Schema Product memakai kode artikel');
  check(
    schemaProduk?.offers?.price === target.pricePerDozen,
    'Schema Product memuat harga per lusin',
  );
  check(!('availability' in (schemaProduk?.offers ?? {})), 'Ketersediaan tidak dikarang');
  check(!('aggregateRating' in (schemaProduk ?? {})), 'Rating tidak dikarang');

  const produkLain = produk.find((p) => p.dummy);
  await page.goto(`${BASE}/produk/${produkLain.id}`, { waitUntil: 'networkidle' });
  const ldLain = JSON.parse(
    await page.locator('script[type="application/ld+json"]').first().innerText(),
  );
  check(
    !ldLain.some((x) => x['@type'] === 'Product'),
    'Produk yang masih dummy tetap tidak memancarkan schema Product',
  );

  /* Domain asli mengubah empat keluaran sekaligus, dan keempatnya baru
     berbentuk final di keadaan ini. */
  console.log('\nDomain asli');
  const robots = await (await fetch(`${BASE}/robots.txt`)).text();
  check(robots.includes('Allow: /'), 'robots.txt mengizinkan indexing setelah domain diisi');
  check(!robots.includes('Disallow: /'), 'Larangan indexing domain contoh sudah hilang');
  check(
    robots.includes(`${UJI.domain}/sitemap-index.xml`),
    'Baris Sitemap memakai domain asli',
    robots.replace(/\n/g, ' | '),
  );

  const sitemap = await (await fetch(`${BASE}/sitemap-0.xml`)).text();
  check(
    sitemap.includes(`<loc>${UJI.domain}/`) && !sitemap.includes('hwrcollection.example'),
    'Seluruh URL sitemap memakai domain asli',
  );

  await page.goto(`${BASE}/produk/${target.id}`, { waitUntil: 'networkidle' });
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
  const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
  check(canonical === `${UJI.domain}/produk/${target.id}/`, 'Canonical memakai domain asli', canonical);
  check(ogImage?.startsWith(UJI.domain), 'og:image jadi URL absolut berdomain asli', ogImage);
  check(ogUrl?.startsWith(UJI.domain), 'og:url memakai domain asli', ogUrl);

  console.log('\nPita versi pengembangan');
  check(
    (await page.locator('body').innerText()).includes(`${produk.length - 1} produk masih data contoh`),
    'Pita menghitung sisa produk contoh dan berhenti menyebut nomor WhatsApp',
  );
} finally {
  await browser?.close();
  preview?.kill();
  await run('npx', ['astro', 'preview', 'stop']).catch(() => {});

  await writeFile(CONFIG, configAsli);
  await writeFile(PRODUCTS, produkAsli);
  await unlink(LOGO).catch(() => {});

  const c = await readFile(CONFIG, 'utf8');
  const p = await readFile(PRODUCTS, 'utf8');
  if (c !== configAsli || p !== produkAsli) {
    console.error('\nGAGAL memulihkan file. Periksa src/config/site.ts dan src/content/products.json.');
    process.exitCode = 1;
  } else {
    console.log('\nsite.ts, products.json, dan public/ dipulihkan ke keadaan placeholder.');
  }

  console.log('Membangun ulang dengan konfigurasi asli…');
  await run('npx', ['astro', 'build']).catch(() => {
    console.error('Build ulang gagal. Jalankan "npm run build" sebelum memakai dist/.');
  });
}

console.log(fails.length ? `\n${fails.length} uji gagal.` : '\nSemua uji data asli lulus.');
if (fails.length) process.exitCode = 1;
