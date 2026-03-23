import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';

export function posRoutes(db: any, auth: any): Hono {
  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  // ── Sessions ──────────────────────────────────────────────────
  app.get('/sessions', async (c) => {
    const { limit = '20', page = '1', status } = c.req.query();
    const lim = Math.min(+limit, 100);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT s.*, COUNT(o.id) as order_count, COALESCE(SUM(o.total), 0) as total_sales
      FROM zvd_pos_sessions s
      LEFT JOIN zvd_pos_orders o ON o.session_id = s.id AND o.status = 'completed'
      WHERE (${status ? sql`s.status = ${status}` : sql`TRUE`})
      GROUP BY s.id ORDER BY s.opened_at DESC LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/sessions/open', zValidator('json', z.object({
    warehouse_id: z.string().uuid().optional(),
    opening_float: z.number().min(0).default(0),
    notes: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const existing = await sql`SELECT id FROM zvd_pos_sessions WHERE cashier_id = ${user.id} AND status = 'open'`.execute(db);
    if (existing.rows.length) return c.json({ error: 'You already have an open session' }, 400);
    const row = await sql`
      INSERT INTO zvd_pos_sessions (cashier_id, warehouse_id, opening_float, notes)
      VALUES (${user.id}, ${d.warehouse_id ?? null}, ${d.opening_float}, ${d.notes ?? null})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.post('/sessions/:id/close', zValidator('json', z.object({
    closing_float: z.number().min(0),
    notes: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const totals = await sql`
      SELECT COALESCE(SUM(total), 0) as cash_sales FROM zvd_pos_orders
      WHERE session_id = ${c.req.param('id')} AND status = 'completed' AND payment_method = 'cash'
    `.execute(db);
    const row = await sql`
      UPDATE zvd_pos_sessions SET status = 'closed', closed_at = NOW(),
        closing_float = ${d.closing_float}, expected_float = opening_float + ${(totals.rows[0] as any).cash_sales},
        notes = COALESCE(${d.notes ?? null}, notes)
      WHERE id = ${c.req.param('id')} AND status = 'open' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Session not found or not open' }, 400);
    return c.json({ data: row.rows[0] });
  });

  // ── Orders ────────────────────────────────────────────────────
  app.get('/sessions/:id/orders', async (c) => {
    const rows = await sql`
      SELECT o.*,
        COALESCE(json_agg(json_build_object(
          'id', l.id, 'product_id', l.product_id, 'product_name', l.product_name,
          'quantity', l.quantity, 'unit_price', l.unit_price, 'discount', l.discount, 'total', l.total
        ) ORDER BY l.id) FILTER (WHERE l.id IS NOT NULL), '[]') as lines
      FROM zvd_pos_orders o
      LEFT JOIN zvd_pos_order_lines l ON l.order_id = o.id
      WHERE o.session_id = ${c.req.param('id')}
      GROUP BY o.id ORDER BY o.created_at DESC
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/orders', zValidator('json', z.object({
    session_id: z.string().uuid(),
    payment_method: z.enum(['cash','card','transfer','other']).default('cash'),
    customer_name: z.string().optional(),
    notes: z.string().optional(),
    lines: z.array(z.object({
      product_id: z.string().uuid().optional(),
      product_name: z.string().min(1),
      quantity: z.number().positive(),
      unit_price: z.number().min(0),
      tax_rate: z.number().default(19),
      discount: z.number().min(0).max(100).default(0),
    })).min(1),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const session = await sql`SELECT id FROM zvd_pos_sessions WHERE id = ${d.session_id} AND status = 'open'`.execute(db);
    if (!session.rows.length) return c.json({ error: 'Session not found or not open' }, 400);
    const subtotal = d.lines.reduce((s, l) => s + l.quantity * l.unit_price * (1 - l.discount / 100), 0);
    const tax_amount = d.lines.reduce((s, l) => s + l.quantity * l.unit_price * (1 - l.discount / 100) * l.tax_rate / 100, 0);
    const total = subtotal + tax_amount;
    const order = await sql`
      INSERT INTO zvd_pos_orders (session_id, cashier_id, payment_method, customer_name, subtotal, tax_amount, total, notes, status)
      VALUES (${d.session_id}, ${user.id}, ${d.payment_method}, ${d.customer_name ?? null},
        ${subtotal}, ${tax_amount}, ${total}, ${d.notes ?? null}, 'completed')
      RETURNING *
    `.execute(db);
    const orderId = (order.rows[0] as any).id;
    for (const line of d.lines) {
      const lineTotal = line.quantity * line.unit_price * (1 - line.discount / 100) * (1 + line.tax_rate / 100);
      await sql`
        INSERT INTO zvd_pos_order_lines (order_id, product_id, product_name, quantity, unit_price, tax_rate, discount, total)
        VALUES (${orderId}, ${line.product_id ?? null}, ${line.product_name}, ${line.quantity},
          ${line.unit_price}, ${line.tax_rate}, ${line.discount}, ${lineTotal})
      `.execute(db);
    }
    return c.json({ data: order.rows[0] }, 201);
  });

  app.post('/orders/:id/refund', async (c) => {
    const row = await sql`
      UPDATE zvd_pos_orders SET status = 'refunded', updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status = 'completed' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Order not found or not completed' }, 400);
    return c.json({ data: row.rows[0] });
  });

  // ── Stats ─────────────────────────────────────────────────────
  app.get('/stats', async (c) => {
    const { from, to } = c.req.query();
    const fromDate = from ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const toDate = to ?? new Date().toISOString().slice(0, 10);
    const row = await sql`
      SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(AVG(total), 0) as avg_order_value,
        COUNT(*) FILTER (WHERE payment_method = 'cash') as cash_orders,
        COUNT(*) FILTER (WHERE payment_method = 'card') as card_orders
      FROM zvd_pos_orders
      WHERE status = 'completed' AND created_at::date BETWEEN ${fromDate} AND ${toDate}
    `.execute(db);
    return c.json({ data: row.rows[0] });
  });

  return app;
}
