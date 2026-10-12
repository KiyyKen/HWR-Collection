# Rencana Implementasi — HWR Collection

Status: Fase 0–6, 7A, 7B, dan 7C selesai. Situs siap menerima data asli; yang menahan peluncuran tinggal data dari pemilik — lihat [PELUNCURAN.md](PELUNCURAN.md).

---

## Fase 0 — Riset & keputusan ✔ selesai

- Skill di-riset, dipasang, dan dipangkas → `docs/DECISIONS.md`
- Stack dipilih dan diverifikasi versinya → `docs/DECISIONS.md`
- Arah visual + design system → `docs/DESIGN-SYSTEM.md`
- Information architecture + wireframe → `docs/WIREFRAMES.md`
- Daftar data yang masih kosong → `PLACEHOLDERS.md`

---

## Fase 1 — Fondasi ✔ selesai

Scaffold Astro, token, font, data model, dan gambar sementara. Belum ada halaman jadi.

- `npm create astro@latest` → TypeScript strict, output statis
- Pasang: `@tailwindcss/vite`, `@astrojs/preact`, `@astrojs/sitemap`, `preact`, `nanostores`, `@nanostores/preact`, `@fontsource-variable/archivo`
- `src/styles/tokens.css` — seluruh token dari `DESIGN-SYSTEM.md` dalam satu blok `@theme`
- `src/config/site.ts` — nomor WhatsApp, alamat, jam buka, semuanya placeholder bertanda
- `src/content.config.ts` — skema Zod untuk koleksi produk
- `src/content/products.json` — 24 produk dummy: 6 jeans, 4 training, 4 cargo, 4 kolor, 4 hawai, 2 lainnya
- `scripts/gen-placeholder-photos.mjs` — generator foto sementara (SVG → sharp → WebP 1400×1750)
- `src/components/Wordmark.astro` — wordmark sementara

**Selesai kalau:** `npm run dev` jalan, token terpakai, 24 produk punya gambar dengan latar dan framing identik.

## Fase 2 — Beranda ✔ selesai

Bangun dan validasi beranda lebih dulu, sendirian.

- Header + navigasi mobile, strip fakta, hero
- Kategori, grid produk pilihan (line sheet)
- Band indigo proposisi grosir (tabel spec), cara pesan, pengiriman, lokasi, CTA, footer
- **Verifikasi visual:** build → jalankan → screenshot 390 / 768 / 1440 → periksa → perbaiki → ulangi

**Selesai kalau:** tidak ada overflow horizontal di 360px, hierarki terbaca, tidak ada masalah yang tersisa dari daftar periksa brief §18.

## Fase 3 — Katalog & filter ✔ selesai

- `/katalog` dan `/katalog/[kategori]` — 7 halaman statis, semuanya di sitemap
- Filter kategori berupa **link ke halaman statis**, bukan island: bisa dibagikan, di-index, dan bekerja tanpa JavaScript
- Cari + urutkan lewat **script vanilla**, bukan island Preact — lihat perubahan di bawah
- State cari/urut di query string, dipulihkan saat kembali ke halaman
- Empty state dengan jalan keluar
- **Verifikasi visual** di tiga viewport + `npm run test:katalog`

### Perubahan dari rencana

**Island Preact diganti script vanilla.** Filter ini memanipulasi daftar yang sudah dirender server; framework tidak memberi apa pun selain ±14 KB tambahan. Hasilnya halaman katalog mengirim **2,2 KB JavaScript inline dan nol file JS eksternal** — chunk Preact ada di `dist/` tapi tidak dirujuk halaman mana pun. Preact tetap terpasang untuk daftar pesanan di Fase 4, tempat state lintas komponen memang dibutuhkan.

**Aksi "Tambah" langsung dari grid ditunda ke Fase 4.** Aksi itu butuh store daftar pesanan yang belum ada. Untuk Fase 3, CTA tiap sel adalah baris "Detail & pesan" yang mengarah ke halaman detail.

## Fase 4 — Detail produk & alur WhatsApp ✔ selesai

