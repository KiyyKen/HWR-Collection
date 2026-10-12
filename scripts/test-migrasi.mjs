/**
 * Gladi bersih migrasi products.json → Sanity, tanpa project Sanity.
 *
 * `npm run test:cms` membuktikan jalur CMS bekerja untuk dua produk uji yang
 * saya karang sendiri. Yang belum pernah dibuktikan: bahwa DATA YANG ADA
 * SEKARANG selamat menyeberang. Itu pertanyaan yang berbeda, dan jawabannya
 * baru ketahuan saat 24 produk sungguhan lewat pipa yang sama.
 *
 * Alurnya meniru migrasi sesungguhnya, langkah demi langkah:
 *
 *   npm run cms:export      → NDJSON + salinan foto
 *   (impor Sanity ditiru)   → _sanityAsset berubah jadi referensi aset
 *   (GROQ ditiru)           → proyeksi persis seperti di src/lib/cms.ts
 *   build Astro sungguhan   → lalu hasilnya dibandingkan dengan build biasa
 *
 * Yang dibandingkan bukan HTML mentah — nama file gambar memang berubah —
 * melainkan yang dijanjikan docs/CMS.md: **jumlah halaman, alamat halaman,
 * dan isi tiap halaman produk harus sama persis.** Satu slug yang bergeser
 * berarti satu tautan mati setelah migrasi.
 *
 * Tidak ada jaringan yang disentuh dan tidak ada kredensial yang dibutuhkan.
 * Setelah selesai, `src/config/cms.ts` dipulihkan dan situs dibangun ulang
 * dari products.json seperti semula.
 *
 * Jalankan: npm run test:migrasi
 */

import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const PORT = Number(process.env.HWR_MIGRASI_STUB_PORT ?? 4336);
const HOST = `http://localhost:${PORT}`;
const CONFIG = 'src/config/cms.ts';
const CMS_LIB = 'src/lib/cms.ts';
const PRODUCTS = 'src/content/products.json';
const KELUAR = '.migrasi';
const NDJSON = path.join(KELUAR, 'produk.ndjson');
const PROJECT_UJI = 'migrasi1';

const fails = [];
const check = (cond, label, detail = '') => {
  if (cond) console.log(`  ✓ ${label}`);
  else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
    fails.push(label);
  }
};

function run(cmd, args) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let keluaran = '';
    p.stdout.on('data', (d) => (keluaran += d));
    p.stderr.on('data', (d) => (keluaran += d));
    p.on('exit', (code) => resolve({ code, keluaran }));
  });
}

/** Semua halaman di dist/, sebagai daftar alamat. */
async function rutaDist(dir = 'dist', prefix = '') {
  const hasil = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) hasil.push(...(await rutaDist(path.join(dir, entry.name), `${prefix}/${entry.name}`)));
    else if (entry.name === 'index.html') hasil.push(prefix === '' ? '/' : `${prefix}/`);
  }
  return hasil.sort();
}

const escHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ── 1. Ekspor ───────────────────────────────────────────────────────── */

console.log('Mengekspor products.json…');
const ekspor = await run('node', ['scripts/export-sanity.mjs']);
if (ekspor.code !== 0) {
  console.error(ekspor.keluaran);
  process.exit(1);
}
console.log(ekspor.keluaran.trim().split('\n')[0]);

const barisNdjson = (await readFile(NDJSON, 'utf8')).trim().split('\n');
const dokumenImpor = barisNdjson.map((b) => JSON.parse(b));
const produkAsal = JSON.parse(await readFile(PRODUCTS, 'utf8'));

/* ── 2. Tiru impor Sanity ─────────────────────────────────────────────
   `sanity dataset import` mengunggah file yang ditunjuk `_sanityAsset`,
   lalu mengganti blok foto dengan referensi aset. Bentuk referensinya —
   image-<id>-<lebar>x<tinggi>-<format> — yang dibaca src/lib/cms-image.ts.
   Dimensinya dibaca dari file sungguhan, bukan diasumsikan: kalau suatu
   saat foto masuk dengan rasio lain, itu harus ketahuan di sini.        */

const asetById = new Map();

