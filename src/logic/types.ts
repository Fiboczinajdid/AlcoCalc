export type Sex = 'm' | 'f';

export interface Profile {
  weightKg: number;
  sex: Sex;
  heightCm: number | null;
  age: number | null;
  /** Limit dla kierowcy w promilach (PL: 0,2‰). */
  limitPermille: number;
  currency: string;
  hourlyRate: number | null;
  /** Godzina, o której zaczyna się nowy „dzień” (wieczór po północy liczy się do poprzedniego). */
  dayStartHour: number;
  activeUnitId: string;
  /** Moment pierwszego uruchomienia – od tego dnia liczone są dni bez alkoholu. */
  startedAt: number;
}

/** Jednostka odniesienia, np. „Moje piwo 5% 500 ml”. */
export interface Unit {
  id: string;
  name: string;
  volumeMl: number;
  /** Zawartość alkoholu w procentach (5 = 5%). */
  abv: number;
}

export interface Drink {
  id: string;
  name: string;
  volumeMl: number;
  abv: number;
  count: number;
  /** Znacznik czasu wypicia (ms). */
  time: number;
  /** Cena za sztukę (opcjonalnie). */
  price: number | null;
}

export interface Extra {
  id: string;
  label: string;
  amount: number;
}

/** Dane przypisane do jednego „dnia” (wieczoru). */
export interface DayLog {
  /** Klucz dnia RRRR-MM-DD. */
  date: string;
  waterGlasses: number;
  ate: boolean;
  extras: Extra[];
}

/** Wynik z alkomatu, przeliczony na promile. */
export interface Reading {
  id: string;
  time: number;
  permille: number;
}
