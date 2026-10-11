import type { Drink, Unit } from './types';

/** Gęstość etanolu w g/ml. */
export const ETHANOL_DENSITY = 0.789;
/** Przybliżona wartość energetyczna etanolu w kcal/g. */
export const KCAL_PER_GRAM = 7;

/** Czysty alkohol (ml) w napoju: objętość × procent × liczba sztuk. */
export function pureAlcoholMl(volumeMl: number, abv: number, count = 1): number {
  return (volumeMl * abv * count) / 100;
}

export function mlToGrams(ml: number): number {
  return ml * ETHANOL_DENSITY;
}

export function gramsToKcal(grams: number): number {
  return grams * KCAL_PER_GRAM;
}

export function drinkAlcoholMl(d: Pick<Drink, 'volumeMl' | 'abv' | 'count'>): number {
  return pureAlcoholMl(d.volumeMl, d.abv, d.count);
}

export function drinkGrams(d: Pick<Drink, 'volumeMl' | 'abv' | 'count'>): number {
  return mlToGrams(drinkAlcoholMl(d));
}

export function unitAlcoholMl(u: Pick<Unit, 'volumeMl' | 'abv'>): number {
  return pureAlcoholMl(u.volumeMl, u.abv, 1);
}

/** Ile „sztuk” danej jednostki odpowiada podanej ilości czystego alkoholu. */
export function toUnits(alcoholMl: number, unit: Pick<Unit, 'volumeMl' | 'abv'>): number {
  const per = unitAlcoholMl(unit);
  return per > 0 ? alcoholMl / per : 0;
}

export function totalAlcoholMl(drinks: Pick<Drink, 'volumeMl' | 'abv' | 'count'>[]): number {
  return drinks.reduce((sum, d) => sum + drinkAlcoholMl(d), 0);
}

/** Cena za jedną jednostkę odniesienia (np. ile zł kosztuje „moje piwo” alkoholu w tym produkcie). */
export function pricePerUnit(
  volumeMl: number,
  abv: number,
  pricePerPiece: number,
  unit: Pick<Unit, 'volumeMl' | 'abv'>,
): number | null {
  const units = toUnits(pureAlcoholMl(volumeMl, abv, 1), unit);
  return units > 0 ? pricePerPiece / units : null;
}

export function isValidUnit(u: Pick<Unit, 'volumeMl' | 'abv'>): boolean {
  return u.volumeMl > 0 && u.abv > 0 && u.abv <= 100;
}
