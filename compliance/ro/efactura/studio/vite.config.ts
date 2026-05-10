import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [svelte()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'ZveltioExt',
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
