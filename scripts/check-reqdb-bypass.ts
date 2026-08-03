#!/usr/bin/env bun
/**
 * Gate: an extension that knows about `reqDb` must not go around it.
 *
 * Every extension route module opens with the same three lines:
 *
 *     const reqDb = (c) => (ctx.reqDb ? ctx.reqDb(c) : (c.get('tenantTrx') ?? db));
 *
 * `reqDb(c)` hands back the request's TENANT TRANSACTION — the one carrying
 * `SET LOCAL ROLE zveltio_rls` and the tenant GUC. The bare `db` it closes over
 * is the engine's global pool, with neither. Both spellings compile, both
 * return rows, and only one of them is scoped to the caller's tenant.
 *
 * The 2026-08-03 audit found this in eight extensions and called each one a
 * separate finding. Measured across the repository it is 205 queries in 31 of
 * 53 extensions — including `forms`, which defines `reqDb` and then never calls
 * it once, on public `/public/*` routes.
 *
 * Two things follow from that number, and they pull in opposite directions.
 *
 * A gate that fails on all 205 today is a gate somebody switches off on
 * Thursday. And the security consequence has already been closed at the
 * database: the isolation predicate is fail-closed now (engine migration 029)
 * and it actually binds (030), so a bare `db` query reads the default tenant's
 * rows rather than everybody's. What is left is a correctness bug — the query
 * looks at the wrong tenant's data — which matters, but is no longer a
 * disclosure.
 *
 * So this ratchets. The recorded count per file is the line; a file may improve
 * and may not get worse, and a NEW file starts at zero. That stops the pattern
 * spreading while the existing 205 are worked down, without pretending they can
 * all be fixed in one change.
 *
 * Usage:
 *   bun scripts/check-reqdb-bypass.ts            # verify against the baseline
 *   bun scripts/check-reqdb-bypass.ts --update   # re-record after improving
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const BASELINE = join(ROOT, 'scripts', 'reqdb-bypass-baseline.json');

/** A query issued on the closed-over `db` rather than the request's `reqDb(c)`. */
const BARE_DB = /\(db as any\)|\.execute\(db\)|await db\./;
/** The file has to know about `reqDb` for going around it to mean anything. */
const DEFINES_REQDB = /\breqDb\s*=|\bfunction reqDb\b/;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) out.push(full);
  }
  return out;
}

/** Count bare-db queries per file, for files that define `reqDb`. */
function measure(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const file of walk(ROOT)) {
    const rel = relative(ROOT, file).replace(/\\/g, '/');
    if (!/\/engine\/.*\.ts$/.test(rel)) continue;
    const src = readFileSync(file, 'utf8');
    if (!DEFINES_REQDB.test(src)) continue;
    let n = 0;
    for (const raw of src.split('\n')) {
      const line = raw.trim();
      if (line.startsWith('//') || line.startsWith('*')) continue;
      if (BARE_DB.test(line)) n++;
    }
    if (n > 0) counts[rel] = n;
  }
  return counts;
}

const current = measure();
const update = process.argv.includes('--update');

if (update || !existsSync(BASELINE)) {
  writeFileSync(BASELINE, `${JSON.stringify(current, null, 2)}\n`);
  const total = Object.values(current).reduce((a, b) => a + b, 0);
  console.log(
    `📌 reqdb-bypass: baseline recorded — ${total} bare quer(ies) in ` +
      `${Object.keys(current).length} file(s).`,
  );
  process.exit(0);
}

const baseline: Record<string, number> = JSON.parse(readFileSync(BASELINE, 'utf8'));
const regressions: string[] = [];
const improvements: string[] = [];

for (const [file, n] of Object.entries(current)) {
  const was = baseline[file] ?? 0;
  if (n > was) regressions.push(`  ${file}: ${was} → ${n} (+${n - was})`);
  else if (n < was) improvements.push(`  ${file}: ${was} → ${n}`);
}
for (const [file, was] of Object.entries(baseline)) {
  if (!(file in current)) improvements.push(`  ${file}: ${was} → 0 ✨`);
}

if (regressions.length > 0) {
  console.error('❌ reqdb-bypass: new queries on the bare `db` instead of `reqDb(c)`.\n');
  for (const r of regressions) console.error(r);
  console.error(
    `\n\`db\` is the engine's global pool: no tenant transaction, no tenant GUC, no\n` +
      `\`SET LOCAL ROLE\`. \`reqDb(c)\` is the caller's tenant transaction. Both compile\n` +
      `and both return rows, which is why this keeps happening — the difference only\n` +
      `shows up as one tenant reading another's data.\n\n` +
      `Use \`reqDb(c)\`. If a query genuinely must span tenants (a boot task, a cron\n` +
      `sweep), say so in a comment and re-record with:\n` +
      `  bun scripts/check-reqdb-bypass.ts --update\n`,
  );
  process.exit(1);
}

const total = Object.values(current).reduce((a, b) => a + b, 0);
const baseTotal = Object.values(baseline).reduce((a, b) => a + b, 0);
if (improvements.length > 0) {
  console.log(`✅ reqdb-bypass: no regressions, and ${improvements.length} file(s) improved:`);
  for (const i of improvements) console.log(i);
  console.log(`\n   ${baseTotal} → ${total}. Re-record with --update to hold the new line.`);
} else {
  console.log(
    `✅ reqdb-bypass: no new bare-\`db\` queries ` +
      `(${total} remaining in ${Object.keys(current).length} file(s), being worked down).`,
  );
}
