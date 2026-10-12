/**
 * Generator foto produk SEMENTARA untuk HWR Collection.
 *
 * Kenapa ada: foto produk asli belum tersedia, tapi layout tidak boleh
 * dibangun di atas gambar acak. Script ini membuat siluet garmen dengan
 * latar, pencahayaan, bayangan, dan framing yang IDENTIK di setiap file,
 * supaya terbaca seperti dipotret oleh satu brand.
 *
 * Cara mengganti dengan foto asli:
 *   1. Taruh foto di src/assets/products/<id>.webp (atau .jpg), rasio 4:5.
 *   2. Hapus baris "shape" dari produk itu di src/content/products.json.
 *   3. Tidak ada kode komponen yang perlu diubah — pipeline astro:assets
 *      sama persis untuk placeholder maupun foto asli.
 *
 * Produk tanpa "shape" DILEWATI script ini. Itu pengamannya: foto asli yang
 * sudah masuk tidak akan pernah tertimpa gambar buatan, berapa kali pun
 * perintah ini dijalankan.
 *
 * Jalankan: npm run gen:photos
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'src/assets/products');

/* ── Sistem foto (lihat docs/DESIGN-SYSTEM.md §7) ───────────────────── */

const OUT_W = 1400;
const OUT_H = 1750; // 4:5
const VB_W = 1000;
const VB_H = 1250;

const BACKDROP = '#EFEDE7';
const SHADOW = 'rgba(23,35,59,0.13)';
const STITCH = '#C08A22';

/** Nama warna dari products.json → warna kain. Warna pertama yang dipakai. */
const FABRIC = {
  'Biru Tua': '#2F4470',
  'Biru Muda': '#7E9AC4',
  Hitam: '#2B2E35',
  'Abu Misty': '#9A9EA5',
  Navy: '#24314F',
  Khaki: '#B8A282',
  Army: '#5A6350',
  Cream: '#E3DAC6',
  Maroon: '#6B2E36',
  Mustard: '#C69A3C',
  'Dusty Pink': '#C99A9B',
  Putih: '#EFEFEC',
};

const CX = 500;
const WAIST_Y = 180;

/* ── Geometri siluet ────────────────────────────────────────────────── */

/**
 * Bentuk dasar celana, dilihat dari depan, digelar rata.
 * Semua varian memakai fungsi ini supaya proporsinya konsisten.
 */
function pantsPath({ waistHalf, hipHalf, hipY, crotchY, hemY, hemOuter, hemInner, gap }) {
  const apex = crotchY - 48;
  return [
    `M ${CX - waistHalf} ${WAIST_Y}`,
    `L ${CX + waistHalf} ${WAIST_Y}`,
    `Q ${CX + hipHalf} ${hipY - 40} ${CX + hipHalf} ${hipY}`,
    `C ${CX + hipHalf} ${hipY + (hemY - hipY) * 0.45} ${CX + hemOuter + 26} ${hemY - (hemY - hipY) * 0.3} ${CX + hemOuter} ${hemY}`,
    `L ${CX + hemInner} ${hemY}`,
    `C ${CX + hemInner + 10} ${hemY - (hemY - crotchY) * 0.45} ${CX + gap + 18} ${crotchY + 70} ${CX + gap} ${crotchY}`,
    `L ${CX} ${apex}`,
    `L ${CX - gap} ${crotchY}`,
    `C ${CX - gap - 18} ${crotchY + 70} ${CX - hemInner - 10} ${hemY - (hemY - crotchY) * 0.45} ${CX - hemInner} ${hemY}`,
    `L ${CX - hemOuter} ${hemY}`,
    `C ${CX - hemOuter - 26} ${hemY - (hemY - hipY) * 0.3} ${CX - hipHalf} ${hipY + (hemY - hipY) * 0.45} ${CX - hipHalf} ${hipY}`,
    `Q ${CX - hipHalf} ${hipY - 40} ${CX - waistHalf} ${WAIST_Y}`,
    'Z',
  ].join(' ');
}

