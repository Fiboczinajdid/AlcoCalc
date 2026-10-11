import type { Drink, Profile, Reading } from './types';
import { drinkGrams } from './units';

/** Spalanie „najwcześniej” (szybki metabolizm), ‰/h. */
export const BURN_EARLIEST = 0.15;
/** Spalanie „bezpieczniej” (wolniejszy metabolizm), ‰/h. */
export const BURN_SAFER = 0.1;
/** Czas wchłaniania na pusty żołądek (min) – szczyt ok. 30–60 min. */
export const ABSORPTION_FASTED_MIN = 45;
/** Czas wchłaniania po jedzeniu (min) – szczyt ok. 60–90 min. */
export const ABSORPTION_FED_MIN = 90;
/** Udział wody we krwi (używany przy przeliczeniu wzoru Watsona na współczynnik Widmarka). */
export const BLOOD_WATER_FRACTION = 0.8;
/** Alkomat w mg/l → promile (w polskich przepisach 0,1 mg/l ≈ 0,2‰). */
export const MGL_TO_PERMILLE = 2;
/** Jak daleko wstecz uwzględniamy napoje przy szacowaniu „teraz” (h). */
export const LOOKBACK_HOURS = 48;

const MIN = 60_000;
const HOUR = 3_600_000;

/** Całkowita woda w organizmie (litry) wg Watsona. */
export function watsonTbw(sex: Profile['sex'], age: number, heightCm: number, weightKg: number): number {
  return sex === 'm'
    ? 2.447 - 0.09516 * age + 0.1074 * heightCm + 0.3362 * weightKg
    : -2.097 + 0.1069 * heightCm + 0.2466 * weightKg;
}

/**
 * Współczynnik Widmarka r. Gdy znamy wzrost i wiek – z wody całkowitej (Watson):
 * r = TBW / (0,8 × masa). W przeciwnym razie 0,7 (M) lub 0,6 (K).
 */
export function widmarkFactor(p: Pick<Profile, 'sex' | 'weightKg' | 'heightCm' | 'age'>): number {
  const fallback = p.sex === 'm' ? 0.7 : 0.6;
  if (!p.heightCm || !p.age || p.weightKg <= 0) return fallback;
  const tbw = watsonTbw(p.sex, p.age, p.heightCm, p.weightKg);
  const r = tbw / (BLOOD_WATER_FRACTION * p.weightKg);
  if (!Number.isFinite(r)) return fallback;
  return Math.min(0.9, Math.max(0.4, r));
}

export interface BacDrink {
  time: number;
  grams: number;
  absorptionMin: number;
}

export interface BacReading {
  time: number;
  permille: number;
}

/** Przebieg promili w równych krokach czasu. */
export interface BacSeries {
  start: number;
  stepMs: number;
  values: number[];
}

export interface SimOptions {
  /** r × masa ciała (kg). */
  rW: number;
  /** Spalanie w ‰/h. */
  burnRate: number;
  stepMin?: number;
  maxHours?: number;
}

/**
 * Symulacja krok po kroku: każdy napój wchłania się liniowo przez `absorptionMin`,
 * równolegle organizm spala `burnRate` ‰/h (kinetyka zerowego rzędu).
 * Wynik z alkomatu nadpisuje szacunek w chwili pomiaru; niewchłonięta
 * jeszcze część alkoholu dalej podnosi poziom.
 */
export function simulateBac(drinks: BacDrink[], readings: BacReading[], opts: SimOptions): BacSeries | null {
  if (!drinks.length && !readings.length) return null;
  if (opts.rW <= 0) return null;
  const stepMs = (opts.stepMin ?? 1) * MIN;
  const maxMs = (opts.maxHours ?? 72) * HOUR;
  const ds = [...drinks].sort((a, b) => a.time - b.time);
  const rs = [...readings].sort((a, b) => a.time - b.time);

  const start = Math.min(ds[0]?.time ?? Infinity, rs[0]?.time ?? Infinity);
  const lastInput = Math.max(
    ...ds.map((d) => d.time + Math.max(1, d.absorptionMin) * MIN),
    ...rs.map((r) => r.time),
  );
  const hardEnd = start + maxMs;
  const burnPerStep = (opts.burnRate * stepMs) / HOUR;

  let v = 0;
  let ri = 0;
  while (ri < rs.length && rs[ri].time <= start) v = rs[ri++].permille;
  const values = [v];

  for (let t = start; t < hardEnd; t += stepMs) {
    const t1 = t + stepMs;
    let grams = 0;
    for (const d of ds) {
      if (d.time >= t1) break;
      const dur = Math.max(1, d.absorptionMin) * MIN;
      const a = Math.max(t, d.time);
      const b = Math.min(t1, d.time + dur);
      if (b > a) grams += (d.grams * (b - a)) / dur;
    }
    v = Math.max(0, v + grams / opts.rW - burnPerStep);
    while (ri < rs.length && rs[ri].time <= t1) v = rs[ri++].permille;
    values.push(v);
    if (t1 >= lastInput && v <= 0) break;
  }
  return { start, stepMs, values };
}

export function timeAt(s: BacSeries, i: number): number {
  return s.start + i * s.stepMs;
}

