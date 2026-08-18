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

  /**
   * The Studio canvas is a fifth place the vocabulary lives, and it was the one
   * nobody checked.
   *
   * `BlockRenderer.svelte` drew eighteen types; `BlockPreview.svelte` drew
   * thirteen. The five it missed included `button` and `icon` — both OFFERED by
   * the block library — so an author could add a button, set its label and link
   * in the properties panel, and see a grey box with the word "button" on the
   * canvas while the public page rendered it correctly. The other three were
   * `heading`, `text` and `html`, which every page authored before this builder
   * is made of.
   *
   * A placeholder is not a harmless fallback here: it looks exactly like a block
   * that is broken, on the one screen whose whole job is showing what the
   * visitor will see.
   */
  test('the Studio canvas previews every type the public renderer draws', async () => {
    const src = await read('../studio/src/components/builder/BlockPreview.svelte');
    const handled = new Set([...src.matchAll(/block\.type === '([a-z_]+)'/g)].map((m) => m[1]));

    const unpreviewed = ALL_BLOCK_TYPES.filter((t) => !handled.has(t));
    expect(unpreviewed).toEqual([]);
  });

  test('the block-type library seeded by the migrations matches', async () => {
    // Every migration, not just the first: block types are seeded wherever they
    // were introduced, and a test that reads only 001 starts lying the moment a
    // type ships in 003.
    const dir = join(HERE, '../engine/migrations');
    const { readdirSync } = await import('node:fs');
    const seeded = new Set<string>();
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
      const sql = await Bun.file(join(dir, file)).text();
      let at = sql.indexOf('INSERT INTO zv_page_block_types');
      while (at !== -1) {
        const chunk = sql.slice(at, sql.indexOf(';', at));
        for (const m of chunk.matchAll(/^\s*\('([a-z_]+)',/gm)) seeded.add(m[1]);
        at = sql.indexOf('INSERT INTO zv_page_block_types', at + 1);
      }
    }

    // The seed is the picker's reference library; it should name every current
    // block type. Legacy names are deliberately absent — they are readable, not
    // offerable.
    const missing = BLOCK_TYPES.filter((t) => !seeded.has(t));
    expect(missing).toEqual([]);
    for (const legacy of LEGACY_BLOCK_TYPES) expect(seeded.has(legacy)).toBe(false);
  });
});

describe('the curated icon set', () => {
  test('every icon is a path, and the picker offers exactly those', async () => {
    const { ICONS, ICON_NAMES } = await import('./icons.js');
    expect(ICON_NAMES.length).toBeGreaterThan(20);
    expect(new Set(ICON_NAMES)).toEqual(new Set(Object.keys(ICONS)));
    for (const [name, d] of Object.entries(ICONS)) {
      // A path, not markup: the renderer puts it in a `d` attribute.
      expect(typeof d).toBe('string');
      expect(d.length).toBeGreaterThan(5);
      expect(d).not.toContain('<');
    }
  });
});

describe('motion settings', () => {
  test('clamps values a mistyped form could produce', async () => {
    const { motionAttrs } = await import('./motion.js');
    // 30 seconds of delay is a block that never appears.
    const out = motionAttrs({ motion: { type: 'fade', duration: 99999, delay: 99999 } });
    expect(out.style).toContain('--zv-anim-dur:3000ms');
    expect(out.style).toContain('--zv-anim-delay:2000ms');
  });

  test('an unknown animation contributes no class', async () => {
    const { motionAttrs } = await import('./motion.js');
    expect(motionAttrs({ motion: { type: 'explode' } }).class).toBe('');
    expect(motionAttrs({}).class).toBe('');
  });

  test('sticky is a class plus a clamped offset', async () => {
    const { motionAttrs } = await import('./motion.js');
    const out = motionAttrs({ motion: { sticky: true, stickyOffset: 9999 } });
    expect(out.class).toContain('zv-sticky');
    expect(out.style).toContain('--zv-sticky-top:400px');
  });
});
