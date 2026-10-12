import { MAX_QTY, MIN_QTY } from '../../lib/order';

/**
 * Pengatur jumlah lusin.
 *
 * Kolom angka bisa diketik langsung — pembeli grosir sering memesan belasan
 * lusin sekaligus, dan menekan "+" dua belas kali bukan cara yang masuk akal.
 * Tombol − / + tetap ada untuk penyesuaian kecil di layar sentuh.
 */
interface Props {
  value: number;
  onChange: (next: number) => void;
  /** Nama yang dibacakan pembaca layar, misalnya "Jumlah lusin Jeans Anak Reguler". */
  label: string;
  /** "sm" dipakai di dalam drawer, tingginya tetap 44px. */
  size?: 'md' | 'sm';
}

export default function QtyStepper({ value, onChange, label, size = 'md' }: Props) {
  const clamp = (n: number) => Math.min(MAX_QTY, Math.max(MIN_QTY, n));
  const width = size === 'sm' ? 'w-12' : 'w-16';

  const btn =
    'inline-flex size-11 shrink-0 items-center justify-center text-tinta ' +
    'transition-colors duration-(--durasi-state) hover:bg-katun ' +
    'disabled:cursor-not-allowed disabled:text-redup disabled:hover:bg-transparent';

  return (
    <div class="inline-flex items-center rounded-kontrol border border-batas">
      <button
        type="button"
        class={btn}
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= MIN_QTY}
        aria-label={`Kurangi ${label.toLowerCase()}`}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14" stroke-linecap="round" />
        </svg>
      </button>

      <label class="flex items-center gap-1 px-1">
        <span class="sr-only">{label}</span>
        <input
          type="number"
          inputMode="numeric"
          min={MIN_QTY}
          max={MAX_QTY}
          step={1}
          value={value}
          onInput={(e) => {
            const raw = (e.currentTarget as HTMLInputElement).value;
            if (raw === '') return;
            onChange(clamp(Number(raw)));
          }}
          onBlur={(e) => {
            const raw = (e.currentTarget as HTMLInputElement).value;
            onChange(clamp(raw === '' ? MIN_QTY : Number(raw)));
          }}
          class={`t-harga ${width} h-11 appearance-none border-0 bg-transparent text-center text-tinta focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
        />
        <span class="t-meta shrink-0 pr-1 text-redup" aria-hidden="true">
          lusin
        </span>
      </label>

      <button
        type="button"
        class={btn}
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= MAX_QTY}
        aria-label={`Tambah ${label.toLowerCase()}`}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  );
}
