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
    // Serveur de dev limité à cette machine (failles connues de Vite 5 côté serveur de dev).
    host: '127.0.0.1',
    // Le front et l'API partagent la même origine en dev : cookies et SSE passent sans CORS.
    proxy: {
      '/api': api,
      '/auth': api,
    },
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Les dépendances changent rarement : fichiers séparés, gardés en cache d'un déploiement à l'autre.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react';
          if (/[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) return 'motion';
          return 'vendor';
        },
      },
    },
  },
});
