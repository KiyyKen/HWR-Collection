# Information Architecture & Wireframe — HWR Collection

Status: beranda (Fase 2) dan katalog (Fase 3) sudah dibangun. Bagian bawah dokumen mencatat setiap penyimpangan dari rencana ini beserta alasannya.

---

## Prinsip yang mengatur urutan

Brief §20 menetapkan perjalanan sesungguhnya:

```
HWR Collection → produk → kepercayaan → percakapan WhatsApp → penjualan
```

Karena itu tiga fakta ini harus terbaca sebelum pengunjung menggulir sekali pun: **HWR menjual celana**, **HWR grosir**, **minimum 1 lusin**. Ketiganya dipasang di strip fakta tepat di bawah header, bukan disebar ke section terpisah di bawah.

Riset katalog grosir fashion 2026 menegaskan satu hal yang membentuk halaman katalog kita: line sheet digital yang berguna adalah yang bisa difilter dan bisa **menambah item ke pesanan langsung dari grid**, tanpa harus membuka halaman detail dulu. Pembeli grosir sudah tahu apa yang dicari; memaksa mereka masuk-keluar halaman detail memperlambat pesanan.

---

## Peta halaman

```
/                       Beranda
/katalog                Katalog + filter + urut + cari
/katalog/[kategori]     Katalog terfilter (URL sendiri, bisa di-index)
/produk/[slug]          Detail produk
/cara-pesan             Alur pemesanan (juga diringkas di beranda)
/lokasi                 Lokasi & informasi toko
/pesanan                Daftar pesanan versi halaman penuh (fallback drawer)
```

Kategori: `jeans` · `training` · `cargo` · `kolor` · `hawai` · `lainnya`

---

## Beranda — desktop

```
┌──────────────────────────────────────────────────────────────────┐
│ HWR COLLECTION    Katalog  Kategori  Cara pesan  Lokasi          │
│                                        [ 0 ]  [Pesan via WA ▸]   │
├──────────────────────────────────────────────────────────────────┤
│ Grosir · Minimum 1 lusin · Kirim ke seluruh Indonesia            │  ← strip fakta
├──────────────────────────────────────────────────────────────────┤
│                                    │                             │
│  Grosir celana, langsung           │                             │
│  dari HWR Collection.              │      [ foto produk 4:5 ]    │
│                                    │                             │
│  Jeans anak, training, cargo,      │                             │
│  kolor, dan Hawai. Minimum         │                             │
│  1 lusin, kirim ke seluruh         │                             │
│  Indonesia.                        │                             │
│                                    │                             │
│  [ Lihat katalog ]  Pesan via WA ▸ │                             │
└────────────────────────────────────┴─────────────────────────────┘

  Kategori
  ─────────────────────────────────────────────────────────────────
  [foto]    [foto]    [foto]    [foto]    [foto]    [foto]
  Jeans     Training  Cargo     Kolor     Hawai     Lainnya
  ─────────────────────────────────────────────────────────────────

  Produk pilihan                                  Lihat semua ▸
  ┌─────────┬─────────┬─────────┬─────────┐
  │  4:5    │  4:5    │  4:5    │  4:5    │   ← dipisah garis rambut,
  │         │         │         │         │     bukan jarak antar kartu
  ├─────────┼─────────┼─────────┼─────────┤
  │ J-01    │ T-02    │ C-03    │ K-01    │   ← kode
  │ Jeans…  │ Trainin…│ Cargo…  │ Kolor…  │   ← nama
  │ Rp285.000 / lusin │ …       │ …       │   ← harga + satuan
  │ 1–8 · 4 warna     │ …       │ …       │   ← size run · colorway
  │ [+ Tambah]        │ …       │ …       │   ← muncul saat hover/focus,
  └─────────┴─────────┴─────────┴─────────┘     selalu tampak di mobile

╔══════════════════════════════════════════════════════════════════╗  ← band indigo
║  Cara kerja grosir di HWR                                        ║
║                                                                  ║
║  Minimum pemesanan     1 lusin (12 pcs) per model                ║
║  Satuan harga          per lusin                                 ║
║  Pilihan ukuran        [PLACEHOLDER: size run per model]         ║
║  Pilihan warna         [PLACEHOLDER: kebijakan campur warna]     ║
║  Pengiriman            seluruh Indonesia                         ║
║  Pembayaran            dikonfirmasi lewat WhatsApp               ║
╚══════════════════════════════════════════════════════════════════╝

┌── band katun ────────────────────────────────────────────────────┐
│  Cara pesan                                                      │
│                                                                  │
│  1  Pilih produk dan jumlah lusin                                │
│  2  Kirim daftar pesanan lewat WhatsApp                          │
│  3  Kami konfirmasi stok, total, dan pengiriman                  │
└──────────────────────────────────────────────────────────────────┘
        ↑ satu-satunya tempat penomoran dipakai — ini memang urutan

  Pengiriman
  ─────────────────────────────────────────────────────────────────
  Kami kirim ke seluruh Indonesia.
  Ekspedisi: [PLACEHOLDER: daftar ekspedisi yang dipakai]
  Ongkir dihitung saat konfirmasi pesanan.

┌── band katun ────────────────────────────────────────────────────┐
│  Toko                              │                             │
│  [PLACEHOLDER: alamat lengkap]     │   [ peta — PLACEHOLDER ]    │
│  [PLACEHOLDER: kota, provinsi]     │                             │
│  [PLACEHOLDER: jam buka]           │                             │
│  [Buka di Google Maps ▸]           │                             │
└────────────────────────────────────┴─────────────────────────────┘

╔══════════════════════════════════════════════════════════════════╗  ← band indigo
║  Siap pesan? Kirim daftarnya, kami balas dengan stok dan total.  ║
║  [ Pesan via WhatsApp ▸ ]   [PLACEHOLDER: nomor WA]              ║
╚══════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────┐
│ HWR COLLECTION     Katalog      Kategori      Kontak             │
│ Grosir celana      Semua        Jeans         WhatsApp           │
│ anak & dewasa      Cara pesan   Training      [PLACEHOLDER]      │
│                    Lokasi       Cargo …       [PLACEHOLDER: IG]  │
│ © 2026 HWR Collection                                            │
└──────────────────────────────────────────────────────────────────┘
```