/** Ukuran per siluet. hemY menentukan panjang, hemOuter menentukan potongan. */
const GEOMETRY = {
  'jeans-panjang': { waistHalf: 172, hipHalf: 206, hipY: 360, crotchY: 540, hemY: 1090, hemOuter: 148, hemInner: 26, gap: 20 },
  'jeans-pendek': { waistHalf: 172, hipHalf: 206, hipY: 360, crotchY: 540, hemY: 760, hemOuter: 186, hemInner: 28, gap: 20 },
  // Cutbray melebar dari lutut ke bawah: keliman lebih lebar daripada pinggul.
  'jeans-cutbray': { waistHalf: 168, hipHalf: 200, hipY: 360, crotchY: 540, hemY: 1090, hemOuter: 208, hemInner: 34, gap: 20 },
  'jeans-jogger': { waistHalf: 168, hipHalf: 204, hipY: 360, crotchY: 540, hemY: 1060, hemOuter: 118, hemInner: 30, gap: 20 },
  'training-panjang': { waistHalf: 176, hipHalf: 204, hipY: 356, crotchY: 534, hemY: 1090, hemOuter: 142, hemInner: 26, gap: 22 },
  'training-jogger': { waistHalf: 176, hipHalf: 204, hipY: 356, crotchY: 534, hemY: 1050, hemOuter: 112, hemInner: 30, gap: 22 },
  'cargo-panjang': { waistHalf: 180, hipHalf: 216, hipY: 364, crotchY: 546, hemY: 1090, hemOuter: 160, hemInner: 26, gap: 22 },
  'cargo-pendek': { waistHalf: 180, hipHalf: 216, hipY: 364, crotchY: 546, hemY: 790, hemOuter: 198, hemInner: 28, gap: 22 },
  'kolor-panjang': { waistHalf: 184, hipHalf: 214, hipY: 352, crotchY: 530, hemY: 1080, hemOuter: 150, hemInner: 26, gap: 24 },
  'kolor-pendek': { waistHalf: 184, hipHalf: 214, hipY: 352, crotchY: 530, hemY: 806, hemOuter: 194, hemInner: 30, gap: 24 },
  'hawai-panjang': { waistHalf: 188, hipHalf: 224, hipY: 348, crotchY: 524, hemY: 1080, hemOuter: 214, hemInner: 30, gap: 26 },
  'hawai-pendek': { waistHalf: 188, hipHalf: 224, hipY: 348, crotchY: 524, hemY: 812, hemOuter: 218, hemInner: 32, gap: 26 },
};

/** Kotak batas sebuah siluet dalam koordinat gambar. */
function shapeBox(shape) {
  if (shape === 'setelan') return { x: 284, y: 170, w: 432, h: 668 };
  const g = GEOMETRY[shape];
  const half = Math.max(g.waistHalf, g.hipHalf, g.hemOuter);
  return { x: CX - half, y: WAIST_Y, w: half * 2, h: g.hemY - WAIST_Y };
}

/* ── Detail garmen ──────────────────────────────────────────────────── */

const bandY = (h) => WAIST_Y + h;

/** Ban pinggang jeans/cargo: kaku, ada jahitan atas-bawah. */
function wovenWaistband(g, dark) {
  const h = 46;
  return `
    <path d="M ${CX - g.waistHalf} ${WAIST_Y} L ${CX + g.waistHalf} ${WAIST_Y} L ${CX + g.waistHalf + 4} ${bandY(h)} L ${CX - g.waistHalf - 4} ${bandY(h)} Z" fill="${dark}" opacity="0.5"/>
    <line x1="${CX - g.waistHalf - 2}" y1="${bandY(h)}" x2="${CX + g.waistHalf + 2}" y2="${bandY(h)}" stroke="${STITCH}" stroke-width="2.5" stroke-dasharray="9 7" opacity="0.75"/>
    <line x1="${CX - 5}" y1="${bandY(h)}" x2="${CX - 5}" y2="${bandY(h) + 150}" stroke="${STITCH}" stroke-width="2.5" stroke-dasharray="9 7" opacity="0.6"/>
    <rect x="${CX - 26}" y="${WAIST_Y + 6}" width="52" height="34" fill="${dark}" opacity="0.45"/>`;
}

/** Ban pinggang karet: bergelombang halus, ada tali serut. */
function elasticWaistband(g, dark, drawstring) {
  const h = 54;
  const ruches = Array.from({ length: 13 }, (_, i) => {
    const x = CX - g.waistHalf + 14 + i * ((g.waistHalf * 2 - 28) / 12);
    return `<line x1="${x}" y1="${WAIST_Y + 8}" x2="${x}" y2="${bandY(h) - 8}" stroke="${dark}" stroke-width="3" opacity="0.28"/>`;
  }).join('');
  const tie = drawstring
    ? `<path d="M ${CX - 62} ${bandY(h) - 6} q 30 46 62 6 q 32 40 62 -6" fill="none" stroke="${dark}" stroke-width="7" stroke-linecap="round" opacity="0.55"/>`
    : '';
  return `
    <path d="M ${CX - g.waistHalf} ${WAIST_Y} L ${CX + g.waistHalf} ${WAIST_Y} L ${CX + g.waistHalf} ${bandY(h)} L ${CX - g.waistHalf} ${bandY(h)} Z" fill="${dark}" opacity="0.32"/>
    ${ruches}${tie}`;
}

