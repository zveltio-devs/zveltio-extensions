// Pure unit tests for the public-block scrubber — no DB, always runs.
import { describe, expect, it } from 'bun:test';
import { sanitizeBlocks, scrubHtml } from './sanitize';

describe('scrubHtml', () => {
  it('strips script elements with their content', () => {
    expect(scrubHtml('a<script>alert(1)</script>b')).toBe('ab');
  });

  it('does not let a split tag reconstitute (fixed-point iteration)', () => {
    expect(scrubHtml('<scr<script>ipt>alert(1)</scr</script>ipt>')).not.toContain('<script');
  });

  it('removes whitespace-delimited event handlers', () => {
    expect(scrubHtml('<img src=x onerror=alert(1)>')).not.toContain('onerror');
  });

  it('removes slash-delimited event handlers (<img/onerror=…>)', () => {
    expect(scrubHtml('<img/onerror=alert(1) src=x>')).not.toContain('onerror');
  });

  it('removes quote-delimited event handlers (src="x"onerror=…)', () => {
    expect(scrubHtml('<img src="x"onerror="alert(1)">')).not.toContain('onerror');
  });

  it('removes formaction and srcdoc attributes', () => {
    expect(scrubHtml('<button formaction=javascript:alert(1)>go</button>')).not.toContain('formaction');
    expect(scrubHtml('<iframe srcdoc="<script>alert(1)</script>"></iframe>')).not.toContain('srcdoc');
  });

  it('neutralizes javascript: and data:text/html URLs', () => {
    expect(scrubHtml('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript:');
    expect(scrubHtml('<a href="java\nscript:alert(1)">x</a>')).not.toContain('script:alert');
    expect(scrubHtml('<embed src="data:text/html,<script>alert(1)</script>">')).not.toContain('data:text/html');
  });

  it('leaves benign markup alone', () => {
    const benign = '<h2>Title</h2><p class="lead">Text with <strong>bold</strong> and <a href="https://example.com">a link</a>.</p>';
    expect(scrubHtml(benign)).toBe(benign);
  });
});

describe('sanitizeBlocks', () => {
  it('scrubs only the html/code fields and preserves block shape', () => {
    const blocks = [
      { type: 'text', content: { html: '<p onclick=x>hi</p>' } },
      { type: 'html', content: { code: '<script>bad()</script><p>ok</p>' } },
      { type: 'image', content: { url: '/img.png', alt: 'x' } },
    ];
    const out = sanitizeBlocks(blocks);
    expect(out[0].content.html).not.toContain('onclick');
    expect(out[1].content.code).toBe('<p>ok</p>');
    expect(out[2]).toEqual(blocks[2]);
  });
});