- `/produk/[id]` untuk 24 produk, plus `404.astro`
- Store `nanostores` untuk daftar pesanan + persist `localStorage` (dengan validasi isi)
- Drawer: focus trap, Escape, fokus kembali, kunci gulir, empty state
- Bar pesanan bawah khusus mobile, muncul hanya saat daftar berisi
- Generator pesan WhatsApp + deep link `wa.me`
- SEO per produk: title, description, canonical, Open Graph, BreadcrumbList

### Perubahan dari rencana

**Halaman `/pesanan` dibatalkan.** Rencananya jadi cadangan tanpa JavaScript, tapi tanpa JavaScript `localStorage` tidak terbaca sama sekali — halaman itu hanya menduplikasi drawer. Cadangan yang benar adalah tautan WhatsApp langsung untuk satu produk di `<noscript>`.

**Product schema ditahan selama data dummy.** Menyiarkan nama dan harga contoh sebagai structured data berarti mengundang mesin pencari menampilkan harga karangan. BreadcrumbList tetap dipancarkan karena itu struktur, bukan klaim produk. Skema aktif sendiri begitu `dummy` jadi `false`.

**Uji `wa.me` dilakukan lewat tambalan sementara.** Nomor asli belum ada, jadi `npm run test:whatsapp` menambal `src/config/site.ts` dengan nomor uji, build, preview, uji, lalu memulihkan file dan membangun ulang. Tidak ada nomor karangan yang tersisa di repositori.

### Yang masih perlu diuji di perangkat sungguhan

Tautan `wa.me` sudah diverifikasi bentuk dan isi pesannya di browser, tapi belum pernah benar-benar membuka aplikasi WhatsApp. Lakukan sekali di HP setelah nomor asli diisi.

## Fase 5 — Data & konten bisnis ✔ selesai

Menyiapkan situs supaya siap menerima data asli HWR Collection, tanpa mengarang apa pun yang belum diberikan.

- Audit `PLACEHOLDERS.md` → dikelompokkan jadi **A** (sudah terisi), **B** (menunggu pemilik), **C** (tidak perlu untuk peluncuran), plus daftar isian siap kirim
- `src/config/site.ts` ditata ulang: blok `brand` (logo, favicon, Open Graph, warna bar), jam buka terstruktur, kebijakan grosir yang kurang (campur model, waktu proses, reseller, pembayaran)
- `src/lib/location.ts` — satu tempat alamat dirangkai jadi teks, tautan peta, dan tautan petunjuk arah; semuanya null-safe
- `Wordmark.astro` menerima logo asli lewat konfigurasi, tanpa mengubah tata letak
- `src/pages/robots.txt.ts` — dibangkitkan supaya domainnya tidak pernah tertinggal salah
- Favicon dipasang di `<head>` (sebelumnya hanya mengandalkan `/favicon.ico`)
- JSON-LD `Store` kini ikut memancarkan alamat, jam buka, telepon, dan email — **begitu datanya ada**, tidak sebelumnya
- `shape` jadi opsional di skema produk; generator melewati produk tanpa `shape`
- `scripts/validate-data.mjs` + `npm run validate`, jalan otomatis sebelum `npm run build`
- `docs/DATA.md` — skema produk field per field dan prosedur penggantian data

### Perubahan dari rencana

**Prosedur penggantian foto ternyata rusak.** `src/assets/products/README.md` menyuruh menghapus field `shape` saat foto asli masuk, padahal skema Zod mewajibkannya — mengikuti petunjuk itu menggagalkan build. Sekarang `shape` opsional dan generator melewati produk yang tidak punya, jadi foto asli tidak akan pernah tertimpa.

**Empat foto placeholder ternyata identik byte per byte.** Generator hanya membaca `shape` dan warna pertama, sehingga "Kolor Anak Katun", "Kolor Dewasa Katun", "Kolor Dewasa Motif", dan "Celana Pendek Anak Katun" menghasilkan gambar yang sama persis — katalog terlihat seperti mengulang produk yang sama. Pembedanya sekarang diambil dari data yang memang ada: kelas ukuran (anak digambar lebih kecil), motif, tali serut, list samping, sobekan lutut, dan siluet cutbray tersendiri. Ke-24 foto kini berbeda satu sama lain.

