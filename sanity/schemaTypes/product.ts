import { defineField, defineType } from 'sanity';

/**
 * Produk HWR Collection.
 *
 * Skema ini cermin dari skema Zod di `src/content.config.ts`. Aturannya
 * sengaja digandakan di dua tempat karena keduanya menjaga hal berbeda:
 *
 *   Sanity  → mencegah data salah MASUK. Admin dapat peringatan saat mengetik.
 *   Zod     → mencegah data salah TERBIT. Build gagal, situs tidak berubah.
 *
 * Kalau salah satu diubah, ubah keduanya. `npm run test:cms` menguji bahwa
 * data yang lolos di sini juga lolos di sana.
 *
 * Kategori TIDAK dikelola dari sini. Enam kategori itu adalah struktur situs
 * — URL, filter, navigasi — bukan konten. Daftarnya tinggal di
 * `src/data/categories.ts`; kalau berubah, daftar di bawah ikut diubah.
 */
export const product = defineType({
  name: 'product',
  title: 'Produk',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nama produk',
      type: 'string',
      description: 'Contoh: Jeans Anak Reguler',
      validation: (r) => r.required().min(3).error('Nama produk minimal 3 huruf.'),
    }),

    defineField({
      name: 'code',
      title: 'Kode artikel',
      type: 'string',
      description: 'Kode yang dipakai saat chat WhatsApp. Contoh: J-01, TR-02, CG-03.',
      validation: (r) =>
        r
          .required()
          .regex(/^[A-Z]{1,3}-\d{2}$/, { name: 'kode artikel' })
          .error('Bentuknya 1–3 huruf kapital, tanda hubung, lalu dua angka. Contoh: J-01.'),
    }),

    defineField({
      name: 'slug',
      title: 'Slug (alamat halaman)',
      type: 'slug',
      description:
        'Jadi alamat halaman produk: /produk/<slug>. Tekan "Generate" setelah nama diisi. Mengubah slug produk yang sudah terbit akan mengubah alamatnya — tautan lama tidak lagi berfungsi.',
      options: { source: 'name', maxLength: 96 },
      validation: (r) => r.required().error('Slug wajib diisi — tanpa ini halaman produk tidak bisa dibuat.'),
    }),

    defineField({
      name: 'category',
      title: 'Kategori',
      type: 'string',
      options: {
        list: [
          { title: 'Jeans', value: 'jeans' },
          { title: 'Training', value: 'training' },
          { title: 'Cargo', value: 'cargo' },
          { title: 'Kolor', value: 'kolor' },
          { title: 'Hawai', value: 'hawai' },
          { title: 'Lainnya', value: 'lainnya' },
        ],
        layout: 'radio',
      },
      validation: (r) => r.required().error('Kategori wajib dipilih.'),
    }),

    defineField({
      name: 'photo',
      title: 'Foto produk',
      type: 'image',
      description:
        'Rasio 4:5 (portrait), latar polos terang, minimal 1400px sisi pendek. Pakai titik fokus kalau perlu menggeser bagian yang terlihat.',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Teks alternatif',
          type: 'string',
          description:
            'Deskripsi singkat untuk pembaca layar dan saat gambar gagal dimuat. Contoh: "Jeans anak warna biru tua, tampak depan". Boleh dikosongkan — situs akan merangkainya dari nama dan warna produk.',
        }),
      ],
      validation: (r) => r.required().error('Foto produk wajib ada. Tanpa foto, build situs gagal.'),
    }),

    defineField({
      name: 'pricePerDozen',
      title: 'Harga per lusin',
      type: 'number',
      description: 'Rupiah untuk SATU LUSIN (12 pcs), tanpa titik. Contoh: 420000.',
      validation: (r) =>
        r
          .required()
          .integer()
          .min(12000)
          .error('Isi harga satu lusin dalam rupiah, contoh 420000 — bukan harga satuan.'),
    }),

    defineField({
      name: 'priceType',
      title: 'Jenis harga',
      type: 'string',
      initialValue: 'tetap',
      options: {
        list: [
          { title: 'Harga tetap — "Rp 420.000 / lusin"', value: 'tetap' },
          { title: 'Mulai dari — "Mulai dari Rp 465.000 / lusin"', value: 'mulai' },
        ],
        layout: 'radio',
      },
      validation: (r) => r.required(),
    }),

    defineField({
      name: 'sizes',
      title: 'Ukuran tersedia',
      type: 'array',
      of: [{ type: 'string' }],
      description:
        'Satu ukuran per baris, urut dari terkecil. Contoh anak: 1, 2, 3 … Contoh dewasa: M, L, XL, atau 28, 30, 32.',
      options: { layout: 'tags' },
      validation: (r) => r.required().min(1).error('Isi minimal satu ukuran.'),
    }),

    defineField({
      name: 'sizeNote',
      title: 'Catatan ukuran',
      type: 'string',
      description: 'Opsional, satu kalimat. Contoh: "Ukuran anak nomor 1–8".',
    }),

    defineField({
      name: 'colors',
      title: 'Pilihan warna',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Nama warna seperti yang dipakai saat chat. Contoh: Biru Tua, Hitam, Khaki.',
      options: { layout: 'tags' },
    }),

    defineField({
      name: 'material',
      title: 'Bahan',
      type: 'string',
      description: 'Contoh: Denim katun 11 oz, Diadora fleece, Katun combed. Boleh dikosongkan.',
    }),

    defineField({
      name: 'description',
      title: 'Deskripsi',
      type: 'text',
      rows: 3,
      description:
        'Satu sampai dua kalimat. Dipakai di halaman produk DAN sebagai deskripsi di hasil penelusuran Google, jadi tulis yang membantu pembeli memutuskan.',
      validation: (r) =>
        r.required().min(20).error('Deskripsi minimal 20 huruf — ini juga dipakai di hasil pencarian Google.'),
    }),

    defineField({
      name: 'featured',
      title: 'Tampilkan di beranda',
      type: 'boolean',
      initialValue: false,
      description: 'Produk pilihan yang muncul di beranda dan jadi sampul kategorinya.',
    }),

    defineField({
      name: 'dummy',
      title: 'Masih data contoh',
      type: 'boolean',
      initialValue: true,
      description:
        'Selama menyala: pita "Versi pengembangan" tampil di situs, dan halaman produk ini tidak dikirim ke mesin pencari sebagai data produk. Matikan hanya kalau nama, harga, ukuran, warna, dan fotonya sudah benar semua.',
    }),
  ],

  orderings: [
    {
      title: 'Kode artikel',
      name: 'kode',
      by: [{ field: 'code', direction: 'asc' }],
    },
    {
      title: 'Kategori lalu kode',
      name: 'kategori',
      by: [
        { field: 'category', direction: 'asc' },
        { field: 'code', direction: 'asc' },
      ],
    },
  ],

  preview: {
    select: { title: 'name', code: 'code', price: 'pricePerDozen', media: 'photo', dummy: 'dummy' },
    prepare({ title, code, price, media, dummy }) {
      const harga =
        typeof price === 'number'
          ? new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              maximumFractionDigits: 0,
            }).format(price)
          : 'harga belum diisi';
      return {
        title: dummy ? `${title} (contoh)` : title,
        subtitle: `${code ?? '—'} · ${harga} / lusin`,
        media,
      };
    },
  },
});
