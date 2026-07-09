import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ludus.app',
  appName: 'Ludus',
  webDir: '../web/dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
