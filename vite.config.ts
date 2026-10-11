/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

// Na GitHub Pages aplikacja działa pod /nazwa-repozytorium/ – ustawiane przez zmienną BASE w workflow.
const base = process.env.BASE ?? '/';

export default defineConfig(({ mode }) => {
  // Tryb „native” to wersja do APK (Capacitor): pliki są w aplikacji, więc service worker i manifest są zbędne.
  const native = mode === 'native';

  return {
    base: native ? '/' : base,
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '1.0.0'),
      __NATIVE__: JSON.stringify(native),
    },
    plugins: [
      svelte(),
      !native &&
        VitePWA({
          registerType: 'autoUpdate',
          injectRegister: 'auto',
          includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'],
          manifest: {
            name: 'AlcoCalc',
            short_name: 'AlcoCalc',
            description: 'Świadome picie: przeliczanie alkoholu na Twoje jednostki, szacunek promili i nawyki.',
            lang: 'pl',
            dir: 'ltr',
            start_url: base,
            scope: base,
            display: 'standalone',
            orientation: 'portrait',
            background_color: '#FAF8F4',
            theme_color: '#FAF8F4',
            categories: ['health', 'lifestyle'],
            icons: [
              { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
              { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
              { src: 'icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
              { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            ],
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
            navigateFallback: 'index.html',
            // Plik APK i strona pobierania muszą iść z sieci, a nie zostać zastąpione aplikacją.
            navigateFallbackDenylist: [/\/apk\/?$/, /\.apk$/],
            cleanupOutdatedCaches: true,
          },
        }),
    ],
    test: {
      include: ['src/**/*.test.ts'],
      environment: 'node',
    },
  };
});
