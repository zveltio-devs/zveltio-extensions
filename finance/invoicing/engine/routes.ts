import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';

let invoiceCounter = 0;
async function nextInvoiceNumber(db: any): Promise<string> {
  const row = await sql`SELECT COUNT(*) as cnt FROM zvd_invoices`.execute(db);
  const n = parseInt((row.rows[0] as any).cnt) + 1 + invoiceCounter++;
  return `INV-${String(n).padStart(5, '0')}`;
}

export function invoicingRoutes(db: any, auth: any): Hono {
  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  app.get('/invoices', async (c) => {
    const { limit = '50', page = '1', status, client_id } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT i.*,
        COALESCE(json_agg(json_build_object(
          'id', l.id, 'description', l.description, 'quantity', l.quantity,
          'unit_price', l.unit_price, 'tax_rate', l.tax_rate, 'total', l.total
        ) ORDER BY l.sort_order) FILTER (WHERE l.id IS NOT NULL), '[]') as lines
      FROM zvd_invoices i
      LEFT JOIN zvd_invoice_lines l ON l.invoice_id = i.id
      WHERE (${status ? sql`i.status = ${status}` : sql`TRUE`})
        AND (${client_id ? sql`i.client_id = ${client_id}` : sql`TRUE`})
      GROUP BY i.id
      ORDER BY i.created_at DESC
      LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    const total = await sql`SELECT COUNT(*) as cnt FROM zvd_invoices
      WHERE (${status ? sql`status = ${status}` : sql`TRUE`})`.execute(db);
    return c.json({ data: rows.rows, meta: { total: +(total.rows[0] as any).cnt } });
  });

  app.get('/invoices/overdue', async (c) => {
    const rows = await sql`
      UPDATE zvd_invoices SET status = 'overdue' WHERE due_date < CURRENT_DATE AND status = 'sent';
      SELECT * FROM zvd_invoices WHERE status = 'overdue' ORDER BY due_date ASC
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/invoices/stats', async (c) => {
    const row = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status NOT IN ('cancelled')) as total,
        COALESCE(SUM(total) FILTER (WHERE status = 'paid'), 0) as revenue,
        COALESCE(SUM(total) FILTER (WHERE status IN ('sent','overdue')), 0) as outstanding,
        COUNT(*) FILTER (WHERE status = 'overdue') as overdue_count
      FROM zvd_invoices
    `.execute(db);
    return c.json({ data: row.rows[0] });
  });

  app.get('/invoices/:id', async (c) => {
    const row = await sql`
      SELECT i.*,
        COALESCE(json_agg(json_build_object(
          'id', l.id, 'description', l.description, 'quantity', l.quantity,
          'unit_price', l.unit_price, 'tax_rate', l.tax_rate, 'total', l.total,
          'sort_order', l.sort_order
        ) ORDER BY l.sort_order) FILTER (WHERE l.id IS NOT NULL), '[]') as lines
      FROM zvd_invoices i
      LEFT JOIN zvd_invoice_lines l ON l.invoice_id = i.id
      WHERE i.id = ${c.req.param('id')}
      GROUP BY i.id
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.post('/invoices', zValidator('json', z.object({
    client_id: z.string().optional(),
    client_type: z.enum(['contact','organization']).optional(),
    client_name: z.string().min(1),
    client_email: z.string().email().optional(),
    client_address: z.string().optional(),
    issue_date: z.string().optional(),
    due_date: z.string(),
    currency: z.string().default('RON'),
    tax_rate: z.number().default(19),
    notes: z.string().optional(),
    recurring_interval: z.enum(['monthly','quarterly','yearly']).optional(),
    lines: z.array(z.object({
      description: z.string().min(1),
      quantity: z.number().default(1),
      unit_price: z.number().default(0),
      tax_rate: z.number().default(19),
      sort_order: z.number().default(0),
    })).min(1),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const number = await nextInvoiceNumber(db);
    const subtotal = d.lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
    const tax_amount = d.lines.reduce((s, l) => s + l.quantity * l.unit_price * l.tax_rate / 100, 0);
    const total = subtotal + tax_amount;
    const inv = await sql`
      INSERT INTO zvd_invoices (number, client_id, client_type, client_name, client_email, client_address,
        issue_date, due_date, currency, subtotal, tax_rate, tax_amount, total, notes, recurring_interval, created_by)
      VALUES (${number}, ${d.client_id ?? null}, ${d.client_type ?? null}, ${d.client_name},
        ${d.client_email ?? null}, ${d.client_address ?? null},
        ${d.issue_date ?? new Date().toISOString().slice(0,10)}, ${d.due_date},
        ${d.currency}, ${subtotal}, ${d.tax_rate}, ${tax_amount}, ${total},
        ${d.notes ?? null}, ${d.recurring_interval ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    const invId = (inv.rows[0] as any).id;
    for (const line of d.lines) {
      const lineTotal = line.quantity * line.unit_price * (1 + line.tax_rate / 100);
      await sql`INSERT INTO zvd_invoice_lines (invoice_id, description, quantity, unit_price, tax_rate, total, sort_order)
        VALUES (${invId}, ${line.description}, ${line.quantity}, ${line.unit_price}, ${line.tax_rate}, ${lineTotal}, ${line.sort_order})
      `.execute(db);
    }
    return c.json({ data: inv.rows[0] }, 201);
  });

  app.post('/invoices/:id/send', async (c) => {
    const row = await sql`
      UPDATE zvd_invoices SET status = 'sent', updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status = 'draft' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Invoice not found or not in draft' }, 400);
    return c.json({ data: row.rows[0] });
  });

  app.post('/invoices/:id/pay', async (c) => {
    const row = await sql`
      UPDATE zvd_invoices SET status = 'paid', paid_at = NOW(), updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status IN ('sent','overdue') RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Invoice not found or not payable' }, 400);
    return c.json({ data: row.rows[0] });
  });

  app.post('/invoices/:id/cancel', async (c) => {
    const row = await sql`
      UPDATE zvd_invoices SET status = 'cancelled', updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status NOT IN ('paid','cancelled') RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Cannot cancel this invoice' }, 400);
    return c.json({ data: row.rows[0] });
  });

  app.delete('/invoices/:id', async (c) => {
    const existing = await sql`SELECT status FROM zvd_invoices WHERE id = ${c.req.param('id')}`.execute(db);
    if (!existing.rows.length) return c.json({ error: 'Not found' }, 404);
    if ((existing.rows[0] as any).status === 'paid') return c.json({ error: 'Cannot delete a paid invoice' }, 400);
    await sql`DELETE FROM zvd_invoices WHERE id = ${c.req.param('id')}`.execute(db);
    return c.json({ success: true });
  });

  return app;
}
