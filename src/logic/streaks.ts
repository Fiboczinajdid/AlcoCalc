import { addDays, daysBetween } from './dates';

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100] as const;

export interface StreakInfo {
  /** Bieżąca seria dni bez alkoholu (dzisiejszy dzień bez wpisu też się liczy). */
  current: number;
  longest: number;
  /** Długość serii zakończonej ostatnim dniem z alkoholem (gdy current = 0). */
  previous: number | null;
  /** Zdobyte progi (na podstawie najdłuższej serii). */
  achieved: number[];
  /** Następny próg dla bieżącej serii. */
  next: number | null;
  /** Liczba śledzonych dni (od pierwszego dnia do dziś). */
  trackedDays: number;
}

/**
 * Dni bez wpisu od pierwszego dnia korzystania z aplikacji liczą się jako dni bez alkoholu.
 */
export function computeStreaks(drinkDays: Set<string>, firstKey: string, todayKey: string): StreakInfo {
  const total = daysBetween(firstKey, todayKey) + 1;
  let run = 0;
  let longest = 0;
  let previous: number | null = null;
  for (let i = 0; i < Math.max(0, total); i++) {
    const key = addDays(firstKey, i);
    if (drinkDays.has(key)) {
      previous = run;
      run = 0;
    } else {
      run++;
      if (run > longest) longest = run;
    }
  }
  const achieved = STREAK_MILESTONES.filter((m) => m <= longest);
  const next = STREAK_MILESTONES.find((m) => m > run) ?? null;
  return {
    current: run,
    longest,
    previous: run === 0 ? previous : null,
    achieved: [...achieved],
    next,
    trackedDays: Math.max(0, total),
  };
}
