import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { file } from 'astro/loaders';

import { CATEGORY_IDS } from './data/categories';
import { isCmsConfigured } from './config/cms';
import { sanityLoader } from './lib/cms';

/**
 * Satu skema, dua sumber.
 *
 * Sanity jadi sumber kebenaran begitu project ID-nya diisi di
 * `src/config/cms.ts`. Selama belum, situs membaca `products.json` persis
 * seperti sejak Fase 1 — jadi menyiapkan CMS tidak mengubah apa pun yang
 * sudah diverifikasi, dan berpindah nanti tidak menyentuh satu komponen pun.
 *
 * Skema Zod di bawah memvalidasi KEDUA sumber. Data dari CMS tidak lebih
 * dipercaya daripada data dari file.
 */
const products = defineCollection({
  loader: isCmsConfigured() ? sanityLoader() : file('src/content/products.json'),
  schema: z.object({
    /** Kode artikel yang dipakai di percakapan WhatsApp, contoh "J-01". */
    code: z.string().regex(/^[A-Z]{1,3}-\d{2}$/),
    name: z.string().min(3),
    category: z.enum(CATEGORY_IDS),

    /** Harga dalam rupiah untuk satu lusin (12 pcs). */
    pricePerDozen: z.number().int().positive(),
    /**
     * "tetap"  → tampil "Rp 420.000 / lusin"
     * "mulai"  → tampil "Mulai dari Rp 465.000 / lusin"
     */
    priceType: z.enum(['tetap', 'mulai']).default('tetap'),

    sizes: z.array(z.string()).min(1),
    sizeNote: z.string().optional(),
    colors: z.array(z.string()).default([]),

    material: z.string().nullable().default(null),
    description: z.string(),

    /**
     * Siluet yang dipakai generator foto sementara.
     *
     * OPSIONAL, dan itu yang membuat foto asli bisa masuk tanpa menyentuh
     * kode: begitu field ini dihapus dari sebuah produk, `npm run gen:photos`
     * melewati produk itu dan foto aslinya di src/assets/products/ tidak
     * pernah tertimpa. Produk tanpa `shape` wajib punya file foto sendiri —
     * `npm run validate` yang memastikannya.
     */
    shape: z
      .enum([
        'jeans-panjang',
        'jeans-pendek',
        'jeans-cutbray',
        'jeans-jogger',
        'training-panjang',
        'training-jogger',
        'cargo-panjang',
        'cargo-pendek',
        'kolor-panjang',
        'kolor-pendek',
        'hawai-panjang',
        'hawai-pendek',
        'setelan',
      ])
      .optional(),

    /**
     * Foto dari CMS: URL CDN berasio 4:5 beserta dimensinya.
     *
     * Hanya ada kalau produknya datang dari Sanity. Produk dari
     * `products.json` memakai file di `src/assets/products/<id>.webp`, dan
     * `ProductImage.astro` yang memilih di antara keduanya. Dimensi wajib
     * ikut supaya `astro:assets` bisa mencadangkan ruangnya — tanpa itu
     * halaman bergeser saat gambar masuk (CLS).
     */
    image: z
      .object({
        url: z.url(),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        alt: z.string().nullable().default(null),
      })
      .optional(),

    featured: z.boolean().default(false),

    /**
     * DEVELOPMENT / DUMMY DATA.
     *
     * true selama nama, harga, ukuran, warna, bahan, dan foto belum diganti
     * data asli dari pemilik. Selama true:
     *   - pita "Versi pengembangan" tampil di atas setiap halaman
     *   - halaman produknya TIDAK memancarkan structured data Product,
     *     supaya harga contoh tidak pernah masuk hasil penelusuran
     *
     * Keduanya mati sendiri begitu nilainya jadi false. Tidak ada saklar lain.
     */
    dummy: z.boolean().default(true),
  }),
});

export const collections = { products };
