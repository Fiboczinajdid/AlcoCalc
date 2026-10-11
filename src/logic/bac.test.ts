import { describe, expect, it } from 'vitest';
import {
  crossesBelowAt,
  estimateDriving,
  peakOf,
  simulateBac,
  soberAt,
  valueAt,
  watsonTbw,
  widmarkFactor,
} from './bac';
import type { Drink } from './types';

const MIN = 60_000;
const t0 = new Date(2026, 9, 10, 20, 0).getTime();

describe('współczynnik Widmarka', () => {
  it('domyślne wartości', () => {
    expect(widmarkFactor({ sex: 'm', weightKg: 80, heightCm: null, age: null })).toBe(0.7);
    expect(widmarkFactor({ sex: 'f', weightKg: 60, heightCm: null, age: null })).toBe(0.6);
  });

  it('wzór Watsona daje sensowne r', () => {
    expect(watsonTbw('m', 40, 180, 80)).toBeCloseTo(44.87, 1);
    expect(widmarkFactor({ sex: 'm', weightKg: 80, heightCm: 180, age: 40 })).toBeCloseTo(0.7, 2);
    expect(widmarkFactor({ sex: 'f', weightKg: 60, heightCm: 165, age: 30 })).toBeCloseTo(0.63, 2);
  });
});

describe('symulacja promili', () => {
  const rW = 0.7 * 80; // 56

  it('jednorazowa dawka: szczyt i zejście poniżej limitu', () => {
    const s = simulateBac([{ time: t0, grams: 50, absorptionMin: 1 }], [], { rW, burnRate: 0.15 })!;
    const peak = peakOf(s)!;
    expect(peak.v).toBeCloseTo(50 / 56, 2);
    // (0,893 − 0,2) / 0,15 h ≈ 277 min
    const below = crossesBelowAt(s, 0.2)!;
    expect((below - t0) / MIN).toBeGreaterThan(272);
    expect((below - t0) / MIN).toBeLessThan(282);
    const sober = soberAt(s)!;
    expect(Math.abs((sober - t0) / MIN - (50 / 56 / 0.15) * 60)).toBeLessThan(3);
  });

  it('wchłanianie stopniowe: szczyt po zakończeniu wchłaniania i niższy', () => {
    const s = simulateBac([{ time: t0, grams: 50, absorptionMin: 45 }], [], { rW, burnRate: 0.15 })!;
    const peak = peakOf(s)!;
    expect((peak.t - t0) / MIN).toBeCloseTo(45, 0);
    expect(peak.v).toBeCloseTo(50 / 56 - 0.15 * 0.75, 2);
    expect(valueAt(s, t0 + 10 * MIN)).toBeLessThan(peak.v);
  });

  it('wolniejsze spalanie = później poniżej limitu', () => {
    const drinks = [{ time: t0, grams: 40, absorptionMin: 45 }];
    const fast = simulateBac(drinks, [], { rW, burnRate: 0.15 });
    const slow = simulateBac(drinks, [], { rW, burnRate: 0.1 });
    expect(crossesBelowAt(slow, 0.2)!).toBeGreaterThan(crossesBelowAt(fast, 0.2)!);
  });

  it('kilka napojów w różnych godzinach', () => {
    const s = simulateBac(
      [
        { time: t0, grams: 20, absorptionMin: 45 },
        { time: t0 + 120 * MIN, grams: 20, absorptionMin: 45 },
      ],
      [],
      { rW, burnRate: 0.15 },
    )!;
    const v1 = valueAt(s, t0 + 45 * MIN);
    const v2 = valueAt(s, t0 + 165 * MIN);
    expect(v1).toBeGreaterThan(0.2);
    expect(v2).toBeGreaterThan(0.2);
    expect(v2).toBeLessThan(v1 + 20 / 56);
  });

  it('wynik z alkomatu koryguje szacunek od chwili pomiaru', () => {
    const s = simulateBac(
      [{ time: t0, grams: 50, absorptionMin: 1 }],
      [{ time: t0 + 60 * MIN, permille: 0.3 }],
      { rW, burnRate: 0.15 },
    )!;
    expect(valueAt(s, t0 + 59 * MIN)).toBeGreaterThan(0.6);
    expect(valueAt(s, t0 + 61 * MIN)).toBeCloseTo(0.3, 2);
    const below = crossesBelowAt(s, 0.2)!;
    expect(Math.abs((below - t0) / MIN - 100)).toBeLessThan(3);
  });

  it('pomiar w trakcie wchłaniania – reszta alkoholu nadal się dolicza', () => {
    const s = simulateBac(
      [{ time: t0, grams: 56, absorptionMin: 60 }],
      [{ time: t0 + 30 * MIN, permille: 0.4 }],
      { rW, burnRate: 0 },
    )!;
    expect(valueAt(s, t0 + 60 * MIN)).toBeCloseTo(0.9, 2);
  });

  it('brak danych', () => {
    expect(simulateBac([], [], { rW, burnRate: 0.15 })).toBeNull();
    expect(valueAt(null, t0)).toBe(0);
  });
});

describe('szacunek jazdy', () => {
  const profile = { sex: 'm' as const, weightKg: 80, heightCm: null, age: null, limitPermille: 0.2 };
  const drink = (h: number, extra: Partial<Drink> = {}): Drink => ({
    id: String(h),
    name: 'Piwo',
    volumeMl: 500,
    abv: 5,
    count: 1,
    time: t0 + h * 60 * MIN,
    price: null,
    ...extra,
  });

  it('dwa czasy: najwcześniej i bezpieczniej', () => {
    const e = estimateDriving({
      drinks: [drink(0), drink(1), drink(2)],
      readings: [],
      profile,
      ate: () => false,
      now: t0 + 3 * 60 * MIN,
    });
    expect(e.exceededLimit).toBe(true);
    expect(e.belowLimitSafer!).toBeGreaterThan(e.belowLimitEarliest!);
    expect(e.nowHigh).toBeGreaterThanOrEqual(e.nowLow);
    expect(e.soberSafer!).toBeGreaterThan(e.soberEarliest!);
  });

  it('jedzenie spłaszcza szczyt', () => {
    const base = { drinks: [drink(0, { count: 3 })], readings: [], profile, now: t0 };
    const fasted = estimateDriving({ ...base, ate: () => false });
    const fed = estimateDriving({ ...base, ate: () => true });
    expect(fed.peakLow).toBeLessThan(fasted.peakLow);
  });

  it('pomija napoje sprzed 48 h', () => {
    const e = estimateDriving({
      drinks: [drink(0)],
      readings: [],
      profile,
      ate: () => false,
      now: t0 + 50 * 60 * MIN,
    });
    expect(e.fast).toBeNull();
    expect(e.exceededLimit).toBe(false);
  });
});