### Catatan urutan

Struktur ini menyimpang dari urutan yang disarankan brief §9 di dua titik, dan berikut alasannya.

**Strip fakta naik ke atas, tidak menunggu section "wholesale proposition".** Tiga fakta penentu — grosir, 1 lusin, seluruh Indonesia — adalah hal yang membuat pengunjung memutuskan untuk lanjut atau pergi. Menyimpannya di tengah halaman berarti sebagian pengunjung tidak pernah melihatnya.

**Kategori naik ke atas produk pilihan.** Pembeli grosir datang dengan kategori di kepala ("saya cari cargo anak"), bukan dengan keinginan untuk dibujuk. Memberi jalan pintas kategori lebih dulu memperpendek jalan ke katalog.

---

## Beranda — mobile

```
┌──────────────────────┐
│ HWR COLLECTION  [0]☰ │
├──────────────────────┤
│ Grosir · Min 1 lusin │   ← strip fakta, dua baris kalau perlu
│ · Kirim se-Indonesia │
├──────────────────────┤
│                      │
│  [ foto produk 4:5 ] │   ← foto lebih dulu di mobile
│                      │
├──────────────────────┤
│ Grosir celana,       │
│ langsung dari        │
│ HWR Collection.      │
│                      │
│ Jeans anak, training,│
│ cargo, kolor, dan    │
│ Hawai. Minimum       │
│ 1 lusin, kirim ke    │
│ seluruh Indonesia.   │
│                      │
│ [ Lihat katalog    ] │
│ [ Pesan via WA   ▸ ] │
└──────────────────────┘

  Kategori
  ────────────────────
  ◄ [Jeans][Training][Cargo][Kolor]… ►   ← scroll horizontal, snap

  Produk pilihan
  ┌─────────┬─────────┐
  │  4:5    │  4:5    │   ← 2 kolom
  ├─────────┼─────────┤
  │ J-01    │ T-02    │
  │ Jeans…  │ Trainin…│
  │ Rp285rb │ Rp190rb │
  │ / lusin │ / lusin │
  │ [+]     │ [+]     │   ← selalu tampak, ≥44×44
  └─────────┴─────────┘

  … band indigo, cara pesan, pengiriman, lokasi, CTA, footer …

┌──────────────────────┐
│ 3 item · Pesan via WA│   ← sticky bawah, HANYA muncul
└──────────────────────┘      setelah ada isi di daftar pesanan
```

