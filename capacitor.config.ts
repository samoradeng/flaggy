import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.flagtriv.app',
  appName: 'Flagtriv',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#FFFC00'  // Brand yellow
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'LIGHT'
    }
  }
};

export default config;
