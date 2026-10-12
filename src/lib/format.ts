import { site } from '../config/site';

const rupiah = new Intl.NumberFormat(site.locale, {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** "Rp 420.000" — spasi tipis setelah Rp supaya angka tetap terbaca. */
export function formatRupiah(value: number): string {
  return rupiah.format(value).replace(/\s/g, ' ');
}

/**
 * Label harga lengkap dengan satuannya.
 * Satuan tidak pernah dipisah dari harga — lihat docs/DESIGN-SYSTEM.md §6.
 */
export function formatPrice(pricePerDozen: number, priceType: 'tetap' | 'mulai'): string {
  const angka = `${formatRupiah(pricePerDozen)} / lusin`;
  return priceType === 'mulai' ? `Mulai dari ${angka}` : angka;
}

/** "1 lusin" / "3 lusin" — bahasa Indonesia tidak memakai bentuk jamak. */
export function formatDozen(qty: number): string {
  return `${qty} lusin`;
}

/** Daftar ukuran lengkap. Dipakai di halaman detail, bukan di dalam grid. */
export function formatSizes(sizes: readonly string[]): string {
  return sizes.join(', ');
}

/**
 * Rentang ukuran ringkas: "1–8", "M–XXL", "28–38".
 *
 * Di dalam grid, daftar ukuran lengkap memakan dua baris dan tidak membantu
 * keputusan. Daftar lengkapnya tetap ada di halaman detail produk.
 */
export function formatSizeRange(sizes: readonly string[]): string {
  if (sizes.length === 0) return '';
  if (sizes.length === 1) return sizes[0]!;
  if (sizes.length === 2) return `${sizes[0]} & ${sizes[1]}`;
  return `${sizes[0]}–${sizes[sizes.length - 1]}`;
}

/**
 * Menurunkan huruf kapital kata pertama saat frasa dipakai di tengah kalimat.
 *
 * "Seluruh Indonesia" berdiri sendiri di tabel spesifikasi, tapi di tengah
 * kalimat harus jadi "seluruh Indonesia" — toLowerCase() pada seluruh frasa
 * ikut merusak nama diri.
 */
export function lowerLead(phrase: string): string {
  return phrase.replace(/^(\p{Lu})/u, (c) => c.toLowerCase());
}

/** "3 warna" — jumlahnya lebih berguna daripada daftar panjang di dalam grid. */
export function formatColorCount(colors: readonly string[]): string | null {
  return colors.length > 0 ? `${colors.length} warna` : null;
}
