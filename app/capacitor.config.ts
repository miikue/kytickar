import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cz.kytickar.app',
  appName: 'Kytickar',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;

