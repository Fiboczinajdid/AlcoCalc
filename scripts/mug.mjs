// Wektorowa wersja ikony (kufel z pianką) – współrzędne w przestrzeni oryginalnego obrazka 239×216.
// Środek grafiki ok. (137, 110), rozmiar ok. 120×152.

const OUTLINE = '#1C1F2A';

export const MUG = `
<g stroke="${OUTLINE}" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">
  <!-- ucho -->
  <path d="M158 80 h16 a22 22 0 0 1 22 22 v32 a22 22 0 0 1 -22 22 h-16 v-15 h14 a9 9 0 0 0 9 -9 v-28 a9 9 0 0 0 -9 -9 h-14 z" fill="#F2F4F5"/>
  <!-- szkło -->
  <rect x="80" y="64" width="80" height="106" rx="4" fill="#FCFEFF"/>
  <!-- podstawa -->
  <path d="M78 166 h84 v11 a8 8 0 0 1 -8 8 h-68 a8 8 0 0 1 -8 -8 z" fill="#D7DADC"/>
</g>
<!-- piwo -->
<rect x="88" y="78" width="64" height="85" rx="2.5" fill="#E8A027"/>
<rect x="144" y="78" width="8" height="85" fill="#D38C22"/>
<rect x="93" y="90" width="7" height="66" rx="3.5" fill="#FFBF63"/>
<rect x="88" y="74" width="64" height="12" fill="#F5E0AE"/>
<circle cx="118" cy="118" r="2.6" fill="#FFD27F"/>
<circle cx="128" cy="138" r="2" fill="#FFD27F"/>
<circle cx="112" cy="146" r="1.6" fill="#FFD27F"/>
<!-- pianka -->
<path stroke="${OUTLINE}" stroke-width="4.5" stroke-linejoin="round" fill="#FEFBF0"
  d="M86 72
     C 74 72 71 57 80 52
     C 77 41 90 34 99 39
     C 103 30 118 28 124 35
     C 130 30 143 32 146 40
     C 156 38 165 47 161 57
     C 167 62 164 73 155 72
     L 147 72
     L 147 89
     A 7.5 7.5 0 0 1 132 89
     L 132 72
     Z"/>
<path d="M90 64 C 96 67 104 67 110 64 M116 66 C 120 68 126 68 128 66" stroke="#E9DFC8" stroke-width="3" fill="none" stroke-linecap="round"/>
`;

/** Pełny SVG: tło + kufel przeskalowany do `scale` wokół środka 512×512. */
export function iconSvg({ size = 512, scale = 2.45, background = '#FFFDF6', radius = 0 } = {}) {
  const k = size / 512;
  const s = scale * k;
  const tx = size / 2 - 137 * s;
  const ty = size / 2 - 110 * s;
  const bg = background
    ? `<rect width="${size}" height="${size}" rx="${radius * k}" fill="${background}"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${bg}<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})">${MUG}</g></svg>`;
}
