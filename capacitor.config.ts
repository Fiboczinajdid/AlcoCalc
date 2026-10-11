import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fiboczinajdid.alcocalc',
  appName: 'AlcoCalc',
  webDir: 'dist',
  backgroundColor: '#FAF8F4',
  plugins: {
    CapacitorUpdater: {
      // Aktualizacje sprawdza sama aplikacja (src/updates.ts) na GitHub Pages – bez serwerów Capgo.
      autoUpdate: false,
      updateUrl: '',
      channelUrl: '',
      statsUrl: '',
    },
  },
  android: {
    // Theme w styles.xml wyłącza tryb edge-to-edge; „auto” to zabezpieczenie, gdyby system go wymusił.
    adjustMarginsForEdgeToEdge: 'auto',
  },
};

export default config;
