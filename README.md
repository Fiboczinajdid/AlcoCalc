# AlcoCalc

Aplikacja do świadomego picia (Android APK i PWA). Przelicza alkohol na Twoje własne jednostki (np. „moje piwo 5% 0,5 l”), szacuje promile i czas do zejścia poniżej limitu, liczy wodę i koszty wieczoru oraz pokazuje kalendarz, serie dni bez alkoholu i statystyki.

Wszystkie dane zostają w telefonie (IndexedDB). Nie ma konta ani serwera.

- **Android (APK):** https://fiboczinajdid.github.io/AlcoCalc/apk/
- **Wersja w przeglądarce (także iPhone):** https://fiboczinajdid.github.io/AlcoCalc/

> **Ważne:** szacunki promili to wyłącznie przybliżenie. Ludzie spalają alkohol nawet dwukrotnie różnie szybko. Przed jazdą zawsze sprawdź się alkomatem.

## Technologia

- **Svelte 5 + TypeScript + Vite.** Wybrałem Svelte zamiast Reacta, bo daje mniej kodu i mniejszą paczkę w PWA, która ma być lekka na telefonie.
- Logika obliczeń to czyste funkcje w [`src/logic/`](src/logic/), niezależne od UI, z testami Vitest.
- Zapis lokalny przez [`idb`](https://github.com/jakearchibald/idb) (~1 kB).
- PWA przez `vite-plugin-pwa` (manifest i service worker Workbox, pełne działanie offline).
- Wykresy rysowane własnym kodem SVG, bez bibliotek.
- APK na Androida przez [Capacitor](https://capacitorjs.com) 7. Budowa i podpis odbywają się w GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)), a gotowy plik trafia na stronę aplikacji (`/AlcoCalc.apk`) i do Releases.

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
scripts/            generatory ikon (wektorowa wersja kufla → PNG dla PWA i Androida)
android/            projekt Androida (Capacitor)
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
npm run icons      # ponowne wygenerowanie ikon PWA
npm run icons:android  # ikony i ekran startowy Androida
npm run build:android  # wersja do APK + kopiowanie do projektu Androida
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

## Instalacja na telefonie

### Android – plik APK (zalecane)
1. Na telefonie otwórz w **Chrome** https://fiboczinajdid.github.io/AlcoCalc/apk/ i tapnij **Pobierz AlcoCalc.apk**. Jeśli Chrome zapyta, wybierz **Pobierz mimo to**.
2. Otwórz pobrany plik (z powiadomienia albo z aplikacji **Pliki → Pobrane**).
3. Jeśli telefon zapyta, zezwól na instalację z tego źródła (**Ustawienia → Zezwalaj z tego źródła**). Na Xiaomi/Redmi może też pojawić się skanowanie zabezpieczeń – wybierz **Kontynuuj instalację**.
4. Tapnij **Zainstaluj**. Ikona AlcoCalc pojawi się na pulpicie.

Nową wersję instalujesz tak samo, z tego samego linku. Instaluje się jako aktualizacja, dane zostają.

### Android – z przeglądarki Chrome (bez APK)
1. Otwórz https://fiboczinajdid.github.io/AlcoCalc/ w **Chrome**.
2. Poczekaj, aż strona się załaduje. Może pojawić się pasek „Zainstaluj aplikację”, wystarczy go tapnąć.
3. Jeśli paska nie ma: menu **⋮** (prawy górny róg) → **Zainstaluj aplikację** (albo **Dodaj do ekranu głównego**) → **Zainstaluj**.
4. Ikona kufla pojawi się na ekranie głównym. Aplikacja otwiera się na pełnym ekranie i działa offline.

### iPhone (Safari)
1. Otwórz https://fiboczinajdid.github.io/AlcoCalc/ w **Safari**. Inne przeglądarki na iOS mogą nie mieć tej opcji.
2. Tapnij przycisk **Udostępnij** (kwadrat ze strzałką w górę na dolnym pasku).
3. Przewiń w dół i wybierz **Do ekranu początkowego**.
4. Zostaw nazwę „AlcoCalc” i tapnij **Dodaj**.
5. Uruchamiaj aplikację z ikony na ekranie początkowym, a nie z Safari, bo dane są przypisane do zainstalowanej aplikacji.

### Kopia danych
Usunięcie aplikacji kasuje jej dane. Wersja APK i wersja z przeglądarki mają osobne dane – kopię możesz przenieść między nimi eksportem i importem. Co jakiś czas wejdź w **Ustawienia → Eksportuj kopię (JSON)** i zachowaj plik (np. na Dysku Google lub w iCloud). Dane przywrócisz przez **Importuj kopię**.
