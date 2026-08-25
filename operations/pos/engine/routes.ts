import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { permissionGate } from '@zveltio/sdk/extension';

const POINTS_PER_CURRENCY_UNIT = 1; // 1 RON = 1 point
const POINT_VALUE = 0.01; // 1 point = 0.01 RON

/**
 * May this user refund a completed order?
 *
 * The oldest till fraud there is: ring up a sale, refund it, keep the cash. The
 * route ran behind one `pos` permission — the same permission a cashier needs to
 * sell anything — and asked nothing else. A refund is money leaving the drawer,
 * and it is the one till operation that should need a second person.
 *
 * `pos:refund`, granted deliberately, with `admin` still sufficient so an
 * existing install keeps working before anyone edits policies. A shop that wants
 * every cashier to refund can grant it to the cashier role in one step — the
 * point is that it becomes a decision somebody made.
 */
async function mayRefund(ctx: ExtensionContext, user: any): Promise<boolean> {
  if (await ctx.checkPermission(user.id, 'pos', 'refund').catch(() => false)) return true;
  return ctx.checkPermission(user.id, 'admin', '*').catch(() => false);
}

/**
 * Claim the next receipt number for the current tenant.
 *
 * `UPDATE … RETURNING` in one statement: two concurrent checkouts cannot read
 * the same counter, because the second blocks on the row lock and reads the
 * value the first already moved past.
 *
 * The seeding INSERT creates the tenant's row on its first sale. `tenant_id`
 * comes from the column DEFAULT, which reads the transaction GUC — the same
 * source RLS checks against — so a row can only appear for the tenant making
 * the request.
 */
// biome-ignore lint/suspicious/noExplicitAny: extension db handle is Kysely-shaped
async function claimOrderNumber(dbh: any): Promise<string> {
  await sql`
    INSERT INTO zvd_pos_order_counters DEFAULT VALUES
    ON CONFLICT (tenant_id) DO NOTHING
  `.execute(dbh);

  const row = await sql<{ next_number: string; prefix: string; padding: number }>`
    UPDATE zvd_pos_order_counters
       SET next_number = next_number + 1, updated_at = NOW()
     RETURNING prefix, next_number - 1 AS next_number, padding
  `.execute(dbh);

  const r = row.rows[0];
  if (!r) {
    // RLS filtered every row, meaning this transaction has no tenant context.
    // Inventing a number here would write a receipt nobody can account for, so
    // the sale fails instead.
    throw new Error('Cannot allocate a POS order number: no tenant context.');
  }
  return `${r.prefix}-${String(r.next_number).padStart(r.padding, '0')}`;
}

