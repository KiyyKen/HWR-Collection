# HWR Collection — aturan proyek

Website resmi HWR Collection: brand website + katalog produk + antarmuka pemesanan lewat WhatsApp.
HWR adalah gabungan inisial nama anggota keluarga pemilik. **Jangan pernah membuat kepanjangan atau cerita brand untuk HWR.**

Baca dulu sebelum mengerjakan apa pun:
- `docs/DECISIONS.md` — skill, stack, dan resolusi konflik
- `docs/DESIGN-SYSTEM.md` — warna, tipografi, spacing, grid, komponen, gambar, motion
- `docs/WIREFRAMES.md` — information architecture
- `docs/PLAN.md` — fase implementasi
- `docs/DATA.md` — skema produk dan cara data asli menggantikan data contoh
- `docs/CMS.md` — Sanity Studio, webhook rebuild, migrasi data
- `docs/PELUNCURAN.md` — checklist sebelum situs boleh dipublikasikan
- `PLACEHOLDERS.md` — data yang belum ada

## Stack

Astro 7 (statis) · TypeScript strict · Tailwind 4 via `@tailwindcss/vite` · Preact untuk island · nanostores untuk daftar pesanan · `astro:assets` untuk gambar · Sanity sebagai CMS (Studio ada di `sanity/`, dependensinya terpisah).

Tidak ada UI library, state manager, atau animation library. Jangan tambahkan dependency tanpa alasan yang ditulis di `docs/DECISIONS.md`.

## Menjalankan dev server

Pakai background mode:

```
npx astro dev --background
```

Kelola dengan `npx astro dev stop`, `npx astro dev status`, `npx astro dev logs`.

## Urutan skill

1. **`frontend-design` memegang seluruh keputusan visual.** Estetika, tipografi, layout, motion, copywriting UI.
2. **`ui-ux-pro-max` hanya untuk aturan, bukan selera.** Boleh: `--domain ux`, `--domain icons`, `--stack astro`, `--stack html-tailwind`. Tidak boleh: `--design-system`, `--domain style`, `--domain color`, `--domain typography`, `--domain landing`. Alasannya ada di `docs/DECISIONS.md`.
3. **`webapp-testing` untuk verifikasi visual.** Halaman tidak selesai hanya karena berhasil di-build.

Di Windows, script Python dipanggil dengan **`py`**, bukan `python3` — `python`/`python3` di mesin ini adalah stub Microsoft Store yang gagal.

```bash
py .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain ux
```

## Aturan desain yang tidak bisa ditawar

- Warna hanya lewat token di `src/styles/tokens.css`. Tidak ada hex langsung di komponen.
- Radius: 0, kecuali tombol dan input yang 2px. Tidak ada nilai lain.
- Shadow: tidak ada, kecuali satu elevasi drawer daftar pesanan.
- Produk disusun sebagai line sheet berbatas garis rambut, bukan kartu mengambang.
- Semua gambar produk 4:5, latar identik.
- Semua angka `tabular-nums`. Harga selalu membawa satuan "/ lusin".
- Penomoran (1, 2, 3) hanya di "Cara pesan", karena hanya itu yang memang urutan.
- Tidak ada eyebrow label all-caps di atas heading.
- Tidak ada scroll reveal, parallax, atau hover lift.
- Maksimal satu elemen sticky per tepi layar: filter kategori di atas, bar pesanan di bawah. Tidak pernah ada elemen mengambang ketiga. Halaman yang memakai bar bawah harus memberi `padding-bottom` pada body (lihat `[data-order-bar]` di `global.css`) supaya elemen terakhir tidak tertutup saat menerima fokus.
- Area sentuh minimum 44×44 CSS px.

## Aturan konten

Bahasa Indonesia. Nada wajar, jelas, percaya diri, hangat, profesional. Tulis seperti bisnis pakaian Indonesia sungguhan.

**Jangan pernah mengarang**: lama berdiri, jumlah pelanggan, testimoni, sertifikasi, penghargaan, ukuran gudang, nama ekspedisi, atau statistik apa pun. Kalau datanya belum ada, pakai placeholder bertanda dan catat di `PLACEHOLDERS.md`.

Hindari jargon pemasaran kosong seperti "tingkatkan pengalaman belanja Anda".

## Data

Data produk punya **dua sumber, satu skema**: Sanity kalau `projectId` di `src/config/cms.ts` sudah diisi, kalau belum `src/content/products.json`. Skema Zod di `src/content.config.ts` memvalidasi keduanya — data dari CMS tidak lebih dipercaya daripada data dari file. Informasi toko, merek, dan nomor WhatsApp di `src/config/site.ts`. Konten terpisah dari presentasi supaya data asli bisa menggantikan dummy tanpa menyentuh komponen.

`src/config/site.ts` adalah **satu-satunya** tempat nomor WhatsApp ditulis. Jangan pernah menaruh nomor di komponen, di test, atau di dokumentasi sebagai contoh yang bisa tersalin.

Aturan grosir juga ditulis sekali saja, di `site.wholesalePolicy`. Beranda, halaman produk, dan daftar pesanan membacanya lewat `src/lib/wholesale.ts` — jangan menulis ulang kalimatnya di komponen, karena tiga salinan yang berbeda berarti dua di antaranya salah.

**Semua harga dan nama produk saat ini adalah DUMMY.** Setiap entri punya flag `dummy: true`; selama itu true, halaman produknya tidak memancarkan structured data `Product`. Produk yang fotonya sudah asli tidak lagi punya field `shape`, dan generator melewatinya.

Setelah menyentuh data atau konfigurasi, jalankan **`npm run validate`** — jalan juga otomatis sebelum `npm run build` dan menggagalkan build kalau ada data rusak. Prosedur lengkapnya di `docs/DATA.md`.

## Dokumentasi Astro

https://docs.astro.build — khususnya [routing](https://docs.astro.build/en/guides/routing/), [components](https://docs.astro.build/en/basics/astro-components/), [content collections](https://docs.astro.build/en/guides/content-collections/), [styling](https://docs.astro.build/en/guides/styling/).
