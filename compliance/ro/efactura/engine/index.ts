import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { sql } from 'kysely';
import { efacturaRoutes } from './routes.js';
import { generateUBL } from './ubl-generator.js';

/**
 * Romanian e-Factura compliance extension.
 *
 * Before alpha.67 this extension stored a full duplicate of every invoice in
 * zv_efactura_invoices. As of alpha.67 it consumes the canonical zvd_invoices
 * (owned by finance/invoicing) and only persists ANAF submission metadata —
 * the XML, the upload index, ANAF's response, the status timeline.
 *
 * Two integration paths:
 *   1. invoicing extension is installed → on `invoice.created` we automatically
 *      create a draft submission. User reviews and clicks "submit to ANAF".
 *   2. Standalone (no invoicing) → caller posts /api/efactura/invoices with
 *      invoice fields directly; legacy denormalised columns are populated.
 */
const extension: ZveltioExtension = {
  name: 'compliance/ro/efactura',
  category: 'compliance',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_efactura.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
      join(import.meta.dir, 'migrations/003_canonical_link.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/api/efactura', efacturaRoutes(ctx));

    // ── Auto-draft submissions on invoice creation ──────────────────────────
    // When invoicing emits invoice.created, materialise a draft e-Factura row
    // linked via source_invoice_id. The user can then review + submit to ANAF.
    ctx.events.on('invoice.created', async ({ id, invoice, lines }: any) => {
      try {
        // Skip if already linked (idempotency for hot-reload / re-registration)
        const existing = await sql`
          SELECT id FROM zv_efactura_invoices WHERE source_invoice_id = ${id} LIMIT 1
        `.execute(ctx.db);
        if ((existing.rows as any[]).length > 0) return;

        const linesJson = (lines ?? []).map((l: any) => ({
          description: l.description,
          quantity:    Number(l.quantity ?? 0),
          unit:        l.unit ?? 'buc',
          unit_price:  Number(l.unit_price ?? 0),
          vat_rate:    Number(l.tax_rate ?? 0),
          vat_amount:  Number(l.total ?? 0) - Number(l.unit_price ?? 0) * Number(l.quantity ?? 0),
          line_total:  Number(l.total ?? 0),
        }));

        await sql`
          INSERT INTO zv_efactura_invoices (
            source_invoice_id, invoice_number, invoice_date, due_date,
            seller_name, seller_cui, buyer_name, buyer_cui, buyer_address,
            lines, subtotal, vat_total, total, currency, status
          ) VALUES (
            ${id},
            ${invoice.number},
            ${invoice.issue_date},
            ${invoice.due_date ?? null},
            ${invoice.seller_name ?? 'Set in e-Factura settings'},
            ${invoice.seller_cui ?? ''},
            ${invoice.client_name ?? ''},
            ${invoice.client_tax_id ?? null},
            ${invoice.client_address ?? null},
            ${JSON.stringify(linesJson)}::jsonb,
            ${Number(invoice.subtotal ?? 0)},
            ${Number(invoice.tax_amount ?? 0)},
            ${Number(invoice.total ?? 0)},
            ${invoice.currency ?? 'RON'},
            'draft'
          )
        `.execute(ctx.db);
      } catch (err) {
        console.error('[efactura] auto-draft failed for invoice', id, (err as Error).message);
      }
    });

    // ── Service registry: helpers other extensions can use ──────────────────
    // efactura.submissions.lookup(invoiceId) → submission row | null
    ctx.services.register('efactura.submissions.lookup', async (sourceInvoiceId: string) => {
      const r = await sql<any>`
        SELECT * FROM zv_efactura_invoices WHERE source_invoice_id = ${sourceInvoiceId} LIMIT 1
      `.execute(ctx.db);
      return r.rows[0] ?? null;
    });

    // efactura.generateXml(submissionId) → XML string. Other extensions (or a flow)
    // can request the UBL XML for a submission without going through HTTP.
    ctx.services.register('efactura.generateXml', async (submissionId: string) => {
      const r = await sql<any>`
        SELECT * FROM zv_efactura_invoices WHERE id = ${submissionId} LIMIT 1
      `.execute(ctx.db);
      const submission = r.rows[0];
      if (!submission) return null;
      return generateUBL(submission);
    });
  },
};

export default extension;
