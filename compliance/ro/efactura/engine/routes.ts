import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import { generateUBLXML } from './ubl-generator.js';
import type { ExtensionContext } from '@zveltio/sdk/extension';

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

async function getUser(c: any, auth: any) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return session?.user ?? null;
}

async function logStatusChange(db: any, invoiceId: string, oldStatus: string, newStatus: string, userId: string, note?: string) {
  await sql`
    INSERT INTO zv_efactura_status_log (invoice_id, old_status, new_status, changed_by, note)
    VALUES (${invoiceId}::uuid, ${oldStatus}, ${newStatus}, ${userId}, ${note ?? null})
  `.execute(db).catch(() => {});
}

export function efacturaRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;
  const app = new Hono();

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
    const xml = generateUBLXML({ ...invoice, lines });

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

    // Stub: in production, call ANAF upload endpoint with OAuth token
    const mockResponse = {
      dateResponse: new Date().toISOString(),
      ExecutionStatus: '0',
      index_incarcare: `RO${Date.now()}`,
    };

    await db
      .updateTable('zv_efactura_invoices')
      .set({
        status: 'submitted',
        anaf_index: mockResponse.index_incarcare,
        anaf_response: JSON.stringify(mockResponse),
        updated_at: new Date(),
      })
      .where('id', '=', invoice.id)
      .execute();

    await logStatusChange(db, invoice.id, invoice.status, 'submitted', user.id, `ANAF index: ${mockResponse.index_incarcare}`);

    // Update daily stats
    await sql`
      INSERT INTO zv_efactura_daily_stats (date, seller_cui, submitted_count, total_amount, vat_amount)
      VALUES (CURRENT_DATE, ${invoice.seller_cui}, 1, ${invoice.total}, ${invoice.vat_total})
      ON CONFLICT (date, seller_cui)
      DO UPDATE SET submitted_count = zv_efactura_daily_stats.submitted_count + 1,
                    total_amount = zv_efactura_daily_stats.total_amount + EXCLUDED.total_amount,
                    vat_amount = zv_efactura_daily_stats.vat_amount + EXCLUDED.vat_amount
    `.execute(db).catch(() => {});

    return c.json({ message: 'Submitted to ANAF', anaf_index: mockResponse.index_incarcare, response: mockResponse });
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

        const anafIndex = `RO${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        await db.updateTable('zv_efactura_invoices').set({ status: 'submitted', anaf_index: anafIndex, updated_at: new Date() }).where('id', '=', id).execute();
        await logStatusChange(db, id, inv.status, 'submitted', user.id);
        results.push({ id, success: true });
      }

      return c.json({ results, submitted: results.filter(r => r.success).length });
    },
  );

  // GET /stats
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

  return app;
}
