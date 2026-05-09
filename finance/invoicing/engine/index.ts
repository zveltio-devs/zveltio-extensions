import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { sql } from 'kysely';
import { invoicingRoutes } from './routes.js';

/**
 * Invoicing extension — canonical owner of `zvd_invoices` and `zvd_invoice_lines`.
 *
 * Publishes the following services:
 *   invoicing.lookup(id)                  → invoice with lines | null
 *   invoicing.findByNumber(number)        → invoice | null
 *   invoicing.listByClient(clientId)      → invoice[] for a contact
 *   invoicing.create(input)               → created invoice + lines (also emits invoice.created)
 *
 * Emits events on the engine bus:
 *   invoice.created    { id, invoice, lines }
 *   invoice.updated    { id, invoice }
 *   invoice.paid       { id, invoice }
 *   invoice.cancelled  { id }
 *
 * Consumes services (optional — works without them):
 *   crm.contacts.lookup     used to enrich client_name from contact when client_id is set
 */
const extension: ZveltioExtension = {
  name: 'finance/invoicing',
  category: 'finance',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
      join(import.meta.dir, 'migrations/003_line_metadata.sql'),
      join(import.meta.dir, 'migrations/004_invoice_sequences.sql'),
      join(import.meta.dir, 'migrations/005_client_fk.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/api/invoicing', invoicingRoutes(ctx));

    // ── Service registry — canonical invoices API ───────────────────────────
    ctx.services.register('invoicing.lookup', async (id: string) => {
      const inv = await sql<any>`SELECT * FROM zvd_invoices WHERE id = ${id} LIMIT 1`.execute(ctx.db);
      if (!inv.rows[0]) return null;
      const lines = await sql<any>`
        SELECT * FROM zvd_invoice_lines WHERE invoice_id = ${id} ORDER BY sort_order, id
      `.execute(ctx.db);
      return { ...inv.rows[0], lines: lines.rows };
    });

    ctx.services.register('invoicing.findByNumber', async (number: string) => {
      const r = await sql<any>`SELECT * FROM zvd_invoices WHERE number = ${number} LIMIT 1`.execute(ctx.db);
      return r.rows[0] ?? null;
    });

    ctx.services.register('invoicing.listByClient', async (clientId: string) => {
      const r = await sql<any>`
        SELECT * FROM zvd_invoices WHERE client_id = ${clientId}::uuid ORDER BY issue_date DESC
      `.execute(ctx.db);
      return r.rows;
    });
  },
};

export default extension;
