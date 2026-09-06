#!/usr/bin/env bun
/**
 * Gate: every `.svelte` file in this repository compiles, and exports a component.
 *
 * ## Why this did not exist and had to
 *
 * These files are not components here. They become components when the engine's
 * `prebuild` syncs them into the Studio's SvelteKit tree — so the thing that
 * consumes them was the only thing that could compile them, and a broken one
 * reached the other repository's CI before anything here had looked at it.
 *
 * That is what happened. A comment written to document a sanitiser fix contained
 * a literal closing script tag:
 *
 *     // <script>…</script> and nothing else, and the result went to {@html}
 *
 * A closing script tag inside a `//` comment still CLOSES THE SCRIPT BLOCK. An
 * HTML tokenizer never sees the comment — it sees the tag. Everything after it
 * parsed as markup, the component exported nothing, and the Studio workspace
 * failed to typecheck:
 *
 *     MailInbox.svelte:302:72   Error: Expected whitespace
 *     +page.svelte:2:8          Module '…/MailInbox.svelte' has no default export
 *
 * It is a tokenizer rule, not a Svelte one and not a biome one — this repository
 * had it written down as "biome's Svelte parser dies on a script tag in a
 * comment", which is the right symptom attached to the wrong cause and would not
 * have predicted this. Any tool that reads the file hits it.
 *
 * ## Why it checks the export and not only the parse
 *
 * A script block closed early does not necessarily fail to parse. It can produce
 * a file the compiler accepts and a consumer cannot import, which is the harder
 * half to notice. The parse error above came from what followed; the missing
 * default export is the invariant that actually matters.
 *
 * Usage: bun scripts/check-svelte-compiles.ts
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The compiler, loaded through a variable specifier so `tsc` does not resolve
 * its types.
 *
 * A static `import … from 'svelte/compiler'` pulls Svelte's own `.d.ts` into
 * this workspace, where it collides with `types/svelte-modules.d.ts` — the
 * ambient shim that exists precisely because the bare `tsc` pass has no Svelte
 * types. Both declare `Component`, and `bun run typecheck` fails with TS2300 in
 * a file nobody touched.
 *
 * The shim is right and this gate is right; they simply must not meet. A
 * non-literal specifier keeps them apart, and the shape used below is small
 * enough to state here.
 */
const SVELTE_COMPILER = 'svelte/compiler';
const { compile } = (await import(SVELTE_COMPILER)) as {
  compile: (source: string, options: { filename: string; generate: string }) => {
    js: { code: string };
  };
};

const ROOT = join(import.meta.dir, '..');

const files = new TextDecoder()
  .decode(Bun.spawnSync(['git', 'ls-files', '*.svelte'], { cwd: ROOT }).stdout)
  .split('\n')
  .filter(Boolean);

const broken: string[] = [];

for (const rel of files) {
  let source: string;
  try {
    source = readFileSync(join(ROOT, rel), 'utf8');
  } catch {
    continue;
  }

  try {
    const { js } = compile(source, { filename: rel, generate: 'client' });
    if (!/export default|export\s*\{[^}]*\bdefault\b/.test(js.code)) {
      broken.push(`${rel}\n      compiles, but exports no component — a consumer's import resolves to nothing`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message.split('\n')[0] : String(err);
    broken.push(`${rel}\n      ${message}`);
  }
}

if (broken.length > 0) {
  console.error(`\n✗ ${broken.length} Svelte component(s) do not compile:\n`);
  for (const b of broken) console.error(`  ${b}`);
  console.error(
    '\n  These become components when the Studio syncs them, so a break here surfaces\n' +
      '  in the OTHER repository\'s CI. The most common cause is a literal closing script\n' +
      '  tag inside a comment: the HTML tokenizer never sees the comment, only the tag.\n' +
      '  Write "a script element", or split the string.\n',
  );
  process.exit(1);
}

console.log(`✓ svelte-compiles: ${files.length} component(s) compile and export a component.`);
