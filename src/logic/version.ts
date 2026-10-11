const parts = (v: string) => v.split(/[.-]/).map((x) => parseInt(x, 10) || 0);

/** Czy wersja a jest nowsza niż b (porównanie liczbowe segmentów). */
export function isNewer(a: string, b: string): boolean {
  const pa = parts(a);
  const pb = parts(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d > 0;
  }
  return false;
}

/** Wersja ma postać 1.<poziom części natywnej>.<numer buildu>. */
export function nativeLevelOf(version: string): number {
  return parts(version)[1] ?? 0;
}
