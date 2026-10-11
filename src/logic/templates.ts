export interface UnitTemplate {
  name: string;
  volumeMl: number;
  abv: number;
}

/** Jednostki tworzone przy pierwszym uruchomieniu. */
export const DEFAULT_UNITS: UnitTemplate[] = [
  { name: 'Moje piwo 5% 500 ml', volumeMl: 500, abv: 5 },
  { name: 'Kieliszek wina 12% 150 ml', volumeMl: 150, abv: 12 },
  { name: 'Szot 40% 50 ml', volumeMl: 50, abv: 40 },
];
