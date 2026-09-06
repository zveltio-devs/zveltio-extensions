/**
 * The mail reading pane's `{@html}` sink.
 *
 * What stood here before was one regular expression removing a literal
 * `<script>…</script>`. Measured against it, 11 of 12 payloads survived —
 * `<img src=x onerror=…>`, `<svg onload=…>`, `<iframe src=javascript:…>`,
 * `<a href=javascript:…>`, `<meta http-equiv=refresh>`, an unclosed `<script>`
 * — and the result went straight to `{@html}` in the Studio.
 *
 * The attacker for this sink is anyone who can send an email to a user of the
 * instance. No account, no permission, no prior access.
 *
 * WHAT THESE TESTS CAN AND CANNOT REACH. `bun test` has no DOM, so DOMPurify's
 * real branch does not run here — there is no jsdom or happy-dom in this
 * repository, and adding one is a dependency decision with a lockstep gate
 * attached. `content/pages/client/sanitize.test.ts` has the same limit and says
 * so. What is testable without a DOM is the POLICY — the allow-lists DOMPurify
 * is handed, which is where every one of the twelve payloads is decided — plus
 * the server branch and the remote-content predicate. Each test below states
 * which of those it is exercising, so nobody reads this file as proof that the
 * browser path was executed.
 */

import { describe, expect, test } from 'bun:test';
import {
  ALLOWED_ATTRS,
  ALLOWED_TAGS,
  ALLOWED_URI,
  DANGEROUS_STYLE,
  isRemoteUrl,
  safeMailHtml,
  safeMailText,
} from './sanitize.js';

describe('the policy handed to DOMPurify — where the twelve payloads are decided', () => {
  test('no tag that can execute or navigate is on the allow-list', () => {
    // Each of these was the vector of a payload that survived the old regex.
    for (const tag of [
      'script', 'iframe', 'object', 'embed', 'form', 'input', 'button',
      'meta', 'base', 'link', 'style', 'svg', 'math', 'template', 'body',
      'details', 'frame', 'frameset', 'applet', 'audio', 'video',
    ]) {
      expect(ALLOWED_TAGS).not.toContain(tag);
    }
  });

  test('no event handler or scriptable attribute is on the allow-list', () => {
    for (const attr of ALLOWED_ATTRS) {
      expect(attr.startsWith('on')).toBe(false);
    }
    for (const attr of ['onerror', 'onload', 'ontoggle', 'onclick', 'formaction', 'action', 'http-equiv', 'srcdoc']) {
      expect(ALLOWED_ATTRS).not.toContain(attr);
    }
  });

  test('what a mail client actually needs is still allowed', () => {
    // The reason this list is wider than the CMS one. If these go, ordinary
    // newsletters render as unreadable text and the pane gets turned off.
    for (const tag of ['table', 'tr', 'td', 'tbody', 'font', 'center', 'img', 'a', 'blockquote']) {
      expect(ALLOWED_TAGS).toContain(tag);
    }
    for (const attr of ['href', 'src', 'style', 'colspan', 'bgcolor', 'width']) {
      expect(ALLOWED_ATTRS).toContain(attr);
    }
  });

  test('javascript: and data: URLs are refused, ordinary mail schemes are not', () => {
    for (const url of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html;base64,PHNjcmlwdD4=', 'vbscript:x', 'file:///etc/passwd']) {
      expect(ALLOWED_URI.test(url)).toBe(false);
    }
    for (const url of ['https://example.test/x', 'http://example.test/x', 'mailto:a@b.test', 'tel:+40700000000', 'cid:part1.abc', '#anchor']) {
      expect(ALLOWED_URI.test(url)).toBe(true);
    }
  });

  test('a style attribute that fetches or executes is dropped', () => {
    for (const style of [
      'background:url(https://evil.test/pixel.gif)',
      'width:expression(alert(1))',
      '@import url(https://evil.test/x.css)',
      'background-image:url(javascript:alert(1))',
      'behavior:url(#default#time2)',
    ]) {
      expect(DANGEROUS_STYLE.test(style)).toBe(true);
    }
    for (const style of ['color:#ff0000', 'font-weight:bold;text-align:center', 'padding:4px 8px']) {
      expect(DANGEROUS_STYLE.test(style)).toBe(false);
    }
  });
});

describe('remote content — the read receipt the sender gets for free', () => {
  test('off-origin URLs are recognised, in every spelling', () => {
    for (const url of ['https://evil.test/p.gif', 'http://evil.test/p.gif', '//evil.test/p.gif', '  https://evil.test/p.gif  ', 'HTTPS://EVIL.TEST/p.gif']) {
      expect(isRemoteUrl(url)).toBe(true);
    }
  });

  test('inline and same-document references are not blocked', () => {
    // `cid:` is the attachment the message carries with it — blocking it would
    // break every mail with an inline logo and teach the user to click
    // "show images", which is the opposite of the point.
    for (const url of ['cid:part1.abc@mail', '/local/path.png', 'data:image/png;base64,iVBOR']) {
      expect(isRemoteUrl(url)).toBe(false);
    }
  });
});

describe('safeMailHtml — the no-DOM branch (this is the one that runs here)', () => {
  test('it really is the server branch under test', () => {
    // Without this the file could pass while exercising DOMPurify, which would
    // make the assertions below mean something other than what they say.
    expect(typeof window).toBe('undefined');
  });

  test('an unclosed tag does not survive as markup', () => {
    // `replace(/<[^>]*>/g, '')` needs a closing `>` to match; an HTML parser
    // supplies one for you. Same hole as content/pages/client/sanitize.ts.
    expect(safeMailHtml('<img src=x onerror=alert(1)', false)).not.toContain('<img');
    expect(safeMailHtml('Hello <svg onload=alert(1)', false)).not.toContain('<svg');
  });

  test('complete tags are removed and the text survives', () => {
    expect(safeMailHtml('<p>hello <b>world</b></p>', false)).toBe('hello world');
  });

  test('empty and non-string input give an empty string, not a crash', () => {
    for (const v of [undefined, null, 0, {}, [], '']) {
      expect(safeMailHtml(v as unknown, false)).toBe('');
    }
  });
});

describe('safeMailText — plain-text bodies', () => {
  test('every character that can start markup is escaped', () => {
    expect(safeMailText('<img src=x onerror="alert(1)">')).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;',
    );
  });

  test('an ampersand is escaped before anything else, so escapes cannot be forged', () => {
    // Escaping `<` first and `&` second would turn `&lt;` in the source into a
    // real `<` on screen.
    expect(safeMailText('&lt;script&gt;')).toBe('&amp;lt;script&amp;gt;');
  });

  test('non-string input is treated as empty', () => {
    expect(safeMailText(null)).toBe('');
    expect(safeMailText(undefined)).toBe('');
  });
});
