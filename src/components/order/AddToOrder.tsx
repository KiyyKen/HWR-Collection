import { useEffect, useState } from 'preact/hooks';
import { useStore } from '@nanostores/preact';

import { addLine, initOrder, lines, openDrawer, ready } from '../../lib/order';
import { buildOrderMessage, hasWhatsappNumber, whatsappLink } from '../../lib/whatsapp';
import QtyStepper from './QtyStepper';

/**
 * Penyusun pesanan di halaman produk.
 *
 * Tidak merender apa pun sampai localStorage selesai dibaca. Akibatnya
 * kontrol ini tidak ada sama sekali di HTML server, dan pengunjung tanpa
 * JavaScript melihat tautan WhatsApp langsung dari <noscript> di halaman —
 * satu lusin, satu produk, tanpa kontrol mati.
 *
 * Ruang untuk blok ini sudah dicadangkan di halaman produk supaya tidak ada
 * pergeseran layout saat island selesai hidrasi.
 */
interface Props {
  id: string;
  code: string;
  name: string;
  pricePerDozen: number;
  priceType: 'tetap' | 'mulai';
}

export default function AddToOrder(props: Props) {
  const siap = useStore(ready);
  const items = useStore(lines);
  const [qty, setQty] = useState(1);

  /**
   * Render pertama di klien harus sama persis dengan hasil server (kosong),
   * supaya Preact tidak diminta menghidrasi markup yang tidak pernah ada.
   * Lihat catatan yang sama di OrderButton.tsx.
   */
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initOrder();
  }, []);

  if (!mounted || !siap) return null;

  const sudahAda = items.find((l) => l.id === props.id);
  const waSiap = hasWhatsappNumber();
  const pesan = buildOrderMessage([
    {
      code: props.code,
      name: props.name,
      qty,
      pricePerDozen: props.pricePerDozen,
      priceType: props.priceType,
    },
  ]);
  const waHref = whatsappLink(pesan);

  return (
    <div>
      <p class="t-meta text-redup" id="label-jumlah">
        Jumlah
      </p>

      <div class="mt-2">
        <QtyStepper
          value={qty}
          onChange={setQty}
          label={`Jumlah lusin ${props.name}`}
        />
      </div>

      <button
        type="button"
        onClick={() => addLine(props, qty)}
        class="t-tombol mt-3 flex min-h-12 w-full items-center justify-center rounded-kontrol bg-tinta px-6 text-kertas transition-colors duration-(--durasi-state) hover:bg-denim"
      >
        Tambah ke pesanan
      </button>

      {waSiap && waHref ? (
        <a
          href={waHref}
          target="_blank"
          rel="noopener"
          class="t-tombol mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-kontrol border border-batas px-6 text-tinta transition-colors duration-(--durasi-state) hover:border-tinta hover:bg-katun"
        >
          <WaGlyph />
          Pesan {qty} lusin via WhatsApp
        </a>
      ) : (
        <>
          <button
            type="button"
            disabled
            aria-describedby="wa-produk-belum-siap"
            class="t-tombol mt-3 flex min-h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-kontrol border border-garis bg-katun px-6 text-redup"
          >
            <WaGlyph tone="ikut" />
            Pesan {qty} lusin via WhatsApp
          </button>
          <p id="wa-produk-belum-siap" class="t-meta mt-2 text-redup">
            Nomor WhatsApp toko belum diisi di konfigurasi situs.
          </p>
        </>
      )}

      {/* Status yang bertahan, bukan notifikasi sekejap: pembeli grosir
          menambahkan beberapa model berturut-turut dan perlu tahu apa yang
          sudah masuk tanpa membuka daftar. */}
      <p role="status" class="t-meta mt-3 min-h-5 text-redup">
        {sudahAda ? (
          <>
            Di daftar pesanan: {sudahAda.qty} lusin.{' '}
            {/* Di mobile, bar bawah sudah menawarkan hal yang sama beberapa
                sentimeter di bawah ini. Dua tautan ke tujuan yang sama dalam
                satu layar hanya menambah keputusan, bukan jalan keluar. */}
            <button
              type="button"
              onClick={(e) => openDrawer(e.currentTarget as HTMLElement)}
              class="hidden text-denim underline underline-offset-4 hover:text-tinta md:inline"
            >
              Lihat pesanan
            </button>
          </>
        ) : null}
      </p>
    </div>
  );
}

function WaGlyph({ tone = 'merek' }: { tone?: 'merek' | 'ikut' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      class="shrink-0"
      fill={tone === 'merek' ? 'var(--color-wa)' : 'currentColor'}
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 5.83 2.42 8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.71-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.54c.13.17 1.74 2.65 4.21 3.71.59.26 1.05.41 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  );
}
