import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { sql } from 'kysely';
import { traceRoutes } from './routes/index.js';

const extension: ZveltioExtension = {
  name: 'operations/traceability',
  category: 'operations',
  // S3-01: sub-app mounted at /ext/operations/traceability by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', traceRoutes(ctx));

    // Listen for invoices created by the invoicing extension.
    // invoicing emits 'record.created' with collection='zvd_invoices' — it does not know
    // about traceability. We act only when a line has lot_id in its metadata.
    ctx.events.on('record.created', async ({ collection, record, id }: any) => {
      if (collection !== 'zvd_invoices') return;

      try {
        const linesResult = await sql`
          SELECT id, description, quantity, unit, metadata
          FROM zvd_invoice_lines
          WHERE invoice_id = ${id}
            AND (metadata->>'lot_id') IS NOT NULL
        `.execute(ctx.db);

        for (const line of linesResult.rows as any[]) {
          const lotId = line.metadata?.lot_id;
          if (!lotId) continue;

          // Verify lot exists and is available before creating dispatch
          const lotCheck = await sql`
            SELECT id FROM trace_lots WHERE id = ${lotId} AND status = 'available'
          `.execute(ctx.db);
          if (!lotCheck.rows.length) continue;

          await sql`
            INSERT INTO trace_dispatches (
              invoice_id, invoice_number, invoice_line_id,
              customer_id, customer_name,
              lot_id, item_name_from_invoice,
              quantity_invoiced, unit, status
            ) VALUES (
              ${id}, ${record.number}, ${line.id},
              ${record.client_id ?? null}, ${record.client_name},
              ${lotId}, ${line.description},
              ${line.quantity}, ${line.unit ?? 'buc'}, 'pending'
            )
            ON CONFLICT DO NOTHING
          `.execute(ctx.db);
        }
      } catch {
        // Fire-and-forget — never let event handler errors crash the invoice creation
      }
    });
  },
};

export default extension;
