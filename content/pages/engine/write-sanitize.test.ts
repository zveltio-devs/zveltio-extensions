/**
 * Every block write that carries REQUEST data is sanitised.
 *
 * `sanitizeBlocksForWrite` is the write-side half of the XSS defence — the read
 * side runs again on the public path, and the module's header says to keep both.
 * There are seven call sites across `editor.ts` and `sites.ts` and nothing checks
 * that an eighth remembers.
 *
 * Two writes deliberately do NOT sanitise: the revision snapshots at
 * `editor.ts:571` and `:689` store `current.blocks`, which is content already in
 * the database and therefore already scrubbed on its way in. Re-sanitising a
 * snapshot would also quietly rewrite history, which is the one thing a revision
 * must not do.
 *
 * So the rule is not "every write sanitises" — it is "every write either
 * sanitises or is copying stored content", and this asserts exactly that
 * distinction rather than the easier, wrong version of it.
 *
 * Source text, like `block-contract.test.ts`: the files are on disk here and this
 * needs no database or Svelte toolchain.
 */

import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';

const HERE = import.meta.dir;
const read = (p: string) => Bun.file(join(HERE, p)).text();

/** `blocks: jsonb(<expr>)` — every place a block payload is assigned to a column. */
const BLOCK_WRITE = /blocks:\s*jsonb\(([^\n]*)\)/g;

describe('block writes are sanitised', () => {
  for (const file of ['editor.ts', 'sites.ts']) {
    test(`${file}: every request-carried block write calls sanitizeBlocksForWrite`, async () => {
      const src = await read(`./${file}`);
      const writes = [...src.matchAll(BLOCK_WRITE)].map((m) => m[1]);
      expect(writes.length, `no block writes found in ${file} — has the shape changed?`)
        .toBeGreaterThan(0);

      const unsanitised = writes.filter(
        (expr) =>
          !expr.includes('sanitizeBlocksForWrite') &&
          // The snapshot exception: content read back out of the row being revised.
          !/\bcurrent\./.test(expr),
      );
      expect(
        unsanitised,
        `these write blocks without sanitising, and do not look like a snapshot of stored content`,
      ).toEqual([]);
    });
  }

  test('the snapshot exception is real and narrow — the control', async () => {
    // Without this the filter above could be excusing everything: if the
    // `current.` escape hatch ever matched the ordinary writes too, the test
    // would pass while checking nothing.
    const src = await read('./editor.ts');
    const writes = [...src.matchAll(BLOCK_WRITE)].map((m) => m[1]);
    const snapshots = writes.filter((e) => /\bcurrent\./.test(e));
    const sanitised = writes.filter((e) => e.includes('sanitizeBlocksForWrite'));

    // Both kinds exist, and no write is counted as both.
    expect(snapshots.length).toBeGreaterThan(0);
    expect(sanitised.length).toBeGreaterThan(0);
    expect(snapshots.filter((e) => sanitised.includes(e))).toEqual([]);
  });
});
