#!/usr/bin/env bun
/**
 * Gate: nobody registers a hook on the SHARED `dompurify` import.
 *
 * ## The defect this exists for
 *
 * `import DOMPurify from 'dompurify'` is one instance for the whole bundle, and
 * `addHook` registers on the instance — `hooks` lives inside `createDOMPurify`'s
 * closure (`purify.cjs.js:528`). So a hook added by one feature runs for every
 * caller in the tab, for the life of the page.
 *
 * Three files in the Studio bundle import that specifier: `communications/mail`,
 * the `content/pages` builder preview, and `content/pages/client`. The last
 * allows `style` DELIBERATELY — a hero block carries
 * `style="background-image: url(/img/hero.jpg)"` — and installs no hook of its
 * own.
 *
 * Both of the others installed one that drops `style` when it matches `url(`.
 * So a CMS page rendered correctly until the user opened the mail pane or the
 * page builder in the same session, and then lost that style until the tab was
 * reloaded. Correct on a fresh load, wrong after visiting a different feature,
 * correct again after a refresh — close to unreproducible from a bug report.
 *
 * The failure direction is SAFE: it strips more, not less. That is exactly why
 * nothing noticed.
 *
 * ## Why a gate rather than only a fix
 *
 * Each file is correct on its own. The cost lands entirely on a different
 * feature that never mentions the first, so no reviewer reading either file can
 * see it and no existing gate looks across two extensions at once. The class is
 * "one consumer mutates a shared module singleton" — this catches the instance
 * of it that has already happened twice.
 *
 * Found by the session reviewing the synced Studio bundle, who could see across
 * the extensions in a way neither repository's own checks can.
 *
 * ## What is allowed
 *
 * An isolated instance. Calling the default export as a function returns a fresh
 * one with its own hooks (`const DOMPurify = root => createDOMPurify(root)`),
 * so `DOMPurify(window).addHook(...)` is fine and is what both files now do.
 *
 * Usage: bun scripts/check-shared-singleton-hooks.ts
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');

/**
 * `<Imported>.addHook(` where `<Imported>` is the module's default import.
 *
 * An instance built by calling the factory is a different expression —
 * `instance.addHook(`, `purifier().addHook(` — and is what this permits.
 */
const OFFENDER = /\bDOMPurify\s*\.\s*addHook\s*\(/;

const files = new TextDecoder()
  .decode(Bun.spawnSync(['git', 'ls-files', '*.ts', '*.svelte'], { cwd: ROOT }).stdout)
  .split('\n')
  .filter((f) => f && !f.startsWith('scripts/'));

const found: string[] = [];

for (const rel of files) {
  let text: string;
  try {
    text = readFileSync(join(ROOT, rel), 'utf8');
  } catch {
    continue;
  }
  // Only files that take the module's default export are at risk.
  if (!/import\s+DOMPurify\s+from\s+['"]dompurify['"]/.test(text)) continue;

  text.split('\n').forEach((line, i) => {
    const t = line.trim();
    if (t.startsWith('*') || t.startsWith('//') || t.startsWith('/*')) return;
    if (OFFENDER.test(line)) found.push(`${rel}:${i + 1}`);
  });
}

if (found.length > 0) {
  console.error('\n✗ A hook was registered on the SHARED dompurify instance:\n');
  for (const f of found) console.error(`  ${f}`);
  console.error(
    '\n  `import DOMPurify from \'dompurify\'` is ONE instance for the whole bundle, and\n' +
      '  hooks live on the instance. A hook added here runs for every other caller in the\n' +
      '  tab — including sanitisers in other extensions that deliberately allow what it\n' +
      '  strips, and whose files never mention this one.\n\n' +
      '  Build your own instead. The default export is callable and returns a fresh\n' +
      '  instance with its own hooks:\n\n' +
      '      const instance = DOMPurify(window);\n' +
      '      instance.addHook(...);\n\n' +
      '  Cache it — the factory re-derives its configuration from the window each call.\n',
  );
  process.exit(1);
}

console.log('✓ shared-singleton-hooks: no hooks registered on the shared dompurify instance.');
