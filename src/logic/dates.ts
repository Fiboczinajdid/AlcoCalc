/**
 * „Dzień” w aplikacji zaczyna się o godzinie `startHour` (domyślnie 6:00),
 * więc piwo o 1:30 w nocy należy do poprzedniego wieczoru.
 * Klucz dnia to lokalna data RRRR-MM-DD.
 */

const pad = (n: number) => String(n).padStart(2, '0');

export function dateToKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function dayKey(ts: number, startHour: number): string {
  const d = new Date(ts);
  if (d.getHours() < startHour) d.setDate(d.getDate() - 1);
  return dateToKey(d);
}

/** Początek i koniec (wyłącznie) danego dnia logicznego w ms. */
export function dayRange(key: string, startHour: number): [number, number] {
  const start = keyToDate(key);
  start.setHours(startHour, 0, 0, 0);
  const end = keyToDate(key);
  end.setDate(end.getDate() + 1);
  end.setHours(startHour, 0, 0, 0);
  return [start.getTime(), end.getTime()];
}

export function addDays(key: string, n: number): string {
  const d = keyToDate(key);
  d.setDate(d.getDate() + n);
  return dateToKey(d);
}

/** Liczba dni od a do b (b − a), odporna na zmianę czasu. */
export function daysBetween(a: string, b: string): number {
  const da = keyToDate(a);
  const db = keyToDate(b);
  return Math.round((Date.UTC(db.getFullYear(), db.getMonth(), db.getDate()) -
    Date.UTC(da.getFullYear(), da.getMonth(), da.getDate())) / 86_400_000);
}

/** Dzień tygodnia 0 = poniedziałek … 6 = niedziela. */
export function weekdayMon0(key: string): number {
  return (keyToDate(key).getDay() + 6) % 7;
}

/** Poniedziałek tygodnia, do którego należy dzień. */
export function weekStart(key: string): string {
  return addDays(key, -weekdayMon0(key));
}

export function monthKey(key: string): string {
  return key.slice(0, 7);
}

/**
 * Łączy dzień logiczny z godziną z zegara. Godzina przed `startHour`
 * oznacza noc po północy, czyli następny dzień kalendarzowy.
 */
export function timeOnDay(key: string, hours: number, minutes: number, startHour: number): number {
  const d = keyToDate(key);
  if (hours < startHour) d.setDate(d.getDate() + 1);
  d.setHours(hours, minutes, 0, 0);
  return d.getTime();
}
