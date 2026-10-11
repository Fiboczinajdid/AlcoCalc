import { keyToDate } from '../logic/dates';

const nf = new Map<string, Intl.NumberFormat>();
function numberFormat(min: number, max: number) {
  const k = `${min}-${max}`;
  let f = nf.get(k);
  if (!f) nf.set(k, (f = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: min, maximumFractionDigits: max })));
  return f;
}

export function fmtNum(n: number, maxDigits = 1, minDigits = 0): string {
  return numberFormat(minDigits, maxDigits).format(n);
}

/** Liczba jednostek: 3,84 / 12,5. */
export function fmtUnits(n: number): string {
  if (n === 0) return '0';
  return n < 10 ? fmtNum(n, 2, 0) : fmtNum(n, 1, 0);
}

export function fmtPermille(v: number): string {
  return fmtNum(v, 2, 2);
}

export function fmtAbv(abv: number): string {
  return `${fmtNum(abv, 1)}%`;
}

export function fmtVolume(ml: number): string {
  return ml >= 1000 ? `${fmtNum(ml / 1000, 2)} l` : `${fmtNum(ml, 0)} ml`;
}

export function fmtMoney(n: number, currency: string): string {
  try {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n);
  } catch {
    return `${fmtNum(n, 2, 2)} ${currency}`;
  }
}

export function fmtTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** „02:40”, „jutro 02:40”, „wczoraj 23:10” albo „12.10, 02:40”. */
export function fmtWhen(ts: number, now: number): string {
  const d = new Date(ts);
  const n = new Date(now);
  if (sameDay(d, n)) return fmtTime(ts);
  const tomorrow = new Date(n);
  tomorrow.setDate(n.getDate() + 1);
  if (sameDay(d, tomorrow)) return `jutro ${fmtTime(ts)}`;
  const yesterday = new Date(n);
  yesterday.setDate(n.getDate() - 1);
  if (sameDay(d, yesterday)) return `wczoraj ${fmtTime(ts)}`;
  return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}, ${fmtTime(ts)}`;
}

/** Zaokrąglone do 5 minut w górę – szacunek nie powinien udawać precyzji. */
export function roundUp5(ts: number): number {
  const step = 5 * 60_000;
  return Math.ceil(ts / step) * step;
}

export function fmtDuration(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function fmtHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)} min`;
  return `${fmtNum(h, 1)} h`;
}

const WEEKDAYS = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
const MONTHS_GEN = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
];
export const MONTHS = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];
export const MONTHS_SHORT = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
export const WEEKDAYS_SHORT = ['pn', 'wt', 'śr', 'cz', 'pt', 'sb', 'nd'];

export function fmtDateLong(key: string): string {
  const d = keyToDate(key);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
}

export function fmtDateShort(key: string): string {
  const d = keyToDate(key);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** Polska odmiana: 1 dzień, 2 dni, 5 dni. */
export function plural(n: number, one: string, few: string, many: string): string {
  const a = Math.abs(n);
  if (a === 1) return one;
  const n10 = a % 10;
  const n100 = a % 100;
  if (n10 >= 2 && n10 <= 4 && !(n100 >= 12 && n100 <= 14)) return few;
  return many;
}

export const days = (n: number) => `${n} ${plural(n, 'dzień', 'dni', 'dni')}`;
export const glasses = (n: number) => `${n} ${plural(n, 'szklanka', 'szklanki', 'szklanek')}`;

/** Parsuje liczbę wpisaną z przecinkiem lub kropką. */
export function parseNum(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = v.replace(/\s/g, '').replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
