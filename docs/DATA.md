# Data & skema — HWR Collection

Bagaimana data disimpan, apa artinya tiap field, dan bagaimana data asli menggantikan data contoh tanpa menyentuh satu pun komponen.

Satu aturan mendasari seluruh dokumen ini: **konten terpisah dari presentasi.** Halaman produk tidak tahu apakah yang direndernya data contoh atau data asli, dari file atau dari CMS — yang berubah hanya isinya.

## Dua sumber, satu skema

Sejak Fase 7A ada dua sumber data produk, dan `src/content.config.ts` yang memilih:

| `projectId` di `src/config/cms.ts` | Sumber | Foto |
|---|---|---|
| masih `PLACEHOLDER` | `src/content/products.json` | file di `src/assets/products/` |
| sudah diisi | Sanity (hanya yang published) | CDN Sanity → dioptimalkan ke `dist/` |

Skema Zod yang sama memvalidasi keduanya, dan `npm run validate` ikut berpindah sumber. Cara menyalakannya ada di `docs/CMS.md`; sisa dokumen ini berlaku untuk kedua sumber kecuali disebut lain.

---

## Peta file

| File | Isi | Siapa yang mengubah |
|---|---|---|
| `src/content/products.json` | 24 produk | Pemilik, lewat data asli |
| `src/content.config.ts` | Skema Zod produk | Pengembang |
| `src/data/categories.ts` | Enam kategori + blurb | Pengembang |
| `src/config/site.ts` | Nomor WhatsApp, toko, merek, kebijakan | Pemilik |
| `src/config/cms.ts` | Project Sanity — sumber data produk | Pengembang |
| `sanity/` | Skema Studio (panel admin) | Pengembang |
| `src/assets/products/<id>.webp` | Satu foto per produk | Pemilik |
| `scripts/validate-data.mjs` | Pemeriksa data | Pengembang |

Validasi berlapis dua:

1. **Zod** (`content.config.ts`) menjaga bentuk tiap field saat build.
2. **`npm run validate`** memeriksa yang tidak bisa dilihat skema — id kembar, foto hilang, salah ketik nama field, flag `dummy` yang bertabrakan dengan kenyataan, format nomor WhatsApp. Jalan otomatis sebelum `npm run build` dan **menggagalkan build** kalau ada kesalahan.

---

## Skema produk

Satu entri di `products.json`:

```json
{
  "id": "jeans-anak-reguler",
  "code": "J-01",
  "name": "Jeans Anak Reguler",
  "category": "jeans",
  "pricePerDozen": 420000,
  "priceType": "tetap",
  "sizes": ["1", "2", "3", "4", "5", "6", "7", "8"],
  "sizeNote": "Ukuran anak nomor 1–8",
  "colors": ["Biru Tua", "Biru Muda", "Hitam"],
  "material": "Denim katun 11 oz",
  "description": "Jeans anak potongan lurus dengan lima kantong.",
  "shape": "jeans-panjang",
  "featured": true,
  "dummy": true
}
```

| Field | Wajib | Aturan | Dipakai di |
|---|---|---|---|
| `id` | ya | huruf kecil dan tanda hubung. **Jadi URL dan nama file foto sekaligus.** | `/produk/<id>`, `src/assets/products/<id>.webp` |
| `code` | ya | pola `J-01`, unik | Sel katalog, halaman produk, pesan WhatsApp |
| `name` | ya | minimal 3 huruf | Judul halaman, `<title>`, pesan WhatsApp |
| `category` | ya | salah satu dari `jeans, training, cargo, kolor, hawai, lainnya` | Filter katalog, remah roti |
| `pricePerDozen` | ya | bilangan bulat rupiah untuk **satu lusin**, contoh `420000` | Harga di mana-mana, estimasi total pesanan |
| `priceType` | — | `tetap` (default) atau `mulai` | `Rp 420.000 / lusin` vs `Mulai dari Rp 465.000 / lusin` |
| `sizes` | ya | daftar teks, minimal satu | Grid: rentang ringkas. Halaman produk: daftar lengkap. |
| `sizeNote` | — | satu kalimat penjelas | Halaman produk |
| `colors` | — | daftar nama warna | Grid: jumlahnya. Halaman produk: daftarnya. Warna pertama menentukan warna foto sementara. |
| `material` | — | teks atau `null` | Tabel spesifikasi; `null` tampil "menunggu data dari pemilik" |
| `description` | ya | 1–2 kalimat, minimal 20 huruf | Halaman produk **dan** meta description |
| `shape` | — | siluet foto sementara | **Hapus saat foto asli masuk** — lihat di bawah |
| `featured` | — | `true` menaikkan produk ke beranda | Beranda, gambar sampul kategori |
| `dummy` | — | `true` (default) selama datanya contoh | Pita peringatan, structured data |

