// expo export sonrası: iOS açılış görsellerini ekler, SW önbellek adını değiştirir,
// GitHub Pages derin linkleri için 404.html kopyalar. PWA etiketleri public/index.html şablonundadır.
// Kullanım: EXPO_BASE_URL=/risale-takip node scripts/web-hazirla.mjs dist
import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const dist = process.argv[2] ?? 'dist';
const b = process.env.EXPO_BASE_URL ?? '';
let html = readFileSync(`${dist}/index.html`, 'utf8').replaceAll('%WEB_PUBLIC_URL%', b);

const viewport = html.match(/<meta name="viewport"/g)?.length ?? 0;
if (viewport !== 1) {
  console.error(`viewport etiketi ${viewport} kez var, 1 olmalı`);
  process.exit(1);
}

// acilis/390x844@3.png → yalnızca o ekran boyutunda kullanılır
const acilis = existsSync(`${dist}/acilis`) ? readdirSync(`${dist}/acilis`) : [];
const etiketler = acilis.map((ad) => {
  const [, w, h, r] = ad.match(/^(\d+)x(\d+)@(\d)\.png$/);
  const media = `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`;
  return `<link rel="apple-touch-startup-image" media="${media}" href="${b}/acilis/${ad}">`;
});
html = html.replace('</head>', `${etiketler.join('\n')}\n</head>`);
writeFileSync(`${dist}/index.html`, html);
copyFileSync(`${dist}/index.html`, `${dist}/404.html`);

const sw = readFileSync(`${dist}/sw.js`, 'utf8').replace(/const CACHE = '[^']*'/, `const CACHE = 'rt-${Date.now()}'`);
writeFileSync(`${dist}/sw.js`, sw);
console.log(`${acilis.length} açılış görseli eklendi, sw önbelleği yenilendi, 404.html yazıldı`);
