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
      name: 'ZveltioExtAI',
      formats: ['es'],
      fileName: () => 'bundle.js',
    },
    rollupOptions: {
      // Svelte is provided by the Studio's import map — do not bundle it.
      external: (id: string) => id === 'svelte' || id.startsWith('svelte/'),
    },
    outDir: 'dist',
  },
});
