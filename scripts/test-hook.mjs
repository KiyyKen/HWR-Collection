/**
 * Uji penerima webhook rebuild.
 *
 * Yang diuji bukan "apakah build jalan" — itu sudah diuji di tempat lain.
 * Yang diuji adalah SATU-SATUNYA hal yang berbahaya kalau salah: verifikasi
 * tanda tangan. Endpoint rebuild yang menerima permintaan tanpa tanda tangan
 * sah bisa dipicu siapa saja, berkali-kali, sampai kuota build habis.
 *
 * Jeda build disetel sangat panjang supaya tidak ada build yang benar-benar
 * jalan selama pengujian.
 *
 * Jalankan: npm run test:hook
 */

import { createHmac } from 'node:crypto';
import { spawn } from 'node:child_process';

const PORT = Number(process.env.HWR_HOOK_TEST_PORT ?? 4456);
const URL_HOOK = `http://localhost:${PORT}/rebuild`;
const SECRET = 'rahasia-uji-bukan-rahasia-asli';

const fails = [];
const check = (cond, label, detail = '') => {
  if (cond) console.log(`  ✓ ${label}`);
  else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
    fails.push(label);
  }
};

/** Tanda tangan dengan format yang sama seperti kiriman Sanity. */
function tandaTangan(body, { secret = SECRET, detik = Math.floor(Date.now() / 1000) } = {}) {
  const hmac = createHmac('sha256', secret).update(`${detik}.${body}`).digest('base64url');
  return `t=${detik},v1=${hmac}`;
}

async function kirim(body, header, metode = 'POST', jalur = '/rebuild') {
  const res = await fetch(`http://localhost:${PORT}${jalur}`, {
    method: metode,
    headers: {
      'content-type': 'application/json',
      ...(header ? { 'sanity-webhook-signature': header } : {}),
    },
    ...(metode === 'POST' ? { body } : {}),
  });
  return res.status;
}

async function tungguSiap(timeout = 15000) {
  const t0 = Date.now();
  for (;;) {
    try {
      await fetch(URL_HOOK, { method: 'GET' });
      return true;
    } catch {
      /* belum siap */
    }
    if (Date.now() - t0 > timeout) return false;
    await new Promise((r) => setTimeout(r, 200));
  }
}

/*
  Tanpa `shell: true` dengan sengaja: di Windows, mematikan shell pembungkus
  tidak ikut mematikan proses node di dalamnya, pipanya tetap terbuka, dan
  uji ini tidak pernah selesai.
*/
const server = spawn(process.execPath, ['scripts/rebuild-hook.mjs'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: {
    ...process.env,
    SANITY_WEBHOOK_SECRET: SECRET,
    HWR_HOOK_PORT: String(PORT),
    // Sepuluh menit: uji ini tidak boleh memicu build sungguhan.
    HWR_HOOK_DEBOUNCE: String(10 * 60 * 1000),
  },
});

let log = '';
server.stdout.on('data', (d) => (log += d));
server.stderr.on('data', (d) => (log += d));

try {
  if (!(await tungguSiap())) throw new Error(`Penerima webhook tidak siap.\n${log}`);

  /*
    Port bisa saja sudah dipakai sisa proses lain. Tanpa pemeriksaan ini,
    uji akan berjalan lancar melawan server yang SALAH dan melaporkan lulus.
  */
  await new Promise((r) => setTimeout(r, 300));
  if (!log.includes('Penerima webhook siap')) {
    throw new Error(
      `Port ${PORT} tampaknya sudah dipakai proses lain — uji ini akan menguji server yang salah.\n${log}`,
    );
  }

  const body = JSON.stringify({ _type: 'product', _id: 'p1', name: 'Celana Uji' });

  console.log('Tanda tangan');
  check((await kirim(body, tandaTangan(body))) === 202, 'Tanda tangan sah diterima');
  check(
    (await kirim(body, tandaTangan(body, { secret: 'secret-yang-salah' }))) === 401,
    'Secret salah ditolak',
  );
  check((await kirim(body, 't=123,v1=bukanhmac')) === 401, 'Tanda tangan ngawur ditolak');
  check((await kirim(body, undefined)) === 401, 'Permintaan tanpa tanda tangan ditolak');
  check(
    (await kirim('{"diubah":true}', tandaTangan(body))) === 401,
    'Body yang diubah setelah ditandatangani ditolak',
  );

  console.log('\nUmur permintaan');
  const lama = Math.floor(Date.now() / 1000) - 10 * 60;
  check(
    (await kirim(body, tandaTangan(body, { detik: lama }))) === 401,
    'Tanda tangan lama ditolak — tidak bisa dipakai ulang',
  );
  const baruSaja = Math.floor(Date.now() / 1000) - 60;
  check(
    (await kirim(body, tandaTangan(body, { detik: baruSaja }))) === 202,
    'Tanda tangan semenit lalu masih diterima',
  );

  console.log('\nJalur & metode');
  check((await kirim(body, tandaTangan(body), 'GET')) === 405, 'GET ditolak, hanya POST');
  check(
    (await kirim(body, tandaTangan(body), 'POST', '/jalur-lain')) === 404,
    'Jalur lain tidak dilayani',
  );

  // Beri kesempatan keluaran anak proses sampai ke pipa sebelum diperiksa.
  await new Promise((r) => setTimeout(r, 500));

  console.log('\nPenjadwalan');
  check(log.includes('build dijadwalkan'), 'Build dijadwalkan setelah publish sah', log.slice(-200));
  check(
    !log.includes('membangun…'),
    'Build belum jalan selama masih dalam jeda — publikasi beruntun jadi satu build',
  );
  check(log.includes('tanda tangan tidak sah'), 'Penolakan ikut tercatat di log');
} finally {
  server.kill();
}

console.log(fails.length ? `\n${fails.length} uji gagal.` : '\nSemua uji webhook lulus.');
if (fails.length) process.exitCode = 1;
