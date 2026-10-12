/**
 * Uji integrasi Sanity → Astro, tanpa kredensial asli.
 *
 * Project Sanity sungguhan belum ada, dan tidak boleh dikarang. Tapi jalur
 * CMS yang tidak pernah dijalankan sama saja dengan jalur yang tidak ada:
 * ia akan pertama kali dicoba justru saat data asli masuk, saat kesalahan
 * paling mahal.
 *
 * Jadi script ini menjalankan stub API Sanity di localhost — query GROQ dan
 * CDN gambarnya — lalu MEMBANGUN SITUS SUNGGUHAN di atasnya dan memeriksa
 * HTML yang keluar. Setelah selesai, `src/config/cms.ts` dipulihkan dan
 * situs dibangun ulang dari `products.json` seperti semula.
 *
 * Yang dibuktikan:
 *   1. Loader menarik produk dari API, bukan dari JSON
 *   2. Foto CMS ikut pipeline astro:assets dan keluar di dist/ (bukan hotlink)
 *   3. Draft TIDAK PERNAH terbit
 *   4. Crop dan titik fokus pilihan admin ikut ke URL sumber
 *   5. Alt text dari admin dipakai
 *   6. `dummy: false` menyalakan structured data Product
 *   7. Data rusak (kode kembar, tanpa slug, tanpa foto) MENGGAGALKAN build
 *
 * Jalankan: npm run test:cms
 */

import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';

const PORT = Number(process.env.HWR_CMS_STUB_PORT ?? 4334);
const HOST = `http://localhost:${PORT}`;
const CONFIG = 'src/config/cms.ts';
const PROJECT_UJI = 'ujicoba1';

/** Foto sungguhan supaya sharp punya sesuatu untuk dioptimalkan. */
const FOTO = 'src/assets/products/jeans-anak-reguler.webp';

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

/* ── Dokumen uji ────────────────────────────────────────────────────────
   Nama, harga, dan kode sengaja berbeda jauh dari data di products.json,
   supaya kalau situs diam-diam masih membaca JSON, perbedaannya langsung
   ketahuan di HTML.                                                      */

const REF_FOTO = 'image-ujicoba0000000000000000000000000001-1400x1750-webp';

const DOKUMEN_BAIK = [
  {
    _id: 'produk-uji-1',
    _type: 'product',
    id: 'celana-uji-satu',
    code: 'UJ-01',
    name: 'Celana Uji Satu',
    category: 'jeans',
    pricePerDozen: 777000,
    priceType: 'tetap',
    sizes: ['1', '2', '3'],
    sizeNote: 'Ukuran uji 1–3',
    colors: ['Biru Tua', 'Hitam'],
    material: 'Bahan uji',
    description: 'Produk uji untuk memastikan jalur CMS benar-benar terbaca oleh situs.',
    featured: true,
    dummy: true,
    image: {
      ref: REF_FOTO,
      alt: 'Foto uji dengan alt dari admin',
      crop: { top: 0.1, bottom: 0.05, left: 0, right: 0 },
      hotspot: { x: 0.4, y: 0.35 },
    },
  },
  {
    _id: 'produk-uji-2',
    _type: 'product',
    id: 'celana-uji-dua',
    code: 'UJ-02',
    name: 'Celana Uji Dua',
    category: 'kolor',
    pricePerDozen: 888000,
    priceType: 'mulai',
    sizes: ['M', 'L'],
    colors: ['Navy'],
    material: null,
    description: 'Produk uji kedua, ditandai bukan data contoh supaya schema Product ikut terbit.',
    featured: false,
    dummy: false,
    image: { ref: REF_FOTO, alt: null, crop: null, hotspot: null },
  },
  {
    // Draft: TIDAK BOLEH pernah muncul di situs.
    _id: 'drafts.produk-uji-3',
    _type: 'product',
    id: 'celana-uji-draft',
    code: 'UJ-03',
    name: 'Celana Uji Draft',
    category: 'cargo',
    pricePerDozen: 999000,
    priceType: 'tetap',
    sizes: ['M'],
    colors: [],
    material: null,
    description: 'Draft yang belum dipublikasikan dan tidak boleh terbit ke situs.',
    featured: false,
    dummy: true,
    image: { ref: REF_FOTO, alt: null, crop: null, hotspot: null },
  },
];

