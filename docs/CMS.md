# CMS — Sanity Studio

Panel admin HWR Collection. Admin menambah produk, mengubah harga, dan mengunggah foto dari browser; situs dibangun ulang otomatis setelah Publish.

**Keadaan sekarang: CMS aktif.** Project **`1ybl4qg4`**, dataset `production`, berisi **24 produk** hasil migrasi dari `products.json` — slug, kode, nama, dan harganya identik, jadi tidak ada alamat halaman yang berubah. `projectId` di `src/config/cms.ts` sudah diisi, dan situs membaca produknya dari Sanity, bukan lagi dari file.

Semua produk itu masih `dummy: true`: pita "Versi pengembangan" tetap tampil dan halaman produk belum memancarkan structured data `Product`. Keduanya mati sendiri begitu `dummy` dimatikan per produk di Studio.

`src/content/products.json` **tidak dihapus** — disimpan sebagai cadangan sampai beberapa siklus publish berjalan mulus. Situs tidak lagi membacanya; kalau `projectId` dikembalikan ke `PLACEHOLDER`, situs langsung kembali memakai file itu tanpa perubahan lain.

Buka panel admin dengan `npm run cms` di http://localhost:3333.

---

## Cara kerjanya

```
Admin di Studio
  └─ Publish
     └─ dataset Sanity  (hanya yang published; draft tidak pernah ikut)
        ├─ webhook → rebuild → build Astro
        │   └─ loader GROQ → Zod → content store
        │      ├─ halaman produk statis
        │      └─ foto: CDN → astro:assets → dist/
        └─ situs statis, tanpa permintaan ke Sanity dari browser pengunjung
```

Dua hal yang membuat ini aman:

1. **Satu skema, dua sumber.** `src/content.config.ts` memilih loader Sanity kalau project ID sudah diisi, kalau belum tetap `products.json`. Skema Zod yang sama memvalidasi keduanya — data dari CMS tidak lebih dipercaya daripada data dari file.
2. **Build gagal, bukan situs rusak.** Kode kembar, slug kosong, produk tanpa foto, harga yang tampak seperti harga satuan — semuanya menghentikan build. Situs yang sedang tayang tidak berubah sampai datanya benar.

---

## Menyalakan CMS

### 1. Buat project ✔ sudah

