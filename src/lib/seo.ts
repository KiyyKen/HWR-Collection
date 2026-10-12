import { site } from '../config/site';

/**
 * URL absolut untuk structured data.
 *
 * Bentuknya harus sama persis dengan `<link rel="canonical">` dan dengan
 * sitemap — keduanya memakai garis miring di akhir. URL yang dirakit
 * sendiri-sendiri di tiap halaman gampang meleset satu karakter, dan mesin
 * pencari lalu melihat dua alamat untuk satu halaman yang sama.
 *
 *   abs()                 → https://contoh.id/
 *   abs('katalog')        → https://contoh.id/katalog/
 *   abs('produk', 'j-01') → https://contoh.id/produk/j-01/
 */
export function abs(...segments: string[]): string {
  const base = site.url.replace(/\/+$/, '');
  const jalur = segments
    .map((s) => s.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
  return jalur ? `${base}/${jalur}/` : `${base}/`;
}

/**
 * Meta description yang muat di hasil penelusuran tanpa dipotong mesin.
 *
 * `ekor` (harga, minimum pemesanan) SELALU ikut — itu bagian yang paling
 * berguna bagi pembeli grosir yang sedang membandingkan hasil pencarian.
 * Yang dikurangi adalah kalimat deskripsi, dan pengurangannya per kalimat
 * utuh: potongan di tengah kata plus "…" terbaca seperti hasil mesin.
 */
export function ringkasMeta(teks: string, ekor: string, maks = 160): string {
  const penuh = `${teks} ${ekor}`;
  if (penuh.length <= maks) return penuh;

  const kalimat = teks.split(/(?<=\.)\s+/);
  let hasil = kalimat[0] ?? '';
  for (const k of kalimat.slice(1)) {
    if (`${hasil} ${k} ${ekor}`.length > maks) break;
    hasil = `${hasil} ${k}`;
  }
  return `${hasil} ${ekor}`.trim();
}
