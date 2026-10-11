import { describe, expect, it } from 'vitest';
import {
  drinkGrams,
  gramsToKcal,
  mlToGrams,
  pricePerUnit,
  pureAlcoholMl,
  toUnits,
  totalAlcoholMl,
} from './units';

const myBeer = { volumeMl: 500, abv: 5 };

describe('przeliczanie jednostek', () => {
  it('3 × 400 ml × 8% w jednostce „piwo 5% 500 ml” daje 3,84', () => {
    const ml = pureAlcoholMl(400, 8, 3);
    expect(ml).toBeCloseTo(96, 10);
    expect(pureAlcoholMl(500, 5)).toBeCloseTo(25, 10);
    expect(toUnits(ml, myBeer)).toBeCloseTo(3.84, 10);
  });

  it('porównanie w innych jednostkach', () => {
    const ml = pureAlcoholMl(400, 8, 3);
    expect(toUnits(ml, { volumeMl: 150, abv: 12 })).toBeCloseTo(5.333, 3);
    expect(toUnits(ml, { volumeMl: 50, abv: 40 })).toBeCloseTo(4.8, 10);
  });

  it('gramy i kalorie', () => {
    expect(mlToGrams(25)).toBeCloseTo(19.725, 6);
    expect(drinkGrams({ volumeMl: 400, abv: 8, count: 3 })).toBeCloseTo(75.744, 6);
    expect(gramsToKcal(10)).toBe(70);
  });

  it('suma wielu napojów', () => {
    expect(
      totalAlcoholMl([
        { volumeMl: 500, abv: 5, count: 2 },
        { volumeMl: 50, abv: 40, count: 1 },
      ]),
    ).toBeCloseTo(70, 10);
  });

  it('jednostka o zerowej zawartości nie dzieli przez zero', () => {
    expect(toUnits(50, { volumeMl: 500, abv: 0 })).toBe(0);
  });

  it('cena za jednostkę odniesienia', () => {
    // piwo 8% 400 ml za 4 zł = 1,28 „mojego piwa” → 3,125 zł za jedno
    expect(pricePerUnit(400, 8, 4, myBeer)).toBeCloseTo(3.125, 6);
    expect(pricePerUnit(400, 0, 4, myBeer)).toBeNull();
  });
});
