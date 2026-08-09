import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import { generateUBLXML } from './ubl-generator.js';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { permissionGate } from '@zveltio/sdk/extension';

const lineSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().default('BUC'),
  unit_price: z.number(),
  vat_rate: z.number().int().min(0).max(25),
  vat_amount: z.number(),
  line_total: z.number(),
});

const invoiceSchema = z.object({
  invoice_number: z.string().min(1),
  invoice_date: z.string(),
  due_date: z.string().optional(),
  seller_name: z.string().min(1),
  seller_cui: z.string().min(1),
  seller_reg_com: z.string().optional(),
  seller_address: z.string().optional(),
  seller_iban: z.string().optional(),
  seller_bank: z.string().optional(),
  buyer_name: z.string().min(1),
  buyer_cui: z.string().optional(),
  buyer_cui_type: z.enum(['RO', 'EU', 'OTHER']).default('RO'),
  buyer_address: z.string().optional(),
  lines: z.array(lineSchema),
  subtotal: z.number(),
  vat_total: z.number(),
  total: z.number(),
  currency: z.string().default('RON'),
  payment_method: z.string().optional(),
  payment_reference: z.string().optional(),
  reverse_charge: z.boolean().default(false),
});

/**
 * Nothing is sent to ANAF, and saying so is the whole point.
 *
 * This route used to FABRICATE the answer. It built a response object with
 * `ExecutionStatus: '0'` and an upload index of `RO` followed by the current
 * timestamp, wrote that to `anaf_index` and `anaf_response`, moved the invoice
 * to `submitted`, recorded a status-log entry reading "ANAF index: …",
 * incremented the daily count of submitted invoices, and replied "Submitted to
 * ANAF". `batch-submit` did the same for twenty at a time.
 *
 * There is no ANAF call anywhere in this extension — no OAuth, no certificate,
 * no request to anaf.ro — so every one of those invoices was still sitting on
 * the operator's own disk while the product told them it had been filed. A
 * missing feature costs someone an afternoon; a feature that reports success it
 * did not achieve costs them a penalty, months later, with the evidence in
 * their own database saying they had complied.
 *
 * 501 is the honest status: the route exists and is understood, the capability
 * does not. The XML is real and already downloadable, so the reply points at
 * the path that does work today — generate it, fetch it, upload it in SPV by
 * hand — rather than leaving somebody stuck at a button.
 */
/**
 * A database row, as the UBL generator declares its input.
 *
 * Postgres gives NUMERIC back as a string and DATE as a Date; `InvoiceData`
 * asks for `number` and `string`. Converting here keeps every `.toFixed()` in
 * the template honest instead of each one guarding itself.
 */
// biome-ignore lint/suspicious/noExplicitAny: legacy any; tracked in docs/HARDENING-9-PLAN.md H-01
function toInvoiceData(row: any, lines: any[]): any {
  const num = (v: unknown): number => (v === null || v === undefined ? 0 : Number(v));
  const day = (v: unknown): string =>
    v instanceof Date ? v.toISOString().slice(0, 10) : v ? String(v).slice(0, 10) : '';
  return {
    ...row,
    invoice_date: day(row.invoice_date),
    due_date: day(row.due_date),
    subtotal: num(row.subtotal),
    vat_total: num(row.vat_total),
    total: num(row.total),
    lines: (lines ?? []).map((l) => ({
      ...l,
      quantity: num(l.quantity),
      unit_price: num(l.unit_price),
      vat_rate: num(l.vat_rate),
      vat_amount: num(l.vat_amount),
      line_total: num(l.line_total),
    })),
  };
}

const NOT_SUBMITTED_DETAIL =
  'Automatic submission to ANAF is not implemented: this build has no SPV ' +
  'integration (no certificate, no OAuth, no call to anaf.ro). The invoice was ' +
  'NOT sent and its status is unchanged. Generate the XML and download it from ' +
  'GET /:id/xml, then upload that file in SPV yourself.';

// biome-ignore lint/suspicious/noExplicitAny: legacy any; tracked in docs/HARDENING-9-PLAN.md H-01
function notSubmitted(c: any) {
  return c.json(
    { code: 'anaf_submission_not_implemented', error: NOT_SUBMITTED_DETAIL, submitted: false },
    501,
  );
}

async function getUser(c: any, auth: any) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return session?.user ?? null;
}

async function logStatusChange(dbh: any, invoiceId: string, oldStatus: string, newStatus: string, userId: string, note?: string) {
  await sql`
    INSERT INTO zv_efactura_status_log (invoice_id, old_status, new_status, changed_by, note)
    VALUES (${invoiceId}::uuid, ${oldStatus}, ${newStatus}, ${userId}, ${note ?? null})
  `.execute(dbh).catch(() => {});
}

