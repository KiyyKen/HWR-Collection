# HWR Collection

Website resmi HWR Collection — grosir celana anak & dewasa. Brand website + katalog produk + antarmuka pemesanan lewat WhatsApp.

Status: **selesai dan terverifikasi sampai audit pra-peluncuran** (Fase 1–7C). Yang menahan peluncuran tinggal data dari pemilik, bukan kodenya — daftarnya di [docs/PELUNCURAN.md](docs/PELUNCURAN.md).

Produk dikelola dari **Sanity Studio**; katalog berisi 24 produk contoh yang semuanya ditandai `dummy: true`. Alamat toko, jam buka, dan aturan grosir sudah data asli. Nomor WhatsApp dan domain masih placeholder — lihat [PLACEHOLDERS.md](PLACEHOLDERS.md). Selama nomor WhatsApp belum diisi, tombol pesan nonaktif dan **tidak ada tautan wa.me yang dibuat sama sekali**.

Beberapa hal yang membentuk proyek ini:

- **0 KB JavaScript eksternal** di beranda, katalog, dan 404 — direktif hidrasi sendiri (`client:pesanan`) menahan island daftar pesanan sampai benar-benar ada isinya.
- **Satu skema, dua sumber.** Produk boleh datang dari Sanity atau dari `products.json`; skema Zod yang sama memvalidasi keduanya, dan data dari CMS tidak lebih dipercaya daripada data dari file.
- **Tidak ada yang dikarang.** Setiap informasi bisnis yang belum diberikan pemilik tampil sebagai penanda "menunggu data", bukan diisi tebakan — termasuk alamat, jam buka, dan ekspedisi.
- **Verifikasi tidak menunggu kredensial.** Jalur Sanity, webhook rebuild, tautan `wa.me`, dan keadaan "semua placeholder terisi" semuanya diuji lawan stub lokal atau tambalan sementara yang dipulihkan — jalur penting tidak boleh pertama kali dicoba justru saat data asli masuk.

## Tampilan

| Beranda | Katalog |
|---|---|
| [![Beranda](docs/img/beranda.webp)](docs/img/beranda.webp) | [![Katalog](docs/img/katalog.webp)](docs/img/katalog.webp) |

| Halaman produk | Daftar pesanan (mobile) |
|---|---|
| [![Halaman produk](docs/img/produk.webp)](docs/img/produk.webp) | <img src="docs/img/pesanan-mobile.webp" width="260" alt="Drawer daftar pesanan di mobile"> |

Pita kuning di atas setiap halaman adalah penanda versi pengembangan: ia menghitung sendiri berapa produk yang masih data contoh, dan hilang begitu tidak ada lagi yang ditandai `dummy`.

## Menjalankan

```bash
npm install
npx astro dev --background  # http://localhost:4321
```

Kelola dev server: `npx astro dev status`, `npx astro dev logs`, `npx astro dev stop`.

Produk ditarik dari dataset Sanity yang dibaca publik, jadi hasil clone langsung jalan tanpa kredensial apa pun — tidak ada token yang perlu dibuat, dan tidak ada `.env` yang perlu diisi untuk menjalankan situsnya.

> Dataset-nya memang dibuka untuk dibaca siapa saja; itu yang membuat build tidak perlu menyimpan token. Yang terbaca cuma 24 produk contoh. **Menulis** ke dataset tetap butuh login Sanity.

Untuk membuka panel adminnya sendiri:

```bash
cp sanity/.env.example sanity/.env   # isi SANITY_STUDIO_PROJECT_ID
npm run cms                          # http://localhost:3333
```

`npm run gen:photos` hanya dipakai untuk membuat ulang foto contoh di `src/assets/products/` — jalur cadangan `products.json`, bukan yang dipakai situs sekarang.

## Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Dev server (foreground) |
| `npm run validate` | Periksa data produk & konfigurasi |
| `npm run build` | Build statis ke `dist/` (menjalankan `validate` lebih dulu) |
| `npm run preview` | Lihat hasil build |
| `npm run gen:photos` | Regenerasi foto produk sementara dari `products.json` |
| `npm run shoot [rute...]` | Screenshot 390/768/1440 + audit overflow, heading, alt, console |
| `npm run a11y [rute...]` | Uji keyboard, skip link, landmark, target sentuh, dan kontras hasil render |
| `npm run perf [rute...]` | LCP, CLS, byte per jenis, tugas panjang — mobile ter-throttle & desktop |
| `npm run journey` | Potret alur pesan: tambah produk → bar bawah → drawer |
| `npm run cms` | Jalankan Sanity Studio (panel admin) di localhost:3333 |
| `npm run cms:hook` | Penerima webhook rebuild, dengan verifikasi tanda tangan |
| `npm run cms:export` | Siapkan products.json jadi NDJSON + foto untuk diimpor ke Sanity |
| `npm run test:cms` | Uji jalur Sanity → Astro lawan stub API lokal |
| `npm run test:hook` | Uji verifikasi tanda tangan webhook |
| `npm run test:migrasi` | Gladi bersih migrasi: 24 produk menyeberang ke CMS lalu dibandingkan |
| `npm run test:katalog` | Uji filter, cari, urut, URL state, empty state, dan lapisan tanpa-JS |
| `npm run test:pesanan` | Uji 24 rute produk, 404, drawer, keyboard, penyimpanan |
| `npm run test:data` | Gladi bersih data asli: isi semua placeholder sementara, build, periksa, pulihkan |
| `npm run test:whatsapp` | Uji jalur wa.me dengan nomor uji sementara (build + preview, lalu dipulihkan) |
| `node scripts/inspect.mjs <mobile\|tablet\|desktop> [rute]` | Potongan seukuran layar untuk periksa detail |
| `npx astro check` | Type check |