/** Varian rusak: dua produk berkode sama, satu tanpa slug, satu tanpa foto. */
const DOKUMEN_RUSAK = [
  { ...DOKUMEN_BAIK[0] },
  { ...DOKUMEN_BAIK[1], code: 'UJ-01' },
  { ...DOKUMEN_BAIK[1], _id: 'produk-uji-4', id: null, code: 'UJ-04' },
  { ...DOKUMEN_BAIK[1], _id: 'produk-uji-5', id: 'tanpa-foto', code: 'UJ-05', image: null },
];

let muatan = DOKUMEN_BAIK;
const permintaanGambar = [];
let queryTerakhir = '';

const foto = readFileSync(FOTO);

const stub = createServer((req, res) => {
  const url = new URL(req.url ?? '/', HOST);

  // Query GROQ
  if (url.pathname.includes('/data/query/')) {
    const query = url.searchParams.get('query') ?? '';
    queryTerakhir = query;

    // Stub ini MENIRU perilaku perspective + filter draft. Kalau query yang
    // dikirim situs kehilangan filter itu, draft akan ikut terkirim dan uji
    // "draft tidak terbit" gagal — persis seperti yang seharusnya.
    const menyaringDraft =
      query.includes('drafts.**') || url.searchParams.get('perspective') === 'published';

    const hasil = muatan
      .filter((d) => (menyaringDraft ? !d._id.startsWith('drafts.') : true))
      .map(({ _id, _type, ...rest }) => rest);

    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ms: 1, query, result: hasil }));
    return;
  }

  // CDN gambar
  if (url.pathname.startsWith('/images/')) {
    permintaanGambar.push(url.pathname + url.search);
    res.writeHead(200, { 'content-type': 'image/webp', 'content-length': String(foto.length) });
    res.end(foto);
    return;
  }

  res.writeHead(404).end('not found');
});

const asli = await readFile(CONFIG, 'utf8');

function tambal(src) {
  return src
    /* Cocokkan baris projectId apa pun isinya, bukan hanya bentuk
       PLACEHOLDER-nya: begitu project Sanity sungguhan dipasang, pola yang
       terikat kata PLACEHOLDER berhenti cocok — dan uji ini mati tepat saat
       jalur CMS mulai benar-benar dipakai.

       Berjangkar ke awal baris. Tanpa `^`, contoh `projectId:` yang ditulis
       di dalam komentar di atas field-nya ikut tertangkap lebih dulu, dan
       yang tertambal justru komentarnya — konfigurasinya tetap PLACEHOLDER
       dan seluruh uji CMS gagal tanpa sebab yang kelihatan. */
    .replace(/^\s*projectId: .*,$/m, `  projectId: '${PROJECT_UJI}' as string,`)
    .replace("apiHost: 'https://api.sanity.io',", `apiHost: '${HOST}',`)
    .replace("imageHost: 'https://cdn.sanity.io',", `imageHost: '${HOST}',`);
}

const ditambal = tambal(asli);

/*
  "Berubah" saja tidak cukup sebagai bukti. Tambalan bisa mengenai komentar
  dan meninggalkan konfigurasi apa adanya — persis yang pernah terjadi — dan
  uji ini lalu menguji jalur JSON sambil melaporkan kegagalan jalur CMS.
  Jadi yang diperiksa baris konfigurasinya sendiri.
*/
if (!new RegExp(`^\\s*projectId: '${PROJECT_UJI}'`, 'm').test(ditambal)) {
  console.error(
    `Baris projectId di ${CONFIG} tidak berhasil ditambal. Jalur CMS tidak diuji — perbaiki dulu penambalnya.`,
  );
  process.exit(1);
}

