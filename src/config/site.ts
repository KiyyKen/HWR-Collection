/**
 * Konfigurasi situs HWR Collection.
 *
 * SEMUA nilai bertanda PLACEHOLDER di bawah ini harus diganti dengan data asli
 * sebelum situs dipublikasikan. Lihat PLACEHOLDERS.md di root proyek.
 *
 * Tidak ada nomor, alamat, atau klaim yang dikarang di file ini.
 *
 * Dua bentuk penanda dipakai, dan bedanya disengaja:
 *
 *   PLACEHOLDER  → nilai yang PASTI ada di dunia nyata tapi belum diberikan
 *                  (nomor WhatsApp, alamat, jam buka). Situs menampilkan
 *                  penanda "menunggu data" di tempatnya.
 *
 *   null         → pertanyaan yang jawabannya belum diketahui dan mungkin
 *                  memang tidak berlaku (boleh campur warna? ada harga kodi?).
 *                  Situs tidak menampilkan apa pun, bukan menebak.
 */

/** Penanda bahwa sebuah nilai masih dummy/development. */
export const PLACEHOLDER = '__PLACEHOLDER__' as const;

export type Placeholder = typeof PLACEHOLDER;

/** true jika nilai belum diisi data asli. */
export function isPlaceholder(value: string | null | undefined): boolean {
  return !value || value === PLACEHOLDER;
}

