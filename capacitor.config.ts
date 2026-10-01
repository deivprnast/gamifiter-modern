import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cz.upol.ftk.gamifiter',
  appName: 'Gamifiter',
  webDir: 'dist',
  server: {
    cleartext: true
  }
};

export default config;