export function valueAt(s: BacSeries | null, t: number): number {
  if (!s || t < s.start) return 0;
  const x = (t - s.start) / s.stepMs;
  const i = Math.floor(x);
  if (i >= s.values.length - 1) return s.values[s.values.length - 1] ?? 0;
  const f = x - i;
  return s.values[i] * (1 - f) + s.values[i + 1] * f;
}

export function peakOf(s: BacSeries | null): { t: number; v: number } | null {
  if (!s) return null;
  let best = 0;
  for (let i = 1; i < s.values.length; i++) if (s.values[i] > s.values[best]) best = i;
  return { t: timeAt(s, best), v: s.values[best] };
}

/** Pierwszy moment, od którego szacunek pozostaje poniżej progu. `null` gdy nigdy nie przekroczył progu. */
export function crossesBelowAt(s: BacSeries | null, threshold: number): number | null {
  if (!s) return null;
  for (let i = s.values.length - 1; i >= 0; i--) {
    if (s.values[i] >= threshold) return timeAt(s, i + 1);
  }
  return null;
}

/** Szacowany moment zejścia do 0‰. */
export function soberAt(s: BacSeries | null): number | null {
  return crossesBelowAt(s, 0.0005);
}

export interface DriveEstimate {
  /** Szacunek przy spalaniu 0,15‰/h. */
  fast: BacSeries | null;
  /** Szacunek przy spalaniu 0,10‰/h. */
  slow: BacSeries | null;
  nowLow: number;
  nowHigh: number;
  peakLow: number;
  peakHigh: number;
  peakAt: number | null;
  /** „Najwcześniej” poniżej limitu. */
  belowLimitEarliest: number | null;
  /** „Bezpieczniej” poniżej limitu. */
  belowLimitSafer: number | null;
  soberEarliest: number | null;
  soberSafer: number | null;
  /** Czy szacunek w ogóle przekroczył limit. */
  exceededLimit: boolean;
}

export interface EstimateInput {
  drinks: Drink[];
  readings: Reading[];
  profile: Pick<Profile, 'sex' | 'weightKg' | 'heightCm' | 'age' | 'limitPermille'>;
  /** Czy danego napoju dotyczy przełącznik „jadłem”. */
  ate: (d: Drink) => boolean;
  now: number;
  /** Uwzględnij napoje i pomiary od tego momentu (domyślnie now − 48 h). */
  windowStart?: number;
  /** …i do tego momentu (domyślnie bez ograniczeń). */
  windowEnd?: number;
}

export function estimateDriving(input: EstimateInput): DriveEstimate {
  const from = input.windowStart ?? input.now - LOOKBACK_HOURS * HOUR;
  const to = input.windowEnd ?? Infinity;
  const inWindow = (t: number) => t >= from && t < to;
  const drinks: BacDrink[] = input.drinks
    .filter((d) => inWindow(d.time))
    .map((d) => ({
      time: d.time,
      grams: drinkGrams(d),
      absorptionMin: input.ate(d) ? ABSORPTION_FED_MIN : ABSORPTION_FASTED_MIN,
    }));
  const readings: BacReading[] = input.readings.filter((r) => inWindow(r.time));
  const rW = widmarkFactor(input.profile) * input.profile.weightKg;
  const fast = simulateBac(drinks, readings, { rW, burnRate: BURN_EARLIEST });
  const slow = simulateBac(drinks, readings, { rW, burnRate: BURN_SAFER });
  const limit = input.profile.limitPermille;
  const pFast = peakOf(fast);
  const pSlow = peakOf(slow);
  const belowSafer = crossesBelowAt(slow, limit);
  return {
    fast,
    slow,
    nowLow: valueAt(fast, input.now),
    nowHigh: valueAt(slow, input.now),
    peakLow: pFast?.v ?? 0,
    peakHigh: pSlow?.v ?? 0,
    peakAt: pSlow?.t ?? null,
    belowLimitEarliest: crossesBelowAt(fast, limit),
    belowLimitSafer: belowSafer,
    soberEarliest: soberAt(fast),
    soberSafer: soberAt(slow),
    exceededLimit: belowSafer !== null,
  };
}

export function mglToPermille(mgl: number): number {
  return mgl * MGL_TO_PERMILLE;
}

export interface Intoxication {
  /** 0 = trzeźwo … 5 = groźnie. */
  level: number;
  label: string;
}

/** Potoczny opis stanu dla danego stężenia (‰). */
export function intoxication(permille: number, sex: Profile['sex']): Intoxication {
  const f = sex === 'f';
  if (permille < 0.2) return { level: 0, label: 'Trzeźwo' };
  if (permille < 0.5) return { level: 1, label: f ? 'Lekko wstawiona' : 'Lekko wstawiony' };
  if (permille < 1) return { level: 2, label: f ? 'Wstawiona' : 'Wstawiony' };
  if (permille < 2) return { level: 3, label: f ? 'Pijana' : 'Pijany' };
  if (permille < 3) return { level: 4, label: f ? 'Bardzo pijana' : 'Bardzo pijany' };
  return { level: 5, label: 'Groźnie – ryzyko zatrucia' };
}