export const site = {
  name: 'HWR Collection',
  /**
   * HWR adalah gabungan inisial nama anggota keluarga pemilik.
   * Jangan pernah menulis kepanjangan atau cerita brand untuk HWR.
   */
  tagline: 'Grosir celana anak & dewasa',
  /*
    Deskripsi beranda dan `Store` di JSON-LD. Lokasi toko ikut disebut sejak
    alamatnya diberikan pemilik: pembeli grosir celana di Jakarta mencari
    dengan nama daerah, dan Cipulir adalah informasi yang memang benar —
    bukan kata kunci yang ditempel. Nama merek tidak perlu diulang di sini
    karena sudah ada di judul halaman.

    155 karakter. Batas aman hasil penelusuran ±160; kalau ditambah, yang
    hilang justru kalimat terakhirnya.
  */
  description:
    'Grosir jeans anak, celana training, cargo, kolor, dan Hawai di Cipulir, Jakarta Selatan. Minimum 1 lusin, kirim ke seluruh Indonesia. Pesan lewat WhatsApp.',

  /** PLACEHOLDER — domain final belum ditentukan. */
  url: 'https://hwrcollection.example',

  /** Bahasa & lokal untuk format angka dan tanggal. */
  lang: 'id',
  locale: 'id-ID',

  /**
   * Nomor WhatsApp toko. Diberikan pemilik sebagai 081314801091; ditulis di
   * sini dalam bentuk internasional karena itu yang diterima wa.me.
   *
   * SATU-SATUNYA tempat nomor WhatsApp ditulis di seluruh proyek. Semua
   * tombol, tautan wa.me, dan pesan pesanan membacanya dari sini lewat
   * `src/lib/whatsapp.ts`. Jangan pernah menulis nomor di komponen.
   *
   * Format: kode negara tanpa "+" dan tanpa "0" di depan, contoh "6281234567890".
   * Selama masih PLACEHOLDER, tombol pesan dinonaktifkan dan menampilkan penjelasan.
   */
  whatsappNumber: '6281314801091' as string,

  /**
   * Aset merek. Semuanya sementara sampai file asli datang.
   * Cara mengganti: README.md bagian "Mengganti data contoh dengan data asli".
   */
  brand: {
    /**
     * Logo asli. null = pakai wordmark sementara berbasis Archivo.
     * Isi dengan path di folder public/, contoh "/logo-hwr.svg".
     * Begitu diisi, `Wordmark.astro` memakainya tanpa perubahan kode lain.
     */
    /**
     * Logo asli, dipotong dari spanduk toko: monogram HWR dalam lingkaran
     * plus wordmark "H.W.R Collection", latar putihnya dibuat transparan
     * supaya bisa duduk di ground terang maupun gelap. Rasionya 4,69:1.
     *
     * Disimpan 479×102, yaitu dua kali tinggi tampil terbesarnya (footer,
     * 51px). File aslinya 1314px dan berbobot 218 KB; dikirim apa adanya ke
     * SETIAP halaman termasuk 404, dan itu terlihat jelas di `npm run perf`.
     * Versi sekarang 24 KB. Kalau logonya diganti, kecilkan dengan cara yang
     * sama dan perbarui `logoAspect`.
     */
    logo: '/logo-hwr.webp' as string | null,
    /**
     * Tinggi tampil logo dalam px. Dipakai hanya kalau `logo` diisi.
     *
     * 38, bukan 28 seperti wordmark sementara dulu: lockup aslinya memuat
     * monogram, "H.W.R", dan "Collection" dalam satu strip selebar 4,7 kali
     * tingginya, jadi di 28px kata "Collection" tinggal sekitar 8px dan
     * berhenti terbaca.
     */
    logoHeight: 38,
    /**
     * Rasio lebar ÷ tinggi file logo (479 × 102 = 4,696).
     *
     * Dipakai menghitung atribut `width` supaya peramban bisa mencadangkan
     * ruangnya sebelum gambar selesai dimuat. Tanpa itu header bergeser saat
     * logo masuk, dan CLS yang selama ini 0,000 ikut rusak. Perbarui angkanya
     * kalau file logonya diganti dengan rasio lain.
     */
    logoAspect: 479 / 102,
    /** Teks alternatif logo. */
    logoAlt: 'HWR Collection',
    /**
     * Gambar Open Graph, 1200×630.
     *
     * Ukurannya ikut ditulis di <head>: tanpa itu WhatsApp dan Facebook
     * harus mengunduh gambarnya dulu sebelum bisa menyusun pratinjau, dan
     * pratinjau pertama sering muncul tanpa gambar. Kalau file diganti
     * dengan ukuran lain, perbarui angkanya di sini juga.
     */
    ogImage: '/og-default.png',
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: 'HWR Collection — grosir celana anak & dewasa, minimum 1 lusin',
    /** Favicon utama (SVG) dan cadangannya (ICO). */
    favicon: '/favicon.svg',
    faviconFallback: '/favicon.ico',
    /** Warna bar browser di Android. Ikut token "tinta". */
    themeColor: '#17233b',
  },

  /**
   * Informasi toko.
   *
   * Alamat, kelurahan, kecamatan, kota, provinsi, dan kode pos DIBERIKAN
   * pemilik. Nomor bangunan dan RT/RW belum diberikan, jadi baris jalannya
   * berhenti di nama jalan — tidak ditambah nomor tebakan.
   *
   * Tautan peta, telepon, dan email masih menunggu.
   */
  store: {
    addressLine: 'Jalan Ciledug Raya' as string,
    village: 'Cipulir' as string,
    district: 'Kebayoran Lama' as string,
    city: 'Jakarta Selatan' as string,
    province: 'DKI Jakarta' as string,
    postalCode: '12230' as string,
    /**
     * Tautan Google Maps toko, hasil "Bagikan" di aplikasi Maps.
     * Menunjuk Pasar Cipulir, tempat kios HWR berada.
     */
    mapsUrl: 'https://maps.app.goo.gl/hS4SLWMMXsHxaTQ86' as string,
    /** URL di dalam atribut src hasil "Sematkan peta" di Google Maps. */
    mapsEmbedUrl: PLACEHOLDER as string,
    phone: PLACEHOLDER as string,
    email: PLACEHOLDER as string,

    /**
     * Jam buka — DIBERIKAN pemilik: buka setiap hari 08.00–17.00.
     *
     * `summary` untuk dibaca manusia, `openingHours` untuk JSON-LD.
     * Keduanya diisi dari jawaban yang sama; jangan diisi salah satu saja —
     * `npm run validate` menolak kalau hanya satu yang terisi.
     */
    hours: {
      summary: 'Setiap hari 08.00–17.00' as string,
      /** Format schema.org. Mo-Su = Senin sampai Minggu. */
      openingHours: ['Mo-Su 08:00-17:00'] as readonly string[],
    },
  },

  /** PLACEHOLDER — akun sosial, kosongkan yang memang tidak ada. */
  social: {
    instagram: PLACEHOLDER as string,
    tiktok: PLACEHOLDER as string,
    shopee: PLACEHOLDER as string,
    tokopedia: PLACEHOLDER as string,
  },

  /** Ketentuan grosir yang sudah pasti dari brief. */
  wholesale: {
    /** Minimum pemesanan dalam lusin. */
    minOrderDozen: 1,
    /** Isi satu lusin. */
    piecesPerDozen: 12,
    /** Jangkauan pengiriman. */
    shippingArea: 'Seluruh Indonesia',
  },

  /**
   * Kebijakan yang menjelaskan CARA KERJA situs, bukan klaim tentang bisnis.
   *
   * Ini benar tanpa perlu dikonfirmasi siapa pun: situs memang tidak punya
   * checkout, jadi total dan pembayaran memang diurus lewat WhatsApp. Tetap
   * ditaruh di konfigurasi supaya kalimatnya bisa diganti tanpa menyentuh
   * komponen — misalnya saat metode pembayaran resmi sudah ditentukan.
   *
   * Pemilik mengonfirmasi bahwa pembayaran memang disepakati lewat WhatsApp,
   * jadi `wholesalePolicy.payment` sengaja dibiarkan null: mengisinya dengan
   * kalimat yang sama persis hanya menduplikasi sumber.
   */
  orderFlow: {
    shippingCost: 'Dihitung saat konfirmasi pesanan',
    payment: 'Dikonfirmasi lewat WhatsApp',
  },

  /**
   * Kebijakan grosir.
   *
   * Empat baris pertama DIKONFIRMASI pemilik dan dipakai serentak di beranda,
   * halaman produk, dan daftar pesanan lewat `src/lib/wholesale.ts` — kalimat
   * yang sama, satu sumber. Mengubahnya di sini mengubah ketiganya.
   *
   * Sisanya masih null: pertanyaan yang belum dijawab dan mungkin memang
   * tidak berlaku. Baris opsional tidak muncul sama sekali selama null —
   * situs tidak boleh memamerkan daftar kosong.
   */
  wholesalePolicy: {
    /** Boleh campur ukuran dalam satu lusin? Tidak. */
    mixedSizes: 'Satu lusin satu ukuran' as string | null,
    /** Boleh campur warna dalam satu lusin? Boleh. */
    mixedColors: 'Boleh campur warna dalam satu lusin' as string | null,
    /** Boleh campur model dalam satu lusin? Tidak. */
    mixedModels: 'Tidak bisa — satu lusin satu model' as string | null,
    /**
     * Ekspedisi. Pemilik tidak mengunci satu nama ekspedisi; pembeli bebas
     * memilih dan pilihannya disepakati saat konfirmasi. Tidak ada nama
     * ekspedisi yang ditulis di sini (CLAUDE.md, aturan konten).
     */
    couriers: 'Bebas pilih ekspedisi, dikonfirmasi lewat WhatsApp' as string | null,

    /* Opsional: hanya tampil kalau diisi. */

    /** Ada harga khusus untuk kodi atau karton? */
    bulkTier: null as string | null,
    /** Melayani eceran satuan? */
    retail: null as string | null,
    /** Berapa lama pesanan diproses sebelum dikirim? */
    processingTime: null as string | null,
    /** Syarat atau keuntungan khusus reseller, kalau ada. */
    reseller: null as string | null,
    /**
     * Metode pembayaran resmi, kalau sudah ditentukan.
     * Selama null, situs memakai `orderFlow.payment`.
     */
    payment: null as string | null,
  },
} as const;

export type Site = typeof site;