for (const doc of dokumenImpor) {
  const berkas = doc.photo?._sanityAsset?.replace('image@file://./', '') ?? null;
  if (!berkas) {
    console.error(`Dokumen ${doc._id} tidak menunjuk file foto mana pun.`);
    process.exit(1);
  }

  const penuh = path.join(KELUAR, berkas);
  const meta = await sharp(penuh).metadata();
  // ID aset Sanity alfanumerik, tanpa tanda hubung.
  const assetId = `hwr${doc.slug.current.replace(/[^A-Za-z0-9]/g, '')}`;

  if (asetById.has(assetId)) {
    console.error(`Dua produk menghasilkan id aset yang sama: ${assetId}.`);
    process.exit(1);
  }
  asetById.set(assetId, penuh);

  doc.photo = {
    _type: 'image',
    asset: { _type: 'reference', _ref: `image-${assetId}-${meta.width}x${meta.height}-${meta.format}` },
  };
  delete doc.photo._sanityAsset;
}

/* ── 3. Tiru proyeksi GROQ ────────────────────────────────────────────
   Nama field diambil dari query di src/lib/cms.ts, bukan disalin ke sini.
   Kalau query itu berubah dan pemetaan di bawah tidak ikut, uji ini gagal
   alih-alih diam-diam menguji bentuk yang sudah tidak dipakai.          */

const querySrc = await readFile(CMS_LIB, 'utf8');
const query = querySrc.slice(
  querySrc.indexOf('`', querySrc.indexOf('const QUERY')) + 1,
  querySrc.indexOf('`', querySrc.indexOf('`', querySrc.indexOf('const QUERY')) + 1),
);

function proyeksi(doc) {
  return {
    id: doc.slug.current,
    code: doc.code,
    name: doc.name,
    category: doc.category,
    pricePerDozen: doc.pricePerDozen,
    priceType: doc.priceType,
    sizes: doc.sizes,
    sizeNote: doc.sizeNote ?? null,
    colors: doc.colors,
    material: doc.material ?? null,
    description: doc.description,
    featured: doc.featured,
    dummy: doc.dummy,
    image: { ref: doc.photo.asset._ref, crop: null, hotspot: null, alt: null },
  };
}

const contoh = proyeksi(dokumenImpor[0]);

/** Nama field yang diminta satu blok proyeksi GROQ. */
const fieldDari = (blok) =>
  [...blok.matchAll(/^\s*(?:"(\w+)"\s*:|(\w+),?\s*$)/gm)].map((m) => m[1] ?? m[2]).filter(Boolean);

// Blok foto dipisah dulu: isinya jadi field di dalam `image`, bukan di akar.
const bukaFoto = query.indexOf('photo {');
const tutupFoto = query.indexOf('}', bukaFoto);
const blokFoto = query.slice(bukaFoto + 'photo {'.length, tutupFoto);
const akar = query.slice(0, bukaFoto) + query.slice(tutupFoto + 1);

const hilang = [
  ...fieldDari(akar).filter((f) => !(f in contoh)),
  ...fieldDari(blokFoto).map((f) => `image.${f}`).filter((f) => !(f.slice(6) in contoh.image)),
];

const muatan = dokumenImpor.map(proyeksi);

/* ── 4. Stub ─────────────────────────────────────────────────────────── */

let queryTerakhir = '';
const gambarDiminta = new Set();

const stub = createServer((req, res) => {
  const url = new URL(req.url ?? '/', HOST);

  if (url.pathname.includes('/data/query/')) {
    queryTerakhir = url.searchParams.get('query') ?? '';
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ms: 1, query: queryTerakhir, result: muatan }));
    return;
  }

  if (url.pathname.startsWith('/images/')) {
    // /images/<project>/<dataset>/<assetId>-<w>x<h>.<format>
    const berkas = path.basename(url.pathname);
    const assetId = berkas.replace(/-\d+x\d+\.\w+$/, '');
    const sumber = asetById.get(assetId);
    if (!sumber) {
      res.writeHead(404).end('aset tidak dikenal');
      return;
    }
    gambarDiminta.add(assetId);
    const isi = readFileSync(sumber);
    res.writeHead(200, { 'content-type': 'image/webp', 'content-length': String(isi.length) });
    res.end(isi);
    return;
  }

  res.writeHead(404).end('not found');
});

const asli = await readFile(CONFIG, 'utf8');

