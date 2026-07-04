import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nextn.app',
  appName: 'ivopaybrindes',
  webDir: 'public',
  server: {
    url: 'https://ivopaybrindes.vercel.app',
    cleartext: true
  }
};

export default config;
