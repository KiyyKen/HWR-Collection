/** Kategori produk HWR Collection. Urutan di sini = urutan tampil di situs. */

export const CATEGORY_IDS = [
  'jeans',
  'training',
  'cargo',
  'kolor',
  'hawai',
  'lainnya',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface Category {
  id: CategoryId;
  /** Label pendek untuk filter dan navigasi. */
  label: string;
  /** Nama lengkap untuk heading halaman dan judul SEO. */
  title: string;
  /** Satu kalimat, dipakai di halaman kategori dan meta description. */
  blurb: string;
}

export const categories: readonly Category[] = [
  {
    id: 'jeans',
    label: 'Jeans',
    title: 'Jeans Anak',
    blurb: 'Jeans anak potongan reguler, slim, cutbray, sampai model pendek dan jogger.',
  },
  {
    id: 'training',
    label: 'Training',
    title: 'Celana Training',
    blurb: 'Training anak dan dewasa, model panjang dan jogger.',
  },
  {
    id: 'cargo',
    label: 'Cargo',
    title: 'Celana Cargo',
    blurb: 'Cargo anak dan dewasa dengan kantong samping, panjang dan pendek.',
  },
  {
    id: 'kolor',
    label: 'Kolor',
    title: 'Celana Kolor',
    blurb: 'Kolor katun harian untuk anak dan dewasa, polos dan motif.',
  },
  {
    id: 'hawai',
    label: 'Hawai',
    title: 'Celana Hawai',
    blurb: 'Hawai motif dan polos, potongan longgar untuk anak dan dewasa.',
  },
  {
    id: 'lainnya',
    label: 'Lainnya',
    title: 'Produk Lainnya',
    blurb: 'Celana pendek katun dan setelan harian anak.',
  },
] as const;

const byId = new Map(categories.map((c) => [c.id, c]));

export function getCategory(id: CategoryId): Category {
  const found = byId.get(id);
  if (!found) throw new Error(`Kategori tidak dikenal: ${id}`);
  return found;
}
