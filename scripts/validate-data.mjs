/**
 * Pemeriksa data HWR Collection.
 *
 * Skema Zod di src/content.config.ts sudah menjaga bentuk tiap field. Yang
 * TIDAK bisa dilihat skema itulah yang diperiksa di sini:
 *
 *   - id atau kode produk yang kembar
 *   - foto yang hilang, kembar, atau menganggur tanpa produk
 *   - field asing hasil salah ketik (Zod membuangnya diam-diam)
 *   - flag `dummy` yang bertabrakan dengan keadaan sebenarnya
 *   - nomor WhatsApp yang formatnya akan menghasilkan tautan rusak
 *
 * Kategori, siluet, dan field wajib ikut diperiksa juga supaya laporannya
 * bisa dibaca orang — bukan lemparan error Zod di tengah build.
 *
 * Jalankan: npm run validate
 * Jalan otomatis sebelum `npm run build`.
 *
 * Keluar dengan kode 1 kalau ada ERROR. PERINGATAN tidak menggagalkan build:
 * itu hal yang wajar selama data asli belum masuk.
 */

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRODUCTS = path.join(ROOT, 'src/content/products.json');
const PHOTOS = path.join(ROOT, 'src/assets/products');
const CATEGORIES_TS = path.join(ROOT, 'src/data/categories.ts');
const SCHEMA_TS = path.join(ROOT, 'src/content.config.ts');
const SITE_TS = path.join(ROOT, 'src/config/site.ts');
const CMS_TS = path.join(ROOT, 'src/config/cms.ts');
const CMS_LIB_TS = path.join(ROOT, 'src/lib/cms.ts');

/**
 * Keluar dengan kode tertentu, tanpa menabrak socket yang masih terbuka.
 *
 * `@sanity/client` menyisakan socket keep-alive setelah fetch. Memanggil
 * `process.exit()` selagi socket itu hidup memicu assertion libuv di Windows
 * — prosesnya abort dengan kode 127 dan mencetak `Assertion failed:
 * !(handle->flags & UV_HANDLE_CLOSING)` tepat di bawah pesan kesalahan yang
 * sebenarnya. Build tetap gagal, tapi orang yang membacanya jadi mengira
 * alatnya yang rusak, bukan datanya.
 *
 * Jadi kode keluar disetel lebih dulu, socket diberi satu jeda pendek untuk
 * menutup diri, baru prosesnya dihentikan. Karena ini `await`, pemanggilnya
 * ikut berhenti di sini — sama seperti `process.exit()` yang digantikannya.
 */
async function keluar(code) {
  process.exitCode = code;
  await new Promise((r) => setTimeout(r, 250));
  process.exit(code);
}

const errors = [];
const warnings = [];
const err = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

/* ── Sumber kebenaran diambil dari file aslinya, bukan disalin ke sini ── */

