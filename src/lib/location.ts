import { site, isPlaceholder } from '../config/site';

/**
 * Lokasi toko — satu-satunya tempat alamat dirangkai jadi teks dan tautan.
 *
 * Aturan yang dipegang seluruh file ini: **tidak ada yang dikarang.** Tidak
 * ada koordinat tebakan, tidak ada nama kota contoh, tidak ada tautan peta
 * yang dibuat-buat. Selama sebuah bagian alamat masih placeholder, bagian
 * itu hilang dari keluaran — bukan diganti isian sementara yang terlihat
 * seperti data asli.
 *
 * Semua fungsi di sini aman dipanggil dengan data setengah jadi: kalau
 * pemilik baru memberi kota tanpa kode pos, yang tampil hanya kotanya.
 */

const { store } = site;

/** Nilai kalau sudah diisi, null kalau masih placeholder. */
function real(value: string): string | null {
  return isPlaceholder(value) ? null : value;
}

/** Gabung potongan alamat yang sudah ada, buang yang masih kosong. */
function join(parts: (string | null)[], separator = ', '): string | null {
  const filled = parts.filter((p): p is string => p !== null && p.trim() !== '');
  return filled.length > 0 ? filled.join(separator) : null;
}

/** true kalau setidaknya baris jalan sudah diisi. */
export function hasAddress(): boolean {
  return real(store.addressLine) !== null;
}

/**
 * Alamat sebagai baris-baris terpisah, siap dirender bertumpuk.
 * Array kosong berarti belum ada alamat sama sekali.
 */
export function addressLines(): string[] {
  const lines = [
    real(store.addressLine),
    join([real(store.village), real(store.district)]),
    join([real(store.city), join([real(store.province), real(store.postalCode)], ' ')]),
  ];
  return lines.filter((line): line is string => line !== null);
}

/** Alamat dalam satu baris, untuk tautan peta dan meta description. */
export function addressOneLine(): string | null {
  return join(addressLines());
}

/** Tautan Google Maps toko. null selama belum diberikan. */
export function mapsUrl(): string | null {
  return real(store.mapsUrl);
}

/** URL peta sematan. null selama belum diberikan. */
export function mapEmbedUrl(): string | null {
  return real(store.mapsEmbedUrl);
}

/**
 * Tautan navigasi "antar saya ke sini".
 *
 * Dirakit dari alamat yang pemilik berikan, bukan dari koordinat tebakan.
 * Kalau alamatnya belum ada, hasilnya null dan tombolnya tidak dibuat.
 */
export function directionsUrl(): string | null {
  const alamat = addressOneLine();
  if (!alamat) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(alamat)}`;
}

/** Jam buka untuk dibaca manusia. null selama belum diberikan. */
export function openingHoursSummary(): string | null {
  return real(store.hours.summary);
}

/** Nomor telepon toko, kalau berbeda dari WhatsApp. */
export function storePhone(): string | null {
  return real(store.phone);
}

/** Alamat email toko. */
export function storeEmail(): string | null {
  return real(store.email);
}

/**
 * Blok PostalAddress untuk JSON-LD, atau null kalau datanya belum cukup.
 *
 * Kota adalah syarat minimum: alamat tanpa kota tidak berguna untuk mesin
 * pencari dan hanya mengisi hasil penelusuran dengan potongan yang salah.
 */
export function postalAddress(): Record<string, string> | null {
  const city = real(store.city);
  if (!city) return null;

  /*
    Kelurahan dan kecamatan tidak punya field sendiri di schema.org, dan
    keduanya justru yang dipakai orang untuk mengenali lokasi di Jakarta.
    Jadi ketiganya digabung jadi satu `streetAddress` — sama persis dengan
    dua baris pertama alamat yang tampil di halaman, bukan susunan lain.
  */
  const jalan = join([real(store.addressLine), real(store.village), real(store.district)]);

  return {
    '@type': 'PostalAddress',
    addressCountry: 'ID',
    addressLocality: city,
    ...(jalan ? { streetAddress: jalan } : {}),
    ...(real(store.province) ? { addressRegion: store.province } : {}),
    ...(real(store.postalCode) ? { postalCode: store.postalCode } : {}),
  };
}

/** Jam buka format schema.org, kosong kalau belum diberikan. */
export function openingHoursSpec(): readonly string[] {
  return store.hours.openingHours;
}
