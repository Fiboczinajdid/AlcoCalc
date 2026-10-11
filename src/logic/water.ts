import type { Drink } from './types';

export const GLASS_ML = 250;

/** Liczba porcji (sztuk) napojów. */
export function servingsCount(drinks: Pick<Drink, 'count'>[]): number {
  return drinks.reduce((s, d) => s + d.count, 0);
}

/** Szklanka wody do każdego napoju plus jedna przed snem. */
export function suggestedWaterGlasses(servings: number): number {
  return servings > 0 ? Math.ceil(servings) + 1 : 0;
}

export function glassesToMl(glasses: number): number {
  return glasses * GLASS_ML;
}
