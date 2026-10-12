import { cms } from '../config/cms';

/**
 * URL foto produk dari Sanity.
 *
 * Ditulis tangan, bukan memakai `@sanity/image-url`, karena yang dibutuhkan
 * hanya satu hal: satu URL sumber berasio 4:5 untuk diserahkan ke
 * `astro:assets`. Ukuran responsif, format, dan cache-busting tetap diurus
 * pipeline Astro yang sudah diverifikasi sejak Fase 1 — jadi menambah
 * dependensi hanya untuk merangkai URL tidak dibayar oleh apa pun
 * (CLAUDE.md: jangan tambah dependensi tanpa alasan tertulis).
 *
 * Yang TIDAK disederhanakan: crop dan hotspot yang diatur admin di Studio
 * tetap dihormati. Admin yang menggeser titik fokus supaya ban pinggang
 * tidak terpotong harus melihat hasilnya di situs.
 */

/** Bentuk aset gambar yang dikembalikan GROQ. */
export interface SanityImageSource {
  /** `image-<assetId>-<lebar>x<tinggi>-<format>` */
  ref: string;
  /** Crop pilihan admin, dalam pecahan sisi gambar asli. */
  crop?: { top: number; bottom: number; left: number; right: number } | null;
  /** Titik fokus pilihan admin, 0–1 dari kiri dan atas. */
  hotspot?: { x: number; y: number } | null;
  alt?: string | null;
}

export interface ResolvedImage {
  url: string;
  width: number;
  height: number;
  alt: string | null;
}

/** Rasio foto produk, dikunci design system §7. */
const RASIO_W = 4;
const RASIO_H = 5;

/** Lebar sumber yang diminta dari CDN. Astro menurunkannya jadi srcset. */
const LEBAR_SUMBER = 1400;
const TINGGI_SUMBER = (LEBAR_SUMBER / RASIO_W) * RASIO_H;

/**
 * ID aset Sanity alfanumerik campuran huruf besar-kecil, contohnya
 * `Tb9Ew8CXIwaY6R1kjMvI0uRR` — bukan heksadesimal.
 */
const POLA_REF = /^image-([A-Za-z0-9]+)-(\d+)x(\d+)-(\w+)$/;

/**
 * Membongkar asset ref Sanity.
 * Dimensi asli ikut di dalam ref, jadi tidak perlu memanggil API untuk tahu
 * ukuran gambar — penting supaya build tidak menambah satu permintaan
 * jaringan per produk.
 */
export function parseRef(ref: string): { id: string; width: number; height: number; format: string } {
  const m = POLA_REF.exec(ref);
  if (!m) {
    throw new Error(
      `Asset ref Sanity tidak dikenali: "${ref}". Bentuk yang benar: image-<id>-<lebar>x<tinggi>-<format>.`,
    );
  }
  return { id: m[1]!, width: Number(m[2]), height: Number(m[3]), format: m[4]! };
}

/**
 * URL sumber 4:5 untuk satu foto produk.
 *
 * Urutan yang dipakai CDN Sanity: `rect` memotong dulu sesuai crop admin,
 * lalu `fit=crop` menyesuaikan sisanya ke rasio target dengan titik fokus
 * sebagai pusatnya.
 */
export function resolveImage(src: SanityImageSource): ResolvedImage {
  const asset = parseRef(src.ref);
  const base = `${cms.imageHost}/images/${cms.projectId}/${cms.dataset}/${asset.id}-${asset.width}x${asset.height}.${asset.format}`;

  const params = new URLSearchParams();

  if (src.crop && (src.crop.top || src.crop.bottom || src.crop.left || src.crop.right)) {
    const x = Math.round(src.crop.left * asset.width);
    const y = Math.round(src.crop.top * asset.height);
    const w = Math.round((1 - src.crop.left - src.crop.right) * asset.width);
    const h = Math.round((1 - src.crop.top - src.crop.bottom) * asset.height);
    if (w > 0 && h > 0) params.set('rect', `${x},${y},${w},${h}`);
  }

  params.set('w', String(LEBAR_SUMBER));
  params.set('h', String(TINGGI_SUMBER));
  params.set('fit', 'crop');

  if (src.hotspot) {
    params.set('crop', 'focalpoint');
    params.set('fp-x', src.hotspot.x.toFixed(3));
    params.set('fp-y', src.hotspot.y.toFixed(3));
  } else {
    params.set('crop', 'center');
  }

  return {
    url: `${base}?${params.toString()}`,
    width: LEBAR_SUMBER,
    height: TINGGI_SUMBER,
    alt: src.alt?.trim() ? src.alt.trim() : null,
  };
}
