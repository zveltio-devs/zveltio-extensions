import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { ExtensionContext } from '@zveltio/sdk/extension';

// Templates and their render log are declared collections served by the data
// API; template history is the engine's record revisions (`/api/revisions`).
// The one route left renders a PDF: the template is read and the render is
// logged through the data API as the caller, so who may generate is who may
// read the template and create in `document_renders`. Nothing here decides it.

const TEMPLATES = 'document_templates';
const RENDERS = 'document_renders';

type Row = Record<string, unknown>;

const GenerateSchema = z.object({
  variables: z.record(z.string(), z.any()).optional().default({}),
});

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * `{{key}}` and `{{a.b}}` from the variables, HTML-escaped; a missing value
 * renders empty. 1.x inserted values raw, so a caller's variable could add
 * markup — an `<img src>` the PDF renderer would fetch — to the document.
 */
export function populatePlaceholders(template: string, variables: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, key: string) => {
    let value: unknown = variables;
    for (const k of key.split('.')) {
      value = (value as Record<string, unknown> | null | undefined)?.[k];
      if (value === undefined || value === null) return '';
    }
    const text = value instanceof Date ? value.toLocaleDateString('ro-RO') : String(value);
    return text.replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
  });
}

export function documentTemplatesRoutes(ctx: ExtensionContext): Hono {
  const { internals } = ctx;
  const app = new Hono();

  app.post('/:id/generate', zValidator('json', GenerateSchema), async (c) => {
    const found = await internals.readRecord(c, TEMPLATES, c.req.param('id'));
    if (found.status !== 200) return c.json(found.body as object, found.status as 404);
    const template = found.body as Row;
    if (!template.is_active) return c.json({ error: 'Template is not active' }, 400);

    const { variables } = c.req.valid('json');
    // Logged before the PDF is made, so a caller who may not log a render gets no document.
    const logged = await internals.createRecord(c, RENDERS, { template_id: template.id, variables });
    if (logged.status !== 201) return c.json(logged.body as object, logged.status as 403);

    let pdf: Uint8Array<ArrayBuffer>;
    try {
      const html = populatePlaceholders(String(template.html_body), variables);
      pdf = Uint8Array.from((await internals.generatePDFAsync(html, (template.pdf_options as Row | null) ?? {})) as Buffer);
    } catch (err) {
      // Rolls the request back, render row included: no log for a document never made.
      throw new HTTPException(502, {
        res: c.json({ error: 'PDF generation failed', detail: err instanceof Error ? err.message : String(err) }, 502),
      });
    }

    const filename = `${String(template.name).replace(/[^a-zA-Z0-9-]/g, '-')}-${Date.now()}.pdf`;
    c.header('Content-Type', 'application/pdf');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    return c.body(pdf);
  });

  return app;
}
