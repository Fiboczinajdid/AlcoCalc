import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { DayLog, Drink, Preset, Profile, Reading, Unit } from '../logic/types';

interface AlcoDB extends DBSchema {
  kv: { key: string; value: unknown };
  units: { key: string; value: Unit };
  presets: { key: string; value: Preset };
  drinks: { key: string; value: Drink; indexes: { time: number } };
  days: { key: string; value: DayLog };
  readings: { key: string; value: Reading };
}

const STORES = ['kv', 'units', 'presets', 'drinks', 'days', 'readings'] as const;

let dbPromise: Promise<IDBPDatabase<AlcoDB>> | null = null;

function db() {
  dbPromise ??= openDB<AlcoDB>('alcocalc', 2, {
    upgrade(d, oldVersion) {
      if (oldVersion < 1) {
        d.createObjectStore('kv');
        d.createObjectStore('units', { keyPath: 'id' });
        d.createObjectStore('drinks', { keyPath: 'id' }).createIndex('time', 'time');
        d.createObjectStore('days', { keyPath: 'date' });
        d.createObjectStore('readings', { keyPath: 'id' });
      }
      if (oldVersion < 2) d.createObjectStore('presets', { keyPath: 'id' });
    },
  });
  return dbPromise;
}

export interface Snapshot {
  profile: Profile | null;
  units: Unit[];
  presets: Preset[];
  drinks: Drink[];
  days: DayLog[];
  readings: Reading[];
}

export async function loadAll(): Promise<Snapshot> {
  const d = await db();
  const [profile, units, presets, drinks, days, readings] = await Promise.all([
    d.get('kv', 'profile') as Promise<Profile | undefined>,
    d.getAll('units'),
    d.getAll('presets'),
    d.getAllFromIndex('drinks', 'time'),
    d.getAll('days'),
    d.getAll('readings'),
  ]);
  // Wersja 1 zapisywała wodę w szklankach po 250 ml.
  const legacy = (day: DayLog & { waterGlasses?: number }): DayLog => {
    const { waterGlasses, ...rest } = day;
    return { ...rest, waterMl: day.waterMl ?? (waterGlasses ?? 0) * 250 };
  };
  return { profile: profile ?? null, units, presets, drinks, days: days.map(legacy), readings };
}

export async function saveProfile(p: Profile) {
  await (await db()).put('kv', p, 'profile');
}

export async function saveUnit(u: Unit) {
  await (await db()).put('units', u);
}

export async function deleteUnit(id: string) {
  await (await db()).delete('units', id);
}

export async function savePreset(p: Preset) {
  await (await db()).put('presets', p);
}

export async function deletePreset(id: string) {
  await (await db()).delete('presets', id);
}

export async function saveDrink(dr: Drink) {
  await (await db()).put('drinks', dr);
}

export async function deleteDrink(id: string) {
  await (await db()).delete('drinks', id);
}

export async function saveDay(day: DayLog) {
  await (await db()).put('days', day);
}

export async function saveReading(r: Reading) {
  await (await db()).put('readings', r);
}

export async function deleteReading(id: string) {
  await (await db()).delete('readings', id);
}

export async function clearAll() {
  const d = await db();
  const tx = d.transaction(STORES, 'readwrite');
  await Promise.all([...STORES.map((s) => tx.objectStore(s).clear()), tx.done]);
}

/** Zastępuje wszystkie dane zawartością kopii (w jednej transakcji). */
export async function replaceAll(s: Snapshot) {
  const d = await db();
  const tx = d.transaction(STORES, 'readwrite');
  const ops: Promise<unknown>[] = STORES.map((st) => tx.objectStore(st).clear());
  if (s.profile) ops.push(tx.objectStore('kv').put(s.profile, 'profile'));
  for (const u of s.units) ops.push(tx.objectStore('units').put(u));
  for (const pr of s.presets) ops.push(tx.objectStore('presets').put(pr));
  for (const dr of s.drinks) ops.push(tx.objectStore('drinks').put(dr));
  for (const day of s.days) ops.push(tx.objectStore('days').put(day));
  for (const r of s.readings) ops.push(tx.objectStore('readings').put(r));
  ops.push(tx.done);
  await Promise.all(ops);
}

/** Prosi przeglądarkę, by nie usuwała danych przy braku miejsca. */
export async function requestPersistence() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    /* brak wsparcia – trudno */
  }
}
