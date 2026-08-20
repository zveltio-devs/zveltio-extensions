/**
 * Block-content sanitization for the PUBLIC website.
 *
 * `html`/`text` blocks are rendered with {@html} by the public client, so their
 * content executes in every visitor's browser. Two controls protect that path:
 *
 *   1. PRIMARY — the admin gate on every authoring mutation (routes.ts
 *      `requireAdmin`). Authoring is a privileged capability, the same one
 *      WordPress guards with `unfiltered_html`.
 *   2. This module — a real allow-list HTML sanitizer (sanitize-html), applied
 *      on WRITE (content scrubbed at rest) AND on the public READ path (covers
 *      rows authored before this existed and any future write path that forgets
 *      to call it). Unlike the previous regex scrubber, this parses the markup
 *      structurally, so tag-reconstitution and delimiter-confusion bypasses
 *      (`<scr<script>ipt>`, `<img/onerror=…>`, `src="x"onerror=…`,
 *      `java\nscript:`) cannot survive — anything not on the allow-list is
 *      dropped rather than pattern-matched away.
 *
 * Keep BOTH controls. The sanitizer is robust, but the admin gate stays the
 * primary boundary: authoring is not a public capability.
 */

import sanitizeHtml from 'sanitize-html';

// Rich-text set a CMS block legitimately needs. Deliberately excludes script,
// style, iframe, object, embed, form, base, link, meta, svg, math — none of
// which have a place in authored page copy and all of which are XSS vectors.
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr', 'span', 'div',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'small', 'sub', 'sup', 'del', 'ins',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
    'a', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan', 'scope'],
    col: ['span'],
    '*': ['class', 'style'],
  },
  // http(s)/mailto/tel plus relative URLs (default). Notably NO `data:` or
  // `javascript:` — sanitize-html strips any attribute whose scheme is not
  // listed, after decoding entities and stripping control chars, which is
  // exactly the class of URL-scheme bypass the old regex chased by hand.
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  allowProtocolRelative: true,
  // Inline styles are allowed only for a short list of presentational
  // properties, each value regex-validated. This preserves authoring intent
  // (colour, alignment) while blocking `url(...)` exfiltration and
  // `expression()`/behavior CSS.
  allowedStyles: {
    '*': {
      color: [/^#[0-9a-fA-F]{3,8}$/, /^rgba?\([\d\s.,%]+\)$/, /^hsla?\([\d\s.,%]+\)$/, /^[a-zA-Z]{3,20}$/],
      'background-color': [/^#[0-9a-fA-F]{3,8}$/, /^rgba?\([\d\s.,%]+\)$/, /^hsla?\([\d\s.,%]+\)$/, /^[a-zA-Z]{3,20}$/],
      'text-align': [/^(left|right|center|justify)$/],
      'font-weight': [/^(normal|bold|bolder|lighter|[1-9]00)$/],
      'font-style': [/^(normal|italic|oblique)$/],
      'text-decoration': [/^(none|underline|line-through|overline)$/],
    },
  },
  // Force external links to be safe: any target keeps noopener/noreferrer so
  // the opened page cannot reach back through window.opener.
  transformTags: {
    a: (tagName, attribs) => {
      if (attribs.target) attribs.rel = 'noopener noreferrer';
      return { tagName, attribs };
    },
  },
  // Drop the CONTENT of these, not just the tags — a bare `<script>alert(1)`
  // with no close tag must not leak its body as text.
  nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript'],
  disallowedTagsMode: 'discard',
};

/** Sanitize a single HTML string destined for the public {@html} renderer. */
export function scrubHtml(input: string): string {
  if (typeof input !== 'string' || input.length === 0) return input;
  return sanitizeHtml(input, OPTIONS);
}

/**
 * Every block field whose value reaches a `{@html}` renderer.
 *
 * `html` and `code` were the whole list, and they missed the one an author uses
 * most: a `richtext` block keeps its markup in `content.content`, and the client
 * renders it with `{@html safeHtml(content)}`. So the server scrubbed neither on
 * write nor on read for the main text block, and the only thing standing between
 * an authored `<img onerror>` and a visitor was the CLIENT-side sanitizer in the
 * shipped component. Any consumer drawing blocks themselves — which the client
 * entry point explicitly invites — got the raw string.
 *
 * `items` (columns) is an array of HTML strings and is scrubbed element-wise for
 * the same reason.
 */
const HTML_FIELDS = ['html', 'code', 'content', 'caption', 'text'] as const;

/**
 * Scrub every block field the public renderer passes to {@html}, at every depth.
 *
 * RECURSIVE, and that is not a nicety. A `container` holds other blocks, so a
 * scrubber that walked only the top level would leave an `embed` two levels down
 * exactly as its author typed it — and the deeper a block sits, the less likely
 * anyone is to look at it.
 */
// biome-ignore lint/suspicious/noExplicitAny: JSONB block payload
export function sanitizeBlocks(blocks: any[]): any[] {
  if (!Array.isArray(blocks)) return blocks;
  // biome-ignore lint/suspicious/noExplicitAny: JSONB block payload
  return blocks.map((b: any) => {
    const content = b?.content;
    if (!content || typeof content !== 'object') return b;
    const next = { ...content };

    // Children first, so a nested block is scrubbed by the same rules.
    if (Array.isArray(next.children)) next.children = sanitizeBlocks(next.children);

    // A data block's ITEM TEMPLATE is authored markup like any other block, and
    // it is drawn once per record — so markup that slipped through here would be
    // rendered N times rather than once. It nests under its own key, not under
    // `children`, so a walk that only followed containers would miss it.
    if (next.item_template && typeof next.item_template === 'object') {
      next.item_template = sanitizeBlocks([next.item_template])[0];
    }

    for (const field of HTML_FIELDS) {
      if (typeof next[field] === 'string') next[field] = scrubHtml(next[field]);
    }

    // A `columns` block holds one HTML string per column.
    if (Array.isArray(next.items)) {
      next.items = next.items.map((v: unknown) => (typeof v === 'string' ? scrubHtml(v) : v));
    }

    return { ...b, content: next };
  });
}

/**
 * Give every block an `id`, so the parts that address a block by id work.
 *
 * The Studio assigns `crypto.randomUUID()` to each block it creates
 * (`BlockLibrary`, `BlockList`, `PropertiesPanel`, and `block-tree.ts` backfills
 * `b.id ?? crypto.randomUUID()`). The API did not, and stored whatever it was
 * given. So a page created through `POST /sites/:slug/pages` came back with
 * blocks that have no id, and `findBlockById` — which matches on `b.id` — could
 * never find them.
 *
 * The consequence was silent rather than loud. `BlockRenderer` guards with
 * `block.id ? rowsUrl : …`, so a data block without an id renders its first page
 * of rows and simply never gets a rows URL: no load-more, no server-side sort,
 * no search. The feature those endpoints exist for is absent and nothing says so.
 *
 * WRITE ONLY. `sanitizeBlocks` also runs on the render path, and assigning ids
 * there would hand the client a fresh id on every request — a URL pointing at a
 * block that does not exist under that id in storage, which is worse than no URL
 * at all. Existing rows keep their missing ids until something rewrites them,
 * which is honest: the id has to be the one that was persisted.
 */
// biome-ignore lint/suspicious/noExplicitAny: JSONB block payload
export function assignBlockIds(blocks: any[]): any[] {
  if (!Array.isArray(blocks)) return blocks;
  // biome-ignore lint/suspicious/noExplicitAny: JSONB block payload
  return blocks.map((b: any) => {
    if (!b || typeof b !== 'object') return b;
    const next = { ...b, id: b.id ?? crypto.randomUUID() };
    const content = next.content;
    if (content && typeof content === 'object') {
      const c = { ...content };
      if (Array.isArray(c.children)) c.children = assignBlockIds(c.children);
      if (c.item_template) c.item_template = assignBlockIds([c.item_template])[0];
      next.content = c;
    }
    return next;
  });
}

/**
 * What every WRITE path passes its blocks through: scrub, then make sure each
 * one can be addressed. One name to grep for, so route number nine cannot use
 * only half of it.
 */
// biome-ignore lint/suspicious/noExplicitAny: JSONB block payload
export function sanitizeBlocksForWrite(blocks: any[]): any[] {
  return assignBlockIds(sanitizeBlocks(blocks));
}