/** Sobekan lutut, dipakai hanya kalau produknya memang model sobek. */
function ripDetail(g, dark) {
  const kneeY = g.crotchY + (g.hemY - g.crotchY) * 0.42;
  const rip = (side) => {
    const x = CX + side * (g.hipHalf * 0.5);
    return `
      <rect x="${x - 52}" y="${kneeY}" width="104" height="26" rx="6" fill="${dark}" opacity="0.34"/>
      <rect x="${x - 52}" y="${kneeY + 44}" width="104" height="18" rx="6" fill="${dark}" opacity="0.26"/>`;
  };
  return `${rip(-1)}${rip(1)}`;
}

function jeansDetail(g, dark, sobek) {
  return `
    ${wovenWaistband(g, dark)}
    ${sobek ? ripDetail(g, dark) : ''}
    <path d="M ${CX - g.waistHalf + 16} ${bandY(46)} q 62 26 96 84" fill="none" stroke="${STITCH}" stroke-width="2.5" stroke-dasharray="8 7" opacity="0.7"/>
    <path d="M ${CX + g.waistHalf - 16} ${bandY(46)} q -62 26 -96 84" fill="none" stroke="${STITCH}" stroke-width="2.5" stroke-dasharray="8 7" opacity="0.7"/>
    <line x1="${CX - g.hemInner - 8}" y1="${g.hemY - 34}" x2="${CX - g.hemOuter + 8}" y2="${g.hemY - 34}" stroke="${STITCH}" stroke-width="2.5" stroke-dasharray="8 7" opacity="0.7"/>
    <line x1="${CX + g.hemInner + 8}" y1="${g.hemY - 34}" x2="${CX + g.hemOuter - 8}" y2="${g.hemY - 34}" stroke="${STITCH}" stroke-width="2.5" stroke-dasharray="8 7" opacity="0.7"/>`;
}

function cargoDetail(g, dark) {
  // Kantong duduk di paha luar, selalu berjarak dari keliman bawah.
  const legSpan = g.hemY - g.crotchY;
  const pocketY = g.crotchY + legSpan * 0.16;
  const ph = Math.min(150, legSpan * 0.42);
  const pw = Math.min(118, g.hipHalf * 0.56);
  /** Tepi luar kaki pada ketinggian y (interpolasi hip → hem). */
  const outerAt = (y) => {
    const t = Math.max(0, Math.min(1, (y - g.hipY) / (g.hemY - g.hipY)));
    return g.hipHalf + (g.hemOuter - g.hipHalf) * t;
  };
  const pocket = (side) => {
    const edge = Math.min(outerAt(pocketY), outerAt(pocketY + ph));
    const x = CX + side * (edge - 12) - (side > 0 ? pw : 0);
    return `
      <rect x="${x}" y="${pocketY}" width="${pw}" height="${ph}" fill="${dark}" opacity="0.24"/>
      <rect x="${x - 7}" y="${pocketY - 5}" width="${pw + 14}" height="32" fill="${dark}" opacity="0.4"/>
      <line x1="${x}" y1="${pocketY + ph}" x2="${x + pw}" y2="${pocketY + ph}" stroke="${dark}" stroke-width="3" opacity="0.38"/>`;
  };
  return `
    ${wovenWaistband(g, dark)}
    ${pocket(-1)}${pocket(1)}`;
}

function trainingDetail(g, dark, jogger, list) {
  // List samping hanya digambar untuk model yang memang berlist. Model polos
  // tidak boleh tampil berlist — itu sama saja menjanjikan barang lain.
  const stripe = (side) =>
    list
      ? `
    <path d="M ${CX + side * (g.hipHalf - 22)} ${g.hipY} L ${CX + side * (g.hemOuter - 14)} ${g.hemY - (jogger ? 54 : 10)}"
          fill="none" stroke="#EFEDE7" stroke-width="16" opacity="0.5" stroke-linecap="round"/>`
      : '';
  const cuff = jogger
    ? `<path d="M ${CX + g.hemInner} ${g.hemY - 54} L ${CX + g.hemOuter} ${g.hemY - 54} L ${CX + g.hemOuter} ${g.hemY} L ${CX + g.hemInner} ${g.hemY} Z" fill="${dark}" opacity="0.34"/>
       <path d="M ${CX - g.hemOuter} ${g.hemY - 54} L ${CX - g.hemInner} ${g.hemY - 54} L ${CX - g.hemInner} ${g.hemY} L ${CX - g.hemOuter} ${g.hemY} Z" fill="${dark}" opacity="0.34"/>`
    : '';
  return `${elasticWaistband(g, dark, true)}${stripe(-1)}${stripe(1)}${cuff}`;
}

