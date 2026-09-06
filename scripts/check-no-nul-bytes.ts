#!/usr/bin/env bun
/**
 * Gate: no tracked text file contains a NUL byte.
 *
 * Not a style rule. A single NUL makes `grep` classify a file as binary and skip
 * it — silently, with exit code 1 and no output, which is indistinguishable from
 * "no matches". Every grep-based sweep then reports a clean result for a file it
 * never opened.
 *
 * Found on 2026-09-05 in `communications/mail/engine/routes.ts`, 1658 lines, the
 * third-largest engine file in the catalogue. One byte at line 844 — a raw NUL
 * used as a Map key separator, `${account_id}\0${path}` — written as the literal
 * character rather than the escape. `file` reported the source as `data`, and
 * `grep -c zv_settings` on a file containing six of them printed nothing.
 *
 * That matters here more than in most repositories, because this review campaign
 * is largely grep-shaped: the class sweeps that found the `selectFrom('user')`
 * defects, the `::jsonb` cast class, the `.catch(() => {})` inventory and the
 * unique-key campaign were all greps across the tree. Any of them would have
 * reported this file clean without looking at it. The `::jsonb` class count of
 * "27 across 12 extensions" recorded in `communications/mail/CONTEXT.md` was
 * measured that way, and this file holds five such sites.
 *
 * The fix is always the escape — `\0` compiles to the identical character, and
 * the file stays greppable.
 *
 * Usage: bun scripts/check-no-nul-bytes.ts
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');

/** Extensions whose contents are legitimately binary. */
const BINARY = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'ico', 'webp', 'avif',
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  'pdf', 'zip', 'gz', 'tgz', 'br', 'wasm', 'mp4', 'webm', 'mp3', 'ogg',
]);

const tracked = new TextDecoder()
  .decode(Bun.spawnSync(['git', 'ls-files', '-z'], { cwd: ROOT }).stdout)
  .split('\0')
  .filter(Boolean);

const offenders: { file: string; count: number; firstLine: number }[] = [];

for (const rel of tracked) {
  const ext = rel.split('.').pop()?.toLowerCase() ?? '';
  if (BINARY.has(ext)) continue;
  let buf: Buffer;
  try {
    buf = readFileSync(join(ROOT, rel));
  } catch {
    continue; // deleted or unreadable — not this gate's business
  }
  const idx = buf.indexOf(0);
  if (idx === -1) continue;
  let count = 0;
  for (const b of buf) if (b === 0) count++;
  offenders.push({
    file: rel,
    count,
    firstLine: buf.subarray(0, idx).toString('utf8').split('\n').length,
  });
}

if (offenders.length > 0) {
  console.error('\n✗ NUL byte in a tracked text file — grep will skip it silently.\n');
  for (const o of offenders) {
    console.error(`  ${o.file}:${o.firstLine} — ${o.count} NUL byte(s)`);
  }
  console.error(
    '\n  A NUL makes grep treat the file as binary: it prints nothing and exits 1,\n' +
      '  which reads exactly like "no matches". Every class sweep across this repo\n' +
      '  would report the file clean without opening it.\n\n' +
      '  If you meant a NUL character, write the escape — `\\0` in a string or\n' +
      "  template literal compiles to the same character and keeps the file text.\n",
  );
  process.exit(1);
}

console.log(`✓ no NUL bytes in ${tracked.length} tracked files`);
