import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fiboczinajdid.alcocalc',
  appName: 'AlcoCalc',
  webDir: 'dist',
  backgroundColor: '#FAF8F4',
  android: {
    // Theme w styles.xml wyłącza tryb edge-to-edge; „auto” to zabezpieczenie, gdyby system go wymusił.
    adjustMarginsForEdgeToEdge: 'auto',
  },
};

export default config;
