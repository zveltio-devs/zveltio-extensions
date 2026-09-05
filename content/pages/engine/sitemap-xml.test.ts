/**
 * The sitemap is built by string interpolation, and one of the strings is not
 * the author's.
 *
 * A record page has one address per record, and `public-seo.ts` builds them as
 * `${row.slug}/${r.k}` where `r.k` is a COLLECTION FIELD cast to text — a form
 * submission, a CRM contact, an imported row. Page slugs are regex-constrained on
 * write and were never the risk; record values are not constrained at all.
 *
 * Measured on the shipped template, before this:
 *
 *   salt-&-pepper                              -> malformed XML
 *   a<b                                        -> malformed XML
 *   x</loc></url><url><loc>https://evil.test/  -> an extra <url>
 *
 * Both outcomes are quiet. Malformed XML costs the WHOLE sitemap, not just the
 * bad entry, and nobody reads sitemap XML to notice. The injection puts an
 * address the operator never published in front of every crawler that fetches it.
 */

import { describe, expect, test } from 'bun:test';
import { escapeXml } from './public-seo.js';

const BASE = 'https://shop.example';
const loc = (path: string) => `<loc>${escapeXml(`${BASE}/${path}`)}</loc>`;

describe('sitemap XML', () => {
  test('a record value cannot inject an element', () => {
    const hostile = 'products/x</loc></url><url><loc>https://evil.test/phish';
    const out = loc(hostile);
    // The point: no second <url> for a crawler to follow.
    expect(out.match(/<url>/g)).toBeNull();
    expect(out).not.toContain('<loc>https://evil.test');
    // Exactly one element pair, and it is ours.
    expect(out.match(/<loc>/g)).toHaveLength(1);
    expect(out.match(/<\/loc>/g)).toHaveLength(1);
  });

  test('a record value cannot break the document', () => {
    // An unescaped `&` or `<` makes the whole file unparseable, which loses every
    // URL in it — the failure that is worse than the injection and easier to hit.
    for (const key of ['salt-&-pepper', 'a<b', 'x>y', 'quote"d', "apos'trophe"]) {
      const inner = loc(`products/${key}`).replace(/^<loc>|<\/loc>$/g, '');
      expect(inner, `raw markup survived for ${key}`).not.toMatch(/[<>]/);
      // A bare `&` is the one that looks harmless and is not.
      expect(inner).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;|#)/);
    }
  });

  test('an ordinary address is unchanged — the control', () => {
    // An escaper that mangled normal slugs would pass everything above while
    // breaking every real URL in the sitemap.
    expect(loc('products/blue-widget')).toBe('<loc>https://shop.example/products/blue-widget</loc>');
    expect(loc('about')).toBe('<loc>https://shop.example/about</loc>');
    expect(loc('docs/getting-started')).toBe('<loc>https://shop.example/docs/getting-started</loc>');
  });

  test('null and non-strings do not become the text "null"', () => {
    expect(escapeXml(null)).toBe('');
    expect(escapeXml(undefined)).toBe('');
    expect(escapeXml(0.5)).toBe('0.5');
  });
});
