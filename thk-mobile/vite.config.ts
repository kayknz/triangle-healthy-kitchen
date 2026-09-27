import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Vite plugin to remove `crossorigin` attribute from script/link tags for Capacitor WKWebView compatibility
const removeCrossorigin = (): Plugin => ({
  name: 'remove-crossorigin',
  transformIndexHtml(html: string) {
    return html.replace(/\s*crossorigin(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/g, '');
  },
});

export default defineConfig({
  plugins: [react(), removeCrossorigin()],
  base: './',
  build: {
    outDir: 'www',
    emptyOutDir: true,
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