**`wholesalePolicy.payment` tidak pernah terpakai.** Beranda menulis "Dikonfirmasi lewat WhatsApp" langsung di komponen, jadi mengisi field itu tidak mengubah apa pun. Sekarang kalimat prosedural pindah ke `site.orderFlow` dan kebijakan pemilik menimpanya saat diisi.

**Gambar Open Graph per produk tidak dibuat.** Foto produk masih placeholder dan rasionya 4:5, bukan 1200×630. Mengirim gambar contoh sebagai pratinjau tautan di WhatsApp sama saja menyebarkan data dummy ke luar situs. Gambar OG tetap satu untuk semua halaman, tapi jalurnya kini bisa diganti lewat `brand.ogImage`.

## Fase 6 — SEO, konversi & polish UX ✔ selesai

Tidak ada halaman baru. Fase ini mengaudit yang sudah ada dan memperbaiki apa yang ternyata salah.

**Performa & JavaScript**

- `npm run perf` — pengukuran Core Web Vitals di atas hasil build, dua profil (mobile 4× throttle + 4G lemah, desktop). Ukuran JS dihitung dalam gzip dari `dist/`, bukan dari `content-length` preview yang tidak terkompresi.
- Direktif hidrasi sendiri `client:pesanan` → beranda, katalog, dan 404 tidak mengirim framework sama sekali pada kunjungan pertama. Alasan dan angkanya di `DECISIONS.md`.
- `@fontsource-variable/archivo` dilepas — tidak pernah diimpor; font sudah di-selfhost.
- Katalog tidak lagi menyusun ulang ke-24 `<li>` saat dibuka tanpa cari/urut di URL.

**SEO**

- Meta description dipangkas per kalimat utuh supaya harga dan minimum pemesanan tidak terpotong di hasil penelusuran (`ringkasMeta()`).
- `og:image:width`, `og:image:height`, `og:image:alt` — tanpa itu WhatsApp sering menampilkan pratinjau pertama tanpa gambar.
- Judul dan deskripsi diverifikasi unik di ke-33 halaman.
- URL di structured data disamakan bentuknya dengan canonical lewat `abs()`.

**Konversi & UX**

- Hierarki CTA diperbaiki (lihat `DESIGN-SYSTEM.md` §6 nomor 5).
- Mobile: satu pintu masuk pesanan saja — bar bawah. Tombol header dan tautan "Lihat pesanan" di halaman produk sekarang khusus layar ≥768px.
- Bar bawah mendapat `aria-label` yang menyebut isi pesanan, dan tetap memuat teks terlihatnya (WCAG 2.5.3).
- `npm run journey` — potret alur pesan, bukan halaman diam: sebelum menambah, sesudah menambah, katalog saat pesanan berisi, dan isi drawer.

### Perubahan dari rencana

**Halaman `/cara-pesan` dan `/lokasi` tetap ditunda.** Keduanya sudah berupa section di beranda (`/#cara-pesan`, `/#lokasi`) dan tertaut dari header serta footer. `/lokasi` menunggu alamat asli — tanpa itu isinya hanya penanda "menunggu data" dan satu kotak peta kosong, dan halaman tersendiri hanya memperbesar kekosongan itu.

**Aksi "tambah ke pesanan" langsung dari grid katalog tidak dibuat.** Itu mengembalikan island Preact ke semua halaman katalog dan membatalkan penghematan di atas, sementara ukuran dan warna tetap perlu dilihat di halaman detail. CTA tiap sel tetap "Detail & pesan".

**Font tidak diperkecil.** Varian `wght`-only-nya 34 KB dibanding 88 KB, tapi membuang sumbu `wdth` yang dipakai sungguhan oleh `.t-meta` (92%), `.t-section` (112%), dan `.t-hero` (115%). Itu mengganti arah visual, bukan mengoptimalkan.

## Fase 7A — Arsitektur CMS ✔ selesai

Panel admin supaya pemilik bisa menambah produk, mengubah harga, dan mengunggah foto tanpa menyentuh kode. Panduan lengkap: `docs/CMS.md`.

