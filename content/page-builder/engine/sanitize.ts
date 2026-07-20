/**
 * Block-content scrubbing for the PUBLIC website.
 *
 * `html`/`text` blocks are rendered with {@html} by the public client, so their
 * content is executable in every visitor's browser. The PRIMARY control is the
 * admin gate on every authoring mutation (see routes.ts `requireAdmin`) —
 * authoring is a privileged capability, the same call WordPress makes with
 * `unfiltered_html`. This module is defense in depth on top of that:
 *
 *   - applied on WRITE, so newly authored content is scrubbed at rest;
 *   - applied on the public READ path, which additionally covers rows written
 *     BEFORE this existed and any write path added later that forgets to call it.
 *
 * It is deliberately conservative and is NOT a complete HTML sanitizer — do not
 * treat it as one, and do not remove the admin gate on its strength.
 */

export function scrubHtml(input: string): string {
  let out = input;
  // Repeat to a fixed point. A single pass is not enough: removing an inner
  // match can RECONSTITUTE a live tag from the surrounding text — the classic
  // `<scr<script>ipt>` bypass collapses to `<script>` after one substitution.
  for (let pass = 0; pass < 8; pass++) {
    const before = out;
    out = out
      // dangerous element together with its content
      .replace(/<\s*(script|style|iframe|object|embed|form)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
      // …and any stray/unclosed opening or closing tag left over
      .replace(/<\s*\/?\s*(?:script|style|iframe|object|embed|base|form|link|meta)\b[^>]*>?/gi, '')
      // inline event handlers: onclick=, onerror=… (quoted or bare)
      .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/\ssrcdoc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/(?:javascript|vbscript)\s*:/gi, 'blocked:')
      .replace(/data\s*:\s*text\/html/gi, 'blocked:');
    if (out === before) break;
  }
  return out;
}

/** Scrub the two block fields the public renderer passes to {@html}. */
// biome-ignore lint/suspicious/noExplicitAny: JSONB block payload
export function sanitizeBlocks(blocks: any[]): any[] {
  if (!Array.isArray(blocks)) return blocks;
  // biome-ignore lint/suspicious/noExplicitAny: JSONB block payload
  return blocks.map((b: any) => {
    const content = b?.content;
    if (!content || typeof content !== 'object') return b;
    const next = { ...content };
    if (typeof next.html === 'string') next.html = scrubHtml(next.html);
    if (typeof next.code === 'string') next.code = scrubHtml(next.code);
    return { ...b, content: next };
  });
}
