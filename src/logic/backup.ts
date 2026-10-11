import type { DayLog, Drink, Profile, Reading, Unit } from './types';

export const BACKUP_FORMAT = 'alcocalc-backup';
export const BACKUP_VERSION = 1;

export interface Backup {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  profile: Profile | null;
  units: Unit[];
  drinks: Drink[];
  days: DayLog[];
  readings: Reading[];
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const numOrNull = (v: unknown) => (isNum(v) ? v : null);

export class BackupError extends Error {}

/** Sprawdza i normalizuje plik kopii. Rzuca BackupError, gdy plik jest nieprawidłowy. */
export function parseBackup(raw: unknown): Backup {
  if (!raw || typeof raw !== 'object') throw new BackupError('To nie jest plik kopii AlcoCalc.');
  const o = raw as Record<string, unknown>;
  if (o.format !== BACKUP_FORMAT) throw new BackupError('To nie jest plik kopii AlcoCalc.');
  if (!isNum(o.version) || o.version > BACKUP_VERSION)
    throw new BackupError('Ta kopia pochodzi z nowszej wersji aplikacji.');

  const arr = (v: unknown) => (Array.isArray(v) ? v : []);

  const units: Unit[] = arr(o.units)
    .filter((u) => u && isStr(u.id) && isStr(u.name) && isNum(u.volumeMl) && isNum(u.abv))
    .map((u) => ({ id: u.id, name: u.name, volumeMl: u.volumeMl, abv: u.abv }));

  const drinks: Drink[] = arr(o.drinks)
    .filter((d) => d && isStr(d.id) && isNum(d.volumeMl) && isNum(d.abv) && isNum(d.time))
    .map((d) => ({
      id: d.id,
      name: isStr(d.name) ? d.name : 'Napój',
      volumeMl: d.volumeMl,
      abv: d.abv,
      count: isNum(d.count) && d.count > 0 ? d.count : 1,
      time: d.time,
      price: numOrNull(d.price),
    }));

  const days: DayLog[] = arr(o.days)
    .filter((d) => d && isStr(d.date))
    .map((d) => ({
      date: d.date,
      waterGlasses: isNum(d.waterGlasses) ? d.waterGlasses : 0,
      ate: d.ate === true,
      extras: arr(d.extras)
        .filter((e) => e && isStr(e.id) && isNum(e.amount))
        .map((e) => ({ id: e.id, label: isStr(e.label) ? e.label : 'Dodatek', amount: e.amount })),
    }));

  const readings: Reading[] = arr(o.readings)
    .filter((r) => r && isStr(r.id) && isNum(r.time) && isNum(r.permille))
    .map((r) => ({ id: r.id, time: r.time, permille: r.permille }));

  let profile: Profile | null = null;
  const p = o.profile as Record<string, unknown> | null | undefined;
  if (p && isNum(p.weightKg) && (p.sex === 'm' || p.sex === 'f')) {
    profile = {
      weightKg: p.weightKg,
      sex: p.sex,
      heightCm: numOrNull(p.heightCm),
      age: numOrNull(p.age),
      limitPermille: isNum(p.limitPermille) ? p.limitPermille : 0.2,
      currency: isStr(p.currency) ? p.currency : 'PLN',
      hourlyRate: numOrNull(p.hourlyRate),
      dayStartHour: isNum(p.dayStartHour) ? p.dayStartHour : 6,
      activeUnitId: isStr(p.activeUnitId) ? p.activeUnitId : (units[0]?.id ?? ''),
      startedAt: isNum(p.startedAt) ? p.startedAt : Date.now(),
    };
    if (!units.some((u) => u.id === profile!.activeUnitId) && units[0]) profile.activeUnitId = units[0].id;
  }

  return {
    format: BACKUP_FORMAT,
    version: o.version,
    exportedAt: isStr(o.exportedAt) ? o.exportedAt : '',
    profile,
    units,
    drinks,
    days,
    readings,
  };
}
