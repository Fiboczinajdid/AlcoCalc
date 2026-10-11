// Generuje ikony i ekrany startowe Androida z wektorowego kufla: npm run icons:android
import sharp from 'sharp';
import { readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { MUG, iconSvg } from './mug.mjs';

const res = fileURLToPath(new URL('../android/app/src/main/res/', import.meta.url));
const ADAPTIVE_BG = '#FBEBCB';
const SPLASH_BG = '#FAF8F4';

const render = (svg, w, h, file) =>
  sharp(Buffer.from(svg)).resize(w, h).png({ compressionLevel: 9 }).toFile(res + file);

/** Kufel wyśrodkowany na płótnie W×H; `fill` to część krótszego boku, którą zajmuje grafika. */
function canvas(w, h, fill, background) {
  const s = (Math.min(w, h) * fill) / 152; // 152 ≈ wysokość kufla w jednostkach źródłowych
  const tx = w / 2 - 137 * s;
  const ty = h / 2 - 110 * s;
  const bg = background ? `<rect width="${w}" height="${h}" fill="${background}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${bg}<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})">${MUG}</g></svg>`;
}

const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const jobs = [];

for (const [d, k] of Object.entries(DENSITIES)) {
  const legacy = Math.round(48 * k);
  const fg = Math.round(108 * k);
  // Starsze Androidy: kwadrat z zaokrąglonymi rogami i okrągła wersja.
  jobs.push(render(iconSvg({ size: 512, scale: 2.2, background: ADAPTIVE_BG, radius: 96 }), legacy, legacy, `mipmap-${d}/ic_launcher.png`));
  jobs.push(render(iconSvg({ size: 512, scale: 2.0, background: ADAPTIVE_BG, radius: 256 }), legacy, legacy, `mipmap-${d}/ic_launcher_round.png`));
  // Ikona adaptacyjna (Android 8+): przezroczysty pierwszy plan, kufel w bezpiecznej strefie 66/108.
  jobs.push(render(canvas(fg, fg, 0.47, null), fg, fg, `mipmap-${d}/ic_launcher_foreground.png`));
}

// Ekrany startowe: zachowujemy rozmiary z szablonu Capacitora.
for (const dir of await readdir(res)) {
  if (!dir.startsWith('drawable')) continue;
  const files = await readdir(res + dir);
  if (!files.includes('splash.png')) continue;
  const file = `${dir}/splash.png`;
  const { width, height } = await sharp(res + file).metadata();
  const svg = canvas(width, height, 0.28, SPLASH_BG);
  jobs.push(sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer().then((b) => writeFile(res + file, b)));
}

jobs.push(
  writeFile(
    res + 'values/ic_launcher_background.xml',
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${ADAPTIVE_BG}</color>\n</resources>\n`,
  ),
);
// Wektorowe logo Capacitora z szablonu nie jest używane.
jobs.push(rm(res + 'drawable-v24/ic_launcher_foreground.xml', { force: true }));

await Promise.all(jobs);
console.log('Zasoby Androida wygenerowane.');
