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
import { HTML_KEYS, URL_KEYS } from './bind.js';

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

/**
 * The other list that has to agree with the renderer — and the one that matters
 * for safety rather than for drawing.
 *
 * `bind.ts` escapes a record's value only when it lands in a property the
 * renderer hands to `{@html}`. Which properties those are is `HTML_KEYS`, and its
 * header says it "is kept in step with BlockRenderer" — by hand, across two
 * files, with nothing checking.
 *
 * The failure this guards is not "a block draws wrong". It is: someone adds an
 * `{@html}` for a new property, forgets this list, and a record value — a
 * customer's name, an imported row — reaches a visitor's browser unescaped. The
 * page sanitiser cannot catch it, because the template is scrubbed when it is
 * STORED and the value is substituted afterwards.
 *
 * Read off the renderer's source for the same reason as the tests above: all the
 * sources are on disk here and none of this needs a Svelte toolchain.
 */
describe('the escaping list tracks the renderer', () => {
  test('every property handed to {@html} is in HTML_KEYS', async () => {
    const src = await read('./BlockRenderer.svelte');

    // Each `{@html …}` expression, and the `c.<prop>` references inside it.
    const expressions = [...src.matchAll(/\{@html\s+([^}]*)\}/g)].map((m) => m[1]);
    expect(expressions.length).toBeGreaterThan(0);

    const referenced = new Set<string>();
    for (const expr of expressions) {
      const direct = [...expr.matchAll(/\bc\.([a-zA-Z_][a-zA-Z0-9_]*)/g)].map((m) => m[1]);
      for (const d of direct) referenced.add(d);

      // `{#each (Array.isArray(c.items) ? …) as col}` … `{@html safeHtml(String(col))}`
      // names the loop variable, not the property. Attribute it to the nearest
      // preceding each-block so the columns case is covered rather than skipped.
      if (direct.length === 0) {
        const at = src.indexOf(expr);
        const before = src.slice(0, at);
        const loops = [...before.matchAll(/#each\s*\(Array\.isArray\(c\.([a-zA-Z_][a-zA-Z0-9_]*)\)/g)];
        const nearest = loops.at(-1);
        expect(nearest, `no c.<prop> and no enclosing each for: {@html ${expr}}`).toBeDefined();
        referenced.add(nearest![1]);
      }
    }

    const unescaped = [...referenced].filter((k) => !HTML_KEYS.has(k)).sort();
    expect(
      unescaped,
      `these reach {@html} but bind.ts will not escape a record value substituted into them`,
    ).toEqual([]);
  });

  test('every property bound to an href or src is in URL_KEYS', async () => {
    // The same drift, on the sink that took longer to notice. A record value in
    // an `href` is not escaped by Svelte and not seen by any sanitiser; if the
    // renderer grows a URL attribute this list does not name, a `javascript:`
    // URL from a record reaches a visitor's browser.
    const src = (await read('./BlockRenderer.svelte')) +
      (await read('./HeroSection.svelte')) +
      (await read('./CTASection.svelte'));

    const bound = new Set<string>();
    for (const m of src.matchAll(/\b(?:href|src)=\{([^}]*)\}/g)) {
      const expr = m[1];
      for (const ref of expr.matchAll(/\bc\.([a-zA-Z_][a-zA-Z0-9_]*)/g)) bound.add(ref[1]);
      // `<img {src}>` where `{@const src = c.url ?? c.src}`, and the plain
      // `href={cta_url}` destructured in the small section components.
      if (!expr.includes('c.')) {
        for (const bare of expr.matchAll(/\b([a-z_][a-z0-9_]*)\b/g)) {
          const name = bare[1];
          if (name !== 'undefined' && name !== 'null') bound.add(name);
        }
      }
    }
    expect(bound.size).toBeGreaterThan(0);

    // `src` resolves through a local const; the properties behind it are what
    // matter and both are already named.
    bound.delete('src');
    bound.add('url');
    // `img` is a gallery loop variable over `c.images`, and the attribute is
    // `img.url` — the property is `url`, already named above. The nested case is
    // covered because guardUrl runs at every level.
    bound.delete('img');

    const unguarded = [...bound].filter((k) => !URL_KEYS.has(k)).sort();
    expect(
      unguarded,
      'these reach an href/src but bind.ts will not run safeUrl on a record value in them',
    ).toEqual([]);
  });

  test('HTML_KEYS lists nothing the renderer does not render as HTML', async () => {
    // The other direction. An extra key is not a hole, but it escapes values that
    // then show a visitor `&lt;img&gt;` where the record says `<img>` — the
    // display bug bind.ts's header says the narrow list exists to avoid.
    const src = await read('./BlockRenderer.svelte');
    const text = src + (await read('./TextSection.svelte'));
    for (const key of HTML_KEYS) {
      expect(text, `HTML_KEYS has "${key}" but no {@html} mentions it`).toContain(key);
    }
  });
});
