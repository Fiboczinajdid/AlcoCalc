import type { Drink, Extra, Unit } from './types';
import { gramsToKcal, mlToGrams, toUnits, totalAlcoholMl } from './units';
import { servingsCount } from './water';

export function drinksCost(drinks: Pick<Drink, 'price' | 'count'>[]): number {
  return drinks.reduce((s, d) => s + (d.price ?? 0) * d.count, 0);
}

export function extrasCost(extras: Pick<Extra, 'amount'>[]): number {
  return extras.reduce((s, e) => s + e.amount, 0);
}

/** Koszt w godzinach pracy (null, gdy nie podano stawki). */
export function workHours(amount: number, hourlyRate: number | null | undefined): number | null {
  return hourlyRate && hourlyRate > 0 ? amount / hourlyRate : null;
}

export interface NightSummary {
  drinksCost: number;
  extrasCost: number;
  totalCost: number;
  /** Czy przynajmniej jeden napój ma cenę. */
  hasPrices: boolean;
  alcoholMl: number;
  grams: number;
  units: number;
  kcal: number;
  servings: number;
  workHours: number | null;
}

export function nightSummary(
  drinks: Drink[],
  extras: Extra[],
  unit: Pick<Unit, 'volumeMl' | 'abv'>,
  hourlyRate: number | null,
): NightSummary {
  const alcoholMl = totalAlcoholMl(drinks);
  const grams = mlToGrams(alcoholMl);
  const dc = drinksCost(drinks);
  const ec = extrasCost(extras);
  const total = dc + ec;
  return {
    drinksCost: dc,
    extrasCost: ec,
    totalCost: total,
    hasPrices: drinks.some((d) => d.price != null && d.price > 0),
    alcoholMl,
    grams,
    units: toUnits(alcoholMl, unit),
    kcal: gramsToKcal(grams),
    servings: servingsCount(drinks),
    workHours: workHours(total, hourlyRate),
  };
}