Field di luar daftar ini dibuang diam-diam oleh Zod — karena itu `npm run validate` menolaknya sebagai kesalahan. Salah ketik `"warna"` alih-alih `"colors"` tidak akan lolos.

### Arti `dummy`

Selama `"dummy": true`:

- pita kuning **"Versi pengembangan"** tampil di atas setiap halaman
- halaman produk **tidak** memancarkan structured data `Product`

Yang kedua disengaja: menyiarkan nama dan harga contoh ke mesin pencari sama dengan mengundang harga karangan muncul di hasil penelusuran. `BreadcrumbList` tetap dipancarkan karena itu struktur navigasi, bukan klaim tentang barang.

Keduanya mati sendiri begitu `dummy` jadi `false`. Tidak ada saklar lain di mana pun.

### Arti `shape`

Siluet yang dipakai `npm run gen:photos` untuk menggambar foto sementara. Produk **tanpa** `shape` dilewati generator — itulah pengamannya: foto asli tidak akan pernah tertimpa gambar buatan, berapa kali pun perintah itu dijalankan.

Karena itu langkahnya berpasangan: **taruh foto asli → hapus `shape`.**

---

## Mengganti data contoh dengan data asli

Bisa bertahap. Produk asli dan produk contoh boleh hidup berdampingan di katalog yang sama; pita peringatan menghitung sisanya sendiri.

### Satu produk

1. Ganti nilai-nilainya di `products.json` — kode, nama, harga, ukuran, warna, bahan, deskripsi.
2. Taruh foto di `src/assets/products/<id>.jpg` (4:5, minimal 1400px sisi pendek).
3. Hapus file placeholder `<id>.webp` kalau ekstensinya berbeda.
4. Hapus field `shape`.
5. Ubah `"dummy"` jadi `false`.
6. `npm run validate`.

Kalau `id` produk ikut berubah, URL lamanya ikut berubah. Selama situs belum dipublikasikan itu tidak jadi soal.

### Seluruh katalog sekaligus

Ganti isi `products.json` dengan daftar asli, taruh semua foto, jalankan `npm run validate`, perbaiki yang dilaporkan. Tidak ada komponen yang disentuh. Jumlah produk bebas — grid, filter, dan sitemap mengikuti isi data.

### Informasi toko dan merek

Semuanya di `src/config/site.ts`. Alamat, jam buka, aturan isi satu lusin, dan ekspedisi **sudah diisi** dengan jawaban pemilik (PLACEHOLDERS.md A10–A13); tabel di bawah tetap berlaku untuk sisanya dan untuk saat salah satunya perlu diubah.

| Yang diisi | Field | Efeknya |
|---|---|---|
| Nomor WhatsApp | `whatsappNumber` | Semua tombol pesan aktif serentak. Satu-satunya tempat nomor ditulis. |
| Alamat | `store.addressLine`, `village`, `district`, `city`, `province`, `postalCode` | Bagian lokasi terisi; alamat masuk JSON-LD; tombol petunjuk arah muncul |
| Peta | `store.mapsUrl`, `store.mapsEmbedUrl` | Tombol Maps aktif; kotak bergaris putus-putus berganti peta sungguhan |
| Jam buka | `store.hours.summary` + `store.hours.openingHours` | Tampil di bagian lokasi; yang kedua masuk JSON-LD |
| Logo | `brand.logo` + file di `public/` | `Wordmark.astro` memakai file itu di header dan footer |
| Gambar Open Graph | `brand.ogImage` + file di `public/` | Dipakai semua halaman. Pakai nama file baru, jangan menimpa `og-default.png` — file itu ditulis ulang tiap `npm run gen:photos`. |
| Warna merek | `src/styles/tokens.css` | Satu blok `@theme`. Tidak ada hex yang ditulis di komponen. |
| Kebijakan grosir | `wholesalePolicy.*` | Baris wajib berganti dari "menunggu konfirmasi"; baris opsional baru muncul setelah diisi |
| Domain | `url` | Canonical, sitemap, robots.txt, Open Graph ikut serentak |

Dua bentuk penanda dipakai di file itu, dan bedanya disengaja:

