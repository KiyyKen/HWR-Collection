import type { APIRoute } from 'astro';

import { site } from '../config/site';

/**
 * robots.txt dibangkitkan, bukan file statis di public/.
 *
 * Alasannya satu: baris Sitemap harus memakai domain yang sama dengan
 * `site.url`. Kalau ditulis manual, domain itu akan tertinggal salah saat
 * domain asli diisi — dan tidak ada yang memberi tahu.
 *
 * Situs ini tidak punya halaman privat, jadi tidak ada yang dilarang —
 * KECUALI selama domainnya masih domain contoh.
 *
 * `.example` adalah TLD yang dicadangkan RFC 2606 dan dijamin tidak pernah
 * bisa didaftarkan, jadi kehadirannya di sini berarti satu hal saja: domain
 * asli belum diisi. Build seperti itu bisa saja ikut ter-deploy ke URL
 * pratinjau penyedia hosting, dan saat itu terjadi, yang ter-index adalah 24
 * produk contoh beserta harga karangannya — di alamat yang canonical-nya
 * pun salah. Lebih baik ditutup sampai domainnya benar.
 *
 * Begitu `site.url` diisi domain asli, baris larangan ini hilang sendiri.
 */
export const GET: APIRoute = ({ site: astroSite }) => {
  const url = astroSite ?? new URL(site.url);
  const base = url.href.replace(/\/$/, '');
  const domainContoh = url.hostname.endsWith('.example');

  const body = domainContoh
    ? [
        '# Domain masih placeholder (lihat PLACEHOLDERS.md B17).',
        '# Build ini tidak boleh ter-index di mana pun.',
        'User-agent: *',
        'Disallow: /',
        '',
      ].join('\n')
    : ['User-agent: *', 'Allow: /', '', `Sitemap: ${base}/sitemap-index.xml`, ''].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
