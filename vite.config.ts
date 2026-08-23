import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

/**
 * `VITE_BASE` lets the same source deploy to a subpath without a code change.
 * GitHub Pages serves a project site from /<repo>/, so the deploy workflow sets
 * VITE_BASE=/NameDay/. Locally it stays '/'.
 *
 * `VITE_ROUTER=hash` switches the app to a hash router for single-file builds
 * hosted somewhere that can't rewrite unknown paths back to index.html.
 */
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  build: {
    // VITE_INLINE_ASSETS=1 emits assets as data URIs instead of separate
    // files, for building a single self-contained HTML page.
    assetsInlineLimit: process.env.VITE_INLINE_ASSETS ? 8 * 1024 * 1024 : undefined,
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: { port: 5173 },
});