Hanya ada **satu** elemen sticky di layar pada satu waktu. Tidak ada tombol WA mengambang yang permanen — bar sticky sudah membawa aksi itu, dan tombol mengambang permanen menutupi foto produk.

---

## Katalog

```
┌──────────────────────────────────────────────────────────────────┐
│ HWR COLLECTION    Katalog  Kategori  Cara pesan  Lokasi  [3] [WA]│
├──────────────────────────────────────────────────────────────────┤
│ Katalog                                                          │
│ 24 produk                                                        │
├──────────────────────────────────────────────────────────────────┤
│ Semua  Jeans  Training  Cargo  Kolor  Hawai  Lainnya             │  ← sticky
│        ═════                                                     │     underline Jahit
│                                 [ Cari ]  [ Urutkan ▾ ]          │     = aktif
├──────────────────────────────────────────────────────────────────┤
│ ┌─────────┬─────────┬─────────┬─────────┐                        │
│ │  4:5    │  4:5    │  4:5    │  4:5    │                        │
│ ├─────────┼─────────┼─────────┼─────────┤                        │
│ │ J-01 …  │ J-02 …  │ J-03 …  │ J-04 …  │                        │
│ └─────────┴─────────┴─────────┴─────────┘                        │
│ … (grid lanjut)                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- Filter kategori juga punya URL sendiri (`/katalog/jeans`) supaya bisa dibagikan dan di-index mesin pencari. Filter di dalam halaman menyinkronkan `?cari=` dan `?urut=` ke query string.
- Urutkan: Terbaru · Harga terendah · Harga tertinggi.
- Cari menyaring nama dan kode produk. Semua produk sudah ada di HTML sejak awal, jadi penyaringan instan tanpa request.
- Jumlah hasil diumumkan lewat `aria-live="polite"` setiap filter berubah.
- Mobile: baris filter scroll horizontal dan tetap sticky; select urut dan input cari turun ke baris kedua.
- Kalau hasil kosong: kalimat yang menunjukkan jalan keluar, bukan sekadar "tidak ada hasil" — sebutkan filter yang aktif dan sediakan aksi menghapusnya.

---

## Detail produk

```
┌──────────────────────────────────────────────────────────────────┐
│ Katalog ▸ Jeans ▸ J-01                                           │  ← breadcrumb
├────────────────────────────────┬─────────────────────────────────┤
│                                │ Jeans                           │
│                                │ Jeans Anak Reguler              │  ← h1
│      [ foto utama 4:5 ]        │ J-01                            │
│                                │                                 │
│                                │ Rp 285.000 / lusin              │
│                                │ Minimum 1 lusin (12 pcs)        │
│  [thumb][thumb][thumb]         │                                 │
│                                │ Ukuran   1 · 2 · 3 · 4 … 8      │
│                                │ Warna    [PLACEHOLDER]          │
│                                │ Bahan    [PLACEHOLDER]          │
│                                │                                 │
│                                │ Jumlah                          │
│                                │ [ − ]  1 lusin  [ + ]           │
│                                │                                 │
│                                │ [ Tambah ke pesanan          ]  │
│                                │ [ Pesan produk ini via WA  ▸ ]  │
│                                │                                 │
│                                │ Estimasi Rp 285.000             │
│                                │ Total final dikonfirmasi        │
│                                │ lewat WhatsApp.                 │
└────────────────────────────────┴─────────────────────────────────┘

  Informasi produk
  ─────────────────────────────────────────────────────────────────
  [PLACEHOLDER: deskripsi produk asli]

  Produk lain di kategori Jeans
  ┌─────────┬─────────┬─────────┬─────────┐
