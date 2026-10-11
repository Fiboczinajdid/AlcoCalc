import * as db from '../data/db';
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  dayKey,
  type Backup,
  type DayLog,
  type Drink,
  type Profile,
  type Reading,
  type Unit,
} from '../logic';

let seq = 0;

/** Identyfikator rosnący w kolejności tworzenia – IndexedDB zwraca rekordy posortowane po kluczu. */
export function uid(): string {
  const time = Date.now().toString(36).padStart(9, '0');
  const n = (seq++ % 1296).toString(36).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 8).padEnd(6, '0');
  return `${time}${n}-${rand}`;
}

/** IndexedDB nie przyjmuje proxy Svelte – zapisujemy zwykłe obiekty. */
const plain = <T>(v: T): T => $state.snapshot(v) as T;

export interface Toast {
  id: number;
  message: string;
  actionLabel?: string;
  action?: () => void;
}

class AppState {
  loaded = $state(false);
  loadError = $state<string | null>(null);
  profile = $state<Profile | null>(null);
  units = $state<Unit[]>([]);
  /** Posortowane rosnąco po czasie. */
  drinks = $state<Drink[]>([]);
  days = $state<Record<string, DayLog>>({});
  readings = $state<Reading[]>([]);
  now = $state(Date.now());
  toast = $state<Toast | null>(null);

  activeUnit = $derived<Unit | null>(
    this.units.find((u) => u.id === this.profile?.activeUnitId) ?? this.units[0] ?? null,
  );
  startHour = $derived(this.profile?.dayStartHour ?? 6);
  todayKey = $derived(dayKey(this.now, this.startHour));
  /** Pierwszy śledzony dzień: start aplikacji lub najwcześniejszy wpis. */
  firstKey = $derived.by(() => {
    const start = dayKey(this.profile?.startedAt ?? this.now, this.startHour);
    const first = this.drinks[0] ? dayKey(this.drinks[0].time, this.startHour) : start;
    return first < start ? first : start;
  });
  lastDrink = $derived<Drink | null>(this.drinks.at(-1) ?? null);

