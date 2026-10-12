# Keputusan Teknis — HWR Collection

Status: menunggu review. Belum ada kode produksi yang ditulis.

---

## 1. Skill Claude Code yang dipasang

Terpasang di `.claude/skills/` (project-scoped, jadi setiap sesi memakai setup yang sama).

**Tidak ikut ter-commit.** Semula iya, supaya kontributor lain dapat setup identik. Diubah saat repositori disiapkan untuk publik: isinya 3,7 MB data skill pihak ketiga yang bukan bagian dari proyek ini, dan menyalinnya ke dalam repo hanya memindahkan beban distribusi orang lain ke sini. Pasang ulang dengan perintah di tabel di bawah; versinya dicatat supaya hasilnya sama.

| Skill | Sumber | Pin | Perannya di proyek ini |
|---|---|---|---|
| `frontend-design` | Anthropic, marketplace resmi `claude-plugins-official` | plugin resmi Anthropic | **Pemegang keputusan visual.** Arah estetika, tipografi, layout, motion, anti-generik, copywriting UI. |
| `ui-ux-pro-max` | `nextlevelbuilder/ui-ux-pro-max-skill`, via installer resmi `npx ui-ux-pro-max-cli init --ai claude` | v2.13.0 | **Pemegang aturan, bukan selera.** Aksesibilitas (WCAG), touch target, responsive, performa, dan aturan spesifik stack Astro. |
| `webapp-testing` | `anthropics/skills` @ `34040c9` (2026-09-10) | commit-pinned | **Verifikasi visual.** Script Playwright untuk merender halaman asli, screenshot desktop/tablet/mobile, membaca console log. |

### Yang sengaja tidak dipakai

Installer `ui-ux-pro-max` ikut menaruh enam skill lain. Semuanya dihapus:

| Dihapus | Alasan |
|---|---|
| `ui-styling` | Berbasis shadcn/ui + Radix. Kita tidak memakai React component library, dan tampilan default shadcn (kartu rounded + shadow lembut) persis yang dilarang brief §4. |
| `design-system` | Tumpang tindih dengan `frontend-design` dan token system yang kita tulis sendiri. Juga membawa generator slide yang tidak relevan. |
| `design`, `banner-design`, `slides`, `brand` | Logo generator via Gemini, banner iklan sosial, presentasi HTML, manajemen aset brand. Semuanya di luar scope. |

Brief §17 melarang memasang banyak skill yang tumpang tindih. Tiga skill di atas sudah menutup seluruh area yang diminta: visual design, UX, design system, implementasi frontend, aksesibilitas, responsive, performa, dan verifikasi visual.

### Konflik antar-skill dan cara penyelesaiannya

**Konflik utama: `frontend-design` vs `ui-ux-pro-max --design-system`.**

`frontend-design` menuntut pilihan visual yang spesifik untuk brief ini, dan secara eksplisit menolak default yang bisa muncul di proyek apa pun. `ui-ux-pro-max --design-system` bekerja sebaliknya: ia mencocokkan query ke katalog 79 style / 192 palette / 74 font pairing, lalu mengeluarkan kombinasi yang sudah jadi.

Saya menguji dengan brief nyata proyek ini:

```
py .claude/skills/ui-ux-pro-max/scripts/search.py \
   "children clothing wholesale catalog fashion supplier" --design-system -p "HWR Collection"
```

Hasilnya:

- Pattern: **Scroll-Triggered Storytelling** — pola naratif berbasis scroll. Salah untuk katalog yang tugasnya browsing cepat.
- Style: **Minimalism & Swiss Style**, yang datanya sendiri menulis *"Best For: Enterprise apps, dashboards, documentation sites, SaaS platforms"* — persis yang dilarang brief §3.
- Palette: `#BE185D` / `#EC4899` / `#FDF2F8`, "Fashion rose + gold". Pink generik, tidak ada hubungannya dengan barang indigo/denim yang dijual HWR.
- Typography: **Outfit / Work Sans** — salah satu pasangan font yang paling sering muncul di landing page buatan AI.

**Putusan:** `frontend-design` menang penuh untuk seluruh arah visual. `ui-ux-pro-max` dibatasi ke mode non-estetika:

| Boleh dipakai | Tidak dipakai |
|---|---|
| `--domain ux` (aksesibilitas, touch, responsive, form, navigasi) | `--design-system` |
| `--domain icons` | `--domain style` |
| `--stack astro`, `--stack html-tailwind` | `--domain color` |
| | `--domain typography` |
| | `--domain landing` |

Mode yang diizinkan memang bernilai. Dua keluaran nyata yang akan kita pakai:

- `--stack astro` → *"Optimize images with astro:assets"* dan *"Use `<Picture />` for responsive images"*, lengkap dengan URL dokumentasi dan tanggal verifikasi (2026-08-13).
- `--domain ux` → aturan touch target yang benar: iOS 44pt, Android 48dp, web memakai WCAG Target Size — bukan satu angka untuk semua platform.