- **Sanity** dipilih menggantikan rencana Keystatic — alasannya di `DECISIONS.md`. Panel admin sendiri tidak dibuat.
- `sanity/` — Studio dengan `package.json` sendiri, supaya situs statis tidak ikut menanggung paket seberat itu. Skemanya cermin skema Zod, lengkap dengan aturan validasi dan pesan kesalahan berbahasa Indonesia.
- **Satu skema, dua sumber.** `src/content.config.ts` memilih loader Sanity kalau `projectId` sudah diisi, kalau belum tetap `products.json`. Tidak satu pun komponen berubah.
- Foto CMS ikut pipeline `astro:assets` yang sama: diunduh saat build, dioptimalkan, keluar di `dist/`. Crop dan titik fokus pilihan admin dihormati.
- `scripts/rebuild-hook.mjs` — penerima webhook dengan verifikasi HMAC, penolakan permintaan lama, dan penggabungan publikasi beruntun jadi satu build.
- `npm run validate` ikut berpindah sumber; data CMS diperiksa dengan aturan yang sama.
- `npm run test:cms` dan `npm run test:hook` — 34 + 12 pemeriksaan, berjalan tanpa kredensial Sanity sungguhan.

### Perubahan dari rencana

**Project Sanity belum dibuat.** Project ID tidak boleh dikarang, jadi `src/config/cms.ts` masih sentinel dan situs tetap membaca 24 produk contoh. Integrasinya diuji lawan **stub API Sanity lokal**: query GROQ dan CDN gambarnya ditiru, situs dibangun sungguhan di atasnya, lalu HTML-nya diperiksa. Jalur CMS tidak boleh pertama kali dicoba justru saat data asli masuk.

**Dua bug ditemukan oleh uji itu, bukan oleh pembacaan ulang kode.** Pola asset ref yang saya tulis mengharuskan ID heksadesimal, padahal ID aset Sanity alfanumerik campuran — setiap foto asli akan ditolak. Dan klien Sanity merangkai alamat `<projectId>.api.sanity.io`, yang harus dimatikan untuk host non-Sanity.

**Migrasi 24 produk contoh ke Sanity ditunda ke Fase 7B.** Perlu token tulis dan project sungguhan. Rencananya sudah ditulis di `docs/CMS.md`, termasuk syarat mempertahankan slug supaya tidak ada URL yang berubah.

**Deploy hook belum bisa dipasang.** Belum ada hosting, dan fase ini tidak boleh deploy. Yang bisa diverifikasi sekarang — verifikasi tanda tangan — sudah dibangun dan diuji; resep untuk Netlify, Vercel, dan GitHub Actions menunggu hosting dipilih.


## Fase 7B — Data asli & kesiapan konten ✔ selesai

Sebagian data bisnis akhirnya diberikan pemilik. Fase ini memasukkannya, membuat aturan grosir konsisten di seluruh situs, dan menyiapkan jalan produk asli menggantikan 24 produk contoh.

**Data yang masuk** (PLACEHOLDERS.md A10–A13)

- Alamat toko — Jalan Ciledug Raya, Cipulir, Kebayoran Lama, Jakarta Selatan, DKI Jakarta 12230. Nomor bangunan dan RT/RW belum diberikan, jadi baris jalannya berhenti di nama jalan.
- Jam buka — setiap hari 08.00–17.00, ikut ke JSON-LD sebagai `Mo-Su 08:00-17:00`
- Aturan isi satu lusin — satu ukuran, warna boleh dicampur, satu model
- Ekspedisi — bebas, disepakati saat konfirmasi. Tidak ada nama ekspedisi yang ditulis.

Bagian lokasi di beranda kini berisi alamat sungguhan, tombol petunjuk arah aktif (dirakit dari alamat, bukan dari koordinat), dan JSON-LD `Store` memancarkan alamat serta jam buka.

**Aturan grosir, satu sumber**

`src/lib/wholesale.ts` merangkai aturan isi lusin dari `site.wholesalePolicy` dan dipakai di tiga tempat: tabel ketentuan beranda, halaman produk tepat di atas kontrol jumlah, dan daftar pesanan sesaat sebelum pesan dikirim. Kalimatnya tidak pernah ditulis ulang, jadi tidak bisa perlahan berbeda.

Halaman katalog tidak ikut menampilkannya: di sana pengunjung belum memilih produk, dan halaman katalog sudah menyebut harga per lusin serta minimum pemesanan.