```

Mobile: gambar penuh lebar lebih dulu, lalu informasi, dengan bar sticky di bawah berisi harga, stepper, dan "Tambah ke pesanan".

Dua tombol disediakan karena dua niat yang berbeda memang ada: pembeli yang mengumpulkan beberapa model memakai "Tambah ke pesanan"; pembeli yang hanya butuh satu model langsung memakai "Pesan produk ini via WhatsApp". Hierarkinya jelas — yang pertama isian solid, yang kedua outline.

---

## Daftar pesanan

Drawer yang bisa dibuka dari header di semua halaman, dengan `/pesanan` sebagai halaman penuh untuk fallback tanpa JavaScript.

```
┌──────────────────────────────┐
│ Daftar pesanan          [✕]  │
├──────────────────────────────┤
│ [img] Jeans Anak Reguler     │
│       J-01 · Rp285.000/lusin │
│       [−] 2 lusin [+]   Hapus│
├──────────────────────────────┤
│ [img] Cargo Anak Khaki       │
│       C-03 · Rp310.000/lusin │
│       [−] 1 lusin [+]   Hapus│
├──────────────────────────────┤
│ Catatan (opsional)           │
│ [                          ] │
├──────────────────────────────┤
│ 3 lusin · estimasi Rp880.000 │
│ Total final dikonfirmasi     │
│ lewat WhatsApp.              │
│                              │
│ [ Pesan via WhatsApp     ▸ ] │
└──────────────────────────────┘
```

- Fokus terperangkap di dalam drawer saat terbuka, `Esc` menutup, fokus kembali ke tombol pemicu.
- Jumlah item diumumkan lewat `aria-live`.
- Isi disimpan di `localStorage`, jadi bertahan saat pindah halaman dan saat kembali nanti.
- Tidak ada akun, tidak ada login, tidak ada checkout.

### Pesan WhatsApp yang dihasilkan

```
Halo HWR Collection, saya ingin memesan:

1. Jeans Anak Reguler J-01 — 2 lusin
2. Cargo Anak Khaki C-03 — 1 lusin

Estimasi total: Rp 880.000

Mohon info ketersediaan dan total pesanannya.

Terima kasih.
```

Dikirim ke `https://wa.me/<nomor>?text=<encodeURIComponent(pesan)>`.

Catatan: baris estimasi total ikut disertakan karena harga memang ditampilkan di situs, jadi menyembunyikannya justru membuat percakapan mulai dari nol. Kalimat "mohon info ketersediaan dan total" tetap dipertahankan supaya jelas bahwa angka final datang dari penjual.

---

## Lokasi

Alamat, jam buka, dan peta — semuanya placeholder bertanda jelas sampai data asli diberikan. Peta memakai embed Google Maps yang dimuat lazy (`loading="lazy"`) supaya tidak membebani LCP, dengan link "Buka di Google Maps" sebagai jalur utama di mobile.

Tidak ada alamat karangan di kode mana pun. Daftar lengkap yang dibutuhkan ada di `PLACEHOLDERS.md`.

---

## Perubahan setelah verifikasi visual (Fase 2)

Wireframe di atas adalah rencana. Berikut yang berubah setelah halaman benar-benar dirender dan diperiksa di 390 / 768 / 1440 px, beserta alasannya.

### 1. Urutan hero di mobile dibalik

**Rencana:** foto dulu, lalu judul.
**Jadinya:** judul → foto → penjelasan + tombol.

Foto 4:5 selebar layar setinggi ±440 px. Dengan pita dev, header, dan strip fakta di atasnya, judul terdorong ke sekitar 670 px — hampir seluruhnya di luar layar pertama iPhone. Pengunjung melihat sehelai celana tanpa satu kata pun yang menjelaskan HWR itu apa. Brief §2 nomor 1 menuntut sebaliknya.

### 2. Section "Pengiriman" dihapus, dilebur ke tabel spesifikasi

**Rencana:** section tersendiri setelah "Cara pesan".
**Jadinya:** tiga baris di tabel spesifikasi band indigo — Pengiriman, Ongkos kirim, Ekspedisi.

Saat dirender, section itu ternyata hanya mengulang baris "Pengiriman — Seluruh Indonesia" yang sudah ada di band indigo, ditambah satu kalimat ongkir. Hasilnya satu blok setinggi 300 px yang isinya dua kalimat dan satu placeholder. Brief §9 memang menyarankan section "shipping coverage", tapi juga meminta jangan mengikuti strukturnya secara buta kalau ada hierarki yang lebih baik. Tabel spesifikasi sekarang jadi satu-satunya sumber ketentuan grosir, dan tidak ada yang terduplikasi.