  async init() {
    try {
      const s = await db.loadAll();
      this.profile = s.profile;
      this.units = s.units;
      this.drinks = s.drinks.sort((a, b) => a.time - b.time);
      this.days = Object.fromEntries(s.days.map((d) => [d.date, d]));
      this.readings = s.readings;
    } catch (e) {
      this.loadError = 'Nie udało się otworzyć lokalnej bazy danych. ' + String(e);
    }
    this.loaded = true;
    setInterval(() => (this.now = Date.now()), 30_000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.now = Date.now();
    });
    db.requestPersistence();
  }

  // ---------- profil i jednostki ----------

  async createProfile(p: Omit<Profile, 'activeUnitId' | 'startedAt'>, units: Omit<Unit, 'id'>[]) {
    const created = units.map((u) => ({ ...u, id: uid() }));
    const profile: Profile = { ...p, activeUnitId: created[0].id, startedAt: Date.now() };
    for (const u of created) await db.saveUnit(u);
    await db.saveProfile(profile);
    this.units = created;
    this.profile = profile;
  }

  async saveProfile(patch: Partial<Profile>) {
    if (!this.profile) return;
    const next = { ...plain(this.profile), ...patch };
    await db.saveProfile(next);
    this.profile = next;
  }

  async setActiveUnit(id: string) {
    if (this.profile?.activeUnitId !== id) await this.saveProfile({ activeUnitId: id });
  }

  async saveUnit(u: Unit) {
    const unit = plain(u);
    await db.saveUnit(unit);
    const i = this.units.findIndex((x) => x.id === unit.id);
    if (i >= 0) this.units[i] = unit;
    else this.units.push(unit);
  }

  async removeUnit(id: string) {
    if (this.units.length <= 1) return;
    await db.deleteUnit(id);
    this.units = this.units.filter((u) => u.id !== id);
    if (this.profile?.activeUnitId === id) await this.setActiveUnit(this.units[0].id);
  }

  // ---------- napoje ----------

  drinksOn(key: string): Drink[] {
    return this.drinks.filter((d) => dayKey(d.time, this.startHour) === key);
  }

  async addDrink(d: Omit<Drink, 'id'>, opts: { undo?: boolean } = { undo: true }) {
    const drink: Drink = { ...plain(d), id: uid() };
    await db.saveDrink(drink);
    this.drinks = [...this.drinks, drink].sort((a, b) => a.time - b.time);
    if (opts.undo) {
      this.showToast(`Dodano: ${drink.count > 1 ? drink.count + ' × ' : ''}${drink.name}`, 'Cofnij', () =>
        this.removeDrink(drink.id, false),
      );
    }
    return drink;
  }

  async updateDrink(d: Drink) {
    const drink = plain(d);
    await db.saveDrink(drink);
    this.drinks = this.drinks.map((x) => (x.id === drink.id ? drink : x)).sort((a, b) => a.time - b.time);
  }

  async removeDrink(id: string, undo = true) {
    const old = this.drinks.find((d) => d.id === id);
    if (!old) return;
    const copy = plain(old);
    await db.deleteDrink(id);
    this.drinks = this.drinks.filter((d) => d.id !== id);
    if (undo) {
      this.showToast(`Usunięto: ${copy.name}`, 'Cofnij', async () => {
        await db.saveDrink(copy);
        this.drinks = [...this.drinks, copy].sort((a, b) => a.time - b.time);
      });
    }
  }

  async repeatLast() {
    const last = this.lastDrink;
    if (!last) return;
    const { id: _id, ...rest } = plain(last);
    await this.addDrink({ ...rest, time: Date.now() });
  }

  // ---------- dni (woda, jedzenie, dodatki) ----------

  day(key: string): DayLog {
    return this.days[key] ?? { date: key, waterGlasses: 0, ate: false, extras: [] };
  }

  async updateDay(key: string, patch: Partial<Omit<DayLog, 'date'>>) {
    const next: DayLog = { ...plain(this.day(key)), ...plain(patch), date: key };
    await db.saveDay(next);
    this.days[key] = next;
  }

  ateFor = (d: Drink) => this.day(dayKey(d.time, this.startHour)).ate;

  // ---------- alkomat ----------

  async addReading(time: number, permille: number) {
    const r: Reading = { id: uid(), time, permille };
    await db.saveReading(r);
    this.readings = [...this.readings, r].sort((a, b) => a.time - b.time);
  }

  async removeReading(id: string) {
    await db.deleteReading(id);
    this.readings = this.readings.filter((r) => r.id !== id);
  }

  // ---------- dane ----------

  exportBackup(): Backup {
    return {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      profile: plain(this.profile),
      units: plain(this.units),
      drinks: plain(this.drinks),
      days: Object.values(plain(this.days)),
      readings: plain(this.readings),
    };
  }

  async importBackup(b: Backup) {
    await db.replaceAll(b);
    this.profile = b.profile;
    this.units = b.units;
    this.drinks = [...b.drinks].sort((a, c) => a.time - c.time);
    this.days = Object.fromEntries(b.days.map((d) => [d.date, d]));
    this.readings = b.readings;
  }

  async wipe() {
    await db.clearAll();
    this.profile = null;
    this.units = [];
    this.drinks = [];
    this.days = {};
    this.readings = [];
  }

  // ---------- komunikaty ----------

  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  showToast(message: string, actionLabel?: string, action?: () => void) {
    clearTimeout(this.toastTimer);
    this.toast = { id: Date.now(), message, actionLabel, action };
    this.toastTimer = setTimeout(() => (this.toast = null), 5000);
  }

  dismissToast() {
    clearTimeout(this.toastTimer);
    this.toast = null;
  }
}

export const app = new AppState();
