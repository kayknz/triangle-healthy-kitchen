import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

const androidFirebaseConfigured = existsSync(
  fileURLToPath(new URL('./android/app/google-services.json', import.meta.url)),
);

// Vite plugin to remove `crossorigin` attribute from script/link tags for Capacitor WKWebView compatibility
const removeCrossorigin = (): Plugin => ({
  name: 'remove-crossorigin',
  transformIndexHtml(html: string) {
    return html.replace(/\s*crossorigin(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/g, '');
  },
});

export default defineConfig({
  plugins: [react(), removeCrossorigin()],
  define: {
    // Keep Android push disabled unless the native Firebase config is actually
    // present. This prevents a stale env flag from turning startup into a crash.
    'import.meta.env.VITE_FIREBASE_ANDROID_CONFIGURED': JSON.stringify(androidFirebaseConfigured),
  },
  base: './',
  build: {
    outDir: 'www',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return;
          if (id.includes('/framer-motion/') || id.includes('/motion-dom/')) return 'motion-vendor';
          if (id.includes('/@supabase/')) return 'supabase-vendor';
          if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/scheduler/')) return 'react-vendor';
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
