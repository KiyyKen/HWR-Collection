import { atom, computed } from 'nanostores';

import { ORDER_EVENT, ORDER_KEY } from './order-storage';

/**
 * Daftar pesanan.
 *
 * Ini draf pesan WhatsApp, bukan keranjang transaksi. Tidak ada akun, tidak
 * ada server, tidak ada stok. Yang disimpan cuma cukup untuk menyusun pesan
 * dan menampilkannya kembali: kode, nama, harga, dan jumlah lusin.
 *
 * Kenapa menyimpan salinan harga dan nama, bukan hanya id: kalau hanya id,
 * setiap halaman harus mengirim seluruh katalog ke klien supaya drawer bisa
 * menampilkan isi pesanan. Salinan ini membuat drawer berdiri sendiri.
 * Risikonya harga bisa basi kalau katalog berubah — tidak berbahaya, karena
 * total akhir memang selalu dikonfirmasi penjual lewat WhatsApp.
 */
export interface OrderLine {
  id: string;
  code: string;
  name: string;
  pricePerDozen: number;
  priceType: 'tetap' | 'mulai';
  /** Jumlah dalam lusin. */
  qty: number;
}

const KEY = ORDER_KEY;

export const MIN_QTY = 1;
export const MAX_QTY = 999;

export const lines = atom<OrderLine[]>([]);

/**
 * Catatan opsional yang ikut dikirim ke WhatsApp.
 *
 * Sengaja tidak ikut disimpan ke localStorage: isinya biasanya menempel pada
 * satu pesanan tertentu ("kirim ke Cipulir minggu ini"), jadi memunculkannya
 * lagi berhari-hari kemudian lebih membingungkan daripada membantu.
 */
export const note = atom('');

/**
 * false sampai localStorage selesai dibaca di browser.
 *
 * Kontrol pesanan tidak dirender sebelum ini true, supaya tidak ada tombol
 * mati saat JavaScript belum jalan atau dimatikan.
 */
export const ready = atom(false);

/**
 * Drawer dikendalikan lewat store, bukan state lokal, supaya tombol di
 * halaman produk bisa membukanya tanpa island tambahan.
 *
 * Elemen pemicunya disimpan di luar store karena fokus harus kembali ke
 * tombol yang sama persis saat drawer ditutup.
 */
export const drawerOpen = atom(false);

let lastTrigger: HTMLElement | null = null;

export function openDrawer(trigger?: HTMLElement | null): void {
  lastTrigger = trigger ?? null;
  drawerOpen.set(true);
}

export function closeDrawer(): void {
  drawerOpen.set(false);
  lastTrigger?.focus();
  lastTrigger = null;
}

export const totalDozen = computed(lines, (l) => l.reduce((s, x) => s + x.qty, 0));
export const totalItems = computed(lines, (l) => l.length);
export const totalPrice = computed(lines, (l) =>
  l.reduce((s, x) => s + x.pricePerDozen * x.qty, 0),
);
/** true kalau ada produk berharga "mulai dari", jadi total hanya perkiraan bawah. */
export const hasFromPrice = computed(lines, (l) => l.some((x) => x.priceType === 'mulai'));

function clampQty(n: unknown): number {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return MIN_QTY;
  return Math.min(MAX_QTY, Math.max(MIN_QTY, v));
}

/** Menolak entri rusak dari localStorage supaya drawer tidak ikut error. */
function isValidLine(v: unknown): v is OrderLine {
  if (!v || typeof v !== 'object') return false;
  const l = v as Record<string, unknown>;
  return (
    typeof l.id === 'string' &&
    l.id.length > 0 &&
    typeof l.code === 'string' &&
    typeof l.name === 'string' &&
    typeof l.pricePerDozen === 'number' &&
    Number.isFinite(l.pricePerDozen) &&
    (l.priceType === 'tetap' || l.priceType === 'mulai') &&
    Number.isFinite(Number(l.qty))
  );
}

let started = false;

/** Dipanggil sekali dari island pertama yang mount. */
export function initOrder(): void {
  if (started || typeof window === 'undefined') return;
  started = true;

  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        lines.set(parsed.filter(isValidLine).map((l) => ({ ...l, qty: clampQty(l.qty) })));
      }
    }
  } catch {
    // localStorage bisa diblokir atau isinya rusak. Daftar kosong bukan error.
  }

  lines.subscribe((value) => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(value));
    } catch {
      // Mode privat bisa menolak penulisan. Pesanan tetap jalan di memori.
    }

    // Memberi tahu tombol daftar pesanan di header, yang sengaja belum
    // dihidrasi selama daftarnya masih kosong — lihat
    // src/directives/pesanan.ts.
    if (value.length > 0) window.dispatchEvent(new Event(ORDER_EVENT));
  });

  ready.set(true);
}

/** Menambah produk, atau menambah jumlah kalau produknya sudah ada. */
export function addLine(line: Omit<OrderLine, 'qty'>, qty = 1): void {
  const q = clampQty(qty);
  const current = lines.get();
  const existing = current.find((l) => l.id === line.id);

  if (existing) {
    setQty(line.id, existing.qty + q);
    return;
  }
  lines.set([...current, { ...line, qty: q }]);
}

export function setQty(id: string, qty: number): void {
  lines.set(lines.get().map((l) => (l.id === id ? { ...l, qty: clampQty(qty) } : l)));
}

export function removeLine(id: string): void {
  lines.set(lines.get().filter((l) => l.id !== id));
}

export function clearOrder(): void {
  lines.set([]);
  note.set('');
}

export function findLine(id: string): OrderLine | undefined {
  return lines.get().find((l) => l.id === id);
}
