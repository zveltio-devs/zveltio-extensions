/**
 * Template rendering for generated documents.
 *
 * ── Why this file lives here and not in the engine ────────────
 *
 * It used to be `packages/engine/src/lib/doc-generator.ts`, reachable only
 * through `ctx.internals.renderTemplate`. Measured by importer rather than by
 * name: no engine route and no engine module imported that file, and this
 * extension was its only caller.
 *
 * `ai` looked like a second caller and is not — it defines its own
 * `renderTemplate` twice over, in `engine/routes/ai-chats.ts` and
 * `engine/lib/ai-provider.ts`. Those take `Record<string, string>` and do NOT
 * escape, so they are a different function with the same name, for prompts
 * rather than for HTML. Left alone deliberately: merging them would change what
 * the AI ones do, and this one's escaping is the thing that must not be lost.
 *
 * ── What did NOT move, and why ────────────────────────────────
 *
 * The rest of `doc-generator.ts` did not come with it, and the file is gone:
 *
 *   `generatePDF`             — a one-line delegation to `generatePDFAsync`.
 *                               The routes now call that directly; a wrapper
 *                               whose only job was to be importable from the
 *                               engine has nothing left to do here.
 *
 *   `getNextDocumentNumber`   — dead. Not on `ctx.internals`, not in the SDK,
 *                               and no caller anywhere in either repository.
 *                               This extension has its own `getNextDocNumber`,
 *                               which takes the transaction handle. Deleted
 *                               rather than moved.
 *
 * `pdf-queue` stays in the engine and is NOT a leftover: it runs a pool of up
 * to four Bun `Worker`s. Spawning workers is ambient authority — exactly what
 * `check-ambient-authority` refuses an extension — so it belongs to the host,
 * like tenant isolation. `generatePDFAsync` remains on `ctx.internals`.
 */

/** Escape HTML special characters to prevent XSS in generated PDF content. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Substitute {{variable}} placeholders in a template string.
 *
 * Every substituted value is HTML-escaped: the output goes into the generated
 * HTML/PDF and into the `html_content` column, so an unescaped value is stored
 * XSS. That escaping is the reason this function exists rather than a
 * `String.replace` at the call site.
 */
// biome-ignore lint/suspicious/noExplicitAny: legacy any; tracked in hardening plan item H-01
export function renderTemplate(template: string, variables: Record<string, any>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_match, key) => {
    const value = variables[key.trim()];
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return escapeHtml(new Date(value).toLocaleDateString('ro-RO'));
    }
    if (typeof value === 'number') return escapeHtml(value.toLocaleString('ro-RO'));
    return escapeHtml(String(value));
  });
}
