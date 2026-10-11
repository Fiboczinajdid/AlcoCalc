import { describe, expect, it } from 'vitest';
import { suggestedWaterGlasses, servingsCount } from './water';
import { nightSummary, workHours } from './cost';
import { computeStreaks } from './streaks';
import { aggregateDays, drinkDaySet, hourHeatmap, monthlyStats, weeklyStats } from './stats';
import { parseBackup, BackupError } from './backup';
import type { Drink } from './types';

const d = (time: Date, extra: Partial<Drink> = {}): Drink => ({
  id: String(time.getTime()),
  name: 'Piwo',
  volumeMl: 500,
  abv: 5,
  count: 1,
  time: time.getTime(),
  price: null,
  ...extra,
});

describe('woda', () => {
  it('szklanka do każdego napoju + jedna przed snem', () => {
    expect(suggestedWaterGlasses(0)).toBe(0);
    expect(suggestedWaterGlasses(3)).toBe(4);
    expect(servingsCount([{ count: 2 }, { count: 3 }])).toBe(5);
  });
});

describe('koszty', () => {
  it('podsumowanie wieczoru', () => {
    const drinks = [d(new Date(2026, 9, 10, 20), { count: 3, volumeMl: 400, abv: 8, price: 5 })];
    const s = nightSummary(drinks, [{ id: 'x', label: 'Taxi', amount: 30 }], { volumeMl: 500, abv: 5 }, 30);
    expect(s.drinksCost).toBe(15);
    expect(s.totalCost).toBe(45);
    expect(s.units).toBeCloseTo(3.84, 10);
    expect(s.kcal).toBeCloseTo(96 * 0.789 * 7, 6);
    expect(s.workHours).toBeCloseTo(1.5, 10);
    expect(s.hasPrices).toBe(true);
  });

  it('bez stawki brak godzin pracy', () => {
    expect(workHours(100, null)).toBeNull();
    expect(workHours(100, 0)).toBeNull();
  });
});

describe('serie dni bez alkoholu', () => {
  it('liczy bieżącą i najdłuższą serię', () => {
    const days = new Set(['2026-10-03', '2026-10-08']);
    const s = computeStreaks(days, '2026-10-01', '2026-10-11');
    // 01,02 | 03 | 04–07 (4) | 08 | 09–11 (3)
    expect(s.current).toBe(3);
    expect(s.longest).toBe(4);
    expect(s.achieved).toEqual([3]);
    expect(s.next).toBe(7);
    expect(s.trackedDays).toBe(11);
  });

  it('dzień z alkoholem dziś przerywa serię i zapamiętuje poprzednią', () => {
    const s = computeStreaks(new Set(['2026-10-11']), '2026-10-01', '2026-10-11');
    expect(s.current).toBe(0);
    expect(s.previous).toBe(10);
    expect(s.achieved).toEqual([3, 7]);
  });

  it('pierwszy dzień', () => {
    const s = computeStreaks(new Set(), '2026-10-11', '2026-10-11');
    expect(s.current).toBe(1);
  });
});

describe('statystyki', () => {
  const drinks = [
    d(new Date(2026, 9, 9, 21)), // piątek
    d(new Date(2026, 9, 10, 1, 30), { price: 10 }), // sobota 1:30 → piątkowy wieczór
    d(new Date(2026, 8, 20, 19)),
  ];
  const agg = aggregateDays(
    drinks,
    {
      '2026-10-09': {
        date: '2026-10-09',
        waterGlasses: 0,
        ate: false,
        extras: [{ id: 'a', label: 'Taxi', amount: 20 }],
      },
    },
    6,
  );

  it('agreguje dni logiczne z kosztami', () => {
    expect(agg.get('2026-10-09')!.alcoholMl).toBeCloseTo(50, 10);
    expect(agg.get('2026-10-09')!.cost).toBe(30);
    expect([...drinkDaySet(agg)].sort()).toEqual(['2026-09-20', '2026-10-09']);
  });

  it('tygodnie i miesiące', () => {
    const w = weeklyStats(agg, '2026-09-15', '2026-10-11', 2);
    expect(w[1].start).toBe('2026-10-05');
    expect(w[1].alcoholMl).toBeCloseTo(50, 10);
    expect(w[1].drinkDays).toBe(1);
    expect(w[1].soberDays).toBe(6);
    const m = monthlyStats(agg, '2026-09-15', '2026-10-11', 2);
    expect(m[0].start).toBe('2026-09-01');
    expect(m[0].trackedDays).toBe(16);
    expect(m[0].soberDays).toBe(15);
    expect(m[1].trackedDays).toBe(11);
  });

  it('mapa cieplna używa dnia logicznego', () => {
    const h = hourHeatmap(drinks, 6);
    expect(h[4][21]).toBeCloseTo(25, 10); // piątek 21:00
    expect(h[4][1]).toBeCloseTo(25, 10); // piątkowa noc 1:00
  });
});

describe('kopia danych', () => {
  it('odrzuca obce pliki', () => {
    expect(() => parseBackup({ foo: 1 })).toThrow(BackupError);
    expect(() => parseBackup(null)).toThrow(BackupError);
  });

  it('normalizuje poprawną kopię', () => {
    const b = parseBackup({
      format: 'alcocalc-backup',
      version: 1,
      profile: { weightKg: 80, sex: 'm', activeUnitId: 'zzz' },
      units: [{ id: 'u1', name: 'Piwo', volumeMl: 500, abv: 5 }],
      drinks: [{ id: 'd1', volumeMl: 500, abv: 5, time: 1 }, { bad: true }],
    });
    expect(b.drinks).toHaveLength(1);
    expect(b.drinks[0].count).toBe(1);
    expect(b.profile!.activeUnitId).toBe('u1');
    expect(b.profile!.limitPermille).toBe(0.2);
  });
});
