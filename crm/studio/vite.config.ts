import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: fileURLToPath(new URL('../../../zveltio/packages/studio/src/lib', import.meta.url)),
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
      external: (id: string) => id === 'svelte' || id.startsWith('svelte/'),
      output: {
        globals: (id: string) => {
          const m: Record<string, string> = {
            'svelte':                 'window.__SvelteRuntime.svelte',
            'svelte/store':           'window.__SvelteRuntime.store',
            'svelte/internal/client': 'window.__SvelteRuntime.internal_client',
            'svelte/transition':      'window.__SvelteRuntime.transition',
            'svelte/animate':         'window.__SvelteRuntime.animate',
            'svelte/reactivity':      'window.__SvelteRuntime.reactivity',
          };
          return m[id] ?? 'window.__SvelteRuntime.__unknown';
        },
      },
    },
    outDir: 'dist',
  },
});
