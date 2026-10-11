import type { DayLog, Drink } from './types';
import { addDays, dayKey, daysBetween, monthKey, weekStart, weekdayMon0 } from './dates';
import { drinkAlcoholMl } from './units';
import { drinksCost, extrasCost } from './cost';

export interface DayAgg {
  alcoholMl: number;
  servings: number;
  /** Napoje + dodatki. */
  cost: number;
}

/** Sumy dla każdego dnia logicznego (tylko dni z napojami lub wydatkami). */
export function aggregateDays(
  drinks: Drink[],
  days: Record<string, DayLog>,
  startHour: number,
): Map<string, DayAgg> {
  const map = new Map<string, DayAgg>();
  const get = (k: string) => {
    let a = map.get(k);
    if (!a) map.set(k, (a = { alcoholMl: 0, servings: 0, cost: 0 }));
    return a;
  };
  for (const d of drinks) {
    const a = get(dayKey(d.time, startHour));
    a.alcoholMl += drinkAlcoholMl(d);
    a.servings += d.count;
    a.cost += drinksCost([d]);
  }
  for (const log of Object.values(days)) {
    const c = extrasCost(log.extras ?? []);
    if (c > 0) get(log.date).cost += c;
  }
  return map;
}

export function drinkDaySet(agg: Map<string, DayAgg>): Set<string> {
  const s = new Set<string>();
  for (const [k, a] of agg) if (a.alcoholMl > 0) s.add(k);
  return s;
}

export interface PeriodStat {
  /** Pierwszy dzień okresu (RRRR-MM-DD). */
  start: string;
  /** Ostatni dzień okresu (włącznie). */
  end: string;
  alcoholMl: number;
  cost: number;
  drinkDays: number;
  soberDays: number;
  /** Dni okresu objęte śledzeniem (od pierwszego dnia do dziś). */
  trackedDays: number;
}

function periodStat(
  start: string,
  end: string,
  agg: Map<string, DayAgg>,
  firstKey: string,
  todayKey: string,
): PeriodStat {
  const p: PeriodStat = { start, end, alcoholMl: 0, cost: 0, drinkDays: 0, soberDays: 0, trackedDays: 0 };
  const len = daysBetween(start, end) + 1;
  for (let i = 0; i < len; i++) {
    const k = addDays(start, i);
    const a = agg.get(k);
    if (a) {
      p.alcoholMl += a.alcoholMl;
      p.cost += a.cost;
    }
    const tracked = k >= firstKey && k <= todayKey;
    if (tracked) {
      p.trackedDays++;
      if (a && a.alcoholMl > 0) p.drinkDays++;
      else p.soberDays++;
    } else if (a && a.alcoholMl > 0) {
      p.drinkDays++;
    }
  }
  return p;
}

/** Ostatnie `count` tygodni (pon–nd), od najstarszego. */
export function weeklyStats(
  agg: Map<string, DayAgg>,
  firstKey: string,
  todayKey: string,
  count: number,
): PeriodStat[] {
  const thisWeek = weekStart(todayKey);
  const out: PeriodStat[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const s = addDays(thisWeek, -7 * i);
    out.push(periodStat(s, addDays(s, 6), agg, firstKey, todayKey));
  }
  return out;
}

function monthBounds(year: number, month0: number): [string, string] {
  const pad = (n: number) => String(n).padStart(2, '0');
  const last = new Date(year, month0 + 1, 0).getDate();
  return [`${year}-${pad(month0 + 1)}-01`, `${year}-${pad(month0 + 1)}-${pad(last)}`];
}

/** Ostatnie `count` miesięcy kalendarzowych, od najstarszego. */
export function monthlyStats(
  agg: Map<string, DayAgg>,
  firstKey: string,
  todayKey: string,
  count: number,
): PeriodStat[] {
  const [y, m] = monthKey(todayKey).split('-').map(Number);
  const out: PeriodStat[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    const [s, e] = monthBounds(d.getFullYear(), d.getMonth());
    out.push(periodStat(s, e, agg, firstKey, todayKey));
  }
  return out;
}

/**
 * Mapa cieplna: [dzień tygodnia 0=pon][godzina 0–23] → ml czystego alkoholu.
 * Dzień tygodnia bierzemy z dnia logicznego (piątek 1:00 w nocy to wciąż piątkowy wieczór).
 */
export function hourHeatmap(drinks: Drink[], startHour: number): number[][] {
  const grid = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
  for (const d of drinks) {
    const wd = weekdayMon0(dayKey(d.time, startHour));
    const h = new Date(d.time).getHours();
    grid[wd][h] += drinkAlcoholMl(d);
  }
  return grid;
}