**Migrasi produk ke Sanity**

- `npm run cms:export` — `products.json` → NDJSON + salinan foto, slug diambil dari `id` sekarang supaya alamat halaman tidak bergeser. Aturan Studio diperiksa sebelum berangkat, bukan saat impor.
- `npm run test:migrasi` — gladi bersih tanpa jaringan: ekspor sungguhan, impor dan proyeksi GROQ ditiru, situs dibangun dua kali lalu dibandingkan. 17 pemeriksaan.
- Impor sungguhannya menunggu project Sanity (B14) dan token tulis.

**Pemeriksa data bertambah**

`npm run validate` kini menolak jam buka yang hanya terisi di satu dari dua field, format `openingHours` yang bukan schema.org, dan kode pos yang bukan lima angka; serta memperingatkan alamat jalan yang terisi tanpa kota — karena tanpa kota, alamatnya tidak pernah sampai ke JSON-LD.

### Perubahan dari rencana

**`wholesalePolicy.payment` tetap null.** Pemilik mengonfirmasi pembayaran memang disepakati lewat WhatsApp — kalimat yang sudah ada di `orderFlow.payment`. Mengisinya dengan kalimat yang sama hanya menduplikasi sumber.

**Pesan WhatsApp tidak diubah.** Aturan "satu lusin satu ukuran" berarti penjual perlu tahu ukurannya, tapi menambahkan kalimat tentang ukuran ke pesan yang seolah-olah ditulis pembeli sama dengan mengarang isi pesan orang. Yang diubah placeholder kolom catatan — jadi "Ukuran tiap lusin, warna, atau catatan lain" — plus aturannya tampil tepat di atas kolom itu.

**Pemilih ukuran di halaman produk tidak dibuat.** Itu fitur baru, bukan konsistensi, dan mengubah alur pemesanan yang sudah diverifikasi di Fase 4 dan 6.

**Satu bug ditemukan di alat uji sendiri.** `npm run test:data` mengganti field `payment` yang pertama ditemukan — yang ada di `orderFlow`, bukan di `wholesalePolicy` yang dimaksud. Uji itu lolos selama ini tanpa pernah menyentuh field yang diklaim diujinya. Penggantinya sekarang menolak nama field yang muncul lebih dari sekali.

## Fase 7C — Audit akhir sebelum peluncuran ✔ selesai

Tidak ada halaman baru dan tidak ada fitur baru. Fase ini memeriksa ulang seluruh hasil Fase 1–7B dan memperbaiki yang ternyata salah. Checklist peluncurannya jadi dokumen tersendiri: [PELUNCURAN.md](PELUNCURAN.md).

**Empat bug ditemukan dan diperbaiki**

1. **Kontras gagal di "Cara pesan".** Angka langkah 1/2/3 memakai Jahit di atas Katun — 2,65:1, padahal teks 16px butuh 4,5:1. Ini satu-satunya tempat `text-jahit` dipakai di seluruh situs, dan `docs/DESIGN-SYSTEM.md` §2 sudah melarangnya sejak awal. `aria-hidden` pada angka itu tidak menggugurkan kewajiban kontras: angkanya tetap terlihat mata. Diganti Tinta.
2. **Dua kata menempel di halaman 404** — "tidak ada di katalogHWR Collection". Baris baru antara teks dan `{site.name}` ikut terbuang saat dirender. Spasinya sekarang ditulis eksplisit.
3. **`sanity/sanity.config.ts` menunjuk file yang salah.** Komentarnya menyuruh mengisi project ID di `src/config/site.ts`, padahal tempatnya `src/config/cms.ts` — persis langkah yang akan dikerjakan pemilik saat menyalakan CMS.
4. **`npm run journey` tidak bisa lewat di mobile.** Ia mencari tombol bernama "Buka daftar pesanan", nama yang hanya dimiliki tombol header — dan tombol itu `display:none` di bawah 768px. Hasilnya menggantung 30 detik lalu mati, jadi potret drawer mobile tidak pernah benar-benar diperbarui. Sekarang memakai `[data-buka-pesanan]:visible`, atribut yang dimiliki kedua pintu masuk, disaring ke yang sedang terlihat. Kedelapan potret kembali terbentuk.

