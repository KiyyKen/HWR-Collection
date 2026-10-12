# Design Direction & Design System — HWR Collection

Status: menunggu review. Semua nilai di sini adalah proposal, bukan hasil implementasi.

---

## 1. Arah visual

### Dari mana arahnya diambil

HWR menjual barang indigo. Jeans anak adalah produk unggulan, dan seluruh kategori lain — training, cargo, kolor, Hawai — adalah celana. Dunia fisiknya adalah tumpukan celana terlipat, label ukuran, kode artikel, hitungan lusin, dan kios grosir.

Dua hal dari dunia itu yang dipakai sebagai sumber visual, bukan sebagai dekorasi:

**Indigo.** Warna bahan yang dijual. Dipakai sebagai warna teks dan sebagai ground untuk dua blok pernyataan. Bukan navy korporat, bukan biru SaaS — indigo denim.

**Jahitan emas.** Benang topstitch jeans punya warna kuning-emas yang sangat khas. Itu menjadi satu-satunya aksen: penanda harga per lusin, filter aktif, focus ring, dan tombol primer di atas ground gelap.

**Line sheet.** Dokumen kerja grosir sungguhan. Barang disusun rapat dalam grid, dipisah garis rambut, tiap baris membawa kode, ukuran, dan harga. Ini yang menggantikan kartu produk mengambang — dan kebetulan juga menjawab larangan brief §4 soal kartu rounded berlebihan.

### Yang membuat halaman ini terasa milik HWR

Foto produk yang memegang seluruh warna. Chrome situsnya sengaja tenang — putih, indigo, satu emas. Warna cerah datang dari barangnya sendiri. Kehangatan yang diminta brief §3 datang dari warna produk dan dari bahasa, bukan dari ornamen di antarmuka.

Satu tempat untuk berani: blok indigo gelap penuh-lebar yang memuat proposisi grosir dan CTA WhatsApp. Sisanya disiplin dan sunyi.

---

## 2. Warna

### Token inti

| Token | Hex | Nama | Pakai untuk |
|---|---|---|---|
| `--c-kertas` | `#FFFFFF` | Kertas | Ground utama, seluruh area produk |
| `--c-katun` | `#F2EFE8` | Katun | Band informasi yang tenang (cara pesan, lokasi), tint latar foto |
| `--c-tinta` | `#17233B` | Tinta | Semua teks utama, heading, dan ground band gelap |
| `--c-denim` | `#2E4A87` | Denim | Link, state aktif, isian sekunder |
| `--c-jahit` | `#C08A22` | Jahit | Aksen tunggal: satuan harga, filter aktif, focus ring, tombol primer di atas gelap |
| `--c-garis` | `#DFDCD5` | Garis | Garis rambut pemisah grid (dekoratif) |

### Token pendukung

| Token | Hex | Pakai untuk |
|---|---|---|
| `--c-redup` | `#5C6577` | Teks metadata di atas terang |
| `--c-kabut` | `#8FA0C4` | Teks metadata di atas ground indigo |
| `--c-batas` | `#7A7568` | Border elemen interaktif (input, select) |

### Kontras yang sudah dihitung

| Kombinasi | Rasio | Lolos |
|---|---|---|
| Tinta `#17233B` di atas Kertas | 15.7 : 1 | AAA |
| Denim `#2E4A87` di atas Kertas | 8.6 : 1 | AAA |
| Redup `#5C6577` di atas Kertas | 5.8 : 1 | AA |
| Kertas di atas Tinta (band gelap) | 15.7 : 1 | AAA |
| Kabut `#8FA0C4` di atas Tinta | 6.0 : 1 | AA |
| Jahit `#C08A22` di atas Tinta | 5.2 : 1 | AA |
| Tinta di atas Jahit (tombol emas) | 5.2 : 1 | AA |
| Redup `#5C6577` di atas Katun | 5.1 : 1 | AA |
| Batas `#7A7568` di atas Kertas | 4.6 : 1 | lolos 3:1 untuk border |
| Batas `#7A7568` di atas Katun | 4.0 : 1 | lolos 3:1 untuk border |
| Focus ring Jahit di atas Kertas | 3.04 : 1 | lolos 3:1 non-teks, nyaris |
| Jahit `#C08A22` di atas Katun | 2.65 : 1 | **gagal untuk teks apa pun** |

