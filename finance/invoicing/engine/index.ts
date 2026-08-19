import { type ZveltioExtension, toNumber } from '@zveltio/sdk/extension';
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
  // S3-01: sub-app mounted at /ext/finance/invoicing by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
      join(import.meta.dir, 'migrations/003_user_ref_text.sql'),
      join(import.meta.dir, 'migrations/004_partially_paid_status.sql'),
      join(import.meta.dir, 'migrations/005_company_identity_and_series.sql'),
      join(import.meta.dir, 'migrations/006_vat_compliance.sql'),
      join(import.meta.dir, 'migrations/007_catalogue_and_documents.sql'),
      join(import.meta.dir, 'migrations/008_party_city.sql'),
      join(import.meta.dir, 'migrations/009_party_county.sql'),
      join(import.meta.dir, 'migrations/010_tenant_scoped_unique_keys.sql'),
      join(import.meta.dir, 'migrations/011_line_metadata_object.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', invoicingRoutes(ctx));

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

    /**
     * Record a payment against an invoice.
     *
     * Published because `finance/banking` needed it and had no way to ask.
     * Reconciling a bank transaction against an invoice set `is_reconciled` on
     * the bank side and never touched the invoice — so it stayed `sent`, aged
     * into `overdue`, kept appearing in the cash-flow forecast as expected
     * inflow, and kept appearing in the very suggest-matches list it had just
     * been matched from.
     *
     * The alternative was for banking to UPDATE `zvd_invoices` directly. That is
     * the coupling that produced H-6 in `ecommerce/store`, where one extension
     * wrote another's table and silently violated a NOT NULL for the life of the
     * feature. One owner, one write path.
     *
     * Same arithmetic as `POST /invoices/:id/payments`, deliberately — this is
     * that route's body, reachable by name.
     */
    ctx.services.register(
      'invoicing.recordPayment',
      async (input: {
        invoiceId: string;
        amount: number;
        paymentDate?: string;
        method?: string;
        reference?: string;
        notes?: string;
        userId: string;
      }) => {
        const inv = await sql<any>`
          SELECT id, total, amount_paid FROM zvd_invoices
          WHERE id = ${input.invoiceId} AND status IN ('sent','overdue','partially_paid')
          LIMIT 1
        `.execute(ctx.db);
        if (!inv.rows[0]) return null;
        const invoice = inv.rows[0];
        await sql`
          INSERT INTO zvd_invoice_payments (invoice_id, amount, payment_date, payment_method, reference, notes, created_by)
          VALUES (${input.invoiceId}, ${input.amount}, ${input.paymentDate ?? new Date().toISOString().slice(0, 10)},
            ${input.method ?? 'transfer'}, ${input.reference ?? null}, ${input.notes ?? null}, ${input.userId})
        `.execute(ctx.db);
        // `amount_paid` and `total` are NUMERIC, which the driver hands back as
        // strings; `+` on those concatenates rather than adds.
        //
        // Both operands are converted, not just the column. `input` arrives
        // through `ctx.services`, whose `get<T>()` is an unchecked cast — the
        // `amount: number` declared above is a claim by the caller, not a
        // guarantee. One caller passing the string it read from its own NUMERIC
        // column turns `49 + '5'` into `'495'`, and that is what gets written as
        // the amount paid. `toNumber` also refuses NaN, which PostgreSQL would
        // otherwise accept into the column and then compare as larger than every
        // number, so `newPaid >= total` would mark the invoice paid.
        const newPaid =
          toNumber(invoice.amount_paid, 0, 'zvd_invoices.amount_paid') +
          toNumber(input.amount, 0, 'invoicing.recordPayment#amount');
        const newStatus =
          newPaid >= toNumber(invoice.total, 0, 'zvd_invoices.total') ? 'paid' : 'partially_paid';
        const row = await sql<any>`
          UPDATE zvd_invoices SET amount_paid = ${newPaid}, status = ${newStatus}, updated_at = NOW()
          WHERE id = ${input.invoiceId} RETURNING id, number, status, amount_paid, total
        `.execute(ctx.db);
        return row.rows[0] ?? null;
      },
    );

    /**
     * Open receivables in a date window — what `finance/banking` needs to draw
     * the accounts-receivable half of its cash-flow forecast.
     *
     * It exists because banking was reading `zvd_invoices` directly. That is one
     * extension reading another's table, which is the coupling that produced H-6
     * in `ecommerce/store`, and it had a second cost: on an instance without this
     * extension installed the table simply is not there, so
     * `GET /banking/cash-flow` answered 500 rather than a forecast. A service can
     * be absent; a table cannot be asked whether it exists without saying so.
     *
     * `total - amount_paid` is the outstanding balance. Both are NUMERIC, so the
     * driver returns strings and the subtraction happens in PostgreSQL, not here.
     */
    ctx.services.register(
      'invoicing.openReceivables',
      async (window: { from: string; to: string }) => {
        const r = await sql<any>`
          SELECT
            due_date                        AS expected_date,
            'inflow'                        AS type,
            (total - amount_paid)           AS amount,
            'Invoice ' || number            AS description,
            'accounts_receivable'           AS category
          FROM zvd_invoices
          WHERE status IN ('sent', 'overdue')
            AND due_date BETWEEN ${window.from} AND ${window.to}
          ORDER BY due_date
        `.execute(ctx.db);
        return r.rows;
      },
    );

    ctx.services.register('invoicing.listByClient', async (clientId: string) => {
      const r = await sql<any>`
        SELECT * FROM zvd_invoices WHERE client_id = ${clientId}::uuid ORDER BY issue_date DESC
      `.execute(ctx.db);
      return r.rows;
    });
  },
};

export default extension;