/** Ambil isi array string dari potongan sumber TypeScript. */
function stringList(source, afterMarker, label) {
  const start = source.indexOf(afterMarker);
  if (start === -1) throw new Error(`Tidak menemukan "${afterMarker}" saat membaca ${label}`);
  const open = source.indexOf('[', start);
  const close = source.indexOf(']', open);
  if (open === -1 || close === -1) throw new Error(`Bentuk ${label} tidak dikenali`);
  return [...source.slice(open, close).matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

const categoriesSrc = await readFile(CATEGORIES_TS, 'utf8');
const schemaSrc = await readFile(SCHEMA_TS, 'utf8');
const siteSrc = await readFile(SITE_TS, 'utf8');

const KATEGORI = stringList(categoriesSrc, 'CATEGORY_IDS = [', 'daftar kategori');
const SILUET = stringList(schemaSrc, 'shape: z', 'daftar siluet');
const PRICE_TYPES = ['tetap', 'mulai'];

/** Field yang dikenal skema. Selain ini berarti salah ketik. */
const FIELDS = new Set([
  'id',
  'code',
  'name',
  'category',
  'pricePerDozen',
  'priceType',
  'sizes',
  'sizeNote',
  'colors',
  'material',
  'description',
  'shape',
  'featured',
  'dummy',
]);

/* ── Produk ─────────────────────────────────────────────────────────── */

let products;
/* ── Sumber produk: CMS kalau sudah dikonfigurasi, kalau belum file JSON ── */

const cmsSrc = await readFile(CMS_TS, 'utf8');
/**
 * Baca satu nilai dari src/config/cms.ts.
 *
 * Pemindaian baris, bukan regex yang dirakit dari string: regex begitu mudah
 * rusak diam-diam oleh satu backslash yang hilang, dan kerusakannya berupa
 * "tidak cocok" — yang di sini artinya pemeriksa mengira CMS belum aktif
 * padahal sudah.
 */
const barisCms = cmsSrc.split(/\r?\n/);

const nilaiCms = (nama) => {
  const baris = barisCms.find((l) => l.trim().startsWith(`${nama}:`)) ?? '';
  if (!baris || baris.includes('PLACEHOLDER')) return null;
  return baris.match(/['"]([^'"]+)['"]/)?.[1] ?? null;
};

const projectId = nilaiCms('projectId');
const cmsAktif = projectId !== null;

/**
 * Query GROQ-nya dibaca dari src/lib/cms.ts, bukan disalin ke sini.
 * Dua query yang perlahan berbeda akan membuat pemeriksa ini meloloskan
 * data yang justru menggagalkan build.
 */
function queryDariLib(src) {
  const mulai = src.indexOf('const QUERY');
  const buka = src.indexOf('`', mulai);
  const tutup = src.indexOf('`', buka + 1);
  if (mulai === -1 || buka === -1 || tutup === -1) {
    throw new Error('Tidak menemukan konstanta QUERY di src/lib/cms.ts');
  }
  return src.slice(buka + 1, tutup);
}

/** Produk dari CMS dipetakan ke bentuk yang sama dengan isi products.json. */
function dariCms(doc) {
  return {
    ...doc,
    // Foto CMS tidak berupa file lokal; keberadaannya diperiksa terpisah.
    image: doc.image?.ref ?? null,
  };
}

if (cmsAktif) {
  const { createClient } = await import('@sanity/client');
  const apiHost = nilaiCms('apiHost') ?? 'https://api.sanity.io';
  const client = createClient({
    projectId,
    dataset: nilaiCms('dataset') ?? 'production',
    apiVersion: nilaiCms('apiVersion') ?? '2024-11-01',
    apiHost,
    useProjectHostname: new URL(apiHost).hostname.endsWith('.sanity.io'),
    perspective: 'published',
    useCdn: false,
    ...(process.env.SANITY_READ_TOKEN ? { token: process.env.SANITY_READ_TOKEN } : {}),
  });

  try {
    const hasil = await client.fetch(queryDariLib(await readFile(CMS_LIB_TS, 'utf8')));
    products = (hasil ?? []).map(dariCms);
  } catch (e) {
    console.error(`✗ Tidak bisa membaca produk dari Sanity: ${e.message}`);
    await keluar(1);
  }

  if (products.length === 0) {
    console.error('✗ Dataset Sanity tidak berisi satu pun produk yang sudah dipublikasikan.');
    await keluar(1);
  }
} else {
  try {
    products = JSON.parse(await readFile(PRODUCTS, 'utf8'));
  } catch (e) {
    console.error(`✗ src/content/products.json tidak bisa dibaca: ${e.message}`);
    await keluar(1);
  }

  if (!Array.isArray(products) || products.length === 0) {
    console.error('✗ products.json harus berupa array berisi minimal satu produk.');
    await keluar(1);
  }
}

const fotoFiles = await readdir(PHOTOS).catch(() => []);
const fotoByIdProduk = new Map();
for (const f of fotoFiles) {
  if (!/\.(webp|avif|jpe?g|png)$/i.test(f)) continue;
  const id = f.replace(/\.\w+$/, '');
  fotoByIdProduk.set(id, [...(fotoByIdProduk.get(id) ?? []), f]);
}

const idSeen = new Map();
const codeSeen = new Map();
let dummyCount = 0;

products.forEach((p, i) => {
  const nama = p.id ?? p.code ?? `produk ke-${i + 1}`;

  /* Identitas */
  if (!p.id || typeof p.id !== 'string') err(`${nama}: id kosong atau bukan teks`);
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id))
    err(`${nama}: id harus huruf kecil dan tanda hubung (dipakai sebagai URL dan nama file)`);

  if (!p.code) err(`${nama}: kode produk kosong`);
  else if (!/^[A-Z]{1,3}-\d{2}$/.test(p.code))
    err(`${nama}: kode "${p.code}" tidak berformat seperti "J-01"`);

  if (!p.name || String(p.name).trim().length < 3) err(`${nama}: nama produk kosong`);

  if (p.id) idSeen.set(p.id, (idSeen.get(p.id) ?? 0) + 1);
  if (p.code) codeSeen.set(p.code, (codeSeen.get(p.code) ?? 0) + 1);

  /* Kategori */
  if (!p.category) err(`${nama}: kategori kosong`);
  else if (!KATEGORI.includes(p.category))
    err(`${nama}: kategori "${p.category}" tidak ada. Pilihannya: ${KATEGORI.join(', ')}`);

  /* Harga */
  const harga = p.pricePerDozen;
  if (harga === undefined || harga === null) err(`${nama}: harga per lusin kosong`);
  else if (!Number.isInteger(harga) || harga <= 0)
    err(`${nama}: harga "${harga}" harus bilangan bulat rupiah yang positif (contoh 420000)`);
  else if (harga < 12000)
    err(`${nama}: harga ${harga} terlalu kecil untuk satu lusin — kemungkinan yang diisi harga satuan`);

  if (p.priceType !== undefined && !PRICE_TYPES.includes(p.priceType))
    err(`${nama}: priceType "${p.priceType}" harus "tetap" atau "mulai"`);

  /* Ukuran & warna */
  if (!Array.isArray(p.sizes) || p.sizes.length === 0) err(`${nama}: daftar ukuran kosong`);
  else if (p.sizes.some((s) => typeof s !== 'string' || s.trim() === ''))
    err(`${nama}: ada ukuran yang kosong di dalam daftar`);

  if (!Array.isArray(p.colors) || p.colors.length === 0)
    warn(`${nama}: belum ada pilihan warna — halaman produk menampilkan "menunggu data"`);

  /* Teks */
  if (!p.description || String(p.description).trim().length < 20)
    err(`${nama}: deskripsi kosong atau terlalu pendek (dipakai juga sebagai meta description)`);

  if (p.material === undefined || p.material === null)
    warn(`${nama}: bahan belum diisi — halaman produk menampilkan "menunggu data"`);

  /* Foto — dari CMS berupa asset ref, dari JSON berupa file lokal. */
  const foto = cmsAktif ? [] : (fotoByIdProduk.get(p.id) ?? []);
  if (cmsAktif) {
    if (!p.image) err(`${nama}: belum ada foto yang diunggah di Sanity Studio`);
  } else if (foto.length === 0) {
    err(
      `${nama}: tidak ada foto di src/assets/products/. Jalankan "npm run gen:photos" atau taruh ${p.id}.jpg`,
    );
  } else if (foto.length > 1) {
    err(
      `${nama}: ada ${foto.length} file foto dengan id yang sama (${foto.join(', ')}). Sisakan satu.`,
    );
  }

  /* Siluet & konsistensi flag dummy */
  if (p.shape !== undefined && !SILUET.includes(p.shape))
    err(`${nama}: siluet "${p.shape}" tidak dikenal. Pilihannya: ${SILUET.join(', ')}`);

  if (p.dummy === undefined)
    warn(`${nama}: flag "dummy" tidak ditulis. Defaultnya true, tapi lebih baik eksplisit.`);
  if (p.dummy === true) dummyCount += 1;

  if (p.dummy === false && p.shape !== undefined)
    err(
      `${nama}: ditandai data asli (dummy: false) tapi masih memakai foto buatan. Hapus field "shape" setelah foto asli masuk.`,
    );

  if (p.dummy === false && foto.length === 1 && /\.webp$/i.test(foto[0]) && p.shape === undefined)
    warn(`${nama}: pastikan ${foto[0]} memang foto asli, bukan sisa placeholder.`);

  /* Salah ketik nama field. Hanya berlaku untuk JSON yang ditulis tangan;
     bentuk dokumen CMS ditentukan query GROQ, bukan oleh pengetikan. */
  if (!cmsAktif) {
    for (const key of Object.keys(p)) {
      if (!FIELDS.has(key)) err(`${nama}: field "${key}" tidak dikenal skema dan akan diabaikan`);
    }
  }
});

