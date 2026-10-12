/**
 * Kunci penyimpanan dan nama event daftar pesanan.
 *
 * Dipisah dari `order.ts` karena direktif hidrasi `client:pesanan` perlu
 * keduanya — dan direktif itu harus tetap mungil. Mengimpor `order.ts`
 * berarti menarik nanostores ke dalam bundel yang justru bertugas mencegah
 * bundel itu diunduh.
 */

/** Kunci localStorage. Naikkan versinya kalau bentuk datanya berubah. */
export const ORDER_KEY = 'hwr.pesanan.v1';

/** Disiarkan di window begitu daftar pesanan berisi. */
export const ORDER_EVENT = 'hwr:pesanan';