### 3. Section "Toko" jadi ground putih, bukan katun

Setelah "Pengiriman" hilang, "Cara pesan" dan "Toko" jadi bersebelahan dan keduanya katun — hasilnya satu blok beige sepanjang 400 px tanpa pembeda. Ritme band sekarang: putih → indigo → katun → putih → indigo (CTA + footer).

### 4. Rentang ukuran di grid, bukan daftar lengkap

**Rencana:** "Ukuran 1 · 2 · 3 · 4 · 5 · 6 · 7 · 8".
**Jadinya:** "Ukuran 1–8".

Daftar lengkap memakan dua baris di sel mobile dan tidak membantu keputusan di tahap browsing. Daftar lengkapnya tetap ada di halaman detail produk. Ini sekaligus menghapus rangkaian titik-tengah yang ditandai `frontend-design` sebagai chrome template.

### 5. Rasio 4:5 tidak pernah diganti, termasuk di tablet

Sempat dicoba crop ke persegi di layar sedang supaya foto hero tidak terlalu tinggi. Hasilnya ban pinggang dan keliman celana terpotong. Yang dibatasi akhirnya lebarnya (maks 26rem di bawah 1024 px), bukan rasionya.

### 6. Ukuran judul hero diturunkan

Batas atas `clamp` diturunkan dari 4.25rem ke 3.75rem. Di kolom hero, 68 px memecah judul jadi lima baris pendek dan mulai terbaca sebagai tipografi besar tanpa alasan (brief §4).

---

## Perubahan setelah verifikasi visual (Fase 3 — katalog)

### 1. Filter kategori jadi link ke halaman statis, bukan tombol JavaScript

**Rencana:** filter di dalam halaman yang menyinkronkan `?kategori=`.
**Jadinya:** `/katalog` dan `/katalog/<kategori>` — tujuh halaman statis.

Konsekuensinya semuanya positif: URL kategori bisa dikirim ke grup WhatsApp reseller, di-bookmark, dan di-index untuk pencarian seperti "grosir celana cargo anak"; tombol back/forward bekerja sendiri tanpa kode; dan filter kategori tetap berfungsi penuh tanpa JavaScript. Hanya cari dan urut yang butuh JavaScript, dan keduanya disembunyikan sampai script benar-benar jalan — kontrol mati lebih buruk daripada tidak ada kontrol.

### 2. Script vanilla, bukan island Preact

**Rencana:** island filter Preact.
**Jadinya:** ±2 KB script vanilla inline.

Filter ini memanipulasi daftar yang **sudah dirender server**. Preact tidak memberi apa pun di situ selain ±14 KB tambahan dan kebutuhan untuk merender ulang daftar di klien — yang justru merusak lapisan tanpa-JS. Hasilnya halaman katalog mengirim nol file JavaScript eksternal.

Preact dan nanostores tetap terpasang untuk Fase 4, tempat daftar pesanan memang butuh state lintas komponen.

### 3. Toolbar mobile dua baris, bukan tiga

Menumpuk jumlah, cari, dan urut masing-masing satu baris mendorong produk pertama ±50 px lebih jauh ke bawah. Sekarang kolom cari sebaris penuh di atas, lalu jumlah dan pengurutan berbagi satu baris.

Urutan DOM tetap jumlah → cari → urut; `order` hanya mengatur tampilan. Tidak ada jebakan urutan tab karena teks jumlah bukan elemen fokus.

### 4. Label masuk ke dalam kotak kontrol

Dengan label "Cari" berdiri di luar input, tepi kiri input mulai ±30 px dari margin halaman dan tidak sejajar dengan judul, intro, maupun grid di bawahnya. Label sekarang berada di dalam kotak yang sama, jadi kotaknya sejajar dengan margin halaman. Label tetap terlihat, jadi tidak jatuh jadi placeholder-as-label.

Focus ring pindah ke pembungkus lewat `focus-within` karena kontrol di dalamnya sudah kehilangan outline-nya sendiri.

### 5. Label pengurutan diperpendek

