#!/usr/bin/env bun
/**
 * Validates that every extension's getMigrations() return list points
 * at *.sql files that actually exist on disk in the adjacent
 * migrations/ directory.
 *
 * Why this exists: the engine's extension loader calls
 * `extension.getMigrations()` and runs each returned path against the
 * DB. If the path doesn't exist on disk, the migration is silently
 * skipped — leaving schema changes (including RLS hardening) un-applied
 * on every fresh install. We had ~50 extensions in exactly this state
 * before this check landed, all of which had their tenant_rls.sql
 * files on disk but listed older renamed paths in getMigrations().
 *
 * Exits non-zero on any drift so CI fails before the bad wiring hits
 * production.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';

const ROOT = process.cwd();

async function* walkEngineIndexes(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walkEngineIndexes(p);
    else if (entry.isFile()) {
      const norm = p.replace(/\\/g, '/');
      if (norm.endsWith('/engine/index.ts')) yield p;
    }
  }
}

let errors = 0;
let checked = 0;

for await (const indexPath of walkEngineIndexes(ROOT)) {
  const engineDir = dirname(indexPath);
  const migDir = join(engineDir, 'migrations');

  // Discover SQL files on disk
  let onDisk: string[] = [];
  try {
    const st = await stat(migDir);
    if (st.isDirectory()) {
      onDisk = (await readdir(migDir))
        .filter((n) => n.endsWith('.sql'))
        .sort();
    }
  } catch {
    // no migrations dir
  }

  // Extract paths from getMigrations() in the source
  const src = await readFile(indexPath, 'utf8');
  const re = /getMigrations\s*\(\s*\)\s*\{\s*\n\s*return\s*\[([\s\S]*?)\];/m;
  const m = src.match(re);

  const declared = m
    ? [...m[1].matchAll(/'migrations\/([^']+)'/g)].map((x) => x[1])
    : [];

  // Cases:
  //   1. No migrations dir + no getMigrations() block → fine
  //   2. No migrations dir + getMigrations() declares something → broken
  //   3. Has migrations dir + getMigrations() missing or empty → warn (might be a no-op extension)
  //   4. Has migrations dir + declared doesn't match disk → error
  const rel = indexPath.slice(ROOT.length + 1);

  if (onDisk.length === 0 && declared.length === 0) {
    // case 1 — clean
    checked++;
    continue;
  }

  if (onDisk.length === 0 && declared.length > 0) {
    console.error(`❌ ${rel}: getMigrations() declares ${declared.length} file(s) but no migrations/ dir exists`);
    console.error(`   declared: ${declared.join(', ')}`);
    errors++;
    checked++;
    continue;
  }

  if (onDisk.length > 0 && declared.length === 0) {
    console.error(`❌ ${rel}: migrations/ contains ${onDisk.length} file(s) but getMigrations() declares none — they will never run`);
    console.error(`   on disk: ${onDisk.join(', ')}`);
    errors++;
    checked++;
    continue;
  }

  // Both non-empty — they must match exactly (order included, since
  // the engine runs them in declared order).
  const declaredMissing = declared.filter((f) => !onDisk.includes(f));
  const diskMissing = onDisk.filter((f) => !declared.includes(f));

  if (declaredMissing.length > 0 || diskMissing.length > 0) {
    console.error(`❌ ${rel}: getMigrations() ↔ migrations/ drift`);
    if (declaredMissing.length > 0) {
      console.error(`   declared but missing on disk: ${declaredMissing.join(', ')}`);
    }
    if (diskMissing.length > 0) {
      console.error(`   on disk but not declared: ${diskMissing.join(', ')}`);
    }
    errors++;
  }

  checked++;
}

console.log(`────────────────────────────`);
console.log(`Checked: ${checked} extension(s)`);
console.log(`Errors:  ${errors}`);

if (errors > 0) {
  console.error(`\nFix with: bun scripts/sync-migration-paths.ts (if it exists) or update getMigrations() manually to mirror migrations/*.sql.`);
  process.exit(1);
}
