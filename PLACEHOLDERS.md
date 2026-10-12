# Data yang masih dibutuhkan

Setiap item di bawah ini diisi placeholder bertanda di dalam kode. **Tidak ada satu pun yang dikarang.**

Semua nilai non-produk tinggal di `src/config/site.ts`. Data produk tinggal di `src/content/products.json` — skemanya dijelaskan di [docs/DATA.md](docs/DATA.md).

Jalankan `npm run validate` kapan saja untuk melihat apa yang masih kosong.

---

## Ringkasan

| Kelompok | Isi | Jumlah |
|---|---|---|
| **A** | Sudah terisi, tidak menunggu siapa pun | 16 |
| **B** | Menunggu data dari pemilik HWR | 8 |
| **C** | Tidak diperlukan untuk peluncuran | 7 |

**Tidak ada lagi pemblokir mutlak.** Nomor WhatsApp masuk 12 Oktober 2026 dan seluruh alur pemesanan hidup. Yang tersisa menentukan alamat situsnya (B17) dan membuat tampilannya lebih matang, bukan menentukan bisa terbit atau tidak.

---

## A. Sudah terisi — tidak perlu menunggu siapa pun

Ini keputusan teknis atau isi yang bisa ditentukan dari brief, bukan informasi bisnis. Semuanya sudah jalan; sebagian sementara dan akan diganti aset asli nanti.

| # | Hal | Keadaan sekarang |
|---|---|---|
| A1 | Nama, tagline, dan deskripsi situs | Terisi di `site.ts`. Tidak ada kepanjangan atau cerita brand untuk HWR — HWR tetap inisial keluarga. |
| A2 | Enam kategori produk | `src/data/categories.ts`, lengkap dengan blurb per kategori |
| A3 | Wordmark sementara | `Wordmark.astro`, berbasis Archivo. Tinggal diarahkan ke file logo asli. |
| A4 | Favicon & gambar Open Graph sementara | `public/favicon.svg`, `public/favicon.ico`, `public/og-default.png` |
| A5 | 24 foto produk sementara | Siluet buatan dengan latar, cahaya, dan framing identik. Satu perintah untuk regenerasi. |
| A6 | Minimum pemesanan & satuan | 1 lusin, 12 pcs — dari brief |
| A7 | Jangkauan kirim | Seluruh Indonesia — dari brief |
| A8 | Ongkos kirim & pembayaran | "Dihitung saat konfirmasi pesanan" dan "Dikonfirmasi lewat WhatsApp". Ini cara kerja situsnya, bukan klaim: situs memang tidak punya checkout. Bisa diganti lewat `site.orderFlow`. |
| A9 | robots.txt, sitemap, canonical, Open Graph, BreadcrumbList | Dibangkitkan otomatis, ikut domain di `site.url` |

### Diberikan pemilik 23 September 2026

Empat baris berikut sebelumnya ada di kelompok B. Nomor lamanya dipertahankan supaya catatan fase sebelumnya tetap bisa dirujuk.

| # | Hal | Nilai yang dipakai sekarang |
|---|---|---|
| A10 (dulu B4, B5) | Alamat toko | Jalan Ciledug Raya · Cipulir · Kebayoran Lama · Jakarta Selatan · DKI Jakarta 12230 |
| A11 (dulu B8) | Jam buka | Setiap hari 08.00–17.00 (`Mo-Su 08:00-17:00` di JSON-LD) |
| A12 (dulu B11, B12, C3) | Aturan isi satu lusin | Satu lusin satu ukuran · warna boleh dicampur · satu lusin satu model |
| A13 (dulu B13) | Ekspedisi | Bebas pilih ekspedisi, dikonfirmasi lewat WhatsApp. Tidak ada nama ekspedisi yang ditulis. |

### Diberikan pemilik 12 Oktober 2026

| # | Hal | Nilai yang dipakai sekarang |
|---|---|---|
| A14 (dulu B1) | Nomor WhatsApp | `081314801091`, disimpan sebagai `6281314801091` karena itu bentuk yang diterima wa.me. Footer menampilkannya sebagai `0813-1480-1091`. |
| A15 (dulu B6) | Tautan Google Maps | Menunjuk Pasar Cipulir, tempat kios HWR berada |
| A16 (dulu B9) | Logo | Dipotong dari spanduk toko jadi `public/logo-hwr.webp`, latar putihnya transparan |

Dengan A14 masuk, seluruh alur pemesanan hidup: tombol pesan aktif di semua halaman, dan pesan WhatsApp terbentuk lengkap dengan kode produk serta jumlah lusinnya.

**Nomor bangunan dan RT/RW belum diberikan**, jadi baris jalan berhenti di "Jalan Ciledug Raya". Tidak ditambah nomor tebakan. Kalau nomornya ada, isi `store.addressLine` — tidak ada file lain yang perlu disentuh.

Aturan isi lusin (A12) muncul di tiga tempat sekaligus dari satu sumber, lewat `src/lib/wholesale.ts`: tabel ketentuan di beranda, halaman produk di atas kontrol jumlah, dan daftar pesanan sebelum pesan dikirim.

---

## B. Menunggu data dari pemilik HWR

**Tidak ada nilai yang boleh ditebak untuk bagian ini.**

### Produk

