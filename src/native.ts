/**
 * Integracja z Androidem (tylko wersja APK). W wersji PWA `__NATIVE__` jest równe false,
 * więc bundler usuwa ten kod razem z importami pluginów Capacitora.
 */

export const isNative = __NATIVE__;

/** Systemowy przycisk „Wstecz”: najpierw zamknij arkusz, potem wróć do „Dziś”, na końcu wyjdź. */
export async function setupBackButton(onBack: () => boolean) {
  if (!__NATIVE__) return;
  const { App } = await import('@capacitor/app');
  await App.addListener('backButton', () => {
    if (!onBack()) App.exitApp();
  });
}

/** Zapisuje plik kopii i otwiera systemowe „Udostępnij” (Dysk Google, Pliki, e-mail…). */
export async function shareTextFile(name: string, content: string) {
  if (!__NATIVE__) return;
  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
  const { Share } = await import('@capacitor/share');
  const file = await Filesystem.writeFile({
    path: name,
    data: content,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });
  await Share.share({ title: 'Kopia AlcoCalc', files: [file.uri], dialogTitle: 'Zapisz kopię AlcoCalc' });
}
