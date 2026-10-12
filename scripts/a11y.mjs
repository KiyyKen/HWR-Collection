/**
 * Pemeriksaan aksesibilitas & interaksi.
 *
 * Bukan pengganti pengujian manual dengan screen reader, tapi menangkap
 * kelas masalah yang paling sering lolos: focus tidak terlihat, urutan
 * heading melompat, kontrol tanpa nama, target sentuh terlalu kecil, menu
 * mobile yang tidak bisa dioperasikan lewat keyboard, dan kontras yang
 * kurang.
 *
 * Kontras dihitung dari HASIL RENDER, bukan dari tabel token di
 * docs/DESIGN-SYSTEM.md. Tabel itu hanya memuat pasangan yang terpikirkan
 * saat menulisnya; yang benar-benar tampil di layar adalah gabungan warna
 * teks dengan latar terdekat yang tidak transparan — dan itu bisa berbeda.
 *
 * Jalankan: npm run a11y [rute...]
 * Tanpa argumen, memeriksa satu rute per jenis halaman.
 */

import { chromium } from 'playwright';

const BASE = 'http://localhost:4321';

/* Satu rute per jenis halaman. Halaman produk dan kategori lain memakai
   komponen yang sama persis; memeriksa semuanya menambah waktu tanpa
   menambah informasi. */
const DEFAULT = ['/', '/katalog', '/katalog/jeans', '/produk/jeans-anak-reguler', '/404'];

// Git Bash di Windows menerjemahkan argumen berawalan "/" jadi path Windows,
// jadi rute ditulis tanpa garis miring depan dan dinormalkan di sini.
const args = process.argv.slice(2);
const routes = (args.length > 0 ? args : DEFAULT).map((r) => (r.startsWith('/') ? r : `/${r}`));

const browser = await chromium.launch();
const problems = [];
const lapor = (route, msg) => problems.push(`${route} — ${msg}`);

/**
 * Kontras teks terhadap latar yang benar-benar tampil.
 *
 * Latar diambil dengan menaiki pohon DOM sampai menemukan warna yang tidak
 * transparan, persis seperti yang dilihat mata. Elemen di atas gambar atau
 * gradien dilewati dan disebutkan, karena rasionya tidak bisa dihitung dari
 * satu warna saja.
 */
async function periksaKontras(page, route) {
  const hasil = await page.evaluate(() => {
    const parse = (c) => {
      const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
      if (!m) return null;
      return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
    };
    const lin = (c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    const lum = ({ r, g, b }) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const campur = (atas, bawah) => ({
      r: atas.r * atas.a + bawah.r * (1 - atas.a),
      g: atas.g * atas.a + bawah.g * (1 - atas.a),
      b: atas.b * atas.a + bawah.b * (1 - atas.a),
      a: 1,
    });

    /** Latar efektif: turun dari putih, menumpuk setiap lapis semi-transparan. */
    function latar(el) {
      const tumpukan = [];
      for (let n = el; n && n !== document.documentElement.parentElement; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.backgroundImage && cs.backgroundImage !== 'none') return { gambar: true };
        const c = parse(cs.backgroundColor);
        if (c && c.a > 0) {
          tumpukan.push(c);
          if (c.a === 1) break;
        }
      }
      let hasil = { r: 255, g: 255, b: 255, a: 1 };
      for (const c of tumpukan.reverse()) hasil = campur(c, hasil);
      return { warna: hasil };
    }

    const out = [];
    const terlihat = (el) => {
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 1 && r.height > 1;
    };

    for (const el of document.querySelectorAll('body *')) {
      // Hanya elemen yang benar-benar memuat teksnya sendiri.
      const teks = [...el.childNodes]
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent.trim())
        .join(' ')
        .trim();
      if (!teks || !terlihat(el)) continue;

      const cs = getComputedStyle(el);
      const fg = parse(cs.color);
      if (!fg) continue;

      const bg = latar(el);
      if (bg.gambar) {
        out.push({ teks: teks.slice(0, 40), gambar: true });
        continue;
      }

      const depan = fg.a < 1 ? campur(fg, bg.warna) : fg;
      const [hi, lo] = [lum(depan), lum(bg.warna)].sort((a, b) => b - a);
      const rasio = (hi + 0.05) / (lo + 0.05);

      const px = parseFloat(cs.fontSize);
      const tebal = Number(cs.fontWeight) >= 700;
      const besar = px >= 24 || (tebal && px >= 18.66);
      const ambang = besar ? 3 : 4.5;

      if (rasio < ambang) {
        out.push({
          teks: teks.slice(0, 40),
          rasio: Math.round(rasio * 100) / 100,
          ambang,
          px: Math.round(px * 10) / 10,
          warna: cs.color,
          latar: `rgb(${Math.round(bg.warna.r)}, ${Math.round(bg.warna.g)}, ${Math.round(bg.warna.b)})`,
        });
      }
    }
    return out;
  });

  for (const h of hasil) {
    if (h.gambar) lapor(route, `Kontras tidak terhitung, teks di atas gambar: "${h.teks}"`);
    else
      lapor(
        route,
        `Kontras ${h.rasio}:1 (minimal ${h.ambang}) pada "${h.teks}" — ${h.warna} di atas ${h.latar}, ${h.px}px`,
      );
  }
}