Rute ditulis tanpa garis miring depan — `npm run shoot katalog katalog/jeans` — karena Git Bash di Windows menerjemahkan argumen berawalan `/` jadi path Windows.

Hasil screenshot masuk ke `.shots/` (tidak ikut git).

## Struktur

```
src/
  config/site.ts          nomor WhatsApp, toko, merek, kebijakan — SEMUA placeholder
  config/cms.ts           project Sanity — saklar sumber data produk
  content/products.json   24 produk dummy — cadangan sejak produk pindah ke Sanity
  content.config.ts       skema Zod untuk produk
  data/categories.ts      6 kategori
  lib/                    format harga, pesan WhatsApp, query produk, alamat toko, URL kanonik, jembatan CMS
  pages/robots.txt.ts     robots.txt, domainnya ikut site.url
  styles/tokens.css       SATU-SATUNYA tempat warna & tipografi didefinisikan
  styles/global.css       font, base, sistem tipografi, utilitas layout
  components/             komponen dipakai lintas halaman
  components/home/        seksi khusus beranda
  components/catalog/     filter kategori + tampilan katalog
  components/order/       island daftar pesanan (Preact + nanostores)
  components/product/     tabel spesifikasi produk
  assets/products/        foto produk (placeholder, ganti dengan yang asli)
scripts/                  generator foto, pemeriksa data, verifikasi visual, uji aksesibilitas
sanity/                   Sanity Studio — panel admin, package.json sendiri
docs/                     keputusan, design system, wireframe, rencana, CMS
```

## Mengganti data contoh dengan data asli

Selengkapnya — field per field, beserta apa yang berubah saat diisi — ada di **[docs/DATA.md](docs/DATA.md)**. Ringkasnya:

**Nomor WhatsApp** — satu-satunya yang memblokir peluncuran.
`src/config/site.ts` → `whatsappNumber`. Format `6281234567890` (tanpa `+`, tanpa `0` di depan). Ini satu-satunya tempat nomor ditulis di seluruh proyek; semua tombol membacanya dari sini. Selama masih placeholder, tidak ada tautan `wa.me` yang dibuat dan tombolnya menjelaskan kenapa.

**Informasi toko** — `src/config/site.ts` → `store`. Alamat, Google Maps, jam buka, telepon, email. Tidak ada satu pun yang dikarang; yang kosong tampil sebagai penanda, dan tombol petunjuk arah baru dibuat setelah ada alamat sungguhan.

**Kebijakan grosir** — `src/config/site.ts` → `wholesalePolicy`. Pertanyaan yang muncul di hampir tiap chat reseller: boleh campur ukuran? campur warna? ekspedisi apa? Yang masih `null` tampil sebagai "menunggu konfirmasi pemilik", bukan ditebak. Baris opsional (harga kodi, eceran, waktu proses, syarat reseller) baru muncul setelah diisi.

**Produk** — `src/content/products.json`. Ganti isinya, lalu set `"dummy": false` per produk. Boleh bertahap. Pita peringatan kuning di atas halaman menghitung sendiri sisanya dan hilang saat semua produk sudah `dummy: false` dan nomor WhatsApp terisi.

**Foto produk** — taruh di `src/assets/products/<id>.jpg` (atau `.webp`), rasio 4:5, minimal 1400px sisi pendek, lalu **hapus field `shape`** produk itu dari `products.json`. Produk tanpa `shape` dilewati generator, jadi foto asli tidak akan pernah tertimpa. Tidak ada kode komponen yang perlu diubah.

**Logo** — taruh file di `public/`, lalu isi `brand.logo` di `src/config/site.ts` (contoh `"/logo-hwr.svg"`). `Wordmark.astro` langsung memakainya di header dan footer, dengan tinggi baris yang sama supaya tata letak tidak bergeser.

**Favicon** — ganti `public/favicon.svg` dan `public/favicon.ico`. Jalurnya diatur di `brand.favicon`.

**Gambar Open Graph** — taruh gambar 1200×630 di `public/` dengan **nama baru**, lalu arahkan `brand.ogImage` ke situ. Jangan menimpa `og-default.png` — file itu ditulis ulang tiap kali `npm run gen:photos` dijalankan.

**Warna brand** — `src/styles/tokens.css`. Satu blok `@theme`. Tidak ada hex yang ditulis langsung di komponen.

**Domain** — `src/config/site.ts` → `url`. Canonical, sitemap, robots.txt, dan Open Graph ikut serentak.

Setelah mengganti apa pun: `npm run validate`.

## Dokumentasi

- [docs/DECISIONS.md](docs/DECISIONS.md) — kenapa Astro, kenapa skill ini, bagaimana konflik skill diselesaikan
- [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) — warna (beserta rasio kontrasnya), tipografi, spacing, grid, gambar, motion
- [docs/WIREFRAMES.md](docs/WIREFRAMES.md) — information architecture + perubahan hasil verifikasi visual
- [docs/DATA.md](docs/DATA.md) — skema produk, arti tiap field, cara data asli menggantikan data contoh
- [docs/CMS.md](docs/CMS.md) — Sanity Studio, webhook rebuild, rencana migrasi data
- [docs/PELUNCURAN.md](docs/PELUNCURAN.md) — checklist sebelum situs boleh dipublikasikan
- [docs/PLAN.md](docs/PLAN.md) — fase implementasi
- [CLAUDE.md](CLAUDE.md) — aturan kerja di repo ini
