// Unit tests for the public-block sanitizer (sanitize-html allow-list).
// No DB, always runs. Asserts security properties, not exact serialization.
import { describe, expect, it, test } from 'bun:test';
import { sanitizeBlocks, scrubHtml } from './sanitize';

const lc = (s: string) => s.toLowerCase();

describe('scrubHtml', () => {
  it('strips <script> and its body entirely', () => {
    const out = scrubHtml('<p>ok</p><script>alert(1)</script>');
    expect(out).toContain('ok');
    expect(lc(out)).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
  });

  it('drops a body-less/unclosed script without leaking its text', () => {
    const out = scrubHtml('<script>alert(1)');
    expect(out).not.toContain('alert(1)');
  });

  it('cannot be bypassed by tag reconstitution (leaves inert text, no live tag)', () => {
    const out = scrubHtml('<scr<script>ipt>alert(1)</scr</script>ipt>');
    // The structural parser drops the <script> element entirely; whatever
    // remains is escaped text, never a live <script> tag.
    expect(lc(out)).not.toContain('<script');
    expect(out).not.toContain('<');
  });

  it('removes event-handler attributes regardless of delimiter', () => {
    for (const payload of [
      '<img src="x" onerror="alert(1)">',
      '<img src=x onerror=alert(1)>',
      '<img/onerror=alert(1) src=x>',
      '<img src="x"onerror="alert(1)">',
    ]) {
      expect(lc(scrubHtml(payload))).not.toContain('onerror');
    }
  });

  it('strips javascript:/vbscript:/data: URLs, including obfuscated schemes', () => {
    expect(lc(scrubHtml('<a href="javascript:alert(1)">x</a>'))).not.toContain('javascript:');
    expect(lc(scrubHtml('<a href="java\nscript:alert(1)">x</a>'))).not.toContain('script:alert');
    expect(lc(scrubHtml('<a href="  vbscript:msgbox(1)">x</a>'))).not.toContain('vbscript:');
    expect(lc(scrubHtml('<img src="data:text/html,<script>alert(1)</script>">'))).not.toContain('data:text/html');
  });

  it('drops disallowed tags (iframe/object/embed/form/svg) but keeps allowed siblings', () => {
    const out = scrubHtml('<iframe src="https://evil"></iframe><object></object><svg onload=alert(1)></svg><p>keep</p>');
    expect(lc(out)).not.toContain('<iframe');
    expect(lc(out)).not.toContain('<object');
    expect(lc(out)).not.toContain('<svg');
    expect(lc(out)).not.toContain('onload');
    expect(out).toContain('keep');
  });

  it('forces rel=noopener on target=_blank links', () => {
    const out = scrubHtml('<a href="https://x.com" target="_blank">x</a>');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it('allows only safe inline style properties, dropping url() exfiltration', () => {
    const out = scrubHtml('<p style="color: red; background-image: url(https://evil/track)">x</p>');
    expect(out).toContain('color');
    expect(lc(out)).not.toContain('url(');
    expect(lc(out)).not.toContain('evil');
  });

  it('preserves benign rich-text markup', () => {
    const out = scrubHtml('<h2>Title</h2><p>Text with <strong>bold</strong> and <a href="https://example.com">a link</a>.</p><ul><li>one</li></ul>');
    expect(out).toContain('<strong>bold</strong>');
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('<li>one</li>');
  });

  it('is a no-op on empty/non-string input', () => {
    expect(scrubHtml('')).toBe('');
    // @ts-expect-error testing runtime guard
    expect(scrubHtml(null)).toBe(null);
  });
});

describe('sanitizeBlocks', () => {
  it('scrubs only html/code fields and preserves block shape', () => {
    const blocks = [
      { type: 'text', content: { html: '<p onclick=x>hi</p>' } },
      { type: 'html', content: { code: '<script>bad()</script><p>ok</p>' } },
      { type: 'image', content: { url: '/img.png', alt: 'x' } },
    ];
    const out = sanitizeBlocks(blocks);
    expect(lc(out[0].content.html)).not.toContain('onclick');
    expect(out[1].content.code).toContain('ok');
    expect(lc(out[1].content.code)).not.toContain('<script');
    expect(out[2]).toEqual(blocks[2]);
  });

  it('passes non-array through untouched', () => {
    // biome-ignore lint/suspicious/noExplicitAny: testing runtime guard
    expect(sanitizeBlocks(null as any)).toBe(null as any);
  });
});

// ── The fields a block actually renders with {@html} ────────────────────────
//
// Added with the merge. `html` and `code` were the entire list, and `richtext`
// — the block an author reaches for first — keeps its markup in
// `content.content`. It was scrubbed by the shipped client component and by
// nothing on the server, so a consumer rendering blocks itself got the raw
// string. These hold the list in place.

describe('every {@html} field is scrubbed', () => {
  const XSS = '<p>ok</p><img src=x onerror=alert(1)><script>alert(2)</script>';

  test.each([
    ['content', 'richtext'],
    ['html', 'embed'],
    ['code', 'embed'],
    ['caption', 'image'],
    ['text', 'cta'],
  ])('content.%s (%s block)', (field, type) => {
    const [out] = sanitizeBlocks([{ type, content: { [field]: XSS } }]);
    const value = out.content[field] as string;
    expect(value).toContain('<p>ok</p>');
    expect(value).not.toContain('onerror');
    expect(value).not.toContain('<script');
    expect(value).not.toContain('alert(2)');
  });

  test('a columns block scrubs every column', () => {
    const [out] = sanitizeBlocks([
      { type: 'columns', content: { items: ['<p>a</p><script>x</script>', '<b onclick=y>b</b>'] } },
    ]);
    expect(out.content.items[0]).toBe('<p>a</p>');
    expect(out.content.items[1]).not.toContain('onclick');
  });

  test('non-string values in the same fields are left alone', () => {
    const [out] = sanitizeBlocks([
      { type: 'collection_list', content: { content: 42, items: [1, 2], collection: 'contacts' } },
    ]);
    expect(out.content.content).toBe(42);
    expect(out.content.items).toEqual([1, 2]);
    expect(out.content.collection).toBe('contacts');
  });
});

describe('nested blocks', () => {
  test('a container scrubs its children at every depth', () => {
    const [out] = sanitizeBlocks([
      {
        type: 'container',
        content: {
          gap: 'md',
          children: [
            { type: 'richtext', content: { content: '<p>a</p><script>alert(1)</script>' } },
            {
              type: 'container',
              content: {
                children: [{ type: 'embed', content: { html: '<img src=x onerror=alert(2)>' } }],
              },
            },
          ],
        },
      },
    ]);

    const first = out.content.children[0].content.content as string;
    const deep = out.content.children[1].content.children[0].content.html as string;

    expect(first).toContain('<p>a</p>');
    expect(first).not.toContain('alert(1)');
    // The one that matters: a block two levels down is scrubbed too. A
    // top-level-only walk would have shipped this exactly as authored.
    expect(deep).not.toContain('onerror');
    expect(deep).not.toContain('alert(2)');
  });

  test('a container without children is untouched', () => {
    const block = { type: 'container', content: { gap: 'lg' } };
    expect(sanitizeBlocks([block])[0]).toEqual(block);
  });
});
