// Generuje ikony PWA z wektorowej wersji kufla: npm run icons
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { iconSvg } from './mug.mjs';

const out = new URL('../public/icons/', import.meta.url);
await mkdir(out, { recursive: true });

const png = (svg, size, name) =>
  sharp(Buffer.from(svg), { density: 72 }).resize(size, size).png({ compressionLevel: 9 }).toFile(fileURLToPath(new URL(name, out)));

// „any”: kremowe tło z zaokrąglonymi rogami, kufel duży.
const any = iconSvg({ size: 512, scale: 2.45, radius: 112 });
// maskable: pełne tło (bez rogów), kufel w bezpiecznej strefie (koło 80%).
const maskable = iconSvg({ size: 512, scale: 1.9, background: '#FBEBCB' });
// apple-touch: iOS sam zaokrągla rogi i nie lubi przezroczystości.
const apple = iconSvg({ size: 512, scale: 2.3 });
// favicon: bez tła, maksymalnie duży.
const fav = iconSvg({ size: 512, scale: 3.1, background: null });

await Promise.all([
  png(any, 192, 'icon-192.png'),
  png(any, 512, 'icon-512.png'),
  png(maskable, 192, 'maskable-192.png'),
  png(maskable, 512, 'maskable-512.png'),
  png(apple, 180, 'apple-touch-icon.png'),
  png(fav, 32, 'favicon-32.png'),
  writeFile(new URL('favicon.svg', out), fav),
  writeFile(new URL('icon.svg', out), any),
]);

console.log('Ikony wygenerowane w public/icons/');
