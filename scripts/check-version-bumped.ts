#!/usr/bin/env bun
/**
 * An extension whose published archive changes gets a new manifest version.
 *
 * What was broken: merging publishes (sync.yml), and the registry keeps a
 * published version's archive immutable — engines pin its SHA-256 — so it
 * answers 409 VERSION_EXISTS to other contents under that version. The archive
 * is the whole extension directory, tests and docs included. #371 edited
 * sms/engine/routes.test.ts under 2.2.0 and #377 edited auth/scim/SETUP.md
 * under 3.0.0; neither bumped, and Sync to Registry failed on every master push
 * for eight days while every PR stayed green.
 *
 * This compares the PR head with its base: an extension with a changed file
 * that sync-to-registry.mjs puts in the archive must carry a manifest version
 * other than the base's. A new extension (no manifest at the base) passes.
 *
 * Usage: BASE_REF=origin/master bun scripts/check-version-bumped.ts [repo root]
 */

import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';

const root = process.argv[2] ?? process.cwd();
const base = process.env.BASE_REF;
if (!base) {
  console.error('✗ BASE_REF is required (e.g. origin/master)');
  process.exit(1);
}
const git = (...args: string[]) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' });

// What sync-to-registry.mjs leaves out of the archive (its `zip -x` list); keep the two in step.
const notArchived = (rel: string) =>
  rel === 'CHANGELOG.md' ||
  /^(node_modules|\.git|dist)\//.test(rel) ||
  rel.endsWith('.log') ||
  rel.endsWith('.DS_Store');

const versionAt = (ref: string, manifest: string): string | null => {
  try {
    return JSON.parse(git('show', `${ref}:${manifest}`)).version;
  } catch {
    return null;
  }
};

const changed = git('diff', '--name-only', `${base}...HEAD`).trim().split('\n').filter(Boolean);
const errors: string[] = [];
for (const manifest of git('ls-files', '*manifest.json').trim().split('\n').filter(Boolean)) {
  const dir = dirname(manifest);
  const archived = changed.filter((f) => f.startsWith(`${dir}/`) && !notArchived(f.slice(dir.length + 1)));
  if (archived.length === 0) continue;
  const before = versionAt(base, manifest);
  const after = versionAt('HEAD', manifest);
  if (before !== null && before === after) {
    errors.push(`${dir}: ${archived.join(', ')} changed under published version ${after} — bump the manifest version and add a CHANGELOG entry`);
  }
}
for (const e of errors) console.error(`✗ ${e}`);
if (errors.length) process.exit(1);
console.log('✓ every extension whose archive changed has a new version');
