import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

/**
 * Builds the AI extension's Studio UI as an IIFE bundle that Studio loads via
 * <script src="/ext/ai/bundle.js">. The bundle calls window.__zveltio.registerRoute
 * to install AI pages into Studio's nav and router.
 *
 * Svelte runtime is externalised — Studio already has it on the page; double-loading
 * would create two runtime instances. The `$lib` alias points at Studio's lib so
 * pages can reuse `api`, `toast`, etc.
 */
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      // Studio's $lib — ApiClient, toasts, config, components.
      $lib: fileURLToPath(new URL('../../../zveltio/packages/studio/src/lib', import.meta.url)),
    },
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'ZveltioExtAI',
      formats: ['iife'],
      fileName: () => 'bundle.js',
    },
    rollupOptions: {
      external: [
        'svelte',
        'svelte/internal',
        'svelte/store',
        'svelte/transition',
        'svelte/animate',
      ],
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
