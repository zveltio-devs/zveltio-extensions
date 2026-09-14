/**
 * renderTemplate — a pure {{placeholder}} substitutor with HTML escaping (the
 * stored-XSS guard) and ro-RO date/number formatting.
 *
 * These four cases moved here with the function, from
 * `zveltio/packages/engine/src/tests/unit/doc-generator.test.ts`. The two that
 * covered `getNextDocumentNumber` did not: that function is deleted, not moved
 * — nothing in either repository called it, and this extension has its own
 * `getNextDocNumber`. The one that covered `generatePDF` did not either: that
 * was a one-line delegation to `generatePDFAsync`, which the routes now call
 * directly, and the worker pool behind it stays in the engine with its own
 * tests.
 */

import { describe, expect, it } from 'bun:test';
import { renderTemplate } from './lib/doc-template.js';

describe('renderTemplate', () => {
  it('substitutes trimmed {{keys}} and leaves unknown/nullish as empty string', () => {
    const out = renderTemplate('Hello {{ name }}, code {{missing}}{{ empty }}!', {
      name: 'Ana',
      empty: null,
    });
    expect(out).toBe('Hello Ana, code !');
  });

  it('HTML-escapes substituted values (stored-XSS guard)', () => {
    const out = renderTemplate('{{payload}}', {
      payload: `<script>alert("x&y's")</script>`,
    });
    expect(out).toBe('&lt;script&gt;alert(&quot;x&amp;y&#39;s&quot;)&lt;/script&gt;');
    expect(out).not.toContain('<script>');
  });

  it('formats numbers and ISO dates (ro-RO) and coerces other types', () => {
    const num = renderTemplate('{{total}}', { total: 1234567 });
    // ro-RO groups thousands (with a separator char); the raw digits survive
    expect(num.replace(/\D/g, '')).toBe('1234567');

    const date = renderTemplate('{{when}}', { when: '2026-07-09' });
    // reformatted to a locale date string containing the day/month/year digits
    expect(date).toMatch(/\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4}/);

    expect(renderTemplate('{{flag}}', { flag: true })).toBe('true');
  });

  it('returns the template unchanged when there are no placeholders', () => {
    expect(renderTemplate('plain text', {})).toBe('plain text');
  });
});