/* ── Menu mobile, target sentuh, area klik sel ─────────────────────── */
async function periksaMobile(route) {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await page.goto(BASE + route, { waitUntil: 'networkidle' });

  const toggle = page.locator('#menu-toggle');
  const panel = page.locator('#menu-mobile');

  if (await toggle.count()) {
    if (await panel.isVisible()) lapor(route, 'Menu mobile sudah terbuka saat halaman dimuat');

    await toggle.click();
    if (!(await panel.isVisible())) lapor(route, 'Menu mobile tidak terbuka saat tombol diklik');
    if ((await toggle.getAttribute('aria-expanded')) !== 'true')
      lapor(route, 'aria-expanded tidak jadi true saat menu terbuka');

    await page.keyboard.press('Escape');
    if (await panel.isVisible()) lapor(route, 'Escape tidak menutup menu mobile');
    if (!(await toggle.evaluate((el) => el === document.activeElement)))
      lapor(route, 'Fokus tidak kembali ke tombol menu setelah Escape');

    await toggle.click();
    if (!(await panel.isVisible())) lapor(route, 'Menu tidak bisa dibuka lagi setelah ditutup');
    await page.keyboard.press('Escape');
  }

  // Target sentuh minimum 44x44 CSS px.
  const small = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('a, button, input, select, [tabindex]')) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (cs.display === 'contents') continue;
      // Tersembunyi secara visual sampai menerima fokus (skip link): ukurannya
      // saat tidak fokus tidak relevan.
      if (r.width <= 1 && r.height <= 1) continue;
      // Link yang memakai overlay ::after untuk memperbesar area klik ke
      // seluruh sel. Areanya diuji terpisah lewat klik di bawah.
      if (getComputedStyle(el, '::after').position === 'absolute') continue;
      if (r.height < 44 || r.width < 24) {
        out.push(
          `${el.tagName.toLowerCase()} "${(el.textContent || '').trim().slice(0, 32)}" ${Math.round(r.width)}x${Math.round(r.height)}`,
        );
      }
    }
    return out;
  });
  small.forEach((s) => lapor(route, `Target sentuh kecil: ${s}`));

  // Sel produk harus bisa diklik di area fotonya, bukan hanya di teks nama.
  // Dilewati di halaman yang memang tidak punya grid produk (404, misalnya).
  const adaSel = (await page.locator('[data-produk] img').count()) > 0;
  if (adaSel) await page.locator('[data-produk] img').first().scrollIntoViewIfNeeded();
  const cellHit = await page.evaluate(() => {
    const img = document.querySelector('[data-produk] img');
    if (!img) return null;
    img.scrollIntoView({ block: 'center', behavior: 'instant' });
    const r = img.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return hit?.closest('a')?.getAttribute('href') ?? null;
  });
  if (adaSel && (cellHit === null || !cellHit.startsWith('/produk/'))) {
    lapor(route, `Area foto produk tidak mengarah ke detail produk (dapat: ${cellHit})`);
  }

  await periksaKontras(page, `${route} @390`);
  await page.close();
}

