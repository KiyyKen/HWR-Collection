import { defineConfig } from 'astro/config';
import type { AstroIntegration } from 'astro';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import { site } from './src/config/site';
import { imageHostname, imageProtocol, isCmsConfigured } from './src/config/cms';

/**
 * Mendaftarkan direktif hidrasi `client:pesanan`.
 *
 * Tombol daftar pesanan baru dihidrasi kalau daftarnya memang berisi.
 * Alasan lengkapnya ada di src/directives/pesanan.ts.
 */
function direktifPesanan(): AstroIntegration {
  return {
    name: 'hwr:direktif-pesanan',
    hooks: {
      'astro:config:setup': ({ addClientDirective }) => {
        addClientDirective({ name: 'pesanan', entrypoint: './src/directives/pesanan.ts' });
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: site.url,
  output: 'static',
  // Toolbar dev ikut terpotret saat verifikasi visual dan menutupi konten.
  devToolbar: { enabled: false },
  integrations: [preact({ compat: false }), sitemap(), direktifPesanan()],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: 'auto',
  },
  /*
    Foto dari Sanity ikut pipeline optimasi yang sama dengan foto lokal:
    diunduh saat build, diturunkan jadi srcset, dan keluar di dist/. Jadi
    tidak ada permintaan ke CDN pihak ketiga dari browser pengunjung, dan
    profil performa yang diverifikasi di Fase 6 tetap berlaku.

    Daftar host dibiarkan kosong selama CMS belum dikonfigurasi — tidak ada
    gunanya mengizinkan host yang tidak pernah dipanggil.
  */
  image: {
    remotePatterns: isCmsConfigured()
      ? [{ protocol: imageProtocol(), hostname: imageHostname() }]
      : [],
  },
});
