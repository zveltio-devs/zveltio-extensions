import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: fileURLToPath(new URL('../../../../zveltio/packages/studio/src/lib', import.meta.url)),
    },
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'ZveltioExt',
      formats: ['iife'],
      fileName: () => 'bundle.js',
    },
    rollupOptions: {
      external: ['svelte', 'svelte/internal', 'svelte/store', 'svelte/transition', 'svelte/animate'],
      output: {
        globals: {
          svelte:              'window.__SvelteRuntime.svelte',
          'svelte/internal':   'window.__SvelteRuntime.internal',
          'svelte/store':      'window.__SvelteRuntime.store',
          'svelte/transition': 'window.__SvelteRuntime.transition',
          'svelte/animate':    'window.__SvelteRuntime.animate',
        },
      },
    },
    outDir: 'dist',
  },
});
