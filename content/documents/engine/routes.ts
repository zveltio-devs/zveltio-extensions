import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { renderTemplate } from './lib/doc-template.js';

// Generated documents, their numbering and their signatures are declared
// collections served by the data API. The one route left issues a document:
// the template (`content/document-templates`) is read, the number is taken and
// the document is recorded through the data API as the caller, all in the
// request's transaction. Nothing here decides who may do it.
//
// A signature is a row of `document_signatures`, created by the signer through
// the data API, so the engine stamps who signed (ADR 0015). There is no signing
// or sharing by public token any more (owner decision 2026-11-03, B3).

const TEMPLATES = 'document_templates';
const DOCS = 'generated_documents';
const SEQUENCES = 'document_number_sequences';

type Row = Record<string, unknown>;

const GenerateDocSchema = z.object({
  variables_data: z.record(z.string(), z.any()).optional().default({}),
  source_record_id: z.string().optional(),
  source_collection: z.string().optional(),
  output_format: z.enum(['pdf', 'html']).default('pdf'),
  expires_hours: z.number().int().positive().optional(),
});

/** Answer `status` and roll the request's transaction back: nothing written so far is kept. */
function refuse(c: Context, status: number, body: object): never {
  throw new HTTPException(status as 400, { res: c.json(body, status as 400) });
}

export function documentsRoutes(ctx: ExtensionContext): Hono {
  const { internals } = ctx;
  const app = new Hono();

  /**
   * The template's next number, `PREFIX-YEAR-0001` (or `PREFIX-0001` without
   * the yearly reset). The sequence row is created on first use.
   * ponytail: two concurrent issues can read the same number; `document_number`
   * is unique, so the second answers 409 instead of a duplicate. A row lock
   * (`expect`) when the data API's update grows one.
   */
  async function nextNumber(c: Context, templateId: string): Promise<string> {
    const year = new Date().getFullYear();
    const list = await internals.listRecords(c, SEQUENCES, { limit: 1, filter: { template_id: { eq: templateId } } });
    if (list.status !== 200) refuse(c, list.status, list.body as object);
    const seq = (list.body as { records: Row[] }).records[0];
    if (!seq) {
      const created = await internals.createRecord(c, SEQUENCES, { template_id: templateId, next_number: 2, reset_year: year });
      if (created.status !== 201) refuse(c, created.status, { error: 'Could not start the numbering', detail: created.body });
      return `${(created.body as Row).prefix}-${year}-0001`;
    }
    const reset = Boolean(seq.year_reset) && Number(seq.reset_year) !== year;
    const n = reset ? 1 : Number(seq.next_number);
    const updated = await internals.updateRecord(c, SEQUENCES, String(seq.id), { next_number: n + 1, reset_year: year });
    if (updated.status !== 200) refuse(c, updated.status, { error: 'Could not take a number', detail: updated.body });
    const padded = String(n).padStart(4, '0');
    return seq.year_reset ? `${seq.prefix}-${year}-${padded}` : `${seq.prefix}-${padded}`;
  }

  app.post('/generate/:templateId', zValidator('json', GenerateDocSchema), async (c) => {
    const data = c.req.valid('json');
    const found = await internals.readRecord(c, TEMPLATES, c.req.param('templateId'));
    if (found.status !== 200) return c.json(found.body as object, found.status as 404);
    const template = found.body as Row;
    if (!template.is_active) return c.json({ error: 'Template is not active' }, 400);

    const documentNumber = await nextNumber(c, String(template.id));
    const variables = {
      ...data.variables_data,
      _document_number: documentNumber,
      _generated_at: new Date().toLocaleDateString('ro-RO'),
    };
    const html = renderTemplate(String(template.html_body ?? ''), variables);
    const doc = await internals.createRecord(c, DOCS, {
      template_id: template.id,
      template_name: template.name,
      document_number: documentNumber,
      source_collection: data.source_collection ?? null,
      source_record_id: data.source_record_id ?? null,
      variables_used: variables,
      expires_at: data.expires_hours ? new Date(Date.now() + data.expires_hours * 3_600_000).toISOString() : null,
    });
    if (doc.status !== 201) refuse(c, doc.status, { error: 'Could not record the document', detail: doc.body });
    const docId = String((doc.body as Row).id);

    if (data.output_format === 'html') return c.json({ document: doc.body, html }, 201);

    let pdf: Uint8Array<ArrayBuffer>;
    try {
      pdf = Uint8Array.from((await internals.generatePDFAsync(html, { title: `${template.name} ${documentNumber}` })) as Buffer);
    } catch (err) {
      // No document row and no number taken for a PDF that was never made.
      refuse(c, 502, { error: 'PDF generation failed', detail: err instanceof Error ? err.message : String(err) });
    }
    const filename = `${String(template.name).replace(/\s/g, '_')}_${documentNumber.replace(/\//g, '-')}.pdf`;
    c.header('Content-Type', 'application/pdf');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    c.header('X-Document-Id', docId);
    c.header('X-Document-Number', documentNumber);
    return c.body(pdf);
  });

  return app;
}
