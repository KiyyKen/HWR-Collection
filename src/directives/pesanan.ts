import type { ClientDirective } from 'astro';

import { ORDER_EVENT, ORDER_KEY } from '../lib/order-storage';

/**
 * Direktif hidrasi `client:pesanan`.
 *
 * Tombol daftar pesanan di header tidak menampilkan apa pun selama daftarnya
 * kosong — dan bagi pengunjung baru, daftarnya SELALU kosong. Dengan
 * `client:idle`, setiap halaman tetap mengunduh dan menjalankan ±13 KB
 * Preact untuk merender nol elemen.
 *
 * Direktif ini menunda hidrasi sampai memang ada isinya:
 *
 *   1. Sudah ada pesanan tersimpan → hidrasi langsung saat idle.
 *   2. Belum ada → tunggu sampai produk pertama masuk daftar. Island
 *      pemesanan di halaman produk menyiarkan `ORDER_EVENT` begitu daftarnya
 *      terisi, dan tab lain menyiarkannya lewat event `storage`.
 *
 * Hasilnya beranda, katalog, dan 404 tidak mengirim framework sama sekali
 * pada kunjungan pertama, tanpa kehilangan satu pun perilaku.
 */
const pesanan: ClientDirective = (load) => {
  let sudah = false;

  const hidrasi = async () => {
    if (sudah) return;
    sudah = true;
    const hydrate = await load();
    await hydrate();
  };

  const adaIsi = (): boolean => {
    try {
      const raw = window.localStorage.getItem(ORDER_KEY);
      return !!raw && raw !== '[]' && raw !== 'null';
    } catch {
      // localStorage diblokir: tidak ada pesanan tersimpan yang bisa dibaca,
      // jadi tunggu saja sampai ada yang ditambahkan di sesi ini.
      return false;
    }
  };

  const mulai = () => {
    if (adaIsi()) {
      hidrasi();
      return;
    }
    window.addEventListener(ORDER_EVENT, hidrasi, { once: true });
    window.addEventListener('storage', (e) => {
      if (e.key === ORDER_KEY && adaIsi()) hidrasi();
    });
  };

  if ('requestIdleCallback' in window) window.requestIdleCallback(mulai, { timeout: 2000 });
  else setTimeout(mulai, 200);
};

export default pesanan;