export function efacturaRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;
  const app = new Hono();

  // `db` is `ctx.db`: a proxy the engine hands over that resolves the CURRENT
  // tenant transaction per query via AsyncLocalStorage (H-12). A plain `db` in
  // a handler is therefore already RLS-scoped — there is one spelling, so there
  // is none to forget.

  // Auth + RBAC gate — populate c.user then check `efactura` permission.
  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });
  app.use('*', permissionGate(ctx, 'efactura'));

  // GET / — list invoices
  app.get('/', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { status, seller_cui, from_date, to_date } = c.req.query();
    let query = db
      .selectFrom('zv_efactura_invoices')
      .select(['id', 'invoice_number', 'invoice_date', 'buyer_name', 'buyer_cui', 'total', 'currency', 'status', 'anaf_index', 'created_at'])
      .orderBy('invoice_date', 'desc');

    if (status) query = query.where('status', '=', status);
    if (seller_cui) query = query.where('seller_cui', '=', seller_cui);
    if (from_date) query = query.where('invoice_date', '>=', from_date);
    if (to_date) query = query.where('invoice_date', '<=', to_date);

    const invoices = await query.execute();
    return c.json({ invoices });
  });

  // GET /stats — MUST precede /:id, else the param route captures "stats"
  // as :id and the UUID cast on the invoice id 500s.
  app.get('/stats', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { seller_cui, year } = c.req.query();
    const currentYear = year ? parseInt(year, 10) : new Date().getFullYear();

    const [statusStats, monthlyStats] = await Promise.all([
      sql<any>`
        SELECT status, COUNT(*)::int AS count, SUM(total) AS total_amount
        FROM zv_efactura_invoices
        WHERE EXTRACT(YEAR FROM invoice_date) = ${currentYear}
          ${seller_cui ? sql`AND seller_cui = ${seller_cui}` : sql``}
        GROUP BY status
      `.execute(db).catch(() => ({ rows: [] })),
      sql<any>`
        SELECT TO_CHAR(invoice_date, 'YYYY-MM') AS month,
               COUNT(*)::int AS count, SUM(total) AS total, SUM(vat_total) AS vat
        FROM zv_efactura_invoices
        WHERE EXTRACT(YEAR FROM invoice_date) = ${currentYear}
          ${seller_cui ? sql`AND seller_cui = ${seller_cui}` : sql``}
        GROUP BY month ORDER BY month
      `.execute(db).catch(() => ({ rows: [] })),
    ]);

    return c.json({ year: currentYear, by_status: statusStats.rows, by_month: monthlyStats.rows });
  });

  // GET /:id — get invoice
  app.get('/:id', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const invoice = await db
      .selectFrom('zv_efactura_invoices')
      .selectAll()
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!invoice) return c.json({ error: 'Invoice not found' }, 404);
    return c.json({ invoice });
  });

  // GET /:id/status-log
  app.get('/:id/status-log', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const logs = await sql<any>`
      SELECT * FROM zv_efactura_status_log
      WHERE invoice_id = ${c.req.param('id')}::uuid
      ORDER BY created_at ASC
    `.execute(db).catch(() => ({ rows: [] }));

    return c.json({ log: logs.rows });
  });

  // POST / — create invoice
  app.post('/', zValidator('json', invoiceSchema), async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = c.req.valid('json');
    const invoice = await db
      .insertInto('zv_efactura_invoices')
      .values({
        ...body,
        lines: JSON.stringify(body.lines),
        created_by: user.id,
      })
      .returningAll()
      .executeTakeFirst();

    return c.json({ invoice }, 201);
  });

  // PATCH /:id — update draft
  app.patch('/:id', zValidator('json', invoiceSchema.partial()), async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = c.req.valid('json');
    const updates: any = { updated_at: new Date() };
    for (const [k, v] of Object.entries(body)) {
      if (v !== undefined) updates[k] = k === 'lines' ? JSON.stringify(v) : v;
    }

    const invoice = await db
      .updateTable('zv_efactura_invoices')
      .set(updates)
      .where('id', '=', c.req.param('id'))
      .where('status', '=', 'draft')
      .returningAll()
      .executeTakeFirst();

    if (!invoice) return c.json({ error: 'Invoice not found or not editable' }, 404);
    return c.json({ invoice });
  });

  app.delete('/:id', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    await db
      .deleteFrom('zv_efactura_invoices')
      .where('id', '=', c.req.param('id'))
      .where('status', '=', 'draft')
      .execute();

    return c.json({ success: true });
  });

  // POST /:id/generate-xml — generate UBL XML
  app.post('/:id/generate-xml', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const invoice = await db
      .selectFrom('zv_efactura_invoices')
      .selectAll()
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!invoice) return c.json({ error: 'Invoice not found' }, 404);

    const lines = typeof invoice.lines === 'string' ? JSON.parse(invoice.lines) : invoice.lines;
    // The row is NOT the shape the generator declares, and the cast that used
    // to sit here said it was.
    //
    // `InvoiceData` types its amounts as `number`, but Postgres returns NUMERIC
    // as a STRING — the driver refuses to silently lose precision — so
    // `vat_total.toFixed(2)` threw "toFixed is not a function" on every real
    // invoice. Dates come back as Date objects for the same reason. The `as
    // any` bridged the two shapes for the type checker and left the mismatch
    // for runtime, where it turned into a 500 nobody saw, because generating
    // the XML was only ever a precondition for a submission that was faked and
    // never read it.
    //
    // Coerce once, here, at the boundary where the row becomes InvoiceData —
    // rather than defending inside every field of the template.
    const xml = generateUBLXML(toInvoiceData(invoice, lines));

    await db
      .updateTable('zv_efactura_invoices')
      .set({ xml_content: xml, status: 'xml_generated', updated_at: new Date() })
      .where('id', '=', invoice.id)
      .execute();

    await logStatusChange(db, invoice.id, invoice.status, 'xml_generated', user.id);

    return c.json({ xml, message: 'UBL XML generated successfully' });
  });

  // GET /:id/xml — download XML
  app.get('/:id/xml', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const invoice = await db
      .selectFrom('zv_efactura_invoices')
      .select(['xml_content', 'invoice_number'])
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!invoice?.xml_content) return c.json({ error: 'XML not generated yet' }, 404);

    const safeInvoiceNumber = String(invoice.invoice_number).replace(/[^a-zA-Z0-9\-_.]/g, '_');
    return new Response(invoice.xml_content, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="factura_${safeInvoiceNumber}.xml"`,
      },
    });
  });

  // POST /:id/submit — submit to ANAF
  app.post('/:id/submit', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const invoice = await db
      .selectFrom('zv_efactura_invoices')
      .selectAll()
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!invoice) return c.json({ error: 'Invoice not found' }, 404);
    if (!invoice.xml_content) return c.json({ error: 'Generate XML first' }, 400);

    return notSubmitted(c);
  });

  // POST /:id/storno — create storno/credit note
  app.post(
    '/:id/storno',
    zValidator('json', z.object({ reason: z.string().min(1) })),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const original = await db.selectFrom('zv_efactura_invoices').selectAll().where('id', '=', c.req.param('id')).executeTakeFirst();
      if (!original) return c.json({ error: 'Invoice not found' }, 404);
      if (!['submitted', 'accepted'].includes(original.status)) return c.json({ error: 'Only submitted/accepted invoices can be storned' }, 400);

      const { reason } = c.req.valid('json');

      // Create storno invoice (negative values)
      const stornoLines = (typeof original.lines === 'string' ? JSON.parse(original.lines) : original.lines)
        .map((l: any) => ({ ...l, quantity: -l.quantity, vat_amount: -l.vat_amount, line_total: -l.line_total }));

      const storno = await db.insertInto('zv_efactura_invoices').values({
        invoice_number: `STORNO-${original.invoice_number}`,
        invoice_date: new Date().toISOString().split('T')[0],
        seller_name: original.seller_name,
        seller_cui: original.seller_cui,
        buyer_name: original.buyer_name,
        buyer_cui: original.buyer_cui,
        lines: JSON.stringify(stornoLines),
        subtotal: -original.subtotal,
        vat_total: -original.vat_total,
        total: -original.total,
        currency: original.currency,
        created_by: user.id,
      }).returningAll().executeTakeFirst();

      await sql`
        INSERT INTO zv_efactura_storno (original_id, storno_invoice_id, reason, requested_by)
        VALUES (${original.id}::uuid, ${storno.id}::uuid, ${reason}, ${user.id})
      `.execute(db);

      return c.json({ storno_invoice: storno }, 201);
    },
  );

  // POST /batch-submit
  app.post(
    '/batch-submit',
    zValidator('json', z.object({ ids: z.array(z.string().uuid()).min(1).max(20) })),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const { ids } = c.req.valid('json');
      const results: { id: string; success: boolean; error?: string }[] = [];

      for (const id of ids) {
        const inv = await db.selectFrom('zv_efactura_invoices').select(['id', 'status', 'xml_content', 'seller_cui', 'total', 'vat_total']).where('id', '=', id).executeTakeFirst().catch(() => null);
        if (!inv) { results.push({ id, success: false, error: 'Not found' }); continue; }
        if (!inv.xml_content) { results.push({ id, success: false, error: 'XML not generated' }); continue; }

        // Same refusal as the single-invoice route, per id, so the caller sees
        // exactly which ones would have gone and why none of them did.
        results.push({ id, success: false, error: NOT_SUBMITTED_DETAIL });
      }

      return c.json({ results, submitted: 0 }, 501);
    },
  );

  // GET /stats
  return app;
}