for (const [id, n] of idSeen) if (n > 1) err(`id "${id}" dipakai ${n} produk — id harus unik`);
for (const [code, n] of codeSeen)
  if (n > 1) err(`kode "${code}" dipakai ${n} produk — kode dipakai di chat, harus unik`);

/* Foto menganggur: tidak ada produknya, tapi ikut ter-build.
   Saat CMS aktif, file lokal memang tidak lagi dipakai — itu bukan masalah,
   melainkan cadangan yang sengaja ditinggal. */
if (!cmsAktif) {
  const idProduk = new Set(products.map((p) => p.id));
  for (const id of fotoByIdProduk.keys()) {
    if (!idProduk.has(id)) warn(`foto "${id}" tidak punya produk di products.json`);
  }
}

/* Kategori kosong: halaman kategorinya tetap dibuat dan tampil kosong. */
for (const k of KATEGORI) {
  if (!products.some((p) => p.category === k))
    warn(`kategori "${k}" tidak punya produk — halaman /katalog/${k} akan kosong`);
}

/* ── Konfigurasi situs ──────────────────────────────────────────────── */

/**
 * Nomor yang dipakai harness uji saat menambal `site.ts` sementara.
 *
 * Kedua script itu memulihkan file di blok `finally`, tapi `finally` tidak
 * jalan kalau prosesnya dibunuh. Kalau itu terjadi, situs akan dibangun
 * dengan nomor karangan yang terlihat sah — tautan wa.me-nya menuju nomor
 * yang bukan milik siapa pun. Satu-satunya tempat nomor ini boleh muncul
 * adalah di sini, sebagai hal yang ditolak.
 *
 * Harness itu sendiri menyalakan `HWR_UJI_NOMOR=1` selama menambal, karena
 * di sana nomor uji memang disengaja. Yang tidak boleh adalah nomor itu
 * bertahan setelah harness selesai — dan tanpa env var, build biasa gagal.
 */
