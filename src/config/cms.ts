/**
 * Konfigurasi Sanity — sumber data produk HWR Collection.
 *
 * Selama `projectId` masih PLACEHOLDER, situs memakai `src/content/products.json`
 * seperti sebelumnya dan seluruh perilakunya tidak berubah sedikit pun. Begitu
 * project ID asli diisi, sumber datanya berpindah ke Sanity tanpa ada file lain
 * yang perlu disentuh.
 *
 * Tidak ada project ID, dataset, atau token yang dikarang di file ini.
 * Lihat PLACEHOLDERS.md dan docs/CMS.md.
 */

import { PLACEHOLDER, isPlaceholder } from './site';

export const cms = {
  /**
   * ID project Sanity. Bukan rahasia — ID ini memang ikut terkirim ke browser
   * pada project publik.
   *
   * Project HWR Collection sudah dibuat dan ID-nya **`1ybl4qg4`**, dataset
   * `production`. Studio sudah tersambung ke sana lewat `sanity/.env`.
   *
   * Baris ini sengaja MASIH placeholder, dan itu bukan kelalaian: saklar ini
   * memindahkan SELURUH sumber data produk ke Sanity, dan dataset-nya masih
   * kosong. Menyalakannya sekarang membuat `npm run build`, `npm run dev`,
   * dan seluruh uji yang membangun situs gagal — bukan karena rusak, tapi
   * karena katalog tanpa satu pun produk memang ditolak (lihat
   * `scripts/validate-data.mjs`).
   *
   * Nyalakan begitu ada minimal satu produk yang sudah di-Publish di Studio:
   *
   *     projectId: '1ybl4qg4' as string,
   *
   * lalu `npm run validate` dan `npm run build`. Tidak ada file lain yang
   * perlu disentuh.
   */
  projectId: '1ybl4qg4' as string,

  /** Dataset yang dibaca situs. `production` adalah bawaan Sanity. */
  dataset: 'production',

  /**
   * Tanggal versi API. Dikunci, bukan "terbaru": API Sanity berubah per
   * tanggal, dan build yang sama harus menghasilkan data yang sama
   * bulan depan.
   */
  apiVersion: '2024-11-01',

  /**
   * Host API. Diganti hanya oleh `npm run test:cms`, yang mengarahkannya ke
   * stub lokal supaya jalur CMS bisa diverifikasi tanpa kredensial asli.
   */
  apiHost: 'https://api.sanity.io',

  /** Host CDN gambar. Diganti bersamaan dengan `apiHost` saat pengujian. */
  imageHost: 'https://cdn.sanity.io',

  /**
   * `published` berarti draft TIDAK PERNAH ikut ke situs.
   *
   * Admin sering menyimpan setengah jadi — harga belum diisi, foto belum
   * diunggah. Perspektif ini yang memastikan pekerjaan setengah jadi itu
   * tidak pernah sampai ke pengunjung.
   */
  perspective: 'published' as const,

  /**
   * Dataset privat butuh token baca. Diambil dari environment, tidak pernah
   * ditulis di repositori. Dataset publik tidak membutuhkannya sama sekali —
   * itu bawaan yang dipakai di sini.
   */
  tokenEnvVar: 'SANITY_READ_TOKEN',

  /**
   * PLACEHOLDER — URL deploy hook penyedia hosting.
   *
   * Dipanggil `scripts/rebuild-hook.mjs` setelah admin menekan Publish.
   * Bentuknya berbeda per penyedia; resepnya ada di docs/CMS.md.
   */
  deployHookUrl: PLACEHOLDER as string,

  /**
   * PLACEHOLDER — secret webhook dari Sanity.
   *
   * Dipakai memverifikasi tanda tangan HMAC setiap permintaan masuk. Tanpa
   * ini, endpoint rebuild bisa dipicu siapa saja. Disimpan di environment
   * (`SANITY_WEBHOOK_SECRET`), bukan di file ini.
   */
  webhookSecretEnvVar: 'SANITY_WEBHOOK_SECRET',
} as const;

/** true kalau situs harus membaca produk dari Sanity, bukan dari JSON. */
export function isCmsConfigured(): boolean {
  return !isPlaceholder(cms.projectId);
}

/** Host gambar sebagai hostname saja, untuk `image.remotePatterns` Astro. */
export function imageHostname(): string {
  return new URL(cms.imageHost).hostname;
}

/**
 * true kalau host API memakai pola `<projectId>.api.sanity.io`.
 *
 * Begitulah alamat API Sanity sungguhan. Host lain — proxy, atau stub lokal
 * di `npm run test:cms` — tidak punya subdomain per project, dan klien harus
 * diberi tahu supaya tidak merangkai alamat yang tidak ada.
 */
export function usesProjectHostname(): boolean {
  return new URL(cms.apiHost).hostname.endsWith('.sanity.io');
}

/**
 * Protokol host gambar, tanpa titik dua.
 *
 * Selalu `https` untuk CDN Sanity. Ikut dibaca dari konfigurasi karena
 * `npm run test:cms` mengarahkan host gambar ke stub `http://localhost`,
 * dan `remotePatterns` menolak host yang protokolnya tidak cocok.
 */
export function imageProtocol(): 'http' | 'https' {
  return new URL(cms.imageHost).protocol === 'http:' ? 'http' : 'https';
}
