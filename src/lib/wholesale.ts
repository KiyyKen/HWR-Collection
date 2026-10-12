import { site } from '../config/site';

/**
 * Aturan isi satu lusin — satu sumber untuk tiga tempat.
 *
 * Pembeli grosir menemui aturan ini di tiga titik berbeda: tabel ketentuan
 * di beranda, halaman produk saat menentukan jumlah, dan daftar pesanan
 * sesaat sebelum mengirim pesan. Kalau kalimatnya ditulis ulang di masing
 * masing tempat, cepat atau lambat ketiganya berbeda — dan yang satu jadi
 * bohong. Semuanya membaca `site.wholesalePolicy`.
 *
 * Selama pemilik belum mengonfirmasi, hasilnya kosong dan tidak ada kalimat
 * yang ditampilkan. Tidak ada aturan yang ditebak.
 */

/**
 * Aturan yang menentukan isi satu lusin: ukuran dan warna.
 *
 * Model tidak ikut di sini karena daftar pesanan memisahkan model per baris
 * dengan sendirinya — aturannya tetap tampil di tabel ketentuan beranda.
 */
export function aturanIsiLusin(): string[] {
  const { mixedSizes, mixedColors } = site.wholesalePolicy;
  return [mixedSizes, mixedColors].filter((v): v is string => v !== null && v.trim() !== '');
}

/**
 * Aturan isi lusin sebagai satu kalimat, atau null kalau belum ada.
 * Dipakai di tempat yang cuma punya ruang satu baris.
 */
export function kalimatIsiLusin(): string | null {
  const bagian = aturanIsiLusin();
  return bagian.length > 0 ? `${bagian.join('. ')}.` : null;
}
