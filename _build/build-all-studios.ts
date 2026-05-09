#!/usr/bin/env bun
/**
 * Rebuilds all extension Studio IIFE bundles.
 *
 * For each extension that has a studio/ directory:
 *   1. Rewrites vite.config.ts with correct Svelte 5 externals
 *   2. Ensures src/index.ts calls register() at load time
 *   3. Runs `vite build`
 *
 * Usage:
 *   bun run _build/build-all-studios.ts [extension-name]
 *   bun run _build/build-all-studios.ts   # builds all
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, relative } from 'path';

const ROOT = join(import.meta.dir, '..');
const ONLY = process.argv[2];

// ── Correct vite.config.ts template ───────────────────────────────────────────
function makeViteConfig(libAlias: string | null, libName: string): string {
  const aliasBlock = libAlias
    ? `  resolve: {
    alias: {
      $lib: fileURLToPath(new URL('${libAlias}', import.meta.url)),
    },
  },\n`
    : '';

  return `import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
${libAlias ? "import { fileURLToPath, URL } from 'node:url';\n" : ''}
export default defineConfig({
  plugins: [svelte()],
${aliasBlock}  build: {
    lib: {
      entry: 'src/index.ts',
      name: '${libName}',
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
`;
}

function patchViteConfig(studioDir: string): boolean {
  const configPath = join(studioDir, 'vite.config.ts');
  const src = readFileSync(configPath, 'utf8');

  // Already has Svelte 5 function-based external — skip
  if (src.includes("id.startsWith('svelte/')")) return false;

  // Extract existing $lib alias URL if present
  const aliasMatch = src.match(/\$lib:\s*fileURLToPath\(new URL\('([^']+)'/);
  const existingAlias = aliasMatch ? aliasMatch[1] : null;

  // Compute correct $lib alias path from studioDir depth
  let libAlias: string | null = null;
  if (existingAlias !== null) {
    // Compute from depth: studioDir is ROOT/<a>/<b?>/studio
    const relFromRoot = relative(ROOT, studioDir).replace(/\\/g, '/');
    const segments = relFromRoot.split('/').length; // e.g. crm/studio = 2, auth/ldap/studio = 3
    const ups = '../'.repeat(segments + 1); // +1 to go above ROOT to zveltio-ecosystem/
    libAlias = `${ups}zveltio/packages/studio/src/lib`;
  }

  // Extract lib name (default to ZveltioExt)
  const nameMatch = src.match(/name:\s*['"]([^'"]+)['"]/);
  const libName = nameMatch ? nameMatch[1] : 'ZveltioExt';

  writeFileSync(configPath, makeViteConfig(libAlias, libName), 'utf8');
  return true;
}

function patchIndexTs(indexPath: string): boolean {
  const src = readFileSync(indexPath, 'utf8');
  if (/^\s*register\(\);/m.test(src)) return false;
  if (!src.includes('export default') && !src.includes('export default function')) return false;
  writeFileSync(indexPath, src.trimEnd() + '\n\nregister();\n', 'utf8');
  return true;
}

function findStudioDirs(base: string, prefix = ''): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(base, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('_') || entry.name === 'node_modules') continue;
    const full = join(base, entry.name);
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.name === 'studio' && existsSync(join(full, 'vite.config.ts'))) {
      results.push(full);
    } else {
      results.push(...findStudioDirs(full, rel));
    }
  }
  return results;
}

const studioDirs = findStudioDirs(ROOT).filter(d => {
  if (!ONLY) return true;
  return d.includes(ONLY);
});

console.log(`Building ${studioDirs.length} extension studio bundle(s)…\n`);

let passed = 0;
let failed = 0;

for (const studioDir of studioDirs) {
  const relDir = studioDir.replace(ROOT + '/', '').replace(ROOT + '\\', '');
  const indexPath = join(studioDir, 'src', 'index.ts');

  process.stdout.write(`📦 ${relDir} … `);

  const configPatched = patchViteConfig(studioDir);
  let indexPatched = false;
  if (existsSync(indexPath)) {
    indexPatched = patchIndexTs(indexPath);
  }

  if (configPatched) process.stdout.write('(config patched) ');
  if (indexPatched) process.stdout.write('(register() added) ');

  const proc = Bun.spawn(['bun', 'run', 'build'], {
    cwd: studioDir,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const exit = await proc.exited;

  if (exit === 0) {
    console.log('✅');
    passed++;
  } else {
    const err = await new Response(proc.stderr).text();
    console.log('❌');
    console.error(`   ${err.trim().split('\n').slice(-5).join('\n   ')}`);
    failed++;
  }
}

console.log(`\nDone: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
