import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.trianglehealthykitchen.app',
  appName: 'Triangle Healthy Kitchen',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // Allow navigation to payment gateways and Supabase so the WebView doesn't break
    allowNavigation: [
      'teguqlkfmchxucedxvpu.supabase.co',
      '*.supabase.co',
      '*.tap.company',
      '*.tap.payments',
      'api.tap.company',
      'www.google.com',
      'maps.google.com',
      'fonts.googleapis.com',
      'fonts.gstatic.com',
    ],
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#F9FBF9',
    // Important for geolocation + payments
    webContentsDebuggingEnabled: false,
  },
  ios: {
    backgroundColor: '#0a3030',
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#0a3030',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#F9FBF9',
      overlaysWebView: true,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