Di [sanity.io/manage](https://sanity.io/manage): buat project baru, dataset `production`, dan set dataset itu **publik** (situs statis hanya membaca; dataset publik membuat build tidak perlu menyimpan token).

Sudah dikerjakan: project `1ybl4qg4`, dataset `production`, terbaca tanpa token.

### 2. Jalankan Studio ✔ sudah

```bash
cp sanity/.env.example sanity/.env
# isi SANITY_STUDIO_PROJECT_ID
npm run cms                # http://localhost:3333
```

`sanity/.env` sudah dibuat dan tidak ikut ter-commit. Login memakai akun yang sama seperti saat membuat project; untuk memberi akses ke pemilik, undang emailnya di sanity.io/manage → Members.

Perintah lain: `npm --prefix sanity run build`, `npm --prefix sanity run deploy` (menerbitkan Studio ke `<nama>.sanity.studio` supaya admin bisa membukanya tanpa menjalankan apa pun di komputernya).

### 3. Arahkan situs ke project itu

✔ Sudah dikerjakan. Catatan ini tetap disimpan karena berlaku lagi kalau suatu saat saklarnya dimatikan.

**Lakukan ini setelah ada minimal satu produk yang di-Publish di Studio**, bukan sebelumnya. Saklar ini memindahkan seluruh sumber data produk; dataset kosong berarti katalog kosong, dan itu ditolak `npm run validate` dengan "Dataset Sanity tidak berisi satu pun produk yang sudah dipublikasikan" — build gagal, `npm run dev` ikut gagal.

`src/config/cms.ts` → ganti `projectId: PLACEHOLDER as string` dengan ID-nya:

```ts
projectId: '1ybl4qg4' as string,
```

Itu satu-satunya saklar. Setelah diisi:

```bash
npm run validate     # membaca dari Sanity, bukan dari JSON
npm run build
```

Dataset privat butuh token baca — buat di sanity.io/manage lalu jalankan build dengan `SANITY_READ_TOKEN=...`. Token tidak pernah ditulis di repositori.

---

## Webhook: publish memicu rebuild

Situs ini statis, jadi perubahan di CMS tidak sampai ke pengunjung sampai situsnya dibangun ulang.

### Di Sanity

sanity.io/manage → project → **API → Webhooks → Create webhook**

| Kolom | Isi |
|---|---|
| Name | `Rebuild situs` |
| URL | URL endpoint rebuild (lihat pilihan di bawah) |
| Dataset | `production` |
| Trigger on | Create, Update, Delete |
| Filter | `_type == "product"` |
| Projection | biarkan kosong |
| HTTP method | `POST` |
| API version | `v2021-03-25` atau lebih baru |
| Secret | buat string acak panjang — **simpan**, dipakai di sisi penerima |

Filter `_type == "product"` penting: tanpa itu, setiap perubahan aset atau dokumen lain ikut memicu build.

### Pilihan A — Netlify / Vercel (paling sederhana)

Keduanya punya **build hook**: URL yang kalau di-POST akan memicu deploy.

1. Netlify: Site settings → Build & deploy → Build hooks → Add build hook.
   Vercel: Settings → Git → Deploy Hooks.
2. Tempel URL-nya sebagai URL webhook di Sanity.
3. Simpan juga di `src/config/cms.ts` → `deployHookUrl`, sebagai catatan.

Cara ini paling cepat, tapi **tidak memverifikasi tanda tangan** — siapa pun yang tahu URL-nya bisa memicu build. URL-nya panjang dan acak, dan efek terburuknya hanya build berlebih; untuk toko ini itu bisa diterima. Kalau ingin diverifikasi, pakai pilihan B.

### Pilihan B — endpoint sendiri dengan verifikasi tanda tangan

`scripts/rebuild-hook.mjs` sudah berisi logikanya lengkap: verifikasi HMAC, penolakan permintaan lama, dan penggabungan publikasi beruntun jadi satu build.

Jalankan lokal:

```bash
SANITY_WEBHOOK_SECRET="secret-dari-sanity" npm run cms:hook
# POST http://localhost:4455/rebuild
```

Untuk produksi, salin fungsi `tandaTanganSah()` ke serverless function penyedia hosting, lalu panggil deploy hook-nya alih-alih menjalankan build lokal. Yang diverifikasi:

- header `sanity-webhook-signature` berbentuk `t=<detik>,v1=<hmac base64url>`
- yang ditandatangani adalah `<detik>.<body mentah>`, HMAC-SHA256 dengan secret
- permintaan lebih tua dari 5 menit ditolak, supaya tanda tangan yang bocor tidak bisa dipakai ulang

`npm run test:hook` menguji semua itu, termasuk penolakan body yang diubah setelah ditandatangani.

### Pilihan C — GitHub Actions

Kalau repositori ada di GitHub dan build jalan di sana, buat workflow dengan trigger `repository_dispatch`, lalu arahkan webhook Sanity ke `https://api.github.com/repos/<user>/<repo>/dispatches`. Cara ini butuh token GitHub di header, jadi webhook Sanity harus diberi custom header — lebih rumit daripada pilihan A atau B.

---

## Migrasi produk ke Sanity

Alatnya sudah ada dan sudah dijalankan sampai ujung — yang belum dilakukan hanya langkah yang memang butuh project sungguhan.

### 1. Ekspor

```bash
npm run cms:export
```

Menghasilkan `.migrasi/` berisi:

| Isi | Keterangan |
|---|---|
| `produk.ndjson` | Satu baris per produk, `_type: "product"` |
| `foto/` | Salinan semua foto produk |
| `BACA-DULU.md` | Perintah impor dan langkah sesudahnya |

Tiga hal yang dijaga script itu:

- **Slug diambil dari `id` sekarang**, jadi alamat halaman produk tidak berubah setelah migrasi. Tidak ada tautan lama yang mati dan tidak ada redirect yang perlu dibuat.
- **Foto ikut terangkut** lewat `_sanityAsset`, bentuk yang dimengerti `sanity dataset import` untuk mengunggah file lokal dan menyambungkan referensinya sendiri.
- **Aturan Studio diperiksa sebelum berangkat.** Kode artikel, kategori, harga minimum, dan panjang deskripsi diuji dengan aturan yang sama persis seperti `sanity/schemaTypes/product.ts`. Dokumen yang akan ditolak Sanity dihentikan di sini, bukan di tengah impor.

`shape` tidak ikut: siluet foto sementara hanya ada di jalur file. Akibatnya keterangan "Foto contoh. Foto produk asli menyusul." berhenti tampil setelah produk dibaca dari CMS — foto di Sanity adalah file yang sungguh-sungguh diunggah admin, apa pun isinya. Pita "Versi pengembangan" tetap tampil selama `dummy` masih menyala.

`alt` juga tidak ikut, supaya situs tetap merangkainya dari nama dan warna produk seperti sekarang. Admin mengisinya belakangan per produk kalau memang perlu.

### 2. Impor — butuh project dan token tulis

```bash
cd .migrasi
npx sanity dataset import produk.ndjson production --replace
```

`--replace` membuat perintah ini aman diulang: dokumen dengan `_id` sama ditimpa, bukan digandakan.

### 3. Sesudahnya

1. Isi `projectId` di `src/config/cms.ts`.
2. `npm run validate` — harus melaporkan jumlah produk yang sama, dibaca "dari Sanity".
3. `npm run build` — jumlah halaman harus sama dengan build sebelumnya.
4. `products.json` tetap disimpan sebagai cadangan sampai beberapa siklus publish berjalan mulus.

### Gladi bersihnya sudah dijalankan

```bash
npm run test:migrasi
```

Menjalankan seluruh alur di atas tanpa menyentuh jaringan: ekspor sungguhan, impor Sanity ditiru (`_sanityAsset` → referensi aset, dimensi dibaca dari file foto sungguhan), proyeksi GROQ ditiru, lalu **situs dibangun dua kali** — sekali dari `products.json`, sekali dari data hasil migrasi — dan hasilnya dibandingkan.

Yang dibandingkan bukan HTML mentah, karena nama file gambar memang berubah, melainkan yang dijanjikan halaman ini: jumlah halaman, alamat tiap halaman, isi tiap halaman produk, dan daftar URL di sitemap. Satu slug yang bergeser berarti satu tautan mati setelah migrasi, dan itu harus ketahuan sekarang.

Nama field yang diperiksa dibaca dari query GROQ di `src/lib/cms.ts`, bukan disalin ke script uji. Kalau query itu bertambah field dan alat migrasinya tidak ikut, uji ini gagal alih-alih diam-diam menguji bentuk yang sudah tidak dipakai.

---

## Yang TIDAK dikelola dari CMS

| Hal | Di mana | Kenapa |
|---|---|---|
| Enam kategori | `src/data/categories.ts` | Itu struktur situs — URL, filter, navigasi — bukan konten. Menjadikannya editable berarti admin bisa menghapus kategori yang masih dipakai halaman. |
| Nomor WhatsApp, alamat, jam buka | `src/config/site.ts` | Nyaris tidak pernah berubah, dan salah ketik di sana memutus seluruh alur pesan. |
| Teks halaman (hero, cara pesan) | komponen | Copy yang terikat tata letak. Mengeditnya dari CMS mengundang paragraf sepanjang tiga kali yang merusak halaman. |

Kalau suatu saat salah satu memang perlu diedit admin, tambahkan sebagai document type baru — bukan dengan membuat panel admin sendiri.

---

## Kalau ada masalah

| Gejala | Sebabnya biasanya |
|---|---|
| Build: "Dataset … tidak berisi satu pun dokumen product" | Dokumen masih draft. Tekan Publish di Studio. |
| Build: "kode … dipakai 2 produk" | Dua produk berkode sama. Kode dipakai saat chat, harus unik. |
| Build: "belum ada foto produk" | Ada produk yang fotonya belum diunggah. |
| Perubahan tidak muncul di situs | Build belum jalan. Cek log webhook di sanity.io/manage → API → Webhooks. |
| Foto terpotong aneh | Atur titik fokus di Studio (klik foto → hotspot). Situs menghormatinya. |
| Halaman produk hilang setelah slug diubah | Slug jadi URL. Mengubahnya mengubah alamat halaman. |

---

## Verifikasi

`npm run test:cms` menjalankan stub API Sanity di localhost, membangun situs sungguhan di atasnya, lalu memeriksa HTML-nya: loader terpanggil, draft tidak terbit, foto masuk `dist/`, crop dan titik fokus admin dihormati, alt text dipakai, `dummy: false` menyalakan schema Product, dan data rusak menggagalkan build. Setelah selesai, konfigurasi dipulihkan dan situs dibangun ulang dari `products.json`.

`npm run test:hook` menguji verifikasi tanda tangan webhook.

`npm run test:migrasi` menjalankan gladi bersih migrasi — lihat bagian migrasi di atas.

Keduanya berjalan tanpa kredensial Sanity sungguhan — jalur CMS tidak boleh pertama kali dicoba justru saat data asli masuk.