**Konflik kedua, lebih kecil.** Checklist `ui-ux-pro-max` meminta *"hover states with smooth transitions"* pada semua elemen clickable. `frontend-design` memperingatkan bahwa transisi hover di setiap kartu adalah salah satu penanda halaman hasil generate.

Putusan: hover hanya pada elemen yang memang perlu menandakan affordance — tombol, link, dan tile produk yang memunculkan aksi "Tambah". Tidak ada hover di permukaan non-interaktif, dan tidak ada efek lift atau scale yang sifatnya dekoratif.

### Catatan Windows

Script `ui-ux-pro-max` membutuhkan Python 3. Di mesin ini `python3` dan `python` menunjuk ke stub Microsoft Store yang gagal dijalankan. Yang bekerja adalah launcher `py` (Python 3.13.5). Selalu panggil dengan `py`, bukan `python3`.

---

## 2. Tech stack

### Pilihan

```
Astro 7.3                      output statis, zero-JS by default
TypeScript                     strict
Tailwind CSS 4.3               via @tailwindcss/vite, token di satu blok @theme
Preact 10                      hanya untuk tiga island interaktif
nanostores 1.5                 state daftar pesanan lintas island, persist ke localStorage
@astrojs/sitemap 3.7           sitemap.xml
astro:assets (sharp)           AVIF/WebP + srcset + lazy + dimensi CLS-safe
@fontsource-variable/archivo   font di-selfhost, subset latin
```

Semua versi di atas diverifikasi lewat `npm view` pada 2026-09-22.

Deploy: **Cloudflare Pages** — ada PoP Jakarta, free tier, cocok untuk output statis. Netlify sebagai alternatif setara.

### Kenapa Astro

Situs ini 90% halaman statis: beranda, katalog, detail produk, halaman informasi. Yang benar-benar butuh JavaScript hanya tiga hal: filter katalog, stepper jumlah lusin, dan drawer daftar pesanan.

- **Astro mengirim 0 KB JS** untuk semua bagian statis dan hanya menghidrasi tiga island itu. Perkiraan total JS untuk seluruh situs: sekitar 18–25 KB gzip. Brief §15 meminta "minimal JavaScript"; ini cara paling langsung memenuhinya.
- **Content Collections** menyimpan data produk sebagai file dengan skema Zod bertipe. Data produk terpisah penuh dari presentasi (brief §22), dan ketika data asli datang, yang diganti hanya isi file — komponen tidak disentuh.
- **astro:assets** menangani AVIF/WebP, srcset responsif, lazy loading, dan width/height otomatis untuk mencegah CLS. Ini menjawab brief §5 dan §15 tanpa dependency tambahan.
- **Output HTML statis** adalah kondisi terbaik untuk SEO lokal ("grosir celana anak", "supplier jeans anak") dan untuk pembeli di Indonesia yang mayoritas membuka lewat Android di jaringan seluler.

### Kenapa bukan yang lain

| Kandidat | Alasan ditolak |
|---|---|
| **Laravel** | Butuh server PHP, ada biaya dan ops berjalan, latency lebih tinggi. Yang dibelinya — auth, database, payment — tidak satu pun dipakai di sini. Brief §16 juga eksplisit meminta jangan berasumsi Laravel. |
| **Next.js 16** | Mengirim runtime React di setiap halaman untuk situs yang hampir seluruhnya statis. Konfigurasi dan permukaan maintenance lebih besar tanpa manfaat yang terpakai. |
| **SvelteKit** | Pilihan yang sah dan ringan. Kalah tipis karena model content collection + island milik Astro lebih pas untuk katalog, dan JS akhirnya tetap lebih rendah di Astro. |
| **HTML + Vite polos** | Tidak punya model konten. Menambah produk berarti menyalin markup — persis yang membuat katalog cepat berantakan. |

### Kenapa Tailwind 4, bukan CSS polos

Token warna, tipografi, dan spacing hidup di satu blok `@theme`. Saat logo dan warna HWR yang asli datang, yang diubah satu file (brief §8). Tailwind 4 juga sudah CSS-native — tanpa config JS, tanpa rantai PostCSS.

Pengaman terhadap tampilan Tailwind yang generik: kita **tidak memakai** skala default Tailwind untuk `gray`, `rounded`, dan `shadow`. Hanya token bernama milik HWR yang tersedia. Radius dan shadow dibatasi di tingkat token (lihat `DESIGN-SYSTEM.md`), jadi komponen tidak bisa hanyut ke tampilan kartu-rounded-shadow.

### Kenapa Preact dan nanostores

Preact: API sama dengan React, sekitar 4 KB dibanding 45 KB. Hanya untuk tiga island. nanostores: sekitar 1 KB, pola yang didokumentasikan Astro untuk state lintas island, dan persist ke `localStorage` supaya daftar pesanan tidak hilang saat pengunjung pindah halaman.

Tidak ada state manager lain, tidak ada UI library, tidak ada animation library.

### Direktif hidrasi sendiri: `client:pesanan`

