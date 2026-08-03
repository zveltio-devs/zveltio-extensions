#!/usr/bin/env bun
/**
 * Gate: a committed bundle was built from the committed source.
 *
 * `Verify packed bundles match manifest engineSha256` checks that the bundle
 * matches what the manifest declares. It cannot check that either matches the
 * SOURCE — and on 2026-08-02 three security fixes were written into
 * `content/drafts/engine/routes.ts`, committed, reviewed and merged, and never
 * ran anywhere because nobody repacked. The bundle and the manifest agreed
 * with each other. They were both older than the code.
 *
 * Repacking here to compare bytes would fail for reasons that have nothing to
 * do with the author — bundler output is not stable across Bun versions. This
 * hashes the INPUT instead, exactly as `extension pack` recorded it.
 *
 * Usage: bun scripts/check-bundle-sources.ts
 */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dir, '..');

/** Must stay byte-identical to `hashEngineSources` in the CLI's pack command. */
function hashEngineSources(dir: string): string {
  const engineDir = join(dir, 'engine');
  const files: string[] = [];
  const walk = (d: string): void => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'migrations' || entry.name === 'node_modules') continue;
        walk(full);
        continue;
      }
      if (!/\.(ts|tsx|js|mjs|json)$/.test(entry.name)) continue;
      if (/\.(test|spec)\.[a-z]+$/.test(entry.name)) continue;
      if (entry.name === 'index.js') continue;
      files.push(full);
    }
  };
  walk(engineDir);
  const h = createHash('sha256');
  for (const f of files.sort()) {
    h.update(f.slice(engineDir.length).replace(/\\/g, '/'));
    h.update('\0');
    h.update(readFileSync(f));
    h.update('\0');
  }
  return h.digest('hex');
}

function findManifests(base: string, out: string[] = []): string[] {
  for (const entry of readdirSync(base, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const full = join(base, entry.name);
    if (entry.isDirectory()) {
      if (existsSync(join(full, 'manifest.json'))) out.push(full);
      findManifests(full, out);
    }
  }
  return out;
}

const stale: string[] = [];
const unrecorded: string[] = [];

for (const dir of findManifests(ROOT)) {
  // Only extensions that ship a compiled engine are in scope.
  if (!existsSync(join(dir, 'engine', 'index.ts'))) continue;
  if (!existsSync(join(dir, 'engine', 'index.js'))) continue;

  const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')) as {
    integrity?: { sourceSha256?: string };
  };
  const declared = manifest.integrity?.sourceSha256;
  const actual = hashEngineSources(dir);
  const rel = relative(ROOT, dir);

  if (!declared) {
    unrecorded.push(rel);
    continue;
  }
  if (declared !== actual) stale.push(rel);
}

if (unrecorded.length > 0) {
  console.error(
    `❌ bundle-sources: ${unrecorded.length} extension(s) have no integrity.sourceSha256.\n`,
  );
  for (const e of unrecorded) console.error(`  ${e}`);
  console.error(
    `\nRe-pack them so the artifact records what it was built from:\n` +
      `  cd <ext> && bun <zveltio>/packages/cli/dist/index.js extension pack --dir . --first-party\n`,
  );
  process.exit(1);
}

if (stale.length > 0) {
  console.error(`❌ bundle-sources: ${stale.length} bundle(s) are older than their source.\n`);
  for (const e of stale) console.error(`  ${e}`);
  console.error(
    `\nThe committed engine/index.js was NOT built from the committed TypeScript,\n` +
      `so the changes in that source do not run anywhere. Re-pack:\n` +
      `  cd <ext> && bun <zveltio>/packages/cli/dist/index.js extension pack --dir . --first-party\n`,
  );
  process.exit(1);
}

console.log('✅ bundle-sources: every packed bundle matches the source it was built from.');
