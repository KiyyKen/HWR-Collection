/// <reference types="astro/client" />

declare module 'astro' {
  interface AstroClientDirectives {
    /**
     * Hidrasi saat daftar pesanan berisi — lihat src/directives/pesanan.ts.
     */
    'client:pesanan'?: boolean;
  }
}

export {};