Angka-angka di atas dihitung ulang di Fase 7C dan dua di antaranya diperbaiki: focus ring di atas Kertas sebelumnya tertulis 3.7:1, padahal 3.04:1 — masih lolos ambang 3:1 untuk elemen non-teks, tapi jaraknya tipis, jadi warna ring tidak boleh dibuat lebih terang. Baris Katun ditambahkan karena band Katun dipakai untuk section utuh dan pasangannya tidak pernah ikut dihitung.

Dua aturan yang lahir dari tabel ini:

- **Jahit tidak pernah dipakai untuk teks, di ground terang mana pun** — 3.04:1 di atas Kertas, 2.65:1 di atas Katun. Jahit di atas terang hanya untuk garis, underline filter aktif, dan focus ring. Untuk teks, Jahit hanya dipakai di atas ground Tinta, atau sebagai isian dengan teks Tinta di atasnya.

  Aturan ini pernah terlanggar satu kali: angka langkah 1/2/3 di "Cara pesan" memakai Jahit di atas Katun. Ditemukan Fase 7C oleh `npm run a11y`, yang sejak itu menghitung kontras dari hasil render, bukan dari tabel ini. `aria-hidden` pada angka itu tidak menggugurkan kewajiban kontras — angkanya tetap terlihat mata.
- Focus ring memakai satu warna saja (Jahit) dan lolos di kedua ground — terang maupun gelap. Tidak perlu dua sistem focus.

### Hijau WhatsApp

Hijau `#25D366` dipakai **hanya sebagai isian glyph ikon WhatsApp** pada ukuran kecil, di mana orang mengenalinya seketika. Tombolnya sendiri memakai palet HWR: isian Tinta dengan teks putih di atas ground terang, isian Jahit dengan teks Tinta di atas ground gelap.

Alasannya: satu gaya tombol primer di seluruh situs lebih mudah dipelajari daripada dua identitas yang bersaing, dan glyph hijau sudah cukup untuk memberi sinyal "ini WhatsApp".

---

## 3. Tipografi

### Keluarga

**Archivo Variable** — satu superfamily, dua sumbu.

```
@fontsource-variable/archivo  (v5.3.0, OFL-1.1)
axes: wght 100–900, wdth 62–125, ital 0–1
```

Satu file woff2 variable, subset latin saja, di-selfhost di `public/fonts/archivo-latin.woff2` (88 KB), `font-display: swap`, dan di-preload dari `<head>`. Tidak ada font kedua.

File itu salinan `archivo-latin-standard-normal.woff2` dari paket npm tersebut; paketnya sendiri **tidak** dipasang sebagai dependensi, karena menyimpan seluruh paket demi satu file adalah beban yang tidak pernah dipakai. Lisensi OFL ikut didistribusikan di `public/fonts/OFL.txt`. Kalau suatu saat butuh versi baru:

```bash
npm i -D @fontsource-variable/archivo
cp node_modules/@fontsource-variable/archivo/files/archivo-latin-standard-normal.woff2 public/fonts/archivo-latin.woff2
npm un @fontsource-variable/archivo
```

Varian `wght`-only-nya memang jauh lebih kecil (34 KB), tapi membuang sumbu `wdth` — dan sumbu itu dipakai sungguhan di tabel peran di bawah. Menukarnya berarti mengganti arah visual, bukan mengoptimalkan.

Kenapa Archivo, dan kenapa hanya satu keluarga:

- Sumbu `wdth` 62–125 memberi **display yang melebar** dan **metadata yang memadat** dari file yang sama. Hierarki lebar adalah alat yang jarang dipakai dan langsung terasa seperti label garmen industri, bukan seperti landing page.
- Archivo punya **tabular figures**. Situs ini penuh angka yang harus sejajar: harga, kode artikel, jumlah lusin, rentang ukuran. Ini menghilangkan alasan untuk menambahkan font monospace — dan `frontend-design` menandai monospace untuk label data sebagai penanda halaman generate.
- Satu file variable jauh lebih ringan daripada dua keluarga dengan beberapa berat.

### Peran

| Peran | wdth | wght | Ukuran | Line-height | Tracking |
|---|---|---|---|---|---|
| Wordmark | 112 | 700 | — | 1 | -0.01em |
| Hero (h1) | 115 | 650 | `clamp(2.25rem, 6vw, 4.25rem)` | 1.02 | -0.02em |
| Section (h2) | 112 | 600 | `clamp(1.5rem, 3.2vw, 2.25rem)` | 1.08 | -0.015em |
| Sub-heading (h3) | 100 | 600 | 1.125rem | 1.25 | 0 |
| Nama produk | 100 | 500 | 0.9375rem | 1.3 | 0 |
| Harga | 100 | 600 | 1rem | 1.2 | 0, tabular |
| Metadata (kode, ukuran, "/ lusin") | 92 | 500 | 0.8125rem | 1.35 | 0.005em, tabular |
| Body | 100 | 400 | 1rem | 1.6 | 0 |
| Tombol | 100 | 600 | 0.9375rem | 1 | 0 |

### Skala

`0.8125 · 0.875 · 1 · 1.125 · 1.375 · 1.75 · 2.25 · 3 · 4.25` rem

### Aturan

- Panjang baris body maksimum **68ch**.
- Ukuran teks body minimum **16px**, tidak pernah lebih kecil untuk kalimat.
- `font-variant-numeric: tabular-nums` pada semua harga, kode, ukuran, dan jumlah.
- **Tidak ada eyebrow label all-caps** di atas heading. Kalau sebuah bagian butuh nama, itu jadi h2-nya.
- **Tidak menonjolkan satu kata** di dalam headline dengan warna atau italic.
- Satu `h1` per halaman, urutan heading tidak melompat.

---

## 4. Spacing

Basis 4px.

```
4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 128
```

Padding vertikal section: 48–64px di mobile, 96–128px di desktop.
Gutter container: 20px mobile, 32px tablet, 48px desktop.

---

## 5. Grid & layout

```
container max-width   1320px
kolom                 12 (desktop) · 6 (tablet) · 4 (mobile)
breakpoint            sm 480 · md 768 · lg 1024 · xl 1320
```

**Grid produk (line sheet):** 2 kolom di mobile, 3 di tablet, 4 di desktop. Sel dipisah **garis rambut 1px**, bukan jarak antar kartu. Tidak ada border keliling, tidak ada radius, tidak ada shadow pada sel. Hasilnya membaca seperti halaman katalog cetak, dan foto produk jadi satu-satunya sumber warna.

**Alignment:** rata kiri di seluruh situs. Tidak ada teks rata tengah kecuali pada satu pernyataan pendek di dalam band indigo.

---

## 6. Prinsip komponen