"Harga terendah" / "Harga tertinggi" terpotong di dalam kotak pada layar 390 px, dan mengulang kata "harga" setelah prefiks "Urutkan". Sekarang "Termurah" / "Termahal".

### 6. Rentang ukuran, bukan daftar titik-tengah

Ini sudah diputuskan di Fase 2 dan berlaku sama di katalog: "Ukuran 1–8", bukan "1 · 2 · 3 · 4 · 5 · 6 · 7 · 8". Daftar ukuran lengkap disimpan untuk halaman detail produk.

### 7. Baris "Detail & pesan" di setiap sel

Sebelumnya satu-satunya petunjuk bahwa sel bisa diklik adalah garis bawah saat hover — yang tidak ada di ponsel. Sekarang tiap sel punya baris "Detail & pesan" berwarna Denim berukuran metadata.

Baris itu `aria-hidden` dan **bukan link kedua**: link tetap satu per sel (nama produk, dengan overlay `::after` selebar sel), supaya pembaca layar tidak mengumumkan dua tautan ke tujuan yang sama.

### 8. Level heading nama produk menyesuaikan konteks

Di beranda grid berada di bawah h2 "Produk pilihan", jadi nama produk adalah h3. Di katalog produk adalah konten utama langsung di bawah h1, jadi h2. Tanpa ini urutan heading melompat h1 → h3 di halaman katalog.

### 9. Empty state tidak mengulang kalimat status

Baris status di toolbar sudah mengumumkan "Tidak ada produk yang cocok". Empty state di bawah grid menyebut kata yang dicari — "Tidak ada hasil untuk "sepatu"." — jadi menambah informasi, bukan mengulang kalimat yang sama persis.

### 10. Minimum order disebut sekali, satuan harga melekat di tiap produk

Brief meminta minimum 1 lusin terlihat jelas tanpa mengganggu layout. Kalimatnya muncul sekali di bawah judul halaman; yang berulang di setiap sel adalah satuan "/ lusin" yang memang melekat pada harga. Mengulang "min. 1 lusin" 24 kali hanya menambah kebisingan.

### Yang ditunda ke Fase 4

Aksi "Tambah ke pesanan" langsung dari grid — riset line sheet menyebut ini berguna untuk pembeli grosir, dan tetap direncanakan. Aksi itu butuh store daftar pesanan yang baru dibangun di Fase 4.

---

## Katalog — struktur akhir

```
Header  (Katalog ditandai garis bawah Jahit)
─────────────────────────────────────────────────────────────────
Katalog                                       ← h1
Seluruh produk HWR Collection, dari jeans anak sampai celana Hawai.
Semua harga per lusin. Minimum pemesanan 1 lusin (12 pcs).
─────────────────────────────────────────────────────────────────
Semua 24   Jeans 6   Training 4   Cargo 4 …   ← sticky, link, angka = jumlah
═══════                                          garis bawah Jahit = aktif
─────────────────────────────────────────────────────────────────
Menampilkan 24 produk    [Cari ______]  [Urutkan  Termurah ▾]
                          ↑ role="status"        ↑ muncul setelah JS jalan
┌─────────┬─────────┬─────────┬─────────┐
│  4:5    │  4:5    │  4:5    │  4:5    │
├─────────┼─────────┼─────────┼─────────┤
│ J-01    │         │         │         │   ← kode
│ Jeans…  │         │         │         │   ← h2, satu-satunya link
│ Rp 420.000 / lusin│         │         │   ← harga + satuan
│ Ukuran 1–8  3 warna│        │         │
│ Detail & pesan    │         │         │   ← penanda CTA, aria-hidden
└─────────┴─────────┴─────────┴─────────┘
```

Mobile 2 kolom, tablet 3, desktop 4. Baris filter kategori adalah **satu-satunya** elemen sticky di halaman ini.

---

## Halaman produk & alur pesanan (Fase 4)

### Struktur halaman produk

