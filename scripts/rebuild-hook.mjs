/**
 * Penerima webhook "Publish" dari Sanity.
 *
 * Alurnya: admin menekan Publish di Studio → Sanity mengirim POST ke sini →
 * situs dibangun ulang. Tanpa ini, perubahan di CMS tidak pernah sampai ke
 * pengunjung karena situsnya statis.
 *
 * Yang TIDAK boleh disederhanakan: verifikasi tanda tangan. Endpoint rebuild
 * tanpa verifikasi bisa dipicu siapa saja yang tahu URL-nya, berkali-kali,
 * sampai kuota build habis. Setiap permintaan di sini diperiksa HMAC-nya
 * lebih dulu.
 *
 * Script ini jalan di mesin sendiri, untuk pengembangan dan untuk menguji
 * bahwa mekanismenya benar. Di hosting, logika yang sama dipasang sebagai
 * serverless function yang memanggil deploy hook penyedia — resepnya ada di
 * docs/CMS.md. Verifikasi tanda tangannya identik.
 *
 * Jalankan: npm run cms:hook
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';

const PORT = Number(process.env.HWR_HOOK_PORT ?? 4455);
const SECRET = process.env.SANITY_WEBHOOK_SECRET ?? '';
const PATH = '/rebuild';

/** Jeda sebelum build dijalankan, supaya publikasi beruntun jadi satu build. */
const JEDA_MS = Number(process.env.HWR_HOOK_DEBOUNCE ?? 5000);

if (!SECRET) {
  console.error(
    'SANITY_WEBHOOK_SECRET belum diisi.\n' +
      'Ambil secret-nya saat membuat webhook di sanity.io/manage, lalu:\n' +
      '  SANITY_WEBHOOK_SECRET="…" npm run cms:hook',
  );
  process.exit(1);
}

/**
 * Tanda tangan Sanity: header `sanity-webhook-signature` berisi
 * `t=<detik>,v1=<hmac base64url>`, dan yang ditandatangani adalah
 * `<detik>.<body mentah>`.
 */
function tandaTanganSah(header, body) {
  const bagian = Object.fromEntries(
    String(header ?? '')
      .split(',')
      .map((p) => p.split('=').map((x) => x.trim()))
      .filter((p) => p.length === 2),
  );
  const t = bagian.t;
  const v1 = bagian.v1;
  if (!t || !v1) return false;

  // Tolak permintaan lama: tanda tangan yang pernah bocor tidak bisa
  // dipakai ulang berhari-hari kemudian.
  const umurDetik = Math.abs(Date.now() / 1000 - Number(t));
  if (!Number.isFinite(umurDetik) || umurDetik > 300) return false;

  const harapan = createHmac('sha256', SECRET).update(`${t}.${body}`).digest('base64url');
  const a = Buffer.from(harapan);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

let timer = null;
let sedangBuild = false;
let antre = false;

function jadwalkanBuild() {
  clearTimeout(timer);
  timer = setTimeout(jalankanBuild, JEDA_MS);
  console.log(`  build dijadwalkan dalam ${JEDA_MS / 1000}s`);
}

function jalankanBuild() {
  if (sedangBuild) {
    antre = true;
    console.log('  build sedang jalan — permintaan ini diantre');
    return;
  }
  sedangBuild = true;
  const mulai = Date.now();
  console.log('  membangun…');

  const p = spawn('npm', ['run', 'build'], { shell: true, stdio: 'inherit' });
  p.on('exit', (code) => {
    sedangBuild = false;
    const detik = ((Date.now() - mulai) / 1000).toFixed(1);
    console.log(code === 0 ? `  build selesai dalam ${detik}s` : `  BUILD GAGAL (kode ${code})`);
    if (antre) {
      antre = false;
      jadwalkanBuild();
    }
  });
}

const server = createServer((req, res) => {
  if (req.url?.split('?')[0] !== PATH) {
    res.writeHead(404).end('not found');
    return;
  }
  if (req.method !== 'POST') {
    res.writeHead(405, { allow: 'POST' }).end('gunakan POST');
    return;
  }

  let body = '';
  req.on('data', (c) => {
    body += c;
    // Payload webhook Sanity kecil; apa pun yang jauh lebih besar bukan
    // dari Sanity.
    if (body.length > 1_000_000) req.destroy();
  });

  req.on('end', () => {
    if (!tandaTanganSah(req.headers['sanity-webhook-signature'], body)) {
      console.log(`${new Date().toISOString()} ✗ tanda tangan tidak sah — diabaikan`);
      res.writeHead(401).end('tanda tangan tidak sah');
      return;
    }

    let ringkas = 'dokumen';
    try {
      const data = JSON.parse(body);
      ringkas = `${data._type ?? 'dokumen'} ${data.name ?? data.slug?.current ?? data._id ?? ''}`.trim();
    } catch {
      /* payload boleh apa saja; yang penting tanda tangannya sah */
    }

    console.log(`${new Date().toISOString()} ✓ publish diterima: ${ringkas}`);
    jadwalkanBuild();
    res.writeHead(202, { 'content-type': 'application/json' }).end(JSON.stringify({ ok: true }));
  });
});

server.listen(PORT, () => {
  console.log(`Penerima webhook siap di http://localhost:${PORT}${PATH}`);
  console.log(`Jeda antar build: ${JEDA_MS / 1000}s. Hentikan dengan Ctrl+C.`);
});