const NOMOR_HARNESS = new Set(['6281234567890']);

const waLine = siteSrc.match(/whatsappNumber:\s*(.+)/)?.[1] ?? '';
if (waLine.includes('PLACEHOLDER')) {
  warn('nomor WhatsApp masih placeholder — semua tombol pesan nonaktif.');
} else {
  const nomor = waLine.match(/['"]([^'"]+)['"]/)?.[1];
  if (!nomor) err('nomor WhatsApp di src/config/site.ts tidak terbaca sebagai teks.');
  else if (!/^[1-9]\d{7,14}$/.test(nomor))
    err(
      `nomor WhatsApp "${nomor}" salah format. Tanpa "+", tanpa "0" di depan, tanpa spasi — contoh 6281234567890.`,
    );
  else if (NOMOR_HARNESS.has(nomor) && process.env.HWR_UJI_NOMOR !== '1')
    err(
      `nomor WhatsApp "${nomor}" adalah nomor uji milik npm run test:whatsapp / test:data, bukan nomor toko. ` +
        `Kemungkinan sebuah uji berhenti sebelum sempat memulihkan file. Kembalikan ke PLACEHOLDER atau isi nomor asli.`,
    );
}

/** Nilai teks sebuah field di site.ts, null kalau masih placeholder. */
function nilaiSite(nama) {
  const baris = siteSrc.split(/\r?\n/).find((l) => new RegExp(`^\\s*${nama}:`).test(l));
  if (!baris || baris.includes('PLACEHOLDER')) return null;
  return baris.match(/['"]([^'"]*)['"]/)?.[1] ?? null;
}

