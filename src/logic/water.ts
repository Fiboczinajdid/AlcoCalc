import type { Drink } from './types';

/** Porcja wody sugerowana do każdego napoju i przed snem (ml). */
export const WATER_PORTION_ML = 250;

/** Liczba porcji (sztuk) napojów. */
export function servingsCount(drinks: Pick<Drink, 'count'>[]): number {
  return drinks.reduce((s, d) => s + d.count, 0);
}

/** 250 ml wody do każdego napoju plus 250 ml przed snem. */
export function suggestedWaterMl(servings: number): number {
  return servings > 0 ? (Math.ceil(servings) + 1) * WATER_PORTION_ML : 0;
}