/**
 * Build pembanding harus datang dari `products.json`, apa pun isi `cms.ts`
 * saat ini.
 *
 * Begitu project Sanity sungguhan dipasang, membangun apa adanya berarti
 * membaca dataset itu — bukan file yang sedang diuji perpindahannya. Dan
 * selama datasetnya masih kosong, build-nya gagal dan uji ini mati di
 * langkah pertama. Jadi sumbernya dipaksa kembali ke file untuk pembanding.
 */
const keJson = asli.replace(/^\s*projectId: .*,$/m, '  projectId: PLACEHOLDER as string,');

const ditambal = asli
  // Berjangkar ke awal baris — lihat catatan lengkapnya di scripts/test-cms.mjs.
  .replace(/^\s*projectId: .*,$/m, `  projectId: '${PROJECT_UJI}' as string,`)
  .replace("apiHost: 'https://api.sanity.io',", `apiHost: '${HOST}',`)
  .replace("imageHost: 'https://cdn.sanity.io',", `imageHost: '${HOST}',`);

// Lihat catatan di scripts/test-cms.mjs: yang diperiksa baris konfigurasinya,
// bukan sekadar "file berubah".
if (
  !new RegExp(`^\\s*projectId: '${PROJECT_UJI}'`, 'm').test(ditambal) ||
  !/^\s*projectId: PLACEHOLDER/m.test(keJson)
) {
  console.error(`Baris projectId di ${CONFIG} tidak berhasil ditambal. Migrasi tidak diuji.`);
  process.exit(1);
}

let rutaSebelum = [];
let sitemapSebelum = '';

