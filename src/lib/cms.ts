import { createClient, type SanityClient } from '@sanity/client';
import type { Loader } from 'astro/loaders';

import { cms, isCmsConfigured, usesProjectHostname } from '../config/cms';
import { resolveImage, type SanityImageSource } from './cms-image';

/**
 * Jembatan Sanity → content collection Astro.
 *
 * Seluruh situs membaca produk lewat `getCollection('products')`. File ini
 * adalah satu-satunya tempat yang tahu Sanity itu ada; komponen tidak pernah
 * tahu datanya datang dari CMS atau dari JSON.
 *
 * Loader berjalan saat build. Hasilnya tetap HTML statis — tidak ada
 * permintaan ke Sanity dari browser pengunjung, dan pola rendering yang
 * sudah diverifikasi di Fase 1–6 tidak berubah.
 */

/**
 * Ambil hanya yang dipakai situs.
 *
 * `perspective: 'published'` sudah menyingkirkan draft, dan filter
 * `!(_id in path("drafts.**"))` ditulis ulang di sini dengan sengaja: kalau
 * suatu saat perspektifnya diubah, query ini tetap tidak menarik pekerjaan
 * setengah jadi ke situs.
 */
const QUERY = /* groq */ `
*[_type == "product" && !(_id in path("drafts.**"))] {
  "id": slug.current,
  code,
  name,
  category,
  pricePerDozen,
  priceType,
  sizes,
  sizeNote,
  colors,
  material,
  description,
  featured,
  dummy,
  "image": photo {
    "ref": asset._ref,
    crop,
    hotspot,
    alt
  }
}
`;

interface ProdukCms {
  id?: string | null;
  code?: string | null;
  name?: string | null;
  category?: string | null;
  pricePerDozen?: number | null;
  priceType?: string | null;
  sizes?: string[] | null;
  sizeNote?: string | null;
  colors?: string[] | null;
  material?: string | null;
  description?: string | null;
  featured?: boolean | null;
  dummy?: boolean | null;
  image?: (SanityImageSource & { ref?: string | null }) | null;
}

export function sanityClient(): SanityClient {
  const token = process.env[cms.tokenEnvVar];
  return createClient({
    projectId: cms.projectId,
    dataset: cms.dataset,
    apiVersion: cms.apiVersion,
    apiHost: cms.apiHost,
    // Alamat API Sanity sungguhan berbentuk <projectId>.api.sanity.io.
    // Stub lokal saat pengujian tidak punya subdomain itu.
    useProjectHostname: usesProjectHostname(),
    perspective: cms.perspective,
    // Data harus yang terbaru saat build dijalankan webhook "Publish".
    // CDN Sanity bisa menyajikan versi lama beberapa detik — cukup lama
    // untuk membuat admin mengira publikasinya gagal.
    useCdn: false,
    ...(token ? { token } : {}),
  });
}

/**
 * Memeriksa hal-hal yang tidak bisa dilihat skema Zod satu per satu:
 * dokumen tanpa slug, kode kembar, dan produk tanpa foto.
 *
 * Dilempar sebagai error supaya build GAGAL. Situs yang tetap terbit dengan
 * dua produk berkode sama akan menghasilkan percakapan WhatsApp yang salah
 * barang — lebih baik build merah daripada pesanan keliru.
 */
function periksaMuatan(items: ProdukCms[]): void {
  const masalah: string[] = [];
  const kode = new Map<string, number>();
  const slug = new Map<string, number>();

  for (const [i, p] of items.entries()) {
    const nama = p.name ?? p.code ?? `dokumen ke-${i + 1}`;

    if (!p.id) {
      masalah.push(`${nama}: slug belum diisi — slug dipakai sebagai URL produk`);
    } else {
      slug.set(p.id, (slug.get(p.id) ?? 0) + 1);
    }

    if (p.code) kode.set(p.code, (kode.get(p.code) ?? 0) + 1);

    if (!p.image?.ref) {
      masalah.push(`${nama}: belum ada foto produk`);
    }
  }

  for (const [k, n] of kode) {
    if (n > 1) masalah.push(`kode "${k}" dipakai ${n} produk — kode dipakai di chat, harus unik`);
  }
  for (const [s, n] of slug) {
    if (n > 1) masalah.push(`slug "${s}" dipakai ${n} produk — slug jadi URL, harus unik`);
  }

  if (masalah.length > 0) {
    throw new Error(
      `Data produk dari Sanity tidak lolos pemeriksaan:\n` +
        masalah.map((m) => `  - ${m}`).join('\n') +
        `\n\nPerbaiki di Sanity Studio lalu publish ulang.`,
    );
  }
}

/** Bentuk satu dokumen Sanity jadi bentuk yang dipahami skema koleksi. */
function petakan(p: ProdukCms) {
  const image = p.image?.ref
    ? resolveImage({
        ref: p.image.ref,
        crop: p.image.crop ?? null,
        hotspot: p.image.hotspot ?? null,
        alt: p.image.alt ?? null,
      })
    : undefined;

  return {
    code: p.code,
    name: p.name,
    category: p.category,
    pricePerDozen: p.pricePerDozen,
    priceType: p.priceType ?? 'tetap',
    sizes: p.sizes ?? [],
    ...(p.sizeNote ? { sizeNote: p.sizeNote } : {}),
    colors: p.colors ?? [],
    material: p.material ?? null,
    description: p.description,
    featured: p.featured ?? false,
    dummy: p.dummy ?? true,
    ...(image ? { image } : {}),
    // `shape` khusus generator foto sementara. Produk dari CMS punya foto
    // sungguhan, jadi field itu memang tidak ada di sini.
  };
}

/**
 * Loader produk dari Sanity.
 *
 * Dipakai hanya kalau `src/config/cms.ts` sudah diisi project ID. Selama
 * belum, `src/content.config.ts` tetap memakai loader file seperti semula.
 */
export function sanityLoader(): Loader {
  return {
    name: 'sanity-produk',
    async load({ store, parseData, generateDigest, logger }) {
      if (!isCmsConfigured()) {
        throw new Error('sanityLoader dipanggil padahal project ID Sanity masih placeholder.');
      }

      logger.info(`Mengambil produk dari Sanity (${cms.projectId}/${cms.dataset})…`);
      const items = (await sanityClient().fetch<ProdukCms[]>(QUERY)) ?? [];

      if (items.length === 0) {
        throw new Error(
          `Dataset "${cms.dataset}" tidak berisi satu pun dokumen product yang sudah dipublikasikan.\n` +
            `Kalau ini dataset baru, jalankan migrasi datanya dulu — lihat docs/CMS.md.`,
        );
      }

      periksaMuatan(items);

      store.clear();
      for (const item of items) {
        const data = await parseData({ id: item.id!, data: petakan(item) });
        store.set({ id: item.id!, data, digest: generateDigest(data) });
      }

      logger.info(`${items.length} produk dimuat dari Sanity.`);
    },
  };
}
