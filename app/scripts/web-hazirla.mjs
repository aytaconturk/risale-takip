// expo export sonrası: PWA etiketlerini ekler, GitHub Pages derin linkleri için 404.html kopyalar.
// Kullanım: EXPO_BASE_URL=/risale-takip node scripts/web-hazirla.mjs dist
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';

const dist = process.argv[2] ?? 'dist';
const b = process.env.EXPO_BASE_URL ?? '';
const etiketler = [
  `<link rel="manifest" href="${b}/manifest.webmanifest">`,
  `<link rel="apple-touch-icon" href="${b}/ikon-180.png">`,
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-title" content="Risale Takip">',
  '<meta name="theme-color" content="#F2F2F7" media="(prefers-color-scheme: light)">',
  '<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">',
].join('\n');
const html = readFileSync(`${dist}/index.html`, 'utf8').replace('</head>', `${etiketler}\n</head>`);
writeFileSync(`${dist}/index.html`, html);
copyFileSync(`${dist}/index.html`, `${dist}/404.html`);
console.log('PWA etiketleri eklendi, 404.html yazıldı');
