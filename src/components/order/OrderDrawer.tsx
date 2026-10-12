import { useEffect, useRef, useState } from 'preact/hooks';
import { useStore } from '@nanostores/preact';

import {
  lines,
  note,
  removeLine,
  setQty,
  clearOrder,
  totalDozen,
  totalPrice,
  hasFromPrice,
  type OrderLine,
} from '../../lib/order';
import { buildOrderMessage, whatsappLink, hasWhatsappNumber } from '../../lib/whatsapp';
import { formatPrice, formatRupiah } from '../../lib/format';
import { kalimatIsiLusin } from '../../lib/wholesale';
import QtyStepper from './QtyStepper';

/* Dibaca sekali saat modul dimuat: isinya konfigurasi build, bukan state. */
const ATURAN_LUSIN = kalimatIsiLusin();

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

interface Props {
  onClose: () => void;
}

/**
 * Daftar pesanan sebagai panel geser.
 *
 * Satu-satunya tempat di situs ini yang memakai bayangan
 * (docs/DESIGN-SYSTEM.md §6) dan satu-satunya gerakan yang diorkestrasi
 * (§8). Isinya tetap line sheet: kode, nama, harga, angka — tanpa foto,
 * supaya island-nya kecil dan bahasanya sama dengan katalog.
 */
export default function OrderDrawer({ onClose }: Props) {
  const items = useStore(lines);
  const catatan = useStore(note);
  const lusin = useStore(totalDozen);
  const total = useStore(totalPrice);
  const adaMulai = useStore(hasFromPrice);

  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [entered, setEntered] = useState(false);

  // Transisi masuk: dirender dulu di posisi luar layar, lalu digeser masuk.
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    closeRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      // Jebakan fokus: Tab tidak boleh keluar dari panel selama terbuka.
      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusables.length === 0) return;

      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const active = document.activeElement;

      if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const pesan = buildOrderMessage(items, catatan);
  const waHref = items.length > 0 ? whatsappLink(pesan) : null;
  const waSiap = hasWhatsappNumber();

  return (
    <div class="fixed inset-0 z-50">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        class={`absolute inset-0 w-full cursor-default bg-tinta/40 transition-opacity duration-(--durasi-drawer) ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-pesanan"
        class={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-kertas shadow-drawer transition-transform duration-(--durasi-drawer) ease-[var(--ease-keluar)] ${
          entered ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header class="flex items-center justify-between border-b border-garis px-5 py-4">
          <h2 id="judul-pesanan" class="t-sub">
            Daftar pesanan
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            class="inline-flex size-11 items-center justify-center rounded-kontrol text-tinta transition-colors duration-(--durasi-state) hover:bg-katun"
          >
            <span class="sr-only">Tutup daftar pesanan</span>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
            </svg>
          </button>
        </header>

        {items.length === 0 ? (
          <div class="flex flex-1 flex-col justify-center px-5 py-10">
            <p class="t-sub">Daftar pesanan masih kosong.</p>
            <p class="t-body mt-2 text-redup">
              Pilih produk di katalog, tentukan jumlah lusinnya, lalu kirim daftarnya lewat
              WhatsApp.
            </p>
            <a
              href="/katalog"
              class="t-tombol mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-kontrol bg-tinta px-6 text-kertas transition-colors duration-(--durasi-state) hover:bg-denim"
            >
              Buka katalog
            </a>
          </div>
        ) : (
          <>
            <ul class="flex-1 divide-y divide-garis overflow-y-auto">
              {items.map((line) => (
                <OrderRow key={line.id} line={line} />
              ))}
            </ul>

            <div class="border-t border-garis px-5 py-4">
              {/* Aturan isi lusin diulang di sini, sesaat sebelum pesan
                  dikirim: ini titik terakhir pembeli masih bisa menuliskan
                  ukuran yang dimaksud. Kalimatnya sama persis dengan yang di
                  halaman produk — keduanya dari src/lib/wholesale.ts. */}
              {ATURAN_LUSIN && <p class="t-meta mb-3 text-redup">{ATURAN_LUSIN}</p>}

              <label class="block">
                <span class="t-meta text-redup">Catatan (opsional)</span>
                <textarea
                  rows={2}
                  value={catatan}
                  onInput={(e) => note.set((e.currentTarget as HTMLTextAreaElement).value)}
                  placeholder="Ukuran tiap lusin, warna, atau catatan lain"
                  class="t-meta mt-1 w-full rounded-kontrol border border-batas bg-kertas px-3 py-2 text-tinta"
                />
              </label>

              <dl class="mt-4 flex items-baseline justify-between gap-4">
                <dt class="t-meta text-redup">
                  {items.length} produk, {lusin} lusin
                </dt>
                <dd class="t-harga">
                  {adaMulai ? `Mulai dari ${formatRupiah(total)}` : formatRupiah(total)}
                </dd>
              </dl>
              <p class="t-meta mt-1 text-redup">
                Perkiraan. Total akhir dan ongkir dikonfirmasi lewat WhatsApp.
              </p>

              {waSiap && waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener"
                  class="t-tombol mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-kontrol bg-tinta px-6 text-kertas transition-colors duration-(--durasi-state) hover:bg-denim"
                >
                  <WaGlyph />
                  Pesan via WhatsApp
                </a>
              ) : (
                <>
                  <button
                    type="button"
                    disabled
                    aria-describedby="wa-drawer-belum-siap"
                    class="t-tombol mt-4 flex min-h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-kontrol border border-garis bg-katun px-6 text-redup"
                  >
                    <WaGlyph tone="ikut" />
                    Pesan via WhatsApp
                  </button>
                  <p id="wa-drawer-belum-siap" class="t-meta mt-2 text-redup">
                    Nomor WhatsApp toko belum diisi di konfigurasi situs, jadi tautan pesan
                    belum bisa dibuat. Daftar pesanan Anda tetap tersimpan.
                  </p>
                </>
              )}

              <button
                type="button"
                onClick={clearOrder}
                class="t-meta mt-3 inline-flex min-h-11 items-center text-redup underline underline-offset-4 hover:text-tinta"
              >
                Kosongkan daftar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function OrderRow({ line }: { line: OrderLine }) {
  return (
    <li class="px-5 py-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="t-meta text-redup">{line.code}</p>
          <p class="t-produk">{line.name}</p>
          <p class="t-meta mt-1 text-redup">
            {formatPrice(line.pricePerDozen, line.priceType)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => removeLine(line.id)}
          class="inline-flex size-11 shrink-0 items-center justify-center rounded-kontrol text-redup transition-colors duration-(--durasi-state) hover:bg-katun hover:text-tinta"
        >
          <span class="sr-only">Hapus {line.name} dari daftar pesanan</span>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <div class="mt-3 flex items-center justify-between gap-3">
        <QtyStepper
          size="sm"
          value={line.qty}
          onChange={(n) => setQty(line.id, n)}
          label={`Jumlah lusin ${line.name}`}
        />
        <p class="t-harga">{formatRupiah(line.pricePerDozen * line.qty)}</p>
      </div>
    </li>
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