- `PLACEHOLDER` — nilai yang pasti ada di dunia nyata tapi belum diberikan. Situs menampilkan penanda "menunggu data" di tempatnya.
- `null` — pertanyaan yang jawabannya belum diketahui dan mungkin memang tidak berlaku. Situs tidak menampilkan apa pun, bukan menebak.

---

## Checklist mengganti 24 produk contoh

Dipakai saat daftar produk asli dan fotonya sudah ada (PLACEHOLDERS.md B2 dan B3). Boleh dikerjakan produk demi produk — produk asli dan produk contoh bisa hidup berdampingan di katalog yang sama.

**Sebelum mulai**

- [ ] Daftar produk asli lengkap: kode artikel, nama, kategori, harga per lusin, jenis harga, ukuran, warna, bahan, deskripsi 1–2 kalimat
- [ ] Foto asli 4:5, latar polos, minimal 1400px sisi pendek, satu file per produk
- [ ] Putuskan jalurnya: lewat `products.json` (belum ada project Sanity) atau lewat Studio (sudah ada). Keduanya memakai skema yang sama; yang berbeda hanya tempat mengetik.

**Per produk — lewat `products.json`**

- [ ] `code` sesuai kode artikel sungguhan, unik, berbentuk `J-01`
- [ ] `name`, `category`, `pricePerDozen` (harga SATU LUSIN), `priceType`
- [ ] `sizes`, `colors`, `material`, `description`
- [ ] Foto di `src/assets/products/<id>.<ext>`, dan file placeholder `<id>.webp` dihapus kalau ekstensinya berbeda
- [ ] Field `shape` **dihapus** — ini yang membuat generator melewati produknya
- [ ] `"dummy": false`
- [ ] `id` dibiarkan kalau bisa. Mengubahnya mengubah alamat halaman.

**Per produk — lewat Sanity Studio**

- [ ] Isi field yang sama; Studio menolak kode, harga, dan deskripsi yang salah bentuk saat diketik
- [ ] Unggah foto, atur titik fokus kalau ada bagian yang terpotong
- [ ] Isi teks alternatif kalau fotonya perlu dijelaskan; kosongkan kalau tidak, situs merangkainya sendiri
- [ ] Matikan **"Masih data contoh"**
- [ ] Publish — draft tidak pernah terbit ke situs

**Setelah semua produk masuk**

- [ ] `npm run validate` — tidak ada kesalahan, dan peringatan yang tersisa memang wajar
- [ ] `npm run build` — jumlah halaman sesuai jumlah produk + 9 halaman tetap
- [ ] Pita "Versi pengembangan" hilang sendiri setelah tidak ada lagi `dummy: true`
- [ ] Halaman produk sekarang memancarkan structured data `Product` — periksa satu halaman di [Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Keterangan "Foto contoh" hilang dari halaman yang fotonya sudah asli
- [ ] `npm run shoot katalog produk/<id salah satu>` — periksa foto asli tidak merusak grid 4:5
- [ ] `npm run test:katalog` dan `npm run test:pesanan`
- [ ] Harga di katalog, halaman produk, drawer, dan pesan WhatsApp menunjukkan angka yang sama

**Yang tidak boleh terjadi**

- Foto asli tertimpa gambar buatan. Pengamannya: generator hanya menyentuh produk yang masih punya `shape`.
- `"dummy": false` sementara `shape` masih ada — `npm run validate` menolak ini sebagai kesalahan, bukan peringatan.
- Harga satuan masuk ke `pricePerDozen`. Nilai di bawah Rp 12.000 ditolak karena itu tidak mungkin harga satu lusin.

---

## Yang diperiksa `npm run validate`

**Kesalahan** (build gagal):

- kode, nama, kategori, harga, ukuran, atau deskripsi kosong
- `id` atau `code` kembar
- kategori atau siluet yang tidak ada di daftar resminya
- harga bukan bilangan bulat positif, atau terlalu kecil untuk satu lusin
- foto hilang, atau dua file foto dengan id yang sama
- field asing hasil salah ketik
- `"dummy": false` tapi `shape` masih ada — mengaku data asli sambil memakai foto buatan
- nomor WhatsApp yang formatnya akan menghasilkan tautan rusak

**Peringatan** (build lanjut):

- warna atau bahan belum diisi
- flag `dummy` tidak ditulis eksplisit
- foto yang tidak punya produk
- kategori tanpa produk
- nomor WhatsApp masih placeholder

Pembagiannya begitu karena peringatan adalah keadaan wajar selama data asli belum masuk; kesalahan berarti ada yang rusak.