**Tiga lubang ditutup sebelum sempat jadi bug**

- **Nomor uji bisa tertinggal di konfigurasi.** `test:whatsapp` dan `test:data` menambal `site.ts` dengan nomor uji dan memulihkannya di `finally` — yang tidak jalan kalau prosesnya dibunuh. Hasilnya: situs terbangun dengan tautan `wa.me` ke nomor yang bukan milik siapa pun. `npm run validate` sekarang menolak nomor itu; kedua harness menyalakan `HWR_UJI_NOMOR=1` selama menambal.
- **Domain contoh mengundang indexing.** `robots.txt` memancarkan `Disallow: /` selama `site.url` masih berakhiran `.example` (TLD yang dicadangkan RFC 2606, jadi kehadirannya hanya berarti satu hal). Tanpa ini, build pratinjau yang ter-deploy akan menyerahkan 24 produk contoh beserta harga karangannya ke mesin pencari. Berganti sendiri jadi `Allow: /` begitu domain asli diisi.
- **Domain asli tidak pernah diuji.** `npm run test:data` mengisi semua placeholder kecuali `url`, sehingga bentuk akhir canonical, `og:image`, `og:url`, sitemap, dan robots.txt belum pernah dilihat. Sekarang ikut ditambal dan keenam keluaran itu diperiksa.

**Pemeriksa aksesibilitas diperluas**

`npm run a11y` dulu hanya memeriksa satu rute — praktiknya selalu beranda. Sekarang memeriksa satu rute per jenis halaman, plus keadaan yang tidak pernah ada di HTML statis: bar pesanan dan drawer saat daftar berisi. Ditambah **kontras yang dihitung dari hasil render**, bukan dari tabel token: latar efektif ditelusuri ke atas pohon DOM sampai warna yang tidak transparan, persis seperti yang dilihat mata. Bug nomor 1 di atas ditemukan oleh pemeriksa ini pada menit pertama.

**Yang diperiksa dan ternyata sudah benar**

33 halaman: judul dan deskripsi unik, canonical lengkap, Open Graph lengkap dengan dimensi, satu `h1` per halaman, semua `<img>` membawa width/height, font di-preload. Nol overflow horizontal dari 320px sampai 1280px. Tidak ada hex di komponen; hanya `rounded-kontrol` dan `shadow-drawer` yang dipakai. 24 foto semuanya tepat 4:5. Satu elemen melekat per tepi layar, tidak ada yang ketiga. Sentinel `__PLACEHOLDER__` tidak pernah sampai ke HTML. Aturan grosir konsisten di beranda, katalog, halaman produk, dan drawer. Back/forward membawa daftar pesanan dengan benar. Reduced-motion mematikan animasi tanpa menghilangkan apa pun.

### Perubahan dari rencana

**Angka "0 KB JS" dijelaskan ulang, bukan dikoreksi.** `docs/DECISIONS.md` menulis beranda mengirim 0 KB JavaScript. Itu benar untuk file yang diunduh terpisah, tapi skrip inline di dalam HTML tetap ada: 2,1 KB gzip di beranda dan 404, 2,8 KB di katalog — gerbang `client:pesanan`, runtime `astro-island`, dan tombol menu mobile. Angkanya sekarang ditulis apa adanya di sana.

**Satu "kegagalan" ternyata milik alat ujinya sendiri.** Probe reduced-motion menuntut `transition-duration` tepat `0s`, padahal `global.css` memakai `0.01ms` — pola yang disengaja supaya `transitionend` tetap menyala dan tidak ada kode yang menunggu selamanya. Tidak ada yang diubah di situs.

## Fase 7 — QA responsif

- 360 / 390 / 414 / 768 / 1024 / 1280 / 1440
- Navigasi, grid, filter, stepper, drawer, bar sticky
- Orientasi landscape di ponsel

## Fase 8 — Aksesibilitas & performa

- Lintasan keyboard penuh, focus ring terlihat di semua ground
- Landmark, skip link, hierarki heading, alt text, label form
- Lighthouse; target: LCP < 2.5s di 4G ter-throttle, CLS < 0.1, JS < 30 KB gzip
- Preload font dan gambar LCP, lazy untuk sisanya

