import { getCollection, type CollectionEntry } from 'astro:content';

import { CATEGORY_IDS, type CategoryId } from '../data/categories';

export type Product = CollectionEntry<'products'>;
export type ProductData = Product['data'];

const order = new Map(CATEGORY_IDS.map((id, i) => [id, i]));

/** Semua produk, diurutkan per kategori lalu per kode artikel. */
export async function getProducts(): Promise<Product[]> {
  const all = await getCollection('products');
  return all.sort((a, b) => {
    const byCategory = order.get(a.data.category)! - order.get(b.data.category)!;
    return byCategory !== 0 ? byCategory : a.data.code.localeCompare(b.data.code);
  });
}

export async function getProductsByCategory(category: CategoryId): Promise<Product[]> {
  return (await getProducts()).filter((p) => p.data.category === category);
}

/** Produk yang tampil di beranda. */
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  return (await getProducts()).filter((p) => p.data.featured).slice(0, limit);
}

/** Satu produk berdasarkan id, atau undefined kalau tidak ada. */
export async function getProduct(id: string): Promise<Product | undefined> {
  return (await getProducts()).find((p) => p.id === id);
}

/**
 * Produk lain di kategori yang sama, untuk ditawarkan di halaman detail.
 * Kalau kategorinya sedikit isinya, sisanya diambil dari kategori lain
 * supaya barisnya tidak setengah kosong.
 */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const all = await getProducts();
  const sameCategory = all.filter(
    (p) => p.id !== product.id && p.data.category === product.data.category,
  );
  if (sameCategory.length >= limit) return sameCategory.slice(0, limit);

  const others = all.filter(
    (p) => p.id !== product.id && p.data.category !== product.data.category,
  );
  return [...sameCategory, ...others].slice(0, limit);
}

/** Jumlah produk per kategori, dipakai di filter katalog. */
export async function countByCategory(): Promise<Map<CategoryId, number>> {
  const all = await getProducts();
  const counts = new Map<CategoryId, number>(CATEGORY_IDS.map((id) => [id, 0]));
  for (const p of all) {
    counts.set(p.data.category, (counts.get(p.data.category) ?? 0) + 1);
  }
  return counts;
}

/** Satu produk per kategori, dipakai sebagai gambar tile kategori. */
export async function getCategoryCovers(): Promise<Map<CategoryId, Product>> {
  const all = await getProducts();
  const covers = new Map<CategoryId, Product>();
  for (const id of CATEGORY_IDS) {
    const cover = all.find((p) => p.data.category === id && p.data.featured)
      ?? all.find((p) => p.data.category === id);
    if (cover) covers.set(id, cover);
  }
  return covers;
}

/**
 * Berapa produk yang masih memakai data dummy.
 *
 * Dipakai untuk menampilkan pita peringatan di situs selama pengembangan,
 * supaya tidak ada yang mengira harga dan nama di katalog ini asli.
 */
export async function countDummyProducts(): Promise<number> {
  return (await getProducts()).filter((p) => p.data.dummy).length;
}

/** Alt text untuk foto produk: sebut garmen dan warnanya, bukan nama file. */
export function productAlt(data: ProductData): string {
  const warna = data.colors[0];
  return warna
    ? `${data.name} warna ${warna.toLowerCase()}, tampak depan`
    : `${data.name}, tampak depan`;
}