1. **Tidak ada kartu** kecuali elemen itu memang target klik yang butuh area sentuh — dan bentuknya tetap sel berbatas garis, bukan kartu mengambang.
2. **Struktur dibentuk oleh garis rambut dan alignment**, bukan oleh kotak dan bayangan.
3. **Radius**: 0 di mana-mana, kecuali tombol dan input yang memakai 2px. Tidak ada nilai lain yang tersedia sebagai token.
4. **Shadow**: tidak ada, kecuali satu elevasi untuk drawer daftar pesanan (`0 12px 32px rgba(23,35,59,.18)`).
5. **Satu aksi primer per tampilan.** Di atas terang: isian Tinta, teks putih. Di atas gelap: isian Jahit, teks Tinta.

   Dipertajam di Fase 6 karena aturannya sempat dilanggar tanpa disadari: begitu daftar pesanan berisi, header memunculkan tombol "Pesanan" gelap **di sebelah** tombol "Pesan via WhatsApp" yang juga gelap — dua aksi primer bersebelahan, dan yang lebih mencolok justru yang salah (tombol itu memulai chat kosong, tanpa satu pun produk yang sudah dipilih). Sekarang tombol WhatsApp umum mundur jadi sekunder selama daftar pesanan berisi; aturannya ada di `global.css`, sengaja di luar `@layer` supaya menang atas utility. Prinsipnya: **yang primer adalah langkah berikutnya, bukan saluran yang paling ingin dipromosikan.**
6. **Semua angka tabular.**
7. **Satuan selalu menyertai harga.** Tidak pernah ada "Rp 285.000" tanpa "/ lusin" di sebelahnya.
8. **Area sentuh minimum 44×44 CSS px**, jarak antar target minimum 8px.
9. **Maksimal satu elemen sticky per tepi layar.** Aturan ini semula berbunyi "satu elemen sticky di layar pada satu waktu"; diperlunak di Fase 4 karena katalog mobile butuh filter kategori yang menempel di atas *dan* bar pesanan di bawah. Keduanya berada di tepi yang berlawanan, tingginya 49px dan 57px, dan tidak saling menutupi — yang dilarang aturan aslinya adalah tumpukan elemen mengambang, bukan dua tepi yang masing-masing punya satu fungsi. Elemen mengambang ketiga tetap tidak diizinkan.

---

## 7. Perlakuan gambar

### Sistem

| Properti | Nilai |
|---|---|
| Rasio produk | **4:5 portrait**, tanpa pengecualian |
| Latar | Flat `#EFEDE7` (abu katun), identik di setiap foto |
| Pencahayaan | Key lembut dari kiri-atas, satu bayangan lembut di kanan-bawah, opacity 12% |
| Framing | Garmen di tengah, margin 8%, gaya flat-lay |
| Sumber | 1400 × 1750 |
| Keluaran | AVIF + WebP via `astro:assets`, srcset 320/480/640/960/1280 |

Gambar kategori dan hero memakai crop 3:2 dari sistem yang sama.

### Aset sementara

Foto asli belum ada. Gambar sementara dibuat oleh satu script, bukan dikumpulkan dari stock:

```
scripts/gen-placeholder-photos.mjs
  → template SVG (siluet garmen per kategori, colorway per produk)
  → sharp
  → WebP 1400×1750
  → src/assets/products/
```

Semua keluaran memakai latar, pencahayaan, bayangan, dan framing yang sama, jadi terbaca seperti dipotret oleh satu brand.

**Jalur penggantian:** foto asli masuk ke `src/assets/products/` dengan nama file yang sama. Tidak ada kode yang berubah — pipeline `astro:assets` sudah identik antara placeholder dan foto asli sejak hari pertama. Ini alasan placeholder dirender jadi raster, bukan disajikan sebagai SVG.

### Alt text

Alt text menyebut jenis garmen dan colorway, bukan nama file dan bukan kata "gambar". Contoh: `Celana cargo anak warna khaki, tampak depan`.

---

## 8. Motion

Satu momen yang diorkestrasi, sisanya hanya perubahan state.

| Kejadian | Perlakuan |
|---|---|
| Drawer daftar pesanan terbuka | Slide 220ms `cubic-bezier(.2,.8,.2,1)` + backdrop fade |
| Jumlah item bertambah | Scale 1 → 1.12 → 1, 140ms |
| Hover/focus tombol, link, tile | Color/opacity 120–160ms |
| Semua yang lain | Tidak ada |

Yang tidak dipakai: scroll reveal, parallax, entrance fade-and-slide per section, hover lift pada kartu, animasi angka berjalan.