/* ── Struktur dokumen, fokus, dan kontras di desktop ───────────────── */
async function periksaDesktop(route) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE + route, { waitUntil: 'networkidle' });

  const structure = await page.evaluate(() => {
    const levels = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => ({
      level: Number(h.tagName[1]),
      text: (h.textContent || '').trim().slice(0, 40),
    }));
    const jumps = [];
    for (let i = 1; i < levels.length; i += 1) {
      if (levels[i].level - levels[i - 1].level > 1) {
        jumps.push(`${levels[i - 1].text} (h${levels[i - 1].level}) → ${levels[i].text} (h${levels[i].level})`);
      }
    }
    const unnamed = [...document.querySelectorAll('a, button')]
      .filter((el) => {
        const name =
          (el.textContent || '').trim() ||
          el.getAttribute('aria-label') ||
          el.querySelector('img')?.alt ||
          '';
        return !name;
      })
      .map((el) => el.outerHTML.slice(0, 70));
    return {
      h1: levels.filter((l) => l.level === 1).length,
      jumps,
      unnamed,
      main: document.querySelectorAll('main').length,
      landmarks: ['header', 'nav', 'main', 'footer'].filter((t) => !document.querySelector(t)),
      lang: document.documentElement.lang,
    };
  });

  if (structure.h1 !== 1) lapor(route, `Jumlah <h1> = ${structure.h1}, seharusnya 1`);
  structure.jumps.forEach((j) => lapor(route, `Level heading melompat: ${j}`));
  structure.unnamed.forEach((u) => lapor(route, `Kontrol tanpa nama: ${u}`));
  if (structure.main !== 1) lapor(route, `Jumlah <main> = ${structure.main}`);
  structure.landmarks.forEach((l) => lapor(route, `Landmark <${l}> tidak ada`));
  if (structure.lang !== 'id') lapor(route, `lang="${structure.lang}", seharusnya "id"`);

  // Skip link harus jadi elemen pertama yang menerima fokus dan terlihat.
  await page.keyboard.press('Tab');
  const skip = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      text: (el.textContent || '').trim(),
      visible: r.width > 1 && r.height > 1,
      outline: cs.outlineStyle !== 'none' && cs.outlineWidth !== '0px',
    };
  });
  if (!skip?.text.toLowerCase().includes('lompat'))
    lapor(route, `Fokus pertama bukan skip link, melainkan "${skip?.text}"`);
  if (!skip?.visible) lapor(route, 'Skip link tidak terlihat saat menerima fokus');
  if (!skip?.outline) lapor(route, 'Skip link tidak punya focus ring yang terlihat');

  await periksaKontras(page, `${route} @1440`);
  await page.close();
}

/**
 * Keadaan yang hanya ada setelah pengunjung bertindak.
 *
 * Bar pesanan dan drawer tidak pernah ikut terperiksa oleh pemeriksaan di
 * atas, karena keduanya tidak ada di HTML sampai daftar pesanan berisi —
 * padahal justru di situ warnanya berbeda dari seluruh halaman: ground
 * gelap untuk bar, satu-satunya permukaan berbayang untuk drawer.
 */
async function periksaPesanan(route) {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await page.goto(BASE + route, { waitUntil: 'networkidle' });

  await page.getByRole('button', { name: 'Tambah ke pesanan' }).click();
  const bar = page.locator('[data-order-bar]');
  await bar.waitFor({ state: 'visible', timeout: 5000 });
  await periksaKontras(page, `${route} @390 + bar pesanan`);

  await bar.getByRole('button').first().click();
  const drawer = page.locator('[role="dialog"]');
  await drawer.waitFor({ state: 'visible', timeout: 5000 });

  const dialog = await drawer.evaluate((el) => ({
    modal: el.getAttribute('aria-modal'),
    label: el.getAttribute('aria-labelledby'),
    adaLabel: !!(
      el.getAttribute('aria-label') ||
      document.getElementById(el.getAttribute('aria-labelledby') ?? '')
    ),
  }));
  if (dialog.modal !== 'true') lapor(route, 'Drawer bukan aria-modal="true"');
  if (!dialog.adaLabel) lapor(route, 'Drawer tidak punya nama yang bisa dibaca');

  await periksaKontras(page, `${route} @390 + drawer terbuka`);
  await page.close();
}

for (const route of routes) {
  await periksaMobile(route);
  await periksaDesktop(route);
  console.log(`  diperiksa ${route}`);
}

/* Satu halaman produk cukup: bar dan drawer dirender komponen yang sama
   di mana pun daftar pesanan berisi. */
const produk = routes.find((r) => r.startsWith('/produk/')) ?? '/produk/jeans-anak-reguler';
await periksaPesanan(produk);
console.log(`  diperiksa ${produk} dengan pesanan berisi`);

await browser.close();

if (problems.length) {
  console.log(`\n${problems.length} masalah:`);
  problems.forEach((p) => console.log('  ✗ ' + p));
  process.exitCode = 1;
} else {
  console.log(`\n✓ ${routes.length} rute bersih: struktur, fokus, target sentuh, dan kontras.`);
}