try {
  await new Promise((r) => stub.listen(PORT, r));

  /* ── 5. Build pembanding, dari products.json ───────────────────────── */

  console.log('\nMembangun dari products.json sebagai pembanding…');
  await writeFile(CONFIG, keJson);
  const bandingan = await run('npx', ['astro', 'build']);
  if (bandingan.code !== 0) {
    console.error(bandingan.keluaran.slice(-3000));
    throw new Error('Build pembanding gagal.');
  }
  rutaSebelum = await rutaDist();
  sitemapSebelum = existsSync('dist/sitemap-0.xml') ? readFileSync('dist/sitemap-0.xml', 'utf8') : '';
  console.log(`  ${rutaSebelum.length} halaman.`);

  /* ── 6. Build dari data hasil migrasi ──────────────────────────────── */

  await writeFile(CONFIG, ditambal);

  console.log('\nMembangun dari data yang sudah "diimpor" ke Sanity…');
  const build = await run('npx', ['astro', 'build']);
  if (build.code !== 0) {
    console.error(build.keluaran.slice(-3000));
    throw new Error('Build dari data migrasi gagal — data ini BELUM siap diimpor.');
  }

  console.log('\nEkspor');
  check(dokumenImpor.length === produkAsal.length, `${produkAsal.length} produk ikut terekspor`);
  check(
    dokumenImpor.every((d) => d.slug?.current),
    'Setiap dokumen punya slug',
  );
  check(
    dokumenImpor.every((d, i) => d.slug.current === produkAsal[i].id),
    'Slug diambil dari id sekarang — alamat halaman tidak bergeser',
  );
  check(
    !barisNdjson.some((b) => b.includes('"shape"')),
    '`shape` tidak ikut ke CMS — siluet foto sementara hanya ada di jalur file',
  );
  check(hilang.length === 0, 'Setiap field yang diminta query GROQ tersedia di dokumen', hilang.join(', '));

  console.log('\nPemeriksa data');
  const val = await run('node', ['scripts/validate-data.mjs']);
  check(val.code === 0, 'npm run validate lolos atas data hasil migrasi', val.keluaran.slice(-400));
  check(
    val.keluaran.includes(`${produkAsal.length} produk diperiksa dari Sanity`),
    `Pemeriksa melihat ${produkAsal.length} produk dari Sanity`,
    val.keluaran.split('\n')[0],
  );

  console.log('\nHalaman');
  const rutaSesudah = await rutaDist();
  check(queryTerakhir.includes('_type == "product"'), 'Situs membaca dari API, bukan dari products.json');
  check(
    rutaSesudah.length === rutaSebelum.length,
    `Jumlah halaman tidak berubah (${rutaSebelum.length})`,
    `sebelum ${rutaSebelum.length}, sesudah ${rutaSesudah.length}`,
  );

  const hilangRute = rutaSebelum.filter((r) => !rutaSesudah.includes(r));
  const baruRute = rutaSesudah.filter((r) => !rutaSebelum.includes(r));
  check(hilangRute.length === 0, 'Tidak ada alamat halaman yang hilang', hilangRute.slice(0, 5).join(', '));
  check(baruRute.length === 0, 'Tidak ada alamat halaman tak terduga', baruRute.slice(0, 5).join(', '));

  console.log('\nIsi halaman produk');
  let isiCocok = 0;
  let fotoLokal = 0;
  const melenceng = [];

  for (const p of produkAsal) {
    const file = `dist/produk/${p.id}/index.html`;
    if (!existsSync(file)) {
      melenceng.push(`${p.id}: halaman tidak ada`);
      continue;
    }
    const html = readFileSync(file, 'utf8');
    const harga = p.pricePerDozen.toLocaleString('id-ID');
    const potongan = escHtml(p.description.slice(0, 40));

    if (!html.includes(escHtml(p.name))) melenceng.push(`${p.id}: nama tidak tampil`);
    else if (!html.includes(p.code)) melenceng.push(`${p.id}: kode tidak tampil`);
    else if (!html.includes(harga)) melenceng.push(`${p.id}: harga ${harga} tidak tampil`);
    else if (!html.includes(potongan)) melenceng.push(`${p.id}: deskripsi tidak tampil`);
    else if (!html.includes(`/produk/${p.id}`)) melenceng.push(`${p.id}: canonical tidak mengikuti slug`);
    else isiCocok++;

    if (!html.includes(HOST)) fotoLokal++;
  }

  check(
    isiCocok === produkAsal.length,
    `Nama, kode, harga, dan deskripsi ke-${produkAsal.length} produk tampil utuh`,
    melenceng.slice(0, 5).join(' · '),
  );
  check(
    fotoLokal === produkAsal.length,
    'Tidak ada halaman yang menempel ke CDN — semua foto dioptimalkan ke dist/',
  );
  check(
    gambarDiminta.size === produkAsal.length,
    `Ke-${produkAsal.length} foto benar-benar diunduh saat build`,
    `${gambarDiminta.size} diunduh`,
  );

  console.log('\nSEO');
  const sitemapSesudah = existsSync('dist/sitemap-0.xml')
    ? readFileSync('dist/sitemap-0.xml', 'utf8')
    : '';
  const urlSitemap = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort();
  check(
    JSON.stringify(urlSitemap(sitemapSesudah)) === JSON.stringify(urlSitemap(sitemapSebelum)),
    'Sitemap berisi alamat yang sama persis seperti sebelum migrasi',
  );
  check(
    !readFileSync(`dist/produk/${produkAsal[0].id}/index.html`, 'utf8').includes('"@type":"Product"'),
    'Produk yang masih ditandai contoh tetap tidak memancarkan schema Product',
  );
} finally {
  stub.close();
  await writeFile(CONFIG, asli);

  const pulih = await readFile(CONFIG, 'utf8');
  if (pulih !== asli) console.error(`\n✗ ${CONFIG} TIDAK pulih. Periksa file itu sebelum commit.`);
  else console.log(`\n${CONFIG} dipulihkan.`);

  // Sumber setelah pemulihan mengikuti isi cms.ts yang semula, bukan selalu file.
  const sumberSemula = /projectId: PLACEHOLDER/.test(asli) ? 'products.json' : 'Sanity';
  console.log(`Membangun ulang dari ${sumberSemula}…`);
  const ulang = await run('npx', ['astro', 'build']);
  if (ulang.code !== 0)
    console.error(`✗ Build ulang dari ${sumberSemula} gagal. Jalankan npm run build.`);
}

console.log(
  fails.length === 0
    ? '\n✓ Ke-24 produk selamat menyeberang: alamat, isi, dan sitemap tidak berubah.'
    : `\n✗ ${fails.length} pemeriksaan gagal:\n${fails.map((f) => `  · ${f}`).join('\n')}`,
);
process.exit(fails.length === 0 ? 0 : 1);