`prefers-reduced-motion: reduce` → semua durasi 0, drawer muncul seketika. Tidak ada informasi yang hilang.

---

## 9. Pass kritik terhadap brief

`frontend-design` mewajibkan rencana desain ditinjau ulang sebelum ditulis jadi kode, dan bagian yang terbaca sebagai default generik harus diganti dengan alasannya disebutkan. Berikut hasilnya.

| Ditolak | Diganti dengan | Alasan |
|---|---|---|
| Ground krem `#F4F1EA` + display serif + aksen terracotta | Ground putih, Tinta indigo, aksen Jahit emas, sans satu keluarga | Kombinasi itu persis yang ditandai `frontend-design` sebagai penanda desain hasil generate. Putih juga lebih benar untuk katalog yang dipimpin foto — ground netral membuat garmen menonjol. |
| Keluaran `--design-system` dari `ui-ux-pro-max`: Swiss Minimalism + `#BE185D`/`#FDF2F8` + Outfit/Work Sans + Scroll-Triggered Storytelling | Seluruh sistem di dokumen ini | Style-nya sendiri berlabel "best for SaaS platforms, dashboards"; palette pink tidak berhubungan dengan barang indigo yang dijual; pairing font itu pilihan AI yang paling umum; pola scroll-story salah untuk katalog yang tugasnya browsing cepat. |
| Grid tiga kartu "Kenapa pilih kami" | Tabel spesifikasi berisi fakta yang memang benar: minimum 1 lusin, harga per lusin, pilihan ukuran, jangkauan kirim | Brief §4 melarang grid "Why Choose Us" generik, dan brief §21 melarang klaim yang dikarang. Tabel spec hanya bisa diisi hal yang benar-benar diketahui. |
| Penanda bernomor 01 / 02 / 03 di berbagai section | Nomor hanya di "Cara pesan" | `frontend-design` menguji apakah kontennya memang urutan. Hanya alur pemesanan yang benar-benar berurutan. |
| Filter berbentuk pill | Filter teks dengan underline Jahit untuk state aktif | Brief §4 melarang pill berlebihan. Underline juga memberi sinyal state yang lebih jelas daripada pill berisi. |
| Font monospace untuk kode artikel dan label data | Archivo wdth 92 + tabular-nums | `frontend-design` menandai monospace untuk label data kecil sebagai chrome template. Tabular figures menyelesaikan masalah sesungguhnya — kesejajaran angka. |
| Tombol WhatsApp hijau `#25D366` | Tombol Tinta/Jahit, hijau hanya di glyph ikon | Satu gaya tombol primer lebih mudah dipelajari. Glyph hijau sudah cukup untuk pengenalan. |

### Satu hal yang tetap dipertahankan meski berdekatan dengan default

Band `--c-katun #F2EFE8` memang berada di keluarga krem yang diperingatkan. Dipertahankan karena tiga alasan: ia **band sekunder**, bukan ground halaman; ia dipasangkan dengan display sans dan aksen **emas**, bukan serif dan terracotta; dan kehangatan katun mentah adalah satu-satunya tempat di mana persyaratan "hangat" pada brief §3 bisa masuk tanpa menambah ornamen.

---

## 10. Jalur penggantian saat branding asli datang

Semua yang bergantung pada brand tinggal di dua file:

```
src/styles/tokens.css     blok @theme — seluruh warna, tipografi, spacing, radius
src/components/Wordmark.astro   wordmark SVG sementara
```

Wordmark sementara dibuat dari Archivo wdth 112 / wght 700 yang dikonversi jadi SVG path — sengaja sederhana, tanpa simbol, tanpa ilustrasi. Ketika logo asli datang, file SVG-nya diganti dan komponen menjaga tinggi serta area aman yang sama, jadi layout tidak bergeser.

Tidak ada warna hex yang boleh ditulis langsung di komponen. Hanya token.
