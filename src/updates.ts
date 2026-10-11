/**
 * Aktualizacje bez reinstalacji:
 * - APK: paczka z nową wersją webową (OTA) pobierana z GitHub Pages przez @capgo/capacitor-updater,
 *   a gdy zmieniła się część natywna – prośba o nowe APK.
 * - PWA: nowy service worker.
 * W obu przypadkach aplikacja pokazuje okno z jedną akcją.
 */
import { app } from './state/app.svelte';
import { isNewer, nativeLevelOf } from './logic/version';

export const PAGES_URL = 'https://fiboczinajdid.github.io/AlcoCalc/';
const MANIFEST_URL = PAGES_URL + 'ota/latest.json';

export interface UpdateOffer {
  /** ota – nowa wersja pobrana; apk – potrzebne nowe APK; pwa – nowa wersja strony. */
  kind: 'ota' | 'apk' | 'pwa';
  version?: string;
  apply: () => Promise<void> | void;
}

interface OtaManifest {
  version: string;
  nativeLevel: number;
  bundle: string;
  checksum: string;
}

export async function initUpdates() {
  if (__NATIVE__) await initNative();
  else await initPwa();
}

async function initPwa() {
  const { registerSW } = await import('virtual:pwa-register');
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      app.update = { kind: 'pwa', apply: () => updateSW(true) };
    },
  });
}

async function initNative() {
  const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
  const { App } = await import('@capacitor/app');
  // Bez tego wtyczka uzna nową wersję za wadliwą i wróci do poprzedniej.
  await CapacitorUpdater.notifyAppReady();

  let busy = false;
  const check = async () => {
    if (busy || app.update) return;
    busy = true;
    try {
      const res = await fetch(`${MANIFEST_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const m = (await res.json()) as OtaManifest;
      if (!isNewer(m.version, __APP_VERSION__)) return;

      const info = await App.getInfo();
      if (m.nativeLevel > nativeLevelOf(info.version)) {
        app.update = {
          kind: 'apk',
          version: m.version,
          apply: () => {
            // Adres spoza aplikacji Capacitor otwiera w przeglądarce systemowej.
            location.href = PAGES_URL + 'apk/';
          },
        };
        return;
      }

      const { bundles } = await CapacitorUpdater.list();
      const ready = bundles.find((b) => b.version === m.version && (b.status === 'pending' || b.status === 'success'));
      const bundle =
        ready ?? (await CapacitorUpdater.download({ url: m.bundle, version: m.version, checksum: m.checksum }));
      // Gdy użytkownik wybierze „Później”, wersja włączy się przy następnym uruchomieniu.
      await CapacitorUpdater.next({ id: bundle.id });
      app.update = {
        kind: 'ota',
        version: m.version,
        apply: () => CapacitorUpdater.set({ id: bundle.id }),
      };
    } catch {
      // Brak internetu lub błąd pobierania – spróbujemy przy następnym otwarciu.
    } finally {
      busy = false;
    }
  };

  check();
  await App.addListener('resume', check);
}
