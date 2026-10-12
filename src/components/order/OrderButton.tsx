import { useEffect, useState } from 'preact/hooks';
import { useStore } from '@nanostores/preact';

import {
  closeDrawer,
  drawerOpen,
  initOrder,
  lines,
  openDrawer,
  ready,
  totalDozen,
} from '../../lib/order';
import OrderDrawer from './OrderDrawer';

/**
 * Pintu masuk daftar pesanan.
 *
 * Satu island untuk tiga hal yang berbagi state yang sama: tombol di header,
 * bar bawah khusus mobile, dan drawer-nya sendiri. Menjadikannya tiga island
 * berarti tiga kali biaya hidrasi untuk satu daftar yang sama.
 *
 * Tidak ada yang dirender sebelum localStorage selesai dibaca, jadi tanpa
 * JavaScript tidak ada tombol mati yang menggantung di header.
 *
 * Tombol hanya muncul saat daftar berisi. Pesanan kosong tidak butuh pintu
 * masuk, dan munculnya tombol itu sendiri jadi konfirmasi bahwa produk
 * berhasil ditambahkan.
 */
export default function OrderButton() {
  const siap = useStore(ready);
  const items = useStore(lines);
  const lusin = useStore(totalDozen);
  const open = useStore(drawerOpen);

  /**
   * Render pertama di klien harus sama persis dengan hasil server (kosong).
   *
   * Halaman produk punya dua island. Kalau island lain sempat memanggil
   * initOrder() lebih dulu, `ready` sudah true saat island ini baru mulai
   * hidrasi, dan Preact diminta menghidrasi markup yang tidak pernah ada —
   * itu melempar TypeError dan tombol pesanan hilang sama sekali.
   */
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initOrder();
  }, []);

  // Bar bawah menutupi ujung halaman; beri ruang supaya elemen terakhir
  // tetap terlihat penuh saat menerima fokus keyboard (WCAG 2.4.11).
  useEffect(() => {
    const el = document.documentElement;
    if (items.length > 0) el.setAttribute('data-order-bar', '');
    else el.removeAttribute('data-order-bar');
    return () => el.removeAttribute('data-order-bar');
  }, [items.length]);

  const drawer = open ? <OrderDrawer onClose={closeDrawer} /> : null;

  if (!mounted || !siap || items.length === 0) return drawer;

  return (
    <>
      {/*
        Hanya dari tablet ke atas. Di mobile, bar bawah sudah jadi pintu masuk
        yang lebih mudah dijangkau, dan tombol kedua di header memepetkan
        wordmark dengan tombol menu di baris selebar 390px.

        Gelap, bukan outline: tombol ini baru ada kalau daftarnya berisi, dan
        saat itu langkah berikutnya yang benar adalah membuka daftar — bukan
        memulai chat kosong lewat tombol WhatsApp di sebelahnya.
      */}
      <button
        type="button"
        data-buka-pesanan
        onClick={(e) => openDrawer(e.currentTarget as HTMLElement)}
        class="t-tombol hidden min-h-11 items-center gap-2 rounded-kontrol bg-tinta px-4 text-kertas transition-colors duration-(--durasi-state) hover:bg-denim md:inline-flex"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7">
          <path d="M4 6h16M4 12h16M4 18h10" stroke-linecap="round" />
        </svg>
        <span aria-hidden="true">Pesanan</span>
        <span class="t-harga rounded-kontrol bg-kertas px-1.5 text-tinta" aria-hidden="true">
          {items.length}
        </span>
        <span class="sr-only">
          Buka daftar pesanan: {items.length} produk, {lusin} lusin
        </span>
      </button>

      {/* Bar bawah khusus mobile: header tidak sticky, jadi tanpa ini daftar
          pesanan hilang dari jangkauan begitu pengunjung menggulir. */}
      <div class="fixed inset-x-0 bottom-0 z-40 border-t border-garis bg-kertas md:hidden">
        <button
          type="button"
          data-buka-pesanan
          onClick={(e) => openDrawer(e.currentTarget as HTMLElement)}
          aria-label={`Lihat pesanan: ${items.length} produk, ${lusin} lusin`}
          class="flex min-h-14 w-full items-center justify-between gap-4 px-5 text-left"
        >
          <span class="t-meta text-redup">
            <span class="t-produk block text-tinta">{items.length} produk</span>
            {lusin} lusin
          </span>
          <span class="t-tombol inline-flex min-h-11 items-center rounded-kontrol bg-tinta px-5 text-kertas">
            Lihat pesanan
          </span>
        </button>
      </div>

      {drawer}
    </>
  );
}
