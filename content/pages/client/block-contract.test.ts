/**
 * The gate that was missing.
 *
 * Four block vocabularies drifted apart over three months and nothing noticed,
 * because no test ever put two of them side by side. This does. It reads the
 * builder's library, the renderer's source and the migration's seed off disk and
 * fails if a block can be AUTHORED but not DRAWN — which is the exact shape of
 * the defect: `hero`, `richtext` and `collection_list` were addable from the
 * block picker and rendered as "Unsupported block" to every visitor.
 *
 * Source text rather than a rendered component on purpose: this file lives in
 * the extension, where all three sources are on disk, and it needs no Svelte
 * toolchain to run in the extension repo's `bun test`.
 */

import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { ALL_BLOCK_TYPES, BLOCK_TYPES, LEGACY_BLOCK_TYPES } from './block-types.js';

const HERE = import.meta.dir;
const read = (p: string) => Bun.file(join(HERE, p)).text();

describe('block vocabulary', () => {
  test('every type the builder offers is in the canonical list', async () => {
    const src = await read('../studio/src/lib/builder-types.ts');
    const offered = [...src.matchAll(/^\s*type:\s*'([a-z_]+)'/gm)].map((m) => m[1]);

    expect(offered.length).toBeGreaterThan(0);
    const unknown = offered.filter((t) => !(BLOCK_TYPES as readonly string[]).includes(t));
    expect(unknown).toEqual([]);
  });

  test('the canonical list offers nothing the builder cannot add', async () => {
    const src = await read('../studio/src/lib/builder-types.ts');
    const offered = new Set([...src.matchAll(/^\s*type:\s*'([a-z_]+)'/gm)].map((m) => m[1]));

    const unbuildable = BLOCK_TYPES.filter((t) => !offered.has(t));
    expect(unbuildable).toEqual([]);
  });

  test('the renderer draws every type, legacy included', async () => {
    const src = await read('./BlockRenderer.svelte');
    // `block.type === 'x'` — the only way this renderer dispatches.
    const handled = new Set(
      [...src.matchAll(/block\.type === '([a-z_]+)'/g)].map((m) => m[1]),
    );

    const undrawn = ALL_BLOCK_TYPES.filter((t) => !handled.has(t));
    expect(undrawn).toEqual([]);
  });

  test('the block-type library seeded by the migration matches', async () => {
    const sql = await read('../engine/migrations/001_initial.sql');
    const seedBlock = sql.slice(sql.indexOf('INSERT INTO zv_page_block_types'));
    const seeded = new Set(
      [...seedBlock.matchAll(/^\s*\('([a-z_]+)',/gm)].map((m) => m[1]),
    );

    // The seed is the picker's reference library; it should name every current
    // block type. Legacy names are deliberately absent — they are readable, not
    // offerable.
    const missing = BLOCK_TYPES.filter((t) => !seeded.has(t));
    expect(missing).toEqual([]);
    for (const legacy of LEGACY_BLOCK_TYPES) expect(seeded.has(legacy)).toBe(false);
  });
});
