/**
 * Menyiapkan isi `products.json` untuk diimpor ke Sanity.
 *
 * Ini SETENGAH pertama migrasi. Setengah kedua — `sanity dataset import` —
 * butuh project sungguhan dan token tulis, dan tidak dijalankan dari sini.
 * Script ini sengaja tidak pernah menyentuh jaringan: yang dihasilkannya
 * adalah satu folder berisi NDJSON dan salinan fotonya, siap diimpor kapan
 * pun project-nya sudah ada.
 *
 * Yang dijaga:
 *
 *   1. **Slug = id sekarang.** Alamat halaman produk tidak berubah setelah
 *      migrasi, jadi tidak ada tautan lama yang mati dan tidak ada redirect
 *      yang perlu dibuat.
 *   2. **Foto ikut terangkut.** Tiap dokumen memakai `_sanityAsset`, bentuk
 *      yang dimengerti `sanity dataset import` untuk mengunggah file lokal
 *      dan menyambungkan referensinya sendiri. Tanpa itu, 24 produk masuk
 *      tanpa foto dan build gagal di sisi lain.
 *   3. **Aturan Studio diperiksa di sini, bukan saat impor.** Kode artikel,
 *      kategori, harga minimum, dan panjang deskripsi diuji dengan aturan
 *      yang sama persis seperti `sanity/schemaTypes/product.ts`. Dokumen
 *      yang akan ditolak Sanity dihentikan sebelum berangkat.
 *
 * Yang TIDAK ikut diekspor:
 *
 *   `shape` — siluet foto sementara. Konsep itu hanya ada di jalur file;
 *   foto di CMS adalah file sungguhan, apa pun isinya.
 *
 *   `alt` — dibiarkan kosong supaya situs tetap merangkainya dari nama dan
 *   warna produk seperti sekarang. Admin bisa mengisinya belakangan per
 *   produk di Studio, dan begitu diisi, situs memakai isian itu.
 *
 * Jalankan: npm run cms:export
 */

import { mkdir, copyFile, writeFile, readFile, rm, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRODUCTS = path.join(ROOT, 'src/content/products.json');
const PHOTOS = path.join(ROOT, 'src/assets/products');
const CATEGORIES_TS = path.join(ROOT, 'src/data/categories.ts');

/** Folder keluaran. Tidak masuk repositori — lihat .gitignore. */
const KELUAR = path.join(ROOT, '.migrasi');
const FOTO_KELUAR = path.join(KELUAR, 'foto');
const NDJSON = path.join(KELUAR, 'produk.ndjson');

const masalah = [];
const keluhan = (msg) => masalah.push(msg);

/* ── Aturan yang digandakan dari sanity/schemaTypes/product.ts ─────────
   Kalau skema Studio berubah, ubah juga di sini — dan sebaliknya. Yang
   memaksa keduanya tetap sejalan adalah npm run test:migrasi, yang
   membangun situs dari hasil ekspor ini.                                */

const POLA_KODE = /^[A-Z]{1,3}-\d{2}$/;
const HARGA_MINIMUM = 12000;
const DESKRIPSI_MINIMUM = 20;
const NAMA_MINIMUM = 3;
const JENIS_HARGA = ['tetap', 'mulai'];

const kategoriSrc = await readFile(CATEGORIES_TS, 'utf8');
const KATEGORI = [...(kategoriSrc.match(/CATEGORY_IDS = \[([\s\S]*?)\]/)?.[1] ?? '').matchAll(/'([^']+)'/g)].map(
  (m) => m[1],
);
if (KATEGORI.length === 0) {
  console.error('Tidak bisa membaca daftar kategori dari src/data/categories.ts.');
  process.exit(1);
}

const products = JSON.parse(await readFile(PRODUCTS, 'utf8'));
const fileFoto = await readdir(PHOTOS).catch(() => []);

/** Foto milik sebuah produk, apa pun ekstensinya. */
function cariFoto(id) {
  return fileFoto.filter((f) => f.replace(/\.[^.]+$/, '') === id);
}