```
Katalog / Jeans Anak / J-01                    ← remah roti, tiap tautan 44px

┌──────────────────────┬────────────────────┐
│                      │ Jeans Anak         │  ← kategori
│                      │ Jeans Anak Reguler │  ← h1
│                      │ J-01               │  ← kode
│    [ foto 4:5 ]      │                    │
│                      │ Rp 420.000 / lusin │
│                      │ Minimum 1 lusin    │
│                      │ ─────────────────  │
│                      │ Jumlah             │
│                      │ [− 1 lusin +]      │
│                      │ [Tambah ke pesanan]│
│                      │ [Pesan via WA]     │
│                      │                    │
│ Foto contoh…         │ Spesifikasi        │  ← tabel spec naik ke kolom
│                      │ Kode / Kategori /  │     kanan supaya tingginya
│ Informasi produk     │ Ukuran / Warna /   │     mengimbangi foto 4:5
│ Deskripsi…           │ Bahan / Min / Satuan│
└──────────────────────┴────────────────────┘

Produk lain                      Lihat kategori ▸
[ grid line sheet 4 kolom ]
```

Penempatan grid dibuat eksplisit, bukan dua kolom polos. Urutan DOM tetap foto → identitas → deskripsi, jadi di mobile nama produk tidak pernah muncul setelah paragraf deskripsi.

### Keputusan

**Tidak ada galeri.** Setiap produk baru punya satu foto. Membuat galeri dari satu gambar yang diulang adalah kebohongan visual. Slot foto tambahan dicatat di `PLACEHOLDERS.md`.

**Tidak ada sticky CTA di halaman produk.** Brief menyebutnya sebagai bahan pertimbangan; yang dipilih adalah satu bar pesanan global yang muncul di semua halaman begitu daftar berisi. Bar itu sekaligus jadi konfirmasi bahwa produk masuk daftar, dan menghindari dua elemen bawah yang bersaing di halaman yang sama.

**Tidak ada halaman `/pesanan`.** Rencana awal menyebutnya sebagai cadangan tanpa JavaScript, tapi tanpa JavaScript tidak ada daftar pesanan sama sekali — `localStorage` tidak bisa dibaca. Halaman itu hanya akan menduplikasi drawer. Cadangan tanpa JavaScript yang benar adalah tautan WhatsApp langsung untuk satu produk, satu lusin, yang dirender di `<noscript>`.

**Tombol pesanan hanya muncul saat daftar berisi.** Pesanan kosong tidak butuh pintu masuk, dan munculnya tombol itu sendiri jadi umpan balik bahwa produk berhasil ditambahkan.

**Status "Di daftar pesanan: N lusin" bertahan, bukan notifikasi sekejap.** Pembeli grosir menambahkan beberapa model berturut-turut dan perlu tahu apa yang sudah masuk tanpa membuka daftar.

### Drawer daftar pesanan

```
┌──────────────────────────────┐
│ Daftar pesanan          [✕]  │  ← fokus pindah ke sini saat terbuka
├──────────────────────────────┤
│ J-01                    [🗑]  │
│ Jeans Anak Reguler           │
│ Rp 420.000 / lusin           │
│ [− 1 lusin +]     Rp 420.000 │
├──────────────────────────────┤
│ CG-03                   [🗑]  │
│ …                            │
├──────────────────────────────┤
│ Catatan (opsional)           │
│ [                          ] │
│                              │
│ 2 produk, 2 lusin  Rp 1.080.000│
│ Perkiraan. Total akhir dan   │
│ ongkir dikonfirmasi lewat WA.│
│ [ Pesan via WhatsApp       ] │
│ Kosongkan daftar             │
└──────────────────────────────┘
```

Tanpa foto: isinya kode, nama, harga, dan angka — bahasa yang sama dengan line sheet katalog, dan island-nya tetap kecil.

Satu-satunya tempat di situs yang memakai bayangan, dan satu-satunya gerakan yang diorkestrasi (geser 220ms + backdrop fade). `prefers-reduced-motion` mematikannya lewat aturan global.

### Pesan WhatsApp yang dihasilkan

```
Halo HWR Collection, saya ingin memesan:

1. Jeans Anak Reguler J-01 — 2 lusin
2. Cargo Dewasa Panjang CG-03 — 1 lusin

Estimasi total: mulai dari Rp 1.500.000

Catatan: Tolong dikirim minggu ini

Mohon info ketersediaan dan total pesanannya.

Terima kasih.
```

"Estimasi total" berubah jadi "mulai dari" kalau ada produk berharga *mulai dari*, karena angkanya cuma batas bawah.

