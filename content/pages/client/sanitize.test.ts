/**
 * `safeHtml` is what stands between CMS content and `{@html}` in the public
 * renderer. Every `{@html}` in this bundle calls it — BlockRenderer (three
 * sites) and TextSection.
 *
 * There was no test for it. The one that mattered is the server branch: with no
 * DOM for DOMPurify, it fell back to `replace(/<[^>]*>/g, '')`, which needs a
 * closing `>` to match. An UNCLOSED tag went through untouched, and an HTML
 * parser closes one for you at the end of a document.
 *
 * On the public site this is defence in depth — the engine's `sanitize-html` has
 * already parsed the same content structurally, on write and again on the public
 * read path. But `safeHtml` is exported for third-party SvelteKit apps to import,
 * and its contract is "returns HTML safe to hand to {@html}". A caller handing it
 * unsanitised content — the case it exists for — got a bypass.
 */

import { describe, expect, test } from 'bun:test';
import { safeHtml } from './sanitize.js';

/** These run under bun, where there is no `window`, so this IS the server branch. */
describe('safeHtml — the no-DOM branch', () => {
  test('it really is the server branch that is under test', () => {
    // Without this the file could pass while exercising DOMPurify, which would
    // make every assertion below meaningless.
    expect(typeof window).toBe('undefined');
  });

  test('an UNCLOSED tag does not survive as markup', () => {
    // The regression. Each of these was returned verbatim before.
    for (const payload of [
      '<img src=x onerror=alert(1)',
      '<svg onload=alert(1)',
      '<img\nsrc=x\nonerror=alert(1)',
      'Hello <iframe src=javascript:alert(1)',
    ]) {
      const out = safeHtml(payload);
      expect(out).not.toMatch(/<[a-zA-Z]/);
    }
  });

  test('a complete tag is still removed, not escaped into view', () => {
    // The behaviour that already worked, asserted so the fix cannot regress it
    // into showing markup to visitors.
    expect(safeHtml('<img src=x onerror=alert(1)>')).toBe('');
    expect(safeHtml('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
  });

  test('prose containing a bare `<` stays readable', () => {
    // The reason this escapes rather than deleting the remainder: `a < b` is
    // ordinary text, and a stricter strip would eat the rest of the sentence.
    expect(safeHtml('if a < b then stop')).toBe('if a &lt; b then stop');
  });

  test('non-strings and empties are handled without throwing', () => {
    for (const v of [null, undefined, 0, {}, [], false]) {
      expect(safeHtml(v as unknown)).toBe('');
    }
    expect(safeHtml('')).toBe('');
  });
});
