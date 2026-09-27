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
    backgroundColor: '#F5F3EB',
    // Important for geolocation + payments and remote debugging
    webContentsDebuggingEnabled: true,
  },
  ios: {
    backgroundColor: '#F5F3EB',
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: true,
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      launchAutoHide: true,
      backgroundColor: '#F5F3EB',
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
