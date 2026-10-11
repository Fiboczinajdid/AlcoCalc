# AlcoCalc

Aplikacja PWA do świadomego picia. Przelicza alkohol na Twoje własne jednostki (np. „moje piwo 5% 0,5 l”), szacuje promile i czas do zejścia poniżej limitu, liczy wodę i koszty wieczoru oraz pokazuje kalendarz, serie dni bez alkoholu i statystyki.

Wszystkie dane zostają w telefonie (IndexedDB). Nie ma konta ani serwera.

> **Ważne:** szacunki promili to wyłącznie przybliżenie. Ludzie spalają alkohol nawet dwukrotnie różnie szybko. Przed jazdą zawsze sprawdź się alkomatem.

## Technologia

- **Svelte 5 + TypeScript + Vite.** Wybrałem Svelte zamiast Reacta, bo daje mniej kodu i mniejszą paczkę w PWA, która ma być lekka na telefonie.
- Logika obliczeń to czyste funkcje w [`src/logic/`](src/logic/), niezależne od UI, z testami Vitest.
- Zapis lokalny przez [`idb`](https://github.com/jakearchibald/idb) (~1 kB).
- PWA przez `vite-plugin-pwa` (manifest i service worker Workbox, pełne działanie offline).
- Wykresy rysowane własnym kodem SVG, bez bibliotek.

## Struktura

```
src/
  logic/            czyste funkcje + testy
    units.ts          czysty alkohol, przeliczanie jednostek, gramy, kcal
    bac.ts            Widmark/Watson, wchłanianie, symulacja promili, alkomat, czasy zejścia
    dates.ts          „dzień logiczny” (nowy dzień od 6:00)
    water.ts, cost.ts, streaks.ts, stats.ts, backup.ts, templates.ts
  data/db.ts        IndexedDB (zapis/odczyt, kopia, czyszczenie)
  state/            stan aplikacji (runy Svelte), most UI ↔ logika ↔ zapis
  ui/screens/       Dziś, Kalendarz, Statystyki, Ustawienia, ekran powitalny
  ui/components/    arkusze, karty, wykresy
scripts/            generator ikon (wektorowa wersja kufla → PNG)
public/icons/       ikony 192, 512, maskable, apple-touch, favicon
```

## Polecenia

```bash
npm install        # instalacja zależności
npm run dev        # serwer deweloperski
npm test           # testy jednostkowe (Vitest)
npm run check      # sprawdzenie typów i dostępności
npm run build      # wersja produkcyjna do katalogu dist/
npm run preview    # podgląd wersji produkcyjnej (z service workerem)
npm run icons      # ponowne wygenerowanie ikon
```

## Model obliczeń

| Co | Jak |
|---|---|
| Czysty alkohol | objętość × moc × liczba sztuk (3 × 400 ml × 8% = 96 ml) |
| Jednostki | 96 ml ÷ 25 ml („moje piwo” 5% 500 ml) = **3,84** |
| Gramy, kalorie | ml × 0,789 g/ml; ok. 7 kcal/g |
| Promile | Widmark: r = 0,7 (M) / 0,6 (K); przy podanym wzroście i wieku r z wody całkowitej wg Watsona: r = TBW / (0,8 × masa) |
| Wchłanianie | liniowo przez ok. 45 min, a z włączonym „jadłem” przez ok. 90 min |
| Spalanie | dwa warianty: „najwcześniej” 0,15‰/h i „bezpieczniej” 0,10‰/h |
| Alkomat | wynik zastępuje szacunek od chwili pomiaru (mg/l × 2 = ‰) |
| Woda | szklanka 250 ml na każdy napój + jedna przed snem |
| Dni bez alkoholu | każdy dzień bez wpisu od pierwszego uruchomienia; nowy dzień zaczyna się o 6:00 (do zmiany w ustawieniach) |

---

## Publikacja za darmo

### Opcja A: GitHub Pages (automatycznie przez GitHub Actions)

Projekt zawiera gotowy workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Przy każdym wypchnięciu zmian uruchamia testy, buduje aplikację i publikuje ją.

1. Załóż konto na [github.com](https://github.com), jeśli go nie masz.
2. Utwórz nowe repozytorium (przycisk **New**), np. o nazwie `AlcoCalc`. Może być publiczne. Nie dodawaj README.
3. W folderze projektu uruchom w terminalu (podmień `TWOJ_LOGIN`):
   ```bash
   git init
   git add .
   git commit -m "AlcoCalc"
   git branch -M main
   git remote add origin https://github.com/TWOJ_LOGIN/AlcoCalc.git
   git push -u origin main
   ```
4. Na GitHubie wejdź w repozytorium → **Settings** → **Pages**. W polu **Source** wybierz **GitHub Actions**.
5. Wejdź w zakładkę **Actions** i poczekaj 1–2 minuty, aż zadanie „Deploy to GitHub Pages” zakończy się zielonym znaczkiem. Jeśli uruchomiło się przed krokiem 4 i nie przeszło, kliknij **Re-run all jobs**.
6. Aplikacja będzie pod adresem `https://TWOJ_LOGIN.github.io/AlcoCalc/`.

Kolejne zmiany publikujesz przez `git add . && git commit -m "opis" && git push`.

### Opcja B: Netlify

Projekt zawiera [`netlify.toml`](netlify.toml), więc Netlify sam wie, jak go zbudować.

**Przez GitHuba (zalecane, aktualizuje się samo):**
1. Wypchnij projekt na GitHuba (kroki 1–3 z opcji A).
2. Na [app.netlify.com](https://app.netlify.com) wybierz **Add new site → Import an existing project → GitHub** i wskaż repozytorium.
3. Ustawienia zostaną wczytane z `netlify.toml` (build: `npm ci && npm run build`, publish: `dist`). Kliknij **Deploy**.
4. Po ok. minucie dostaniesz adres typu `https://nazwa.netlify.app`. Nazwę zmienisz w **Site configuration → Change site name**.

**Bez GitHuba (ręcznie):**
1. Uruchom `npm run build`.
2. Na [app.netlify.com/drop](https://app.netlify.com/drop) przeciągnij folder `dist`.

Oba sposoby dają HTTPS, który jest wymagany do instalacji PWA.

---

## Instalacja na telefonie

### Android (Chrome)
1. Otwórz adres aplikacji w **Chrome**.
2. Poczekaj, aż strona się załaduje. Może pojawić się pasek „Zainstaluj aplikację”, wystarczy go tapnąć.
3. Jeśli paska nie ma: menu **⋮** (prawy górny róg) → **Zainstaluj aplikację** (albo **Dodaj do ekranu głównego**) → **Zainstaluj**.
4. Ikona kufla pojawi się na ekranie głównym. Aplikacja otwiera się na pełnym ekranie i działa offline.

### iPhone (Safari)
1. Otwórz adres aplikacji w **Safari**. Inne przeglądarki na iOS mogą nie mieć tej opcji.
2. Tapnij przycisk **Udostępnij** (kwadrat ze strzałką w górę na dolnym pasku).
3. Przewiń w dół i wybierz **Do ekranu początkowego**.
4. Zostaw nazwę „AlcoCalc” i tapnij **Dodaj**.
5. Uruchamiaj aplikację z ikony na ekranie początkowym, a nie z Safari, bo dane są przypisane do zainstalowanej aplikacji.

### Kopia danych
Usunięcie aplikacji kasuje jej dane. Co jakiś czas wejdź w **Ustawienia → Eksportuj kopię (JSON)** i zachowaj plik (np. na Dysku Google lub w iCloud). Dane przywrócisz przez **Importuj kopię**.