/** Satu dokumen Sanity dari satu entri products.json. */
function jadikanDokumen(p) {
  const nama = p.name ?? p.id ?? '(tanpa nama)';

  if (!p.id) keluhan(`${nama}: tanpa id — slug tidak bisa dibuat`);
  if (!p.name || p.name.length < NAMA_MINIMUM) keluhan(`${nama}: nama minimal ${NAMA_MINIMUM} huruf`);
  if (!POLA_KODE.test(p.code ?? ''))
    keluhan(`${nama}: kode "${p.code}" akan ditolak Studio — bentuknya J-01, TR-02, CG-03`);
  if (!KATEGORI.includes(p.category))
    keluhan(`${nama}: kategori "${p.category}" tidak ada di daftar kategori Studio`);
  if (!Number.isInteger(p.pricePerDozen) || p.pricePerDozen < HARGA_MINIMUM)
    keluhan(`${nama}: harga ${p.pricePerDozen} ditolak Studio — harga SATU LUSIN, minimal ${HARGA_MINIMUM}`);
  if (p.priceType !== undefined && !JENIS_HARGA.includes(p.priceType))
    keluhan(`${nama}: jenis harga "${p.priceType}" tidak dikenal`);
  if (!Array.isArray(p.sizes) || p.sizes.length === 0) keluhan(`${nama}: minimal satu ukuran`);
  if (!p.description || p.description.length < DESKRIPSI_MINIMUM)
    keluhan(`${nama}: deskripsi minimal ${DESKRIPSI_MINIMUM} huruf — ikut dipakai di hasil pencarian`);

  const foto = cariFoto(p.id);
  if (foto.length === 0) keluhan(`${nama}: tidak ada file foto di src/assets/products/`);
  if (foto.length > 1) keluhan(`${nama}: ${foto.length} file foto dengan id sama — ${foto.join(', ')}`);

  return {
    _id: `produk-${p.id}`,
    _type: 'product',
    name: p.name,
    code: p.code,
    slug: { _type: 'slug', current: p.id },
    category: p.category,
    // Jalur relatif terhadap file NDJSON. `sanity dataset import` yang
    // mengunggah filenya dan mengganti blok ini dengan referensi aset.
    photo: foto[0]
      ? { _type: 'image', _sanityAsset: `image@file://./foto/${foto[0]}` }
      : undefined,
    pricePerDozen: p.pricePerDozen,
    priceType: p.priceType ?? 'tetap',
    sizes: p.sizes,
    ...(p.sizeNote ? { sizeNote: p.sizeNote } : {}),
    colors: p.colors ?? [],
    ...(p.material ? { material: p.material } : {}),
    description: p.description,
    featured: p.featured ?? false,
    dummy: p.dummy ?? true,
  };
}

const dokumen = products.map(jadikanDokumen);

const slugSeen = new Map();
const kodeSeen = new Map();
for (const d of dokumen) {
  slugSeen.set(d.slug.current, (slugSeen.get(d.slug.current) ?? 0) + 1);
  kodeSeen.set(d.code, (kodeSeen.get(d.code) ?? 0) + 1);
}
for (const [slug, n] of slugSeen)
  if (n > 1) keluhan(`slug "${slug}" dipakai ${n} produk — slug jadi alamat halaman, harus unik`);
for (const [kode, n] of kodeSeen)
  if (n > 1) keluhan(`kode "${kode}" dipakai ${n} produk — kode dipakai saat chat, harus unik`);

if (masalah.length > 0) {
  console.log(`${masalah.length} hal harus dibereskan sebelum data ini bisa masuk Sanity:\n`);
  for (const m of masalah) console.log(`  ✗ ${m}`);
  console.log('\nTidak ada file yang ditulis.');
  process.exit(1);
}

/* ── Tulis ──────────────────────────────────────────────────────────── */

await rm(KELUAR, { recursive: true, force: true });
await mkdir(FOTO_KELUAR, { recursive: true });

for (const p of products) {
  const foto = cariFoto(p.id)[0];
  await copyFile(path.join(PHOTOS, foto), path.join(FOTO_KELUAR, foto));
}

await writeFile(NDJSON, dokumen.map((d) => JSON.stringify(d)).join('\n') + '\n');

const dummyCount = dokumen.filter((d) => d.dummy).length;

await writeFile(
  path.join(KELUAR, 'BACA-DULU.md'),
  `# Hasil ekspor untuk Sanity

${dokumen.length} produk, ${dokumen.length} foto. Dibuat oleh \`npm run cms:export\`.
${dummyCount > 0 ? `\n**${dummyCount} di antaranya masih data contoh** (\`dummy: true\`). Mengimpornya berguna untuk menguji jalur CMS, tapi data aslinya tetap harus menggantikannya.\n` : ''}
## Mengimpor

Butuh project Sanity dan token tulis — keduanya belum ada, lihat PLACEHOLDERS.md B14.

\`\`\`bash
cd .migrasi
npx sanity dataset import produk.ndjson production --replace
\`\`\`

\`--replace\` membuat perintah ini aman diulang: dokumen dengan \`_id\` sama
ditimpa, bukan digandakan.

## Setelah impor

1. Isi \`projectId\` di \`src/config/cms.ts\`.
2. \`npm run validate\` — harus melaporkan "${dokumen.length} produk diperiksa dari Sanity".
3. \`npm run build\` — jumlah halaman harus sama dengan build sebelumnya.
4. Bandingkan alamat halaman produk: semuanya harus tetap \`/produk/<slug lama>\`.

## Yang berubah setelah produk dibaca dari CMS

Keterangan "Foto contoh. Foto produk asli menyusul." di halaman produk
berhenti tampil. Keterangan itu menempel pada field \`shape\`, yang hanya ada
di jalur file — foto di CMS adalah file sungguhan yang diunggah admin.
Pita "Versi pengembangan" tetap tampil selama \`dummy\` masih menyala.
`,
);

console.log(`${dokumen.length} produk siap diimpor.`);
console.log(`  ${path.relative(ROOT, NDJSON)}`);
console.log(`  ${path.relative(ROOT, FOTO_KELUAR)}/ — ${products.length} foto`);
if (dummyCount > 0) console.log(`\n${dummyCount} di antaranya masih data contoh (dummy: true).`);
console.log(`\nLangkah impor ada di ${path.relative(ROOT, path.join(KELUAR, 'BACA-DULU.md'))}.`);
console.log('Impornya sendiri butuh project Sanity dan token tulis — belum ada.');
