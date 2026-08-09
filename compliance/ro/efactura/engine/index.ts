import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { sql } from 'kysely';
import { efacturaRoutes } from './routes.js';
import { generateUBLXML as generateUBL } from './ubl-generator.js';

/**
 * A DATE column, as Postgres will accept it back.
 *
 * The driver hands `date` columns over as JavaScript Date objects, and
 * interpolating one into SQL stringifies it the JavaScript way —
 * "Sun Aug 09 2026 00:00:00 GMT+0000 (Coordinated Universal Time)" — which
 * Postgres rejects with "invalid input syntax for type date". The invoice row
 * arrives here straight from an INSERT ... RETURNING, so its dates are Date
 * objects, never the strings they looked like in the request body.
 */
function isoDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

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
 *   2. Standalone (no invoicing) → caller posts /ext/compliance/ro/efactura/invoices with
 *      invoice fields directly; legacy denormalised columns are populated.
 */
const extension: ZveltioExtension = {
  name: 'compliance/ro/efactura',
  category: 'compliance',
  // S3-01: sub-app mounted at /ext/compliance/ro/efactura by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
      join(import.meta.dir, 'migrations/003_party_address.sql'),
      join(import.meta.dir, 'migrations/004_party_county.sql'),
      join(import.meta.dir, 'migrations/005_anaf_settings.sql'),
      join(import.meta.dir, 'migrations/006_callback_url.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', efacturaRoutes(ctx));

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

        // The four identity fields below are the ones ANAF validates against,
        // and until the invoicing extension grew a company profile there was
        // nothing behind any of them. Neither seller_cui nor client_tax_id was
        // ever a column on the invoices table, so both resolved to undefined on
        // every invoice ever created: the seller name fell through to the
        // placeholder, the seller code went out as an empty string, and the
        // buyer code went out NULL — which ANAF rejects outright. Those
        // fallbacks were not an edge case, they were the behaviour, on every
        // single document this extension ever drafted.
        //
        // The seller values are snapshotted onto the invoice at issue time, so
        // a submission keeps the details the document was issued under even
        // after the company changes its address or its bank.
        await sql`
          INSERT INTO zv_efactura_invoices (
            source_invoice_id, invoice_number, invoice_date, due_date,
            seller_name, seller_cui, seller_address, seller_city, seller_county, seller_country,
            buyer_name, buyer_cui, buyer_address, buyer_city, buyer_county, buyer_country,
            lines, subtotal, vat_total, total, currency, status
          ) VALUES (
            ${id},
            ${invoice.number},
            ${isoDate(invoice.issue_date)},
            ${isoDate(invoice.due_date)},
            ${invoice.seller_name ?? 'Set in e-Factura settings'},
            ${invoice.seller_tax_id ?? invoice.seller_cui ?? ''},
            ${invoice.seller_address ?? null},
            ${invoice.seller_city ?? null},
            ${invoice.seller_county ?? null},
            ${invoice.seller_country ?? 'RO'},
            ${invoice.client_name ?? ''},
            ${invoice.client_tax_id ?? null},
            ${invoice.client_address ?? null},
            ${invoice.client_city ?? null},
            ${invoice.client_county ?? null},
            ${invoice.client_country ?? 'RO'},
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
