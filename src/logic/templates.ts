export interface DrinkTemplate {
  name: string;
  volumeMl: number;
  abv: number;
}

/** Gotowe szablony popularnych napojów. */
export const DRINK_TEMPLATES: DrinkTemplate[] = [
  { name: 'Piwo 0,5 l', volumeMl: 500, abv: 5 },
  { name: 'Piwo 0,33 l', volumeMl: 330, abv: 5 },
  { name: 'Piwo mocne', volumeMl: 500, abv: 7.5 },
  { name: 'Radler', volumeMl: 500, abv: 2 },
  { name: 'Cydr', volumeMl: 400, abv: 4.5 },
  { name: 'Wino', volumeMl: 150, abv: 12 },
  { name: 'Prosecco', volumeMl: 125, abv: 11 },
  { name: 'Wódka (kieliszek)', volumeMl: 50, abv: 40 },
  { name: 'Whisky', volumeMl: 40, abv: 40 },
  { name: 'Drink z wódką', volumeMl: 40, abv: 40 },
  { name: 'Nalewka', volumeMl: 50, abv: 30 },
];

/** Jednostki tworzone przy pierwszym uruchomieniu. */
export const DEFAULT_UNITS: DrinkTemplate[] = [
  { name: 'Moje piwo 5% 500 ml', volumeMl: 500, abv: 5 },
  { name: 'Kieliszek wina 12% 150 ml', volumeMl: 150, abv: 12 },
  { name: 'Szot 40% 50 ml', volumeMl: 50, abv: 40 },
];