/**
 * Motif cetak. Sebarannya tetap (bukan acak) supaya hasil build selalu sama
 * dan foto yang sama tidak berubah-ubah tiap kali script dijalankan.
 */
function motifDots(hemY, count = 46) {
  // Sebaran acak-semu berbasis hash, bukan kelipatan: x dan y yang sama-sama
  // naik seiring i menghasilkan garis diagonal, bukan motif.
  const hash = (n) => {
    const x = Math.sin(n * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  const span = Math.max(60, hemY - 340);
  return Array.from({ length: count }, (_, i) => {
    const x = (CX - 215 + hash(i + 1) * 430).toFixed(1);
    const y = (300 + hash(i + 97) * span).toFixed(1);
    const r = (8 + hash(i + 211) * 8).toFixed(1);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#EFEDE7" opacity="0.34"/>`;
  }).join('');
}

function kolorDetail(g, dark, { drawstring, motif }) {
  return `
    ${elasticWaistband(g, dark, drawstring)}
    ${motif ? motifDots(g.hemY, 30) : ''}
    <line x1="${CX - g.hemInner - 10}" y1="${g.hemY - 26}" x2="${CX - g.hemOuter + 10}" y2="${g.hemY - 26}" stroke="${dark}" stroke-width="3" opacity="0.32"/>
    <line x1="${CX + g.hemInner + 10}" y1="${g.hemY - 26}" x2="${CX + g.hemOuter - 10}" y2="${g.hemY - 26}" stroke="${dark}" stroke-width="3" opacity="0.32"/>`;
}

function hawaiDetail(g, dark, motif) {
  const dots = motif ? motifDots(g.hemY) : '';
  return `${elasticWaistband(g, dark, false)}${dots}
    <path d="M ${CX - 120} ${g.hipY + 130} q 120 40 240 0" fill="none" stroke="${dark}" stroke-width="3" opacity="0.2"/>`;
}

/** Setelan: kaos di atas, celana pendek di bawah. */
function setelanSvg(dark) {
  const tee = `M 330 200 L 420 170 Q 500 208 580 170 L 670 200 L 716 300 L 648 330 L 648 560 Q 500 588 352 560 L 352 330 L 284 300 Z`;
  const shorts = `M 348 636 L 652 636 L 672 812 L 556 838 L 526 716 L 474 716 L 444 838 L 328 812 Z`;
  return {
    paths: [tee, shorts],
    detail: `
      <path d="M 420 170 Q 500 234 580 170" fill="none" stroke="${dark}" stroke-width="7" opacity="0.4"/>
      <rect x="348" y="636" width="304" height="36" fill="${dark}" opacity="0.32"/>
      <path d="M 466 676 q 34 40 68 0" fill="none" stroke="${dark}" stroke-width="6" stroke-linecap="round" opacity="0.45"/>
      <line x1="352" y1="560" x2="648" y2="560" stroke="${dark}" stroke-width="3" opacity="0.25"/>`,
    box: { x: 284, y: 170, w: 432, h: 668 },
  };
}

/* ── Komposisi ──────────────────────────────────────────────────────── */

/**
 * Margin frame dan SATU skala global untuk semua siluet.
 *
 * Skalanya sengaja global, bukan fit-per-garmen: celana pendek memang harus
 * terlihat lebih pendek daripada celana panjang di dalam grid. Kalau setiap
 * foto diskalakan sendiri-sendiri, celana pendek jadi membesar tak wajar dan
 * perbandingan panjang antar produk jadi bohong.
 */
const FRAME_INSET_X = 0.1;
const FRAME_INSET_Y = 0.07;

const GLOBAL_SCALE = (() => {
  const boxes = [...Object.keys(GEOMETRY), 'setelan'].map(shapeBox);
  const maxW = Math.max(...boxes.map((b) => b.w));
  const maxH = Math.max(...boxes.map((b) => b.h));
  return Math.min((VB_W * (1 - FRAME_INSET_X * 2)) / maxW, (VB_H * (1 - FRAME_INSET_Y * 2)) / maxH);
})();

/**
 * Satu-satunya hal yang boleh mengubah skala: ukuran yang memang dijual.
 *
 * Produk berukuran anak digambar lebih kecil daripada produk dewasa dengan
 * siluet yang sama. Itu bukan hiasan — tanpa ini "Cargo Anak Pendek" dan
 * "Cargo Dewasa Pendek" menghasilkan gambar yang persis sama, dan katalog
 * terlihat seperti mengulang produk yang sama dua kali.
 *
 * Kelasnya dibaca dari field `sizes`, bukan dari nama produk: ukuran angka
 * 1–12 berarti ukuran anak, huruf dan nomor pinggang berarti dewasa.
 */
const SIZE_SCALE = { anak: 0.86, dewasa: 1 };

function sizeClass(product) {
  const sizes = product.sizes ?? [];
  const semuaAngkaKecil =
    sizes.length > 0 && sizes.every((s) => /^\d+$/.test(s) && Number(s) <= 12);
  return semuaAngkaKecil ? 'anak' : 'dewasa';
}

/** Produk ini model bermotif? Dibaca dari nama, bukan ditebak. */
const bermotif = (product) => /motif/i.test(product.name);

function buildSvg(product) {
  const fill = FABRIC[product.colors?.[0]] ?? '#8A8F98';
  const dark = '#101826';
  const shape = product.shape;

  let shapes; // array of path `d`
  let detail;

  if (shape === 'setelan') {
    const s = setelanSvg(dark);
    shapes = s.paths;
    detail = s.detail;
  } else {
    const g = GEOMETRY[shape];
    if (!g) throw new Error(`Siluet tidak dikenal: ${shape} (${product.code})`);
    shapes = [pantsPath(g)];
    if (shape.startsWith('jeans')) detail = jeansDetail(g, dark, /sobek/i.test(product.name));
    else if (shape.startsWith('cargo')) detail = cargoDetail(g, dark);
    else if (shape.startsWith('training'))
      detail = trainingDetail(g, dark, shape.endsWith('jogger'), /list/i.test(product.name));
    else if (shape.startsWith('kolor'))
      // Tali serut adalah ciri kolor. Celana pendek katun biasa di kategori
      // "lainnya" memakai siluet yang sama tapi tanpa tali.
      detail = kolorDetail(g, dark, {
        drawstring: product.category === 'kolor',
        motif: bermotif(product),
      });
    else detail = hawaiDetail(g, dark, bermotif(product));
  }

  // Skala global, posisi tengah. Panjang relatif antar produk tetap jujur.
  const box = shapeBox(shape);
  const s = GLOBAL_SCALE * SIZE_SCALE[sizeClass(product)];
  const tx = (VB_W - box.w * s) / 2 - box.x * s;
  const ty = (VB_H - box.h * s) / 2 - box.y * s;
  const fit = `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})`;

  const body = shapes.map((d) => `<path d="${d}" fill="${fill}"/>`).join('');
  const clip = shapes.map((d) => `<path d="${d}"/>`).join('');
  const shadow = shapes.map((d) => `<path d="${d}" fill="${SHADOW}"/>`).join('');

  // Pencahayaan: satu key lembut dari kiri-atas, identik di setiap foto.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB_W} ${VB_H}" width="${VB_W}" height="${VB_H}">
  <defs>
    <linearGradient id="key" x1="0" y1="0" x2="0.85" y2="1">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.20"/>
      <stop offset="0.52" stop-color="#FFFFFF" stop-opacity="0.02"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.14"/>
    </linearGradient>
    <radialGradient id="ambient" cx="0.36" cy="0.26" r="0.92">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="20"/>
    </filter>
    <clipPath id="garment">${clip}</clipPath>
  </defs>

  <rect width="${VB_W}" height="${VB_H}" fill="${BACKDROP}"/>
  <rect width="${VB_W}" height="${VB_H}" fill="url(#ambient)"/>

  <g transform="${fit}">
    <g transform="translate(22 28)" filter="url(#soft)" opacity="0.85">${shadow}</g>
    ${body}
    <g clip-path="url(#garment)">
      ${detail}
      <rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="url(#key)"/>
    </g>
  </g>
</svg>`;
}

/* ── Jalankan ───────────────────────────────────────────────────────── */

const products = JSON.parse(await readFile(path.join(ROOT, 'src/content/products.json'), 'utf8'));
await mkdir(OUT_DIR, { recursive: true });

const adaDiFolder = await readdir(OUT_DIR).catch(() => []);
const EKSTENSI_FOTO_ASLI = /\.(jpe?g|png|avif)$/i;

let written = 0;
const dilewati = [];

for (const p of products) {
  // Produk tanpa "shape" berarti fotonya sudah asli. Jangan disentuh.
  if (!p.shape) {
    dilewati.push(p.id);
    continue;
  }

  // Foto asli yang sudah masuk tapi "shape"-nya lupa dihapus: dua file dengan
  // id yang sama akan bertabrakan di ProductImage. Diberi tahu, bukan diam.
  const bentrok = adaDiFolder.filter(
    (f) => f.startsWith(`${p.id}.`) && EKSTENSI_FOTO_ASLI.test(f),
  );
  if (bentrok.length > 0) {
    console.warn(
      `! ${p.id}: ada ${bentrok.join(', ')} di folder, tapi field "shape" masih terisi.\n` +
        `  Hapus "shape" dari produk ini di src/content/products.json supaya foto aslinya dipakai.`,
    );
  }

  const svg = buildSvg(p);
  await sharp(Buffer.from(svg), { density: 200 })
    .resize(OUT_W, OUT_H, { fit: 'fill' })
    .webp({ quality: 88 })
    .toFile(path.join(OUT_DIR, `${p.id}.webp`));
  written += 1;
}

/*
  Gambar Open Graph sementara: wordmark di atas indigo.

  File ini SELALU ditulis ulang, jadi jangan menimpanya dengan gambar asli.
  Cara menggantinya: taruh gambar asli di public/ dengan nama lain (misal
  og-hwr.png), lalu arahkan `brand.ogImage` di src/config/site.ts ke situ.
*/
const og = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="#17233B"/>
  <text x="80" y="330" font-family="Archivo, Arial, sans-serif" font-size="96" font-weight="700" letter-spacing="-1" fill="#FFFFFF">HWR COLLECTION</text>
  <text x="80" y="400" font-family="Archivo, Arial, sans-serif" font-size="34" font-weight="500" fill="#8FA0C4">Grosir celana anak &amp; dewasa — minimum 1 lusin</text>
  <rect x="80" y="440" width="120" height="6" fill="#C08A22"/>
</svg>`;
await mkdir(path.join(ROOT, 'public'), { recursive: true });
await sharp(Buffer.from(og)).png().toFile(path.join(ROOT, 'public/og-default.png'));

await writeFile(
  path.join(OUT_DIR, 'README.md'),
  [
    '# Foto produk',
    '',
    'Semua file `.webp` di folder ini adalah **placeholder** hasil `npm run gen:photos`.',
    'Jangan diedit manual — akan tertimpa.',
    '',
    '## Mengganti dengan foto asli',
    '',
    '1. Taruh foto di folder ini dengan nama `<id>.jpg` atau `<id>.webp` (id sama dengan di `products.json`), rasio 4:5, minimal 1400px sisi pendek.',
    '2. Hapus field `shape` dari produk itu di `src/content/products.json`.',
    '3. Hapus file placeholder lama `<id>.webp` kalau foto aslinya berekstensi lain.',
    '4. Jalankan `npm run validate` untuk memastikan tidak ada yang tertinggal.',
    '',
    'Langkah 2 yang penting: produk tanpa `shape` **dilewati** generator, jadi foto asli tidak akan pernah tertimpa gambar buatan. Boleh diganti satu per satu — placeholder dan foto asli bisa hidup berdampingan di katalog yang sama.',
    '',
    'Tidak ada komponen yang perlu diubah. `src/components/ProductImage.astro` memuat file apa pun yang namanya cocok dengan id produk.',
    '',
    '## Pedoman foto',
    '',
    '- Rasio 4:5 portrait, latar polos terang, framing sama untuk semua produk.',
    '- Satu produk satu foto. Galeri dibuat hanya kalau memang ada sudut lain — tidak dipalsukan dari gambar yang sama.',
    '- Nama file = id produk. Itu satu-satunya penghubung ke data.',
    '',
  ].join('\n'),
);

console.log(`${written} foto placeholder + og-default.png dibuat di src/assets/products/`);
if (dilewati.length > 0) {
  console.log(`${dilewati.length} produk dilewati (sudah pakai foto asli): ${dilewati.join(', ')}`);
}