### Saat nomor WhatsApp masih placeholder

Tidak ada tautan `wa.me` yang dibuat — bukan tautan rusak, bukan nomor karangan. Tombolnya nonaktif dan menjelaskan sebabnya, dan daftar pesanan tetap tersimpan. Ini terjadi di tiga tempat: halaman produk, drawer, dan header.

---

## Keadaan "menunggu data" (Fase 5)

Setiap tempat yang menunggu data pemilik memakai satu dari tiga perlakuan. Pilihannya bukan selera — bergantung pada apakah kekosongan itu perlu diketahui pengunjung.

| Perlakuan | Dipakai untuk | Contoh |
|---|---|---|
| **Penanda terlihat** — teks miring "menunggu data dari pemilik" | Hal yang pengunjung memang cari dan akan bingung kalau hilang | Alamat, jam buka, kontak WhatsApp di footer |
| **Baris tetap ada, nilainya ditandai** | Pertanyaan yang pasti muncul di chat reseller | Campur ukuran, campur warna, ekspedisi |
| **Tidak dirender sama sekali** | Hal yang belum tentu berlaku di bisnis ini | Harga kodi, eceran satuan, waktu proses, syarat reseller, telepon, email |

Yang tidak pernah dipakai: nilai contoh yang terlihat seperti data asli, dan tombol mati berjejer. Tombol "Buka di Google Maps" sudah mewakili kekosongan peta; menambah tombol "Petunjuk arah" yang sama matinya hanya menggandakan kekosongan itu, jadi tautan arah baru dibuat setelah alamatnya ada.

Foto produk memakai perlakuan keempat: gambar sementara dengan latar, cahaya, dan framing identik, plus satu baris "Foto contoh. Foto produk asli menyusul." di bawah foto utama halaman produk. Katalog tidak boleh dibangun di atas kotak abu-abu kosong — tapi juga tidak boleh berpura-pura punya foto asli.

---

## Hierarki CTA per keadaan (Fase 6)

Situs ini punya satu saluran pesan, jadi tombol WhatsApp muncul di banyak tempat. Yang menentukan mana yang primer bukan seberapa penting saluran itu, tapi **apa langkah berikutnya yang benar bagi orang yang sedang melihat layar itu.**

### Daftar pesanan masih kosong

| Tempat | Perlakuan |
|---|---|
| Header (≥768px) | "Pesan via WhatsApp" — gelap. Jalan pintas bagi yang lebih suka bertanya daripada menelusuri. |
| Hero beranda | "Lihat katalog" primer, "Pesan via WhatsApp" sekunder |
| Halaman produk | "Tambah ke pesanan" primer, "Pesan N lusin via WhatsApp" sekunder |
| Bar bawah mobile | tidak ada |

### Daftar pesanan berisi

| Tempat | Perlakuan |
|---|---|
| Header (≥768px) | "Pesanan N" jadi gelap; "Pesan via WhatsApp" **mundur jadi outline** |
| Bar bawah (<768px) | muncul: jumlah produk, jumlah lusin, tombol "Lihat pesanan" |
| Halaman produk | tidak berubah; status "Di daftar pesanan: N lusin" bertahan di bawah tombol |

Alasannya satu kalimat: **tombol WhatsApp di header memulai chat kosong.** Selama belum ada yang dipilih, itu berguna. Begitu pengunjung menyusun daftar, tombol itu justru membuang pekerjaannya — dan tidak boleh jadi elemen paling mencolok di sebelah pintu masuk daftar pesanan.

### Satu pintu masuk per layar

Sebelum Fase 6, pengunjung mobile yang sudah menambahkan produk melihat **tiga** jalan ke daftar yang sama: tombol di header, tautan "Lihat pesanan" di bawah tombol tambah, dan bar bawah. Tombol header juga memepetkan wordmark dengan tombol menu di baris selebar 390px.

Sekarang: **mobile hanya bar bawah** (paling dekat jempol, selalu terlihat), **≥768px hanya tombol header** (bar bawah tidak pernah muncul di sana). Tautan "Lihat pesanan" di halaman produk ikut aturan yang sama — hanya ≥768px, karena di mobile bar bawah sudah menawarkan hal yang sama beberapa sentimeter di bawahnya.
