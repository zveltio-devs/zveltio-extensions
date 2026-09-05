#!/usr/bin/env bun
/**
 * Gate: no NEW `${JSON.stringify(x)}::jsonb` write.
 *
 * A single `::jsonb` cast on a stringified parameter does not store the value.
 * It stores a JSON **string scalar** containing the text — `jsonb_typeof` says
 * `string`, not `object`. The double cast `::text::jsonb` forces the driver to
 * hand Postgres text, which Postgres then parses.
 *
 * ## Why the test suite cannot see this
 *
 * It is driver-dependent, and the suite uses a different driver than production.
 * Measured on one database, the same two statements, 2026-09-05:
 *
 *              ::jsonb      ::text::jsonb
 *   pg         array  ✓     array  ✓        ← testing/ext-harness.ts (PostgresDialect)
 *   Bun.SQL    string ✗     array  ✓        ← the engine (BunSqlDialect)
 *
 * `pg` sends a string parameter as text, so Postgres parses it and the defect
 * disappears. Bun.SQL types the parameter as json, so the cast is a no-op and
 * the value lands as a scalar. Every test in this repository reaches Postgres
 * through `pg`; the engine runs on Bun.SQL.
 *
 * That is why this class has only ever been found by hand on a live engine, and
 * why it keeps coming back. It has cost, so far: every mail setting on an
 * instance erased by two consecutive saves; an invoice line's metadata stored as
 * a scalar, which made `metadata->>'lot_id'` return NULL and left four
 * `operations/traceability` routes permanently unreachable; and HACCP food-safety
 * records appended as raw text into a jsonb array, present but unreadable to the
 * SQL that an ANSVSA inspection would need.
 *
 * ## Why a ratchet and not a fix
 *
 * Not every site is broken. Many readers do `typeof x === 'string' ? JSON.parse(x)
 * : x` and tolerate the scalar, so a blind rewrite would change what those
 * readers receive. Each site needs its consumer read first. The 16 that exist are
 * therefore a baseline to work down, and this gate exists to stop a 17th.
 *
 * Usage: bun scripts/check-jsonb-cast.ts [--update]
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const BASELINE = join(ROOT, 'scripts', 'jsonb-cast-baseline.json');

/**
 * Any interpolated parameter cast with a single `::jsonb`.
 *
 * The first version of this looked for `JSON.stringify(...)` followed
 * immediately by `}` and then `::jsonb`. That is one spelling of four, and it
 * found 16 sites when the repository had 31. Measured against the spellings
 * that are actually in this tree:
 *
 *   caught  ${JSON.stringify(x)}::jsonb
 *   caught  ${JSON.stringify(d.metadata ?? {})}::jsonb
 *   MISSED  ${c ? JSON.stringify(c) : null}::jsonb          — a ternary, so no `}` after `)`
 *   MISSED  ${JSON.stringify(d.to.map((e) => ({a: e})))}::jsonb — `[^)]*` cannot cross the inner `)`
 *   MISSED  ${toJson(data.to)}::jsonb                        — a helper, not JSON.stringify
 *   MISSED  ${json}::jsonb                                   — stringified on the line above
 *
 * Every missed form is a real site in this repository, and one of them
 * (`ai/engine/routes/ai-query.ts`) was found by reading the file rather than by
 * running this. A ratchet that cannot see two thirds of the class is not a
 * ratchet — it is a licence to add the spelling it does not know.
 *
 * So the shape being matched changed from "how the value was produced" to "what
 * is being cast": ANY `${…}` interpolation followed by `::jsonb`, unless the
 * cast is the safe `::text::jsonb`.
 *
 * That is deliberately wider than the defect. A `${uuid}::jsonb` is not this
 * bug, and a site can be a false positive — it goes in the baseline with the
 * others and the ratchet still does its one job, which is stopping a new one.
 * The old pattern's narrowness was not precision; it was blindness.
 *
 * Server-side casts are excluded, because they are not this bug at all: the
 * value never passes through the driver as a parameter. `ST_AsGeoJSON(...)::jsonb`
 * in `geospatial/postgis` is correct SQL and must stay legal.
 */
const OFFENDER = /\$\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\s*::jsonb\b/;

/** `::text::jsonb` is the correct form; do not report it. */
const SAFE = /::text\s*::jsonb\b/;

const tracked = new TextDecoder()
  .decode(Bun.spawnSync(['git', 'ls-files', '-z', '*.ts'], { cwd: ROOT }).stdout)
  .split('\0')
  .filter((f) => f && !f.endsWith('.test.ts') && !f.startsWith('scripts/'));

const found: string[] = [];
for (const rel of tracked) {
  let text: string;
  try {
    text = readFileSync(join(ROOT, rel), 'utf8');
  } catch {
    continue;
  }
  text.split('\n').forEach((line, i) => {
    const trimmed = line.trim();
    // Documentation of the wrong form is not the wrong form. jsonb.ts spells it
    // out on purpose, and counting it made the first measurement of this say 17.
    if (trimmed.startsWith('*') || trimmed.startsWith('//')) return;
    // Strip the correct form first, so a line carrying both spellings is still
    // reported for the wrong one.
    const stripped = line.replace(new RegExp(SAFE.source, 'g'), '::ok::');
    if (OFFENDER.test(stripped)) found.push(`${rel}:${i + 1}`);
  });
}

if (process.argv.includes('--update')) {
  writeFileSync(BASELINE, `${JSON.stringify({ sites: found.sort() }, null, 2)}\n`);
  console.log(`✓ baseline written: ${found.length} site(s)`);
  process.exit(0);
}

const baseline: string[] = existsSync(BASELINE)
  ? (JSON.parse(readFileSync(BASELINE, 'utf8')).sites ?? [])
  : [];

const added = found.filter((f) => !baseline.includes(f));
const fixed = baseline.filter((b) => !found.includes(b));

if (added.length > 0) {
  console.error('\n✗ New `${JSON.stringify(x)}::jsonb` write — use `::text::jsonb`.\n');
  for (const a of added) console.error(`  ${a}`);
  console.error(
    '\n  A single cast on a stringified parameter is a no-op under Bun.SQL, which is\n' +
      '  what the engine runs: the value is stored as a JSON string scalar, so `->>`,\n' +
      '  `@>` and `||` on that column stop working. The test suite reaches Postgres\n' +
      '  through `pg`, where the same statement behaves correctly, so no test will\n' +
      "  catch this for you.\n\n" +
      '  Write `::text::jsonb`, or use the `toJsonb` helper from @zveltio/sdk/extension.\n',
  );
  process.exit(1);
}

if (fixed.length > 0) {
  console.log(`✓ ${fixed.length} site(s) fixed since the baseline — re-run with --update:`);
  for (const f of fixed) console.log(`    ${f}`);
}
console.log(`✓ no new single-cast jsonb writes (${found.length} on the baseline)`);