## Fase 9 — Polish

- Bersihkan inkonsistensi spacing dan tipografi
- Hapus abstraksi yang ternyata tidak terpakai
- `README.md` + petunjuk cara mengganti placeholder dengan data asli

---

## Verifikasi visual

Memakai pola dari skill `webapp-testing` — reconnaissance lalu aksi, tunggu `networkidle`, chromium headless, potret tiap viewport.

Skill itu menulis scriptnya dengan Playwright Python. Python di mesin ini tidak punya pip (`py -m pip` gagal: *No module named pip*), jadi yang dipakai binding Node-nya. Polanya sama persis.

```bash
npx astro dev --background

npm run validate                 # data produk & konfigurasi (jalan juga sebelum build)
npm run shoot [rute...]           # full-page 390 / 768 / 1440 + audit otomatis
npm run a11y [rute]               # menu keyboard, skip link, heading, target sentuh
npm run perf [rute...]            # LCP, CLS, byte per jenis, tugas panjang (build + preview)
npm run journey                   # potret alur: tambah produk, bar bawah, drawer
npm run test:cms                  # jalur Sanity → Astro lawan stub API lokal
npm run test:migrasi              # 24 produk menyeberang ke CMS lalu dibandingkan
npm run test:hook                 # verifikasi tanda tangan webhook rebuild
npm run test:katalog              # filter, cari, urut, URL state, empty state, tanpa-JS
npm run test:pesanan              # 24 rute produk, 404, drawer, keyboard, penyimpanan
npm run test:whatsapp             # jalur wa.me dgn nomor uji sementara (build + preview)
npm run test:data                 # gladi bersih: semua placeholder diisi, lalu dipulihkan
node scripts/inspect.mjs mobile [rute]   # potongan seukuran layar untuk periksa detail
```

Rute ditulis tanpa garis miring depan (`npm run shoot katalog katalog/jeans`) karena Git Bash di Windows menerjemahkan argumen berawalan `/` jadi path Windows.

`npm run shoot` sekaligus memeriksa overflow horizontal (dan menyebut elemen penyebabnya), jumlah `h1`, gambar tanpa alt, dan console error di tiap viewport.

`npm run a11y` memeriksa menu mobile lewat keyboard (buka, Escape, fokus kembali), skip link, urutan level heading, landmark, `lang`, kontrol tanpa nama, target sentuh < 44px, dan apakah area foto produk benar-benar mengarah ke halaman detail.

`npm run test:data` mengisi SEMUA placeholder dengan nilai uji — nomor, alamat, peta, jam buka, logo, kebijakan, dan satu produk yang ditandai bukan dummy lagi — membangun situs, memeriksa hasilnya, lalu memulihkan setiap file. Keadaan "terisi" tidak pernah teruji kalau hanya keadaan kosong yang pernah dijalankan.

`npm run test:katalog` menjalankan katalog dua kali — sekali dengan JavaScript dimatikan untuk memastikan lapisan dasarnya utuh, sekali dengan JavaScript untuk menguji cari, urut, empty state, keyboard, dan pemulihan state dari URL.

Screenshot full-page halaman sepanjang ini terlalu kecil untuk menilai spasi dan tipografi — `inspect.mjs` memotongnya jadi blok seukuran layar supaya jarak antar section ikut terlihat.

Halaman tidak dianggap selesai hanya karena kode berhasil di-build.

---

## Yang memblokir peluncuran

Situs bisa dibangun penuh tanpa data di bawah ini, tapi **tidak bisa dipublikasikan** tanpa nomor WhatsApp. Selengkapnya di `PLACEHOLDERS.md`.

| Dibutuhkan | Memblokir |
|---|---|
| Nomor WhatsApp | Seluruh alur pemesanan. Ini satu-satunya pemblokir mutlak. |
| Tautan Google Maps | Peta sematan dan tombol "Buka di Google Maps". Alamatnya sendiri sudah ada. |
| Harga asli | Kredibilitas katalog |
| Foto produk asli | Kualitas visual (placeholder sudah cukup untuk membangun) |
| Logo asli | Identitas (wordmark sementara sudah cukup untuk membangun) |
