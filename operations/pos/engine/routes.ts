import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { permissionGate } from '@zveltio/sdk/extension';

const POINTS_PER_CURRENCY_UNIT = 1; // 1 RON = 1 point
const POINT_VALUE = 0.01; // 1 point = 0.01 RON

export function posRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;

  // Per-request DB handle (CRM PR #1 pattern). After
  // migration 002_tenant_rls.sql, this extension's tables have FORCE
  // RLS keyed on `zveltio.current_tenant`; routes must run through
  // this handle so the GUC is active inside the transaction.
  function reqDb(c: any): any {
    return c.get('tenantTrx') ?? db;
  }

  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  app.use('*', permissionGate(ctx, 'pos'));

  // ── Customers & Loyalty ───────────────────────────────────────
  app.get('/customers', async (c) => {
    const { q } = c.req.query();
    const rows = await sql`
      SELECT * FROM zvd_pos_customers
      WHERE (${q ? sql`name ILIKE ${'%' + q + '%'} OR phone ILIKE ${'%' + q + '%'} OR email ILIKE ${'%' + q + '%'}` : sql`TRUE`})
      ORDER BY name LIMIT 50
    `.execute(reqDb(c));
    return c.json({ data: rows.rows });
  });

  app.post('/customers', zValidator('json', z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    notes: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');

    // If CRM is active, look up an existing canonical contact by email.
    // If none exists, create one. Then link it on the POS customer.
    let canonicalContactId: string | null = null;
    if (d.email) {
      const lookup = ctx.services.get<(idOrEmail: string) => Promise<any | null>>('crm.contacts.findByEmail');
      const create = ctx.services.get<(input: any) => Promise<any>>('crm.contacts.create');
      if (lookup && create) {
        try {
          let contact = await lookup(d.email);
          if (!contact) {
            const [first_name, ...rest] = (d.name || '').split(' ');
            contact = await create({
              first_name: first_name || d.name,
              last_name: rest.join(' ') || null,
              email: d.email,
              phone: d.phone,
              created_by: 'system',
            });
          }
          canonicalContactId = contact?.id ?? null;
        } catch {
          // CRM call failed — POS still functional, just unlinked
        }
      }
    }

    const row = await sql`
      INSERT INTO zvd_pos_customers (name, email, phone, notes, canonical_contact_id)
      VALUES (${d.name}, ${d.email ?? null}, ${d.phone ?? null}, ${d.notes ?? null}, ${canonicalContactId})
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        canonical_contact_id = COALESCE(zvd_pos_customers.canonical_contact_id, EXCLUDED.canonical_contact_id)
      RETURNING *
    `.execute(reqDb(c));
    return c.json({ data: row.rows[0] }, 201);
  });

  app.get('/customers/:id', async (c) => {
    const row = await sql`SELECT * FROM zvd_pos_customers WHERE id = ${c.req.param('id')}`.execute(reqDb(c));
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    const orders = await sql`SELECT id, created_at, total, status, loyalty_points_earned FROM zvd_pos_orders WHERE customer_id = ${c.req.param('id')} ORDER BY created_at DESC LIMIT 10`.execute(reqDb(c));
    return c.json({ data: { ...(row.rows[0] as any), recent_orders: orders.rows } });
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
    `.execute(reqDb(c));
    return c.json({ data: rows.rows });
  });

  app.post('/sessions/open', zValidator('json', z.object({
    warehouse_id: z.string().uuid().optional(),
    opening_float: z.number().min(0).default(0),
    notes: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const existing = await sql`SELECT id FROM zvd_pos_sessions WHERE cashier_id = ${user.id} AND status = 'open'`.execute(reqDb(c));
    if (existing.rows.length) return c.json({ error: 'You already have an open session' }, 400);
    const row = await sql`
      INSERT INTO zvd_pos_sessions (cashier_id, warehouse_id, opening_float, notes)
      VALUES (${user.id}, ${d.warehouse_id ?? null}, ${d.opening_float}, ${d.notes ?? null}) RETURNING *
    `.execute(reqDb(c));
    return c.json({ data: row.rows[0] }, 201);
  });

  app.post('/sessions/:id/close', zValidator('json', z.object({
    closing_float: z.number().min(0),
    notes: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const totals = await sql`
      SELECT
        COALESCE(SUM(total) FILTER (WHERE status = 'completed'), 0) as total_sales,
        COALESCE(SUM(total) FILTER (WHERE status = 'completed' AND payment_method = 'cash'), 0) as cash_sales,
        COALESCE(SUM(total) FILTER (WHERE status = 'completed' AND payment_method = 'card'), 0) as card_sales,
        COALESCE(SUM(total) FILTER (WHERE status = 'refunded'), 0) as refunds,
        COUNT(*) FILTER (WHERE status = 'completed') as order_count,
        COALESCE(SUM(tax_amount) FILTER (WHERE status = 'completed'), 0) as tax_amount
      FROM zvd_pos_orders WHERE session_id = ${c.req.param('id')}
    `.execute(reqDb(c));
    const t = totals.rows[0] as any;
    const row = await sql`
      UPDATE zvd_pos_sessions SET status = 'closed', closed_at = NOW(),
        closing_float = ${d.closing_float}, expected_float = opening_float + ${t.cash_sales},
        notes = COALESCE(${d.notes ?? null}, notes)
      WHERE id = ${c.req.param('id')} AND status = 'open' RETURNING *
    `.execute(reqDb(c));
    if (!row.rows.length) return c.json({ error: 'Session not found or not open' }, 400);
    // Generate Z-report
    await sql`
      INSERT INTO zvd_pos_z_reports (session_id, total_sales, total_refunds, net_sales, cash_sales, card_sales, order_count, tax_amount)
      VALUES (${c.req.param('id')}, ${t.total_sales}, ${t.refunds}, ${+t.total_sales - +t.refunds}, ${t.cash_sales}, ${t.card_sales}, ${t.order_count}, ${t.tax_amount})
      ON CONFLICT (session_id) DO UPDATE SET total_sales = EXCLUDED.total_sales, net_sales = EXCLUDED.net_sales
    `.execute(reqDb(c));
    return c.json({ data: row.rows[0] });
  });

  // ── Cash movements ────────────────────────────────────────────
  app.post('/sessions/:id/cash-movement', zValidator('json', z.object({
    type: z.enum(['float_in','float_out','drop','payout']),
    amount: z.number().positive(),
    reason: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_pos_cash_movements (session_id, type, amount, reason, cashier_id)
      VALUES (${c.req.param('id')}, ${d.type}, ${d.amount}, ${d.reason ?? null}, ${user.id}) RETURNING *
    `.execute(reqDb(c));
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Held Orders ───────────────────────────────────────────────
  app.get('/sessions/:id/held', async (c) => {
    const rows = await sql`SELECT * FROM zvd_pos_held_orders WHERE session_id = ${c.req.param('id')} ORDER BY created_at`.execute(reqDb(c));
    return c.json({ data: rows.rows });
  });

  app.post('/sessions/:id/hold', zValidator('json', z.object({
    lines: z.array(z.any()).min(1),
    customer_id: z.string().uuid().optional(),
    label: z.string().optional(),
    notes: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_pos_held_orders (session_id, cashier_id, lines, customer_id, label, notes)
      VALUES (${c.req.param('id')}, ${user.id}, ${JSON.stringify(d.lines)}, ${d.customer_id ?? null}, ${d.label ?? null}, ${d.notes ?? null})
      RETURNING *
    `.execute(reqDb(c));
    return c.json({ data: row.rows[0] }, 201);
  });

  app.delete('/held/:id', async (c) => {
    await sql`DELETE FROM zvd_pos_held_orders WHERE id = ${c.req.param('id')}`.execute(reqDb(c));
    return c.json({ success: true });
  });

  // ── Orders ────────────────────────────────────────────────────
  app.get('/sessions/:id/orders', async (c) => {
    const rows = await sql`
      SELECT o.*,
        COALESCE(json_agg(json_build_object('id', l.id, 'product_id', l.product_id, 'product_name', l.product_name,
          'quantity', l.quantity, 'unit_price', l.unit_price, 'discount', l.discount, 'total', l.total) ORDER BY l.id) FILTER (WHERE l.id IS NOT NULL), '[]') as lines
      FROM zvd_pos_orders o LEFT JOIN zvd_pos_order_lines l ON l.order_id = o.id
      WHERE o.session_id = ${c.req.param('id')} GROUP BY o.id ORDER BY o.created_at DESC
    `.execute(reqDb(c));
    return c.json({ data: rows.rows });
  });

  app.post('/orders', zValidator('json', z.object({
    session_id: z.string().uuid(),
    payment_method: z.enum(['cash','card','transfer','other']).default('cash'),
    customer_id: z.string().uuid().optional(),
    notes: z.string().optional(),
    redeem_points: z.number().int().min(0).default(0),
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
    const session = await sql`SELECT id FROM zvd_pos_sessions WHERE id = ${d.session_id} AND status = 'open'`.execute(reqDb(c));
    if (!session.rows.length) return c.json({ error: 'Session not found or not open' }, 400);
    const subtotal = d.lines.reduce((s, l) => s + l.quantity * l.unit_price * (1 - l.discount / 100), 0);
    const tax_amount = d.lines.reduce((s, l) => s + l.quantity * l.unit_price * (1 - l.discount / 100) * l.tax_rate / 100, 0);
    // Loyalty redemption
    let loyalty_discount = 0;
    let redeemedPoints = 0;
    if (d.customer_id && d.redeem_points > 0) {
      const cust = await sql`SELECT loyalty_points FROM zvd_pos_customers WHERE id = ${d.customer_id}`.execute(reqDb(c));
      if (cust.rows.length) {
        redeemedPoints = Math.min(d.redeem_points, (cust.rows[0] as any).loyalty_points);
        loyalty_discount = redeemedPoints * POINT_VALUE;
      }
    }
    const total = Math.max(0, subtotal + tax_amount - loyalty_discount);
    const earnedPoints = Math.floor(total * POINTS_PER_CURRENCY_UNIT);

    // Resolve canonical contact id from the POS customer (if linked).
    let canonicalContactId: string | null = null;
    let customerName: string | null = null;
    if (d.customer_id) {
      const c2 = await sql<any>`SELECT name, canonical_contact_id FROM zvd_pos_customers WHERE id = ${d.customer_id}`.execute(reqDb(c));
      canonicalContactId = c2.rows[0]?.canonical_contact_id ?? null;
      customerName = c2.rows[0]?.name ?? null;
    }

    const order = await sql`
      INSERT INTO zvd_pos_orders (session_id, cashier_id, payment_method, customer_id, customer_name, canonical_contact_id, subtotal, tax_amount, total, loyalty_discount, loyalty_points_earned, loyalty_points_redeemed, notes, status)
      VALUES (${d.session_id}, ${user.id}, ${d.payment_method}, ${d.customer_id ?? null}, ${customerName}, ${canonicalContactId}, ${subtotal}, ${tax_amount}, ${total}, ${loyalty_discount}, ${earnedPoints}, ${redeemedPoints}, ${d.notes ?? null}, 'completed')
      RETURNING *
    `.execute(reqDb(c));
    const orderId = (order.rows[0] as any).id;

    // Drive stock movements via the inventory service when active. This keeps the
    // canonical inventory in sync with POS sales without POS owning warehouses.
    const inventoryMove = ctx.services.get<(input: any) => Promise<{ balance: number }>>('inventory.stock.move');
    const lookupProduct = ctx.services.get<(idOrSku: string) => Promise<any | null>>('inventory.products.lookup');

    for (const line of d.lines) {
      const lineTotal = line.quantity * line.unit_price * (1 - line.discount / 100) * (1 + line.tax_rate / 100);
      await sql`INSERT INTO zvd_pos_order_lines (order_id, product_id, product_name, quantity, unit_price, tax_rate, discount, total) VALUES (${orderId}, ${line.product_id ?? null}, ${line.product_name}, ${line.quantity}, ${line.unit_price}, ${line.tax_rate}, ${line.discount}, ${lineTotal})`.execute(reqDb(c));

      // Decrement stock if inventory is connected and the line has a product id.
      if (line.product_id && inventoryMove && lookupProduct) {
        try {
          // Find the default warehouse for the session, if any. Falls back to first warehouse.
          const wh = await sql<any>`SELECT warehouse_id FROM zvd_pos_sessions WHERE id = ${d.session_id}`.execute(reqDb(c));
          const warehouseId = wh.rows[0]?.warehouse_id;
          if (warehouseId) {
            await inventoryMove({
              productId: line.product_id,
              warehouseId,
              qty: line.quantity,
              type: 'out',
              reference: `pos:order:${orderId}`,
              reason: `POS sale ${line.product_name}`,
            }).catch(() => {});
          }
        } catch { /* non-fatal */ }
      }
    }

    if (d.customer_id) {
      const pointDelta = earnedPoints - redeemedPoints;
      await sql`UPDATE zvd_pos_customers SET loyalty_points = loyalty_points + ${pointDelta}, total_spent = total_spent + ${total}, visit_count = visit_count + 1, updated_at = NOW() WHERE id = ${d.customer_id}`.execute(reqDb(c));
      await sql`INSERT INTO zvd_pos_loyalty_log (customer_id, order_id, delta, reason) VALUES (${d.customer_id}, ${orderId}, ${pointDelta}, 'order')`.execute(reqDb(c));
    }
    return c.json({ data: order.rows[0] }, 201);
  });

  app.post('/orders/:id/refund', async (c) => {
    const order = await sql`SELECT * FROM zvd_pos_orders WHERE id = ${c.req.param('id')} AND status = 'completed'`.execute(reqDb(c));
    if (!order.rows.length) return c.json({ error: 'Order not found or not completed' }, 400);
    const o = order.rows[0] as any;
    await sql`UPDATE zvd_pos_orders SET status = 'refunded', updated_at = NOW() WHERE id = ${o.id}`.execute(reqDb(c));
    // Reverse loyalty
    if (o.customer_id && o.loyalty_points_earned > 0) {
      const delta = -o.loyalty_points_earned + o.loyalty_points_redeemed;
      await sql`UPDATE zvd_pos_customers SET loyalty_points = loyalty_points + ${delta}, total_spent = total_spent - ${o.total}, updated_at = NOW() WHERE id = ${o.customer_id}`.execute(reqDb(c));
      await sql`INSERT INTO zvd_pos_loyalty_log (customer_id, order_id, delta, reason) VALUES (${o.customer_id}, ${o.id}, ${delta}, 'refund')`.execute(reqDb(c));
    }
    return c.json({ data: { refunded: true } });
  });

  // ── Z-Reports ─────────────────────────────────────────────────
  app.get('/sessions/:id/z-report', async (c) => {
    const row = await sql`SELECT * FROM zvd_pos_z_reports WHERE session_id = ${c.req.param('id')}`.execute(reqDb(c));
    if (!row.rows.length) {
      // Generate on-the-fly
      const totals = await sql`
        SELECT COALESCE(SUM(total) FILTER (WHERE status='completed'), 0) as total_sales,
          COALESCE(SUM(total) FILTER (WHERE status='refunded'), 0) as refunds,
          COALESCE(SUM(total) FILTER (WHERE status='completed' AND payment_method='cash'), 0) as cash_sales,
          COALESCE(SUM(total) FILTER (WHERE status='completed' AND payment_method='card'), 0) as card_sales,
          COUNT(*) FILTER (WHERE status='completed') as order_count,
          COALESCE(SUM(tax_amount) FILTER (WHERE status='completed'), 0) as tax_amount
        FROM zvd_pos_orders WHERE session_id = ${c.req.param('id')}
      `.execute(reqDb(c));
      return c.json({ data: totals.rows[0] });
    }
    return c.json({ data: row.rows[0] });
  });

  // ── Stats ─────────────────────────────────────────────────────
  app.get('/stats', async (c) => {
    const { from, to } = c.req.query();
    const fromDate = from ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const toDate = to ?? new Date().toISOString().slice(0, 10);
    const row = await sql`
      SELECT COUNT(*) as total_orders, COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(AVG(total), 0) as avg_order_value,
        COUNT(*) FILTER (WHERE payment_method = 'cash') as cash_orders,
        COUNT(*) FILTER (WHERE payment_method = 'card') as card_orders,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM zvd_pos_orders WHERE status = 'completed' AND created_at::date BETWEEN ${fromDate} AND ${toDate}
    `.execute(reqDb(c));
    return c.json({ data: row.rows[0] });
  });

  return app;
}
