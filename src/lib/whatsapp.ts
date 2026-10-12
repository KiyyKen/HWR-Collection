import { site, isPlaceholder } from '../config/site';
import { formatRupiah } from './format';

export interface OrderLine {
  code: string;
  name: string;
  /** Jumlah dalam lusin. */
  qty: number;
  pricePerDozen: number;
  priceType: 'tetap' | 'mulai';
}

/** true kalau nomor WhatsApp asli sudah diisi di src/config/site.ts. */
export function hasWhatsappNumber(): boolean {
  return !isPlaceholder(site.whatsappNumber);
}

/**
 * Tautan wa.me dengan pesan terisi.
 * Mengembalikan null selama nomor masih placeholder — situs tidak boleh
 * mengarang nomor, dan tombol akan menampilkan penjelasan sebagai gantinya.
 */
export function whatsappLink(message: string): string | null {
  if (!hasWhatsappNumber()) return null;
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Nomor WhatsApp dalam bentuk yang dibaca orang, misalnya `0813-1480-1091`.
 *
 * Yang disimpan di konfigurasi adalah bentuk internasional tanpa `+`, karena
 * itu yang diterima wa.me. Menampilkannya apa adanya membuat nomor toko
 * terbaca seperti isi database, dan pembeli Indonesia mengenali nomornya
 * lewat awalan `0`, bukan `62`.
 *
 * Mengembalikan null selama nomornya belum diisi.
 */
export function whatsappDisplay(): string | null {
  if (!hasWhatsappNumber()) return null;

  const nomor = site.whatsappNumber;
  // 62 di depan adalah kode Indonesia; bentuk lokalnya memakai 0.
  const lokal = nomor.startsWith('62') ? `0${nomor.slice(2)}` : nomor;

  // Kelompok 4-4-sisa, pola yang dipakai operator seluler Indonesia.
  const m = /^(\d{4})(\d{4})(\d+)$/.exec(lokal);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : lokal;
}

/** Sapaan pembuka tanpa daftar produk, untuk tombol kontak umum. */
export function generalMessage(): string {
  return `Halo ${site.name}, saya ingin bertanya soal produk dan pemesanan grosir.\n\nTerima kasih.`;
}

/** Pesan untuk satu produk, dari halaman detail. */
export function singleProductMessage(line: OrderLine): string {
  return buildOrderMessage([line]);
}

/**
 * Pesan pesanan terstruktur.
 *
 * Estimasi total ikut disertakan karena harga memang ditampilkan di situs;
 * menyembunyikannya justru membuat percakapan mulai dari nol. Kalimat
 * penutup tetap meminta konfirmasi supaya jelas angka final datang dari
 * penjual, bukan dari website.
 */
export function buildOrderMessage(lines: readonly OrderLine[], note?: string): string {
  const daftar = lines
    .map((l, i) => `${i + 1}. ${l.name} ${l.code} — ${l.qty} lusin`)
    .join('\n');

  const adaHargaMulai = lines.some((l) => l.priceType === 'mulai');
  const total = lines.reduce((sum, l) => sum + l.pricePerDozen * l.qty, 0);
  const labelTotal = adaHargaMulai
    ? `Estimasi total: mulai dari ${formatRupiah(total)}`
    : `Estimasi total: ${formatRupiah(total)}`;

  const bagian = [
    `Halo ${site.name}, saya ingin memesan:`,
    daftar,
    labelTotal,
    note?.trim() ? `Catatan: ${note.trim()}` : null,
    'Mohon info ketersediaan dan total pesanannya.',
    'Terima kasih.',
  ].filter(Boolean);

  return bagian.join('\n\n');
}