export function posRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;

  // `db` is `ctx.db`: a proxy the engine hands over that resolves the CURRENT
  // tenant transaction per query via AsyncLocalStorage (H-12). A plain `db` in
  // a handler is therefore already RLS-scoped — there is one spelling, so there
  // is none to forget.

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
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/customers', zValidator('json', z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    notes: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const user = c.get('user') as any;

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
              // The cashier who served this customer, not the literal string
              // 'system'. `zvd_contacts.created_by` is a TEXT column that
              // REFERENCES "user"(id) whenever the table was created through the
              // engine's DDL manager, so 'system' raised 23503 and took the whole
              // request to a 500. Where the table came from this extension's own
              // migration there is no foreign key, so it inserted — and wrote an
              // authorship value naming a user who does not exist, which is what
              // every "own records" RLS policy reads.
              created_by: user?.id,
            });
          }
          canonicalContactId = contact?.id ?? null;
        } catch (err) {
          // Degrading gracefully is the right intent — a POS sale must not fail
          // because CRM is unavailable — but a silent catch does not achieve it.
          // A PostgreSQL error inside a request transaction aborts that
          // transaction, and every statement after it answers 25P02 regardless of
          // what this handler does; the catch turns a missing LINK into a total
          // failure of the request, and destroys the only evidence of why. Saying
          // it out loud costs one line and is the difference between a diagnosable
          // outage and a 500 with a masking SQLSTATE.
          console.warn(
            `[pos] could not link customer ${d.email} to a CRM contact; the sale is recorded without one:`,
            err instanceof Error ? err.message : err,
          );
        }
      }
    }

    const row = await sql`
      INSERT INTO zvd_pos_customers (name, email, phone, notes, canonical_contact_id)
      VALUES (${d.name}, ${d.email ?? null}, ${d.phone ?? null}, ${d.notes ?? null}, ${canonicalContactId})
      ON CONFLICT (tenant_id, email) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        canonical_contact_id = COALESCE(zvd_pos_customers.canonical_contact_id, EXCLUDED.canonical_contact_id)
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.get('/customers/:id', async (c) => {
    const row = await sql`SELECT * FROM zvd_pos_customers WHERE id = ${c.req.param('id')}`.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    const orders = await sql`SELECT id, created_at, total, status, loyalty_points_earned FROM zvd_pos_orders WHERE customer_id = ${c.req.param('id')} ORDER BY created_at DESC LIMIT 10`.execute(db);
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
      LEFT JOIN zvd_pos_orders o ON o.session_id = s.id AND o.status = 'paid'
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
      VALUES (${user.id}, ${d.warehouse_id ?? null}, ${d.opening_float}, ${d.notes ?? null}) RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.post('/sessions/:id/close', zValidator('json', z.object({
    closing_float: z.number().min(0),
    notes: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    // Closing a till session is the cash reconciliation — it fixes what the
    // drawer is said to have held. Same grant as a refund.
    if (!(await mayRefund(ctx, user))) {
      return c.json({ error: 'You may not close a till session' }, 403);
    }
    const d = c.req.valid('json');
    const totals = await sql`
      SELECT
        COALESCE(SUM(total) FILTER (WHERE status = 'paid'), 0) as total_sales,
        COALESCE(SUM(total) FILTER (WHERE status = 'paid' AND payment_method = 'cash'), 0) as cash_sales,
        COALESCE(SUM(total) FILTER (WHERE status = 'paid' AND payment_method = 'card'), 0) as card_sales,
        COALESCE(SUM(total) FILTER (WHERE status = 'refunded'), 0) as refunds,
        COUNT(*) FILTER (WHERE status = 'paid') as order_count,
        COALESCE(SUM(tax_amount) FILTER (WHERE status = 'paid'), 0) as tax_amount
      FROM zvd_pos_orders WHERE session_id = ${c.req.param('id')}
    `.execute(db);
    const t = totals.rows[0] as any;
    // Closing the till and writing its Z-report are one end-of-day. The guard is
    // `status = 'open'`, so a session closed without its report can never be
    // closed again — the till is shut, the cash reconciliation it is supposed to
    // produce does not exist, and that report is what the day's takings are
    // signed off against.
    const row = await db.transaction().execute(async (trx) => {
      const closed = await sql`
        UPDATE zvd_pos_sessions SET status = 'closed', closed_at = NOW(),
          closing_float = ${d.closing_float}, expected_float = opening_float + ${t.cash_sales},
          notes = COALESCE(${d.notes ?? null}, notes)
        WHERE id = ${c.req.param('id')} AND status = 'open' RETURNING *
      `.execute(trx);
      if (!closed.rows.length) return null;
      // Generate Z-report
      await sql`
        INSERT INTO zvd_pos_z_reports (session_id, total_sales, total_refunds, net_sales, cash_sales, card_sales, order_count, tax_amount)
        VALUES (${c.req.param('id')}, ${t.total_sales}, ${t.refunds}, ${+t.total_sales - +t.refunds}, ${t.cash_sales}, ${t.card_sales}, ${t.order_count}, ${t.tax_amount})
        ON CONFLICT (session_id) DO UPDATE SET total_sales = EXCLUDED.total_sales, net_sales = EXCLUDED.net_sales
      `.execute(trx);
      return closed;
    });
    if (!row) return c.json({ error: 'Session not found or not open' }, 400);
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
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Held Orders ───────────────────────────────────────────────
  app.get('/sessions/:id/held', async (c) => {
    const rows = await sql`SELECT * FROM zvd_pos_held_orders WHERE session_id = ${c.req.param('id')} ORDER BY created_at`.execute(db);
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
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.delete('/held/:id', async (c) => {
    await sql`DELETE FROM zvd_pos_held_orders WHERE id = ${c.req.param('id')}`.execute(db);
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
    `.execute(db);
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
    const session = await sql`SELECT id FROM zvd_pos_sessions WHERE id = ${d.session_id} AND status = 'open'`.execute(db);
    if (!session.rows.length) return c.json({ error: 'Session not found or not open' }, 400);
    const subtotal = d.lines.reduce((s, l) => s + l.quantity * l.unit_price * (1 - l.discount / 100), 0);
    const tax_amount = d.lines.reduce((s, l) => s + l.quantity * l.unit_price * (1 - l.discount / 100) * l.tax_rate / 100, 0);
    // Loyalty redemption
    let loyalty_discount = 0;
    let redeemedPoints = 0;
    if (d.customer_id && d.redeem_points > 0) {
      const cust = await sql`SELECT loyalty_points FROM zvd_pos_customers WHERE id = ${d.customer_id}`.execute(db);
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
      const c2 = await sql<any>`SELECT name, canonical_contact_id FROM zvd_pos_customers WHERE id = ${d.customer_id}`.execute(db);
      canonicalContactId = c2.rows[0]?.canonical_contact_id ?? null;
      customerName = c2.rows[0]?.name ?? null;
    }

    // `order_number` is NOT NULL and was not supplied at all, so every sale
    // failed on the constraint — the till could not record a single transaction
    // on any install. Claimed with UPDATE … RETURNING so two tills ringing up at
    // the same moment cannot take the same number.
    // Drive stock movements via the inventory service when active. This keeps the
    // canonical inventory in sync with POS sales without POS owning warehouses.
    const inventoryMove = ctx.services.get<(input: any) => Promise<{ balance: number }>>('inventory.stock.move');
    const lookupProduct = ctx.services.get<(idOrSku: string) => Promise<any | null>>('inventory.products.lookup');

    // A sale is one thing: the order, its lines, the number it was given, and
    // the loyalty balance it moves. Any of those alone is a receipt that does
    // not add up — a total with no items under it, points added with nothing
    // saying why, an order number consumed by a sale that never happened.
    const { order, orderId, stockToMove } = await db.transaction().execute(async (trx) => {
      const orderNumber = await claimOrderNumber(trx);

      // `'paid'`, not `'completed'`. The CHECK admits ('open','paid','voided'),
      // so the value the handler used could never be written — the second of the
      // two independent failures on this one statement.
      const created = await sql`
        INSERT INTO zvd_pos_orders (session_id, order_number, created_by, payment_method, customer_id, customer_name, canonical_contact_id, subtotal, tax_amount, total, loyalty_discount, loyalty_points_earned, loyalty_points_redeemed, notes, status)
        VALUES (${d.session_id}, ${orderNumber}, ${user.id}, ${d.payment_method}, ${d.customer_id ?? null}, ${customerName}, ${canonicalContactId}, ${subtotal}, ${tax_amount}, ${total}, ${loyalty_discount}, ${earnedPoints}, ${redeemedPoints}, ${d.notes ?? null}, 'paid')
        RETURNING *
      `.execute(trx);
      const id = (created.rows[0] as any).id;

      const pending: Array<{ product_id: string; product_name: string; quantity: number }> = [];
      for (const line of d.lines) {
        const lineTotal = line.quantity * line.unit_price * (1 - line.discount / 100) * (1 + line.tax_rate / 100);
        await sql`INSERT INTO zvd_pos_order_lines (order_id, product_id, product_name, quantity, unit_price, tax_rate, discount, total) VALUES (${id}, ${line.product_id ?? null}, ${line.product_name}, ${line.quantity}, ${line.unit_price}, ${line.tax_rate}, ${line.discount}, ${lineTotal})`.execute(trx);
        if (line.product_id && inventoryMove && lookupProduct) {
          pending.push({
            product_id: line.product_id,
            product_name: line.product_name,
            quantity: line.quantity,
          });
        }
      }

      if (d.customer_id) {
        const pointDelta = earnedPoints - redeemedPoints;
        await sql`UPDATE zvd_pos_customers SET loyalty_points = loyalty_points + ${pointDelta}, total_spent = total_spent + ${total}, visit_count = visit_count + 1, updated_at = NOW() WHERE id = ${d.customer_id}`.execute(trx);
        await sql`INSERT INTO zvd_pos_loyalty_log (customer_id, order_id, delta, reason) VALUES (${d.customer_id}, ${id}, ${pointDelta}, 'order')`.execute(trx);
      }
      return { order: created, orderId: id, stockToMove: pending };
    });

    // Stock decrements happen AFTER the sale commits, and that is the point.
    //
    // `inventoryMove` is an in-process service, so it writes to this same
    // database. Called inside the sale's transaction with its failure swallowed
    // — which is how it used to run — a failed stock statement would poison the
    // transaction, and every order line and loyalty write after it would fail
    // too. The swallow protected nothing and took the sale down with it.
    //
    // Keeping the sale non-fatal on inventory problems is a deliberate decision
    // and it stands: a till must not refuse a customer because the stock module
    // is unhappy. What changes is that the failure is now recorded instead of
    // discarded, and the reference on each movement is the order id, so the
    // decrements can be replayed from the sale.
    if (stockToMove.length > 0 && inventoryMove) {
      const wh = await sql<any>`SELECT warehouse_id FROM zvd_pos_sessions WHERE id = ${d.session_id}`.execute(db);
      const warehouseId = wh.rows[0]?.warehouse_id;
      if (warehouseId) {
        for (const line of stockToMove) {
          try {
            await inventoryMove({
              productId: line.product_id,
              warehouseId,
              qty: line.quantity,
              type: 'out',
              reference: `pos:order:${orderId}`,
              reason: `POS sale ${line.product_name}`,
            });
          } catch (err) {
            console.error(
              `[pos] stock not decremented for order ${orderId}, product ${line.product_id} — inventory is now high by ${line.quantity}:`,
              (err as Error).message,
            );
          }
        }
      }
    }

    return c.json({ data: order.rows[0] }, 201);
  });

  app.post('/orders/:id/refund', async (c) => {
    const user = c.get('user') as any;
    if (!(await mayRefund(ctx, user))) {
      return c.json({ error: 'You may not refund orders' }, 403);
    }
    const order = await sql`SELECT * FROM zvd_pos_orders WHERE id = ${c.req.param('id')} AND status = 'paid'`.execute(db);
    if (!order.rows.length) return c.json({ error: 'Order not found or not completed' }, 400);
    const o = order.rows[0] as any;
    // The refund and the loyalty it reverses are one act. The guard is
    // `status = 'paid'`, so an order marked refunded without its points being
    // taken back can never be refunded again — the customer keeps points for a
    // sale that was returned, and no retry will correct it.
    await db.transaction().execute(async (trx) => {
      await sql`UPDATE zvd_pos_orders SET status = 'refunded', updated_at = NOW() WHERE id = ${o.id}`.execute(trx);
      // Reverse loyalty
      if (o.customer_id && o.loyalty_points_earned > 0) {
        const delta = -o.loyalty_points_earned + o.loyalty_points_redeemed;
        await sql`UPDATE zvd_pos_customers SET loyalty_points = loyalty_points + ${delta}, total_spent = total_spent - ${o.total}, updated_at = NOW() WHERE id = ${o.customer_id}`.execute(trx);
        await sql`INSERT INTO zvd_pos_loyalty_log (customer_id, order_id, delta, reason) VALUES (${o.customer_id}, ${o.id}, ${delta}, 'refund')`.execute(trx);
      }
    });
    return c.json({ data: { refunded: true } });
  });

  // ── Z-Reports ─────────────────────────────────────────────────
  app.get('/sessions/:id/z-report', async (c) => {
    const row = await sql`SELECT * FROM zvd_pos_z_reports WHERE session_id = ${c.req.param('id')}`.execute(db);
    if (!row.rows.length) {
      // Generate on-the-fly
      const totals = await sql`
        SELECT COALESCE(SUM(total) FILTER (WHERE status='paid'), 0) as total_sales,
          COALESCE(SUM(total) FILTER (WHERE status='refunded'), 0) as refunds,
          COALESCE(SUM(total) FILTER (WHERE status='paid' AND payment_method='cash'), 0) as cash_sales,
          COALESCE(SUM(total) FILTER (WHERE status='paid' AND payment_method='card'), 0) as card_sales,
          COUNT(*) FILTER (WHERE status='paid') as order_count,
          COALESCE(SUM(tax_amount) FILTER (WHERE status='paid'), 0) as tax_amount
        FROM zvd_pos_orders WHERE session_id = ${c.req.param('id')}
      `.execute(db);
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
      FROM zvd_pos_orders WHERE status = 'paid' AND created_at::date BETWEEN ${fromDate} AND ${toDate}
    `.execute(db);
    return c.json({ data: row.rows[0] });
  });

  return app;
}