Tombol daftar pesanan di header tidak merender apa pun selama daftarnya kosong — dan bagi pengunjung baru, daftarnya **selalu** kosong. Dengan `client:idle`, setiap halaman tetap mengunduh dan menjalankan ±13 KB Preact untuk merender nol elemen. Itu persis "JavaScript yang tidak perlu" yang jadi alasan memilih Astro sejak awal.

Astro mengizinkan direktif hidrasi buatan sendiri lewat `addClientDirective`, jadi dibuat satu: `src/directives/pesanan.ts`. Isinya kecil dan inline di HTML:

1. Ada pesanan tersimpan di `localStorage` → hidrasi saat idle.
2. Belum ada → tunggu. Island pemesanan di halaman produk menyiarkan event `hwr:pesanan` begitu daftarnya terisi; tab lain terdeteksi lewat event `storage`.

Hasil terukur (`npm run perf`, mobile 4× throttle):

| Rute | Sebelum | Sesudah |
|---|---|---|
| `/` | 13,5 KB JS, 23 permintaan | **0 KB, 18 permintaan** |
| `/katalog` | 13,5 KB, 32 permintaan | **0 KB, 27 permintaan** |
| `/produk/…` | 15,0 KB | **11,9 KB** |
| `/404` | 13,5 KB | **0 KB** |

Angka "0 KB" itu berarti **nol file JS yang diunduh terpisah** — tidak ada chunk framework, tidak ada permintaan tambahan. Yang tetap ikut adalah skrip inline di dalam HTML: 2,1 KB gzip di `/` dan `/404`, 2,8 KB di `/katalog`. Isinya tiga hal, dan ketiganya memang dipakai halaman itu: gerbang `client:pesanan` (0,5 KB mentah), runtime `astro-island` bawaan Astro (4,3 KB mentah), dan tombol menu mobile (0,4 KB mentah); katalog menambah skrip cari/urut. Diverifikasi ulang di Fase 7C.

Kenapa bukan menulis ulang tombolnya dengan JavaScript biasa: perilakunya sudah diverifikasi penuh di Fase 4 (focus trap, kunci gulir, pengembalian fokus, persist). Menduplikasi semua itu di dua tempat demi 1 KB berarti menukar risiko regresi dengan penghematan yang lebih kecil daripada satu gambar produk.

Kontraknya diuji sendiri di `npm run test:pesanan` bagian "Hidrasi tertunda", termasuk syarat bahwa katalog **tidak** meminta chunk island saat daftar masih kosong.

### Dependensi yang dibuang

`@fontsource-variable/archivo` dilepas di Fase 6. Font-nya di-selfhost sebagai satu file di `public/fonts/`, dan paketnya tidak pernah diimpor dari mana pun — hanya menumpang di `node_modules`. Asal file dan cara mengambil versi baru dicatat di `DESIGN-SYSTEM.md` §3; lisensi OFL ikut didistribusikan di `public/fonts/OFL.txt`.

### Jalur pengelolaan konten ke depan

**Sanity**, dipasang di Fase 7A.

Keputusan ini mengganti rencana sebelumnya di dokumen ini, yang menyebut Keystatic. Alasan penggantiannya dicatat apa adanya: Keystatic dipilih dulu karena berbasis git dan tanpa database, dan itu masih benar. Yang berubah adalah kebutuhannya — pemilik HWR harus bisa **mengunggah foto produk** dari ponsel atau browser, tanpa akun git dan tanpa pull request. Keystatic menyimpan gambar sebagai file di repositori; Sanity punya CDN gambar beserta crop dan titik fokus yang diatur admin sendiri. Untuk katalog yang isinya foto, itu perbedaan yang menentukan.

Yang dijaga supaya tidak berubah:

- **Situs tetap statis.** Loader berjalan saat build; browser pengunjung tidak pernah memanggil Sanity. Profil performa Fase 6 tetap berlaku — 0 KB JavaScript di beranda dan katalog.
- **Satu skema, dua sumber.** `products.json` tetap jadi sumber selama `projectId` masih placeholder, dan skema Zod yang sama memvalidasi keduanya. Menyiapkan CMS tidak mengubah apa pun yang sudah diverifikasi di Fase 1–6.
- **Dependensi situs bertambah satu**, `@sanity/client`. Paket `sanity` (Studio) tinggal di `sanity/` dengan `package.json` sendiri — situs statis ini tidak ikut menanggung beratnya.
- **`@sanity/image-url` tidak dipasang.** Yang dibutuhkan hanya satu URL sumber 4:5 untuk diserahkan ke `astro:assets`; merangkainya sepuluh baris, dan crop serta hotspot tetap dihormati. Kodenya di `src/lib/cms-image.ts`.

Panel admin sendiri tidak dibuat. Sanity sudah menyediakan otentikasi, riwayat revisi, draft, dan unggah gambar — menulis ulang itu berarti menanggung bug yang sudah dipecahkan orang lain.

Selengkapnya: `docs/CMS.md`.
