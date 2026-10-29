#!/usr/bin/env bun
/**
 * Every extension ships a CHANGELOG.md whose newest entry is its manifest version.
 *
 * Merging to master publishes (sync.yml), and the registry serves this file to
 * the engine's marketplace, which shows an administrator the entries between
 * the installed and the catalog version before they update. A bump without an
 * entry would show them nothing for exactly the release they are about to take.
 *
 * Format: one `## <version>` heading per release, newest first; text after the
 * version (a date) is free. Exit 1 on any extension that breaks it.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { execFileSync } from 'node:child_process';

const manifests = execFileSync('git', ['ls-files', '*manifest.json'], { encoding: 'utf8' }).trim().split('\n');
const errors: string[] = [];
for (const m of manifests) {
  const { name, version } = JSON.parse(readFileSync(m, 'utf8'));
  const path = `${dirname(m)}/CHANGELOG.md`;
  if (!existsSync(path)) {
    errors.push(`${name}: ${path} missing`);
    continue;
  }
  const top = readFileSync(path, 'utf8').match(/^## \[?v?([^\s\]]+)/m)?.[1];
  if (top !== version) {
    errors.push(`${name}: newest ${path} entry is ${top ?? 'absent'}, manifest is ${version} — add a "## ${version}" entry`);
  }
}
for (const e of errors) console.error(`✗ ${e}`);
if (errors.length) process.exit(1);
console.log(`✓ ${manifests.length} changelogs match their manifest version`);
