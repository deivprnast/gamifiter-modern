import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cz.upol.ftk.gamifiter',
  appName: 'Gamifiter',
  webDir: 'dist',
  server: {
    url: 'https://gamifiter-modern.dprycl.workers.dev',
    cleartext: true
  }
};

export default config;