| # | Data | Catatan |
|---|---|---|
| B2 | Daftar produk asli | Per produk: kode artikel, nama, kategori, harga per lusin, harga tetap atau "mulai dari", rentang ukuran, pilihan warna, bahan, deskripsi 1–2 kalimat |
| B3 | Foto produk asli | 4:5 portrait, latar polos, minimal 1400px sisi pendek, satu file per produk, nama file = id produk |

Sejak 24 September 2026 produk dikelola dari **Sanity Studio** (`npm run cms`), bukan lagi dari file. Menambah, mengubah harga, dan mengunggah foto dilakukan di sana; `products.json` tinggal cadangan.

Sekarang katalog berisi **24 produk contoh** — nama, harga, ukuran, dan warnanya karangan dan ditandai `"dummy": true` di datanya. Selama tanda itu ada: pita "Versi pengembangan" tampil di atas setiap halaman, dan halaman produk **tidak** memancarkan structured data Product ke mesin pencari. Keduanya mati sendiri saat `dummy` jadi `false`.

Langkah penggantiannya ada di [docs/DATA.md → Checklist mengganti 24 produk contoh](docs/DATA.md#checklist-mengganti-24-produk-contoh).

### Toko

| # | Data | Dipakai di |
|---|---|---|
| B7 | Kode sematan peta, hasil "Sematkan peta" di Google Maps | Peta di bagian lokasi, sekarang masih kotak bergaris putus |

Koordinat tidak akan pernah ditebak. Tombol "Buka di Google Maps" dan "Petunjuk arah ke toko" sudah aktif: yang pertama memakai tautan yang kamu beri, yang kedua dirakit dari alamatnya.

### Merek

| # | Data | Catatan |
|---|---|---|
| B10 | Favicon dan logo versi kotak | Favicon serta gambar Open Graph masih memakai aset sementara. Logo yang ada sekarang berbentuk strip lebar 4,7:1, terlalu panjang untuk kotak 1:1. Monogram HWR dalam lingkaran saja sudah cukup, kalau ada filenya terpisah. |

### CMS & hosting

Dibutuhkan sejak Fase 7A, saat panel admin disiapkan.

| # | Data | Catatan |
|---|---|---|
| ~~B14~~ | ~~Project ID Sanity~~ | **Selesai 24 September 2026.** Project `1ybl4qg4`, dataset `production`, berisi 24 produk hasil migrasi. Saklar di `src/config/cms.ts` sudah menyala — situs membaca produk dari Sanity. Panel admin: `npm run cms` → localhost:3333. |
| B15 | Secret webhook Sanity | Dibuat saat membuat webhook. Dipakai memverifikasi bahwa permintaan rebuild memang dari Sanity. Disimpan di environment, bukan di repositori. |
| B16 | URL deploy hook penyedia hosting | Baru ada setelah hosting dipilih. Lihat `docs/CMS.md`. |

### Domain

| # | Data | Dipakai di |
|---|---|---|
| B17 | Nama domain final | Canonical URL, sitemap, robots.txt, Open Graph |

Sekarang memakai `hwrcollection.example`. Situs tetap bisa dibangun dan diuji dengan ini; yang tidak bisa adalah dipublikasikan.

---

## C. Tidak diperlukan untuk peluncuran

Situs berjalan penuh tanpa semua ini. Kalau datanya ada, barisnya muncul sendiri; kalau tidak, tidak ada bekas ruang kosong.

| # | Hal | Kalau tidak diberikan |
|---|---|---|
| C1 | Nomor telepon & email toko | Baris kontak itu tidak dibuat |
| C2 | Instagram, TikTok, Shopee, Tokopedia | Instagram tampil sebagai "menunggu data"; sisanya tidak ditampilkan |
| C4 | Harga khusus kodi / karton | Baris itu tidak muncul |
| C5 | Melayani eceran satuan? | Baris itu tidak muncul |
| C6 | Perkiraan waktu proses pesanan | Baris itu tidak muncul |
| C7 | Syarat atau harga khusus reseller | Baris itu tidak muncul |
| C8 | Foto tambahan per produk (tampak belakang, detail bahan) | Halaman produk menampilkan satu foto. Galeri dibuat hanya kalau memang ada sudut lain — tidak dipalsukan dari gambar yang sama. |

---

## Yang sengaja tidak akan pernah ditulis tanpa data

Brief §21. Tidak ada satu pun dari berikut ini yang muncul di situs, dan tidak akan muncul sampai kamu memberikan datanya:

- Lama berdiri atau tahun pengalaman
- Jumlah pelanggan atau reseller
- Testimoni
- Sertifikasi, penghargaan, atau logo partner
- Ukuran gudang atau kapasitas produksi
- Nama ekspedisi
- Rating, ulasan, atau status ketersediaan produk
- Angka statistik apa pun

---

## Daftar isian untuk pemilik HWR

Salin, isi yang sudah ada, kirim balik. Yang belum ada jawabannya biarkan kosong — kosong lebih baik daripada ditebak.

```
1.  Nama domain yang akan dipakai    :
2.  Daftar produk + harga per lusin  :
3.  Foto produk (4:5, min 1400px)    :
4.  Kode sematan peta Google Maps    :
5.  Logo versi kotak untuk favicon   :
6.  Detail kios: lantai, blok, nomor :
```

Sudah terjawab dan tidak perlu dikirim lagi: nomor WhatsApp, tautan Google Maps, logo, alamat, jam buka, aturan isi satu lusin, ekspedisi, pembayaran, dan project Sanity.
