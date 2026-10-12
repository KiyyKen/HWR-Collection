import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';

import { schemaTypes } from './schemaTypes';

/**
 * Sanity Studio — panel admin HWR Collection.
 *
 * Project ID dibaca dari environment, tidak ditulis di repositori:
 * salin `.env.example` jadi `.env` lalu isi ID dari sanity.io/manage.
 *
 * ID yang sama harus diisi di `src/config/cms.ts` → `projectId`, karena
 * itulah saklar yang memindahkan situs dari products.json ke Sanity.
 * Langkah lengkapnya di docs/CMS.md.
 */
const projectId = process.env.SANITY_STUDIO_PROJECT_ID ?? '';
const dataset = process.env.SANITY_STUDIO_DATASET ?? 'production';

if (!projectId) {
  // Dilempar saat Studio dijalankan, bukan saat file ini diimpor oleh tooling.
  console.warn(
    '[HWR] SANITY_STUDIO_PROJECT_ID belum diisi. Salin sanity/.env.example jadi sanity/.env.',
  );
}

export default defineConfig({
  name: 'hwr-collection',
  title: 'HWR Collection',
  projectId,
  dataset,
  plugins: [structureTool()],
  schema: { types: schemaTypes },
});
