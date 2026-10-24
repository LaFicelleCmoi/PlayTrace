import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const api = `http://localhost:${process.env.PORT ?? 3000}`;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    strictPort: true,
    // Le front et l'API partagent la même origine en dev : cookies et SSE passent sans CORS.
    proxy: {
      '/api': api,
      '/auth': api,
    },
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
  },
});