try {
  await new Promise((r) => stub.listen(PORT, r));
  console.log(`Stub API Sanity jalan di ${HOST}`);

  await writeFile(CONFIG, ditambal);

  console.log('\nMembangun situs dari data CMS…');
  const build = await run('npx', ['astro', 'build']);
  if (build.code !== 0) {
    console.error(build.keluaran.slice(-3000));
    throw new Error('Build dengan data CMS gagal.');
  }

  console.log('\nPemeriksa data');
  const val = await run('node', ['scripts/validate-data.mjs']);
  check(val.code === 0, 'npm run validate lolos membaca data dari CMS', val.keluaran.slice(-300));
  check(
    val.keluaran.includes('produk diperiksa dari Sanity'),
    'Pemeriksa membaca dari Sanity, bukan dari products.json',
  );

  console.log('\nLoader');
  check(queryTerakhir.includes('_type == "product"'), 'Situs benar-benar memanggil API Sanity');
  check(
    queryTerakhir.includes('drafts.**'),
    'Query menyaring draft di GROQ, bukan hanya mengandalkan perspective',
  );

  const halaman1 = 'dist/produk/celana-uji-satu/index.html';
  const halaman2 = 'dist/produk/celana-uji-dua/index.html';
  check(existsSync(halaman1), 'Halaman produk dibuat dari slug CMS');
  check(existsSync(halaman2), 'Halaman produk kedua dibuat');
  check(
    !existsSync('dist/produk/celana-uji-draft/index.html'),
    'Draft TIDAK terbit jadi halaman',
  );
  check(
    !existsSync('dist/produk/jeans-anak-reguler/index.html'),
    'Produk dari products.json tidak lagi ikut saat CMS aktif',
  );

  const h1 = readFileSync(halaman1, 'utf8');
  const h2 = readFileSync(halaman2, 'utf8');

  console.log('\nIsi halaman');
  check(h1.includes('Celana Uji Satu'), 'Nama produk dari CMS tampil');
  check(h1.includes('UJ-01'), 'Kode artikel dari CMS tampil');
  check(h1.includes('777.000'), 'Harga dari CMS tampil');
  check(h1.includes('Ukuran uji 1–3') || h1.includes('1, 2, 3'), 'Ukuran dari CMS tampil');
  check(h1.includes('Bahan uji'), 'Bahan dari CMS tampil');
  check(h2.includes('Mulai dari'), 'Jenis harga "mulai" dari CMS dihormati');
  check(
    !h1.includes('Foto contoh. Foto produk asli menyusul.'),
    'Foto CMS tidak lagi ditandai "foto contoh"',
  );

  console.log('\nGambar');
  check(permintaanGambar.length > 0, 'Astro mengunduh foto dari CDN saat build');
  // Kedua produk uji memakai aset yang sama, jadi urutan permintaannya tidak
  // pasti — yang diperiksa keberadaannya di antara semua permintaan.
  const semuaUrl = decodeURIComponent(permintaanGambar.join(' '));
  // Aset uji 1400×1750, crop atas 0,1 dan bawah 0,05:
  // y = 175, tinggi = 0,85 × 1750 = 1487,5 → 1488.
  check(semuaUrl.includes('rect=0,175,1400,1488'), 'Crop pilihan admin ikut ke URL sumber', permintaanGambar[0]);
  check(semuaUrl.includes('fp-x=0.400') && semuaUrl.includes('fp-y=0.350'), 'Titik fokus pilihan admin ikut ke URL sumber');
  check(semuaUrl.includes('crop=center'), 'Produk tanpa titik fokus dipotong dari tengah');
  check(
    permintaanGambar.every((u) => u.includes('w=1400') && u.includes('h=1750')),
    'Semua sumber diminta dalam rasio 4:5',
  );
  check(
    h1.includes('src="/_astro/') && !h1.includes(`src="${HOST}`),
    'Foto dioptimalkan ke dist/, bukan hotlink ke CDN',
  );
  check(h1.includes('alt="Foto uji dengan alt dari admin"'), 'Alt text dari admin dipakai');
  check(
    h2.includes('alt="Celana Uji Dua warna navy, tampak depan"'),
    'Alt dirangkai dari data produk saat admin mengosongkannya',
  );
  check(/srcset="[^"]*_astro[^"]*\d+w/.test(h1), 'Srcset responsif tetap dibuat untuk foto CMS');
  // Ruang gambar harus tercadangkan sebelum gambarnya sampai; tanpa ini
  // halaman bergeser saat foto masuk (CLS), dan gambar remote tidak bisa
  // ditebak dimensinya oleh Astro.
  check(
    /<img[^>]+width="\d+"[^>]+height="\d+"/.test(h1) || /<img[^>]+height="\d+"[^>]+width="\d+"/.test(h1),
    'Foto CMS membawa width dan height — ruangnya tercadangkan',
  );

  console.log('\nSEO');
  check(!h1.includes('"@type":"Product"'), 'Produk bertanda contoh tetap tanpa schema Product');
  check(h2.includes('"@type":"Product"'), 'Produk data asli memancarkan schema Product');
  check(
    h1.includes('rel="canonical" href="https://hwrcollection.example/produk/celana-uji-satu/"'),
    'Canonical mengikuti slug CMS',
  );
  check(existsSync('dist/sitemap-0.xml'), 'Sitemap tetap dibuat');
  const sitemap = readFileSync('dist/sitemap-0.xml', 'utf8');
  check(sitemap.includes('/produk/celana-uji-satu/'), 'Produk CMS masuk sitemap');
  check(!sitemap.includes('celana-uji-draft'), 'Draft tidak masuk sitemap');

  console.log('\nData rusak harus menggagalkan build');
  muatan = DOKUMEN_RUSAK;
  const rusak = await run('npx', ['astro', 'build']);
  check(rusak.code !== 0, 'Build gagal saat data CMS rusak');
  check(rusak.keluaran.includes('kode "UJ-01" dipakai 2 produk'), 'Kode kembar dilaporkan');
  check(rusak.keluaran.includes('slug belum diisi'), 'Produk tanpa slug dilaporkan');
  check(rusak.keluaran.includes('belum ada foto produk'), 'Produk tanpa foto dilaporkan');
} finally {
  stub.close();
  await writeFile(CONFIG, asli);

  const kembali = await readFile(CONFIG, 'utf8');
  if (kembali !== asli) {
    console.error(`\nGAGAL memulihkan ${CONFIG}. Periksa file itu secara manual.`);
    process.exitCode = 1;
  } else {
    console.log(`\n${CONFIG} dipulihkan ke keadaan semula.`);
  }

  /* Sumber setelah pemulihan belum tentu products.json: kalau project Sanity
     sungguhan sudah dipasang, build ini membaca dari sana. Jangan menyebut
     sumber yang salah di log — itu menyesatkan justru saat build-nya gagal. */
  const sumberSemula = /projectId: PLACEHOLDER/.test(asli) ? 'products.json' : 'Sanity';
  console.log(`Membangun ulang dari ${sumberSemula}…`);
  const ulang = await run('npx', ['astro', 'build']);
  if (ulang.code !== 0) {
    console.error(
      `Build ulang dari ${sumberSemula} gagal. Jalankan "npm run build" sebelum memakai dist/.`,
    );
    process.exitCode = 1;
  }
}

console.log(fails.length ? `\n${fails.length} uji gagal.` : '\nSemua uji CMS lulus.');
if (fails.length) process.exitCode = 1;
