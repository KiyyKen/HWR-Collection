# Foto produk

Semua file `.webp` di folder ini adalah **placeholder** hasil `npm run gen:photos`.
Jangan diedit manual — akan tertimpa.

## Mengganti dengan foto asli

1. Taruh foto di folder ini dengan nama `<id>.jpg` atau `<id>.webp` (id sama dengan di `products.json`), rasio 4:5, minimal 1400px sisi pendek.
2. Hapus field `shape` dari produk itu di `src/content/products.json`.
3. Hapus file placeholder lama `<id>.webp` kalau foto aslinya berekstensi lain.
4. Jalankan `npm run validate` untuk memastikan tidak ada yang tertinggal.

Langkah 2 yang penting: produk tanpa `shape` **dilewati** generator, jadi foto asli tidak akan pernah tertimpa gambar buatan. Boleh diganti satu per satu — placeholder dan foto asli bisa hidup berdampingan di katalog yang sama.

Tidak ada komponen yang perlu diubah. `src/components/ProductImage.astro` memuat file apa pun yang namanya cocok dengan id produk.

## Pedoman foto

- Rasio 4:5 portrait, latar polos terang, framing sama untuk semua produk.
- Satu produk satu foto. Galeri dibuat hanya kalau memang ada sudut lain — tidak dipalsukan dari gambar yang sama.
- Nama file = id produk. Itu satu-satunya penghubung ke data.
