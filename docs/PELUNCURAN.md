# Checklist peluncuran — HWR Collection

Urutan yang harus dilalui sebelum situs ini boleh dilihat orang luar. Disusun di Fase 7C, setelah audit akhir.

Aturan yang memayungi seluruh daftar ini: **tidak ada satu baris pun yang boleh diisi tebakan.** Kalau datanya belum ada, langkahnya ditunda — bukan diisi sementara.

---

## 0. Keadaan sekarang

| | |
|---|---|
| Build | Lolos — 33 halaman |
| Data produk | 24 produk contoh, semuanya `dummy: true` |
| Nomor WhatsApp | Belum ada → seluruh tombol pesan nonaktif |
| Domain | Masih `hwrcollection.example` → **robots.txt memblokir seluruh mesin pencari** |
| CMS | Kode lengkap dan teruji, belum tersambung ke project mana pun |

Situs bisa dibangun dan diuji penuh dalam keadaan ini. Yang tidak bisa adalah dipublikasikan.

---

## 1. Data dari pemilik

Rinciannya di [PLACEHOLDERS.md](../PLACEHOLDERS.md).

- [ ] **B1 — Nomor WhatsApp.** Satu-satunya pemblokir mutlak. Tanpa ini seluruh alur pemesanan mati.
- [ ] **B17 — Domain final.** Selama masih domain contoh, robots.txt memancarkan `Disallow: /`.
- [ ] **B2, B3 — Produk dan foto asli.** Boleh bertahap; ikuti [checklist produk di DATA.md](DATA.md#checklist-mengganti-24-produk-contoh).
- [ ] **B6, B7 — Tautan Google Maps dan kode sematan peta.** Alamat sudah ada; yang belum hanya tautannya.
- [ ] **B9, B10 — Logo dan versi kotaknya.**
- [ ] B14, B15, B16 — Project Sanity, secret webhook, deploy hook. Hanya perlu kalau admin akan mengelola produk sendiri.

Yang **sudah** diberikan dan tidak perlu ditanyakan lagi: alamat, jam buka, aturan isi satu lusin, ekspedisi, dan pembayaran.

---

## 2. Isi datanya

- [ ] `src/config/site.ts` → `whatsappNumber`, `url`, `store.mapsUrl`, `store.mapsEmbedUrl`, `brand.logo`
- [ ] Produk asli masuk — lewat `products.json` atau lewat Sanity Studio
- [ ] `npm run validate` — nol kesalahan, dan peringatan yang tersisa memang disengaja

Setelah `url` diisi domain asli, robots.txt berganti sendiri jadi `Allow: /` beserta baris Sitemap yang benar. Tidak ada file lain yang perlu disentuh.

---

## 3. Verifikasi sebelum deploy

Jalankan berurutan; semuanya harus lulus.

```bash
npx astro check          # 0 error
npm run validate         # data produk & konfigurasi
npm run build            # 33 halaman (atau sejumlah produk + 9)
npm run test:katalog     # filter, cari, urut, URL state, tanpa-JS
npm run test:pesanan     # rute produk, 404, drawer, keyboard, penyimpanan
npm run test:whatsapp    # jalur wa.me
npm run test:data        # gladi bersih seluruh placeholder terisi
npm run a11y             # struktur, fokus, target sentuh, kontras
npm run shoot            # overflow, heading, alt, console — 3 viewport
npm run perf             # LCP < 2,5s · CLS < 0,1 · JS < 30 KB
```

Kalau CMS dipakai, tambahkan `npm run test:cms` dan `npm run test:migrasi`.

Pemeriksaan manual yang tidak bisa diotomatiskan:

- [ ] Buka satu tautan `wa.me` di **HP sungguhan** dan pastikan aplikasi WhatsApp benar-benar terbuka dengan pesan terisi. Ini satu-satunya bagian alur yang belum pernah diuji di perangkat asli.
- [ ] Baca ulang seluruh teks beranda dengan mata pemilik: tidak ada klaim yang tidak benar.
- [ ] Periksa satu halaman produk di [Rich Results Test](https://search.google.com/test/rich-results) setelah `dummy` dimatikan.

---

## 4. Deploy

Belum pernah dilakukan; ini rencananya.

- [ ] Pilih hosting. `docs/DECISIONS.md` menyebut **Cloudflare Pages** — ada PoP Jakarta, free tier, cocok untuk keluaran statis. Netlify setara.
- [ ] Build command `npm run build`, output directory `dist`, Node ≥ 22.12.
- [ ] Arahkan domain, pasang HTTPS.
- [ ] Pastikan host menyajikan `dist/404.html` sebagai halaman 404 — Cloudflare Pages dan Netlify melakukannya otomatis.
- [ ] Buka `/<domain>/robots.txt` setelah deploy pertama dan pastikan isinya `Allow: /`, bukan `Disallow: /`. Kalau masih melarang, berarti `site.url` belum diisi.
- [ ] Daftarkan sitemap di Google Search Console.

---

## 5. Setelah deploy

- [ ] Kirim satu pesanan percobaan lewat situs dan pastikan pesannya masuk ke WhatsApp toko dengan rapi.
- [ ] Kalau CMS dipakai: ubah satu harga di Studio, tekan Publish, pastikan webhook memicu rebuild dan perubahannya muncul.
- [ ] Simpan `products.json` sebagai cadangan sampai beberapa siklus publish berjalan mulus.

---

## Yang sengaja tidak dilakukan

**Tidak ada analytics.** Belum diminta, dan setiap script pihak ketiga membatalkan sebagian profil performa yang dibangun sejak Fase 6. Kalau nanti dibutuhkan, pilih yang tanpa cookie dan ukur ulang dengan `npm run perf`.

**Tidak ada halaman kebijakan privasi.** Situs ini tidak mengumpulkan data apa pun: tidak ada form, tidak ada akun, tidak ada cookie. Daftar pesanan disimpan di `localStorage` peramban pengunjung dan tidak pernah dikirim ke mana pun kecuali ke WhatsApp, atas tindakan pengunjung sendiri. Kalau analytics ditambahkan, keadaan ini berubah dan halaman itu jadi perlu.