/* Domain. Selama masih `.example`, robots.txt memancarkan Disallow: / dan
   seluruh canonical menunjuk alamat yang tidak ada. Build-nya tetap sah —
   itu memang keadaan sekarang — tapi tidak boleh dikira siap terbit. */
const domain = siteSrc.match(/url:\s*'([^']+)'/)?.[1] ?? '';
if (domain.includes('.example'))
  warn(
    'domain masih placeholder — robots.txt memblokir seluruh mesin pencari dan canonical menunjuk domain contoh.',
  );

/* Alamat. JSON-LD `PostalAddress` menolak dirakit tanpa kota, jadi alamat
   jalan yang terisi sendirian tampil di halaman tapi tidak pernah sampai ke
   mesin pencari — hilang diam-diam, persis yang harus dicegah di sini. */
if (nilaiSite('addressLine') && !nilaiSite('city'))
  warn('alamat jalan sudah diisi tapi kota masih kosong — alamat tidak akan masuk JSON-LD.');

const kodePos = nilaiSite('postalCode');
if (kodePos && !/^\d{5}$/.test(kodePos))
  err(`kode pos "${kodePos}" bukan lima angka — periksa src/config/site.ts.`);

/* Jam buka ditulis dua kali: `summary` untuk pengunjung, `openingHours`
   untuk JSON-LD. Mengisi salah satu saja berarti salah satu pembaca itu
   tidak pernah tahu kapan tokonya buka. */
const jamRingkas = nilaiSite('summary');
const jamLdRaw = siteSrc.match(/openingHours:\s*\[([^\]]*)\]/)?.[1] ?? '';
const jamLd = [...jamLdRaw.matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);

if (jamRingkas && jamLd.length === 0)
  err('jam buka terisi di `summary` tapi `openingHours` kosong — JSON-LD tidak akan memuat jam buka.');
else if (!jamRingkas && jamLd.length > 0)
  err('`openingHours` terisi tapi `summary` masih placeholder — pengunjung tidak melihat jam buka.');

const HARI = 'Mo|Tu|We|Th|Fr|Sa|Su';
for (const spec of jamLd) {
  if (!new RegExp(`^(${HARI})(-(${HARI}))?(,(${HARI}))* \\d{2}:\\d{2}-\\d{2}:\\d{2}$`).test(spec))
    err(`jam buka "${spec}" bukan format schema.org — contoh "Mo-Su 08:00-17:00".`);
}

/* ── Laporan ────────────────────────────────────────────────────────── */

const pesan = [];
pesan.push(
  cmsAktif
    ? `${products.length} produk diperiksa dari Sanity (${projectId}).`
    : `${products.length} produk diperiksa dari products.json, ${fotoByIdProduk.size} file foto ditemukan.`,
);
if (dummyCount > 0) pesan.push(`${dummyCount} produk masih data contoh (dummy: true).`);

console.log(pesan.join(' '));

if (warnings.length > 0) {
  console.log(`\n${warnings.length} peringatan:`);
  for (const w of warnings) console.log(`  · ${w}`);
}

if (errors.length > 0) {
  console.log(`\n${errors.length} kesalahan:`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  console.log('\nData produk tidak lolos pemeriksaan.');
  await keluar(1);
}

console.log('\n✓ Data produk lolos pemeriksaan.');
