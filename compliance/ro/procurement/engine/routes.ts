import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { permissionGate } from '@zveltio/sdk/extension';

async function getUser(c: any, auth: any) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return session?.user ?? null;
}

const supplierSchema = z.object({
  name: z.string().min(1),
  cui: z.string().min(1),
  reg_com: z.string().optional(),
  address: z.string().optional(),
  county: z.string().optional(),
  iban: z.string().optional(),
  bank: z.string().optional(),
  contact_name: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
});

const poItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().default('BUC'),
  unit_price: z.number(),
  total: z.number(),
});

export function roProcurementRoutes(ctx: ExtensionContext): Hono {
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
  app.use('*', permissionGate(ctx, 'procurement'));

  // ─── Suppliers ─────────────────────────────────────────────────

  app.get('/suppliers', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { search, category } = c.req.query();
    let query = reqDb(c).selectFrom('zv_ro_suppliers').selectAll().where('is_active', '=', true).orderBy('name', 'asc');
    if (search) query = query.where('name', 'ilike', `%${search}%`);
    if (category) query = query.where('category', '=', category);

    const suppliers = await query.execute();
    return c.json({ suppliers });
  });

  app.get('/suppliers/:id', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const supplier = await reqDb(c).selectFrom('zv_ro_suppliers').selectAll().where('id', '=', c.req.param('id')).executeTakeFirst();
    if (!supplier) return c.json({ error: 'Supplier not found' }, 404);

    const [orders, evaluations, contracts] = await Promise.all([
      reqDb(c).selectFrom('zv_ro_purchase_orders').select(['id', 'number', 'date', 'total', 'currency', 'status']).where('supplier_id', '=', c.req.param('id')).orderBy('date', 'desc').limit(10).execute(),
      sql<any>`SELECT * FROM zv_ro_supplier_evaluations WHERE supplier_id = ${c.req.param('id')}::uuid ORDER BY period DESC`.execute(reqDb(c)).catch(() => ({ rows: [] })),
      sql<any>`SELECT id, number, title, value, currency, status, start_date, end_date FROM zv_ro_contracts WHERE supplier_id = ${c.req.param('id')}::uuid AND status = 'active'`.execute(reqDb(c)).catch(() => ({ rows: [] })),
    ]);

    return c.json({ supplier, recent_orders: orders, evaluations: evaluations.rows, active_contracts: contracts.rows });
  });

  app.post('/suppliers', zValidator('json', supplierSchema), async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const supplier = await reqDb(c).insertInto('zv_ro_suppliers').values(c.req.valid('json')).returningAll().executeTakeFirst();
    return c.json({ supplier }, 201);
  });

  app.patch('/suppliers/:id', zValidator('json', supplierSchema.partial()), async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const supplier = await reqDb(c)
      .updateTable('zv_ro_suppliers')
      .set({ ...c.req.valid('json'), updated_at: new Date() })
      .where('id', '=', c.req.param('id'))
      .returningAll()
      .executeTakeFirst();

    if (!supplier) return c.json({ error: 'Supplier not found' }, 404);
    return c.json({ supplier });
  });

  app.delete('/suppliers/:id', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    await reqDb(c).updateTable('zv_ro_suppliers').set({ is_active: false }).where('id', '=', c.req.param('id')).execute();
    return c.json({ success: true });
  });

  // POST /suppliers/:id/evaluate
  app.post(
    '/suppliers/:id/evaluate',
    zValidator('json', z.object({
      period: z.string().min(1),
      quality_score: z.number().int().min(1).max(5),
      delivery_score: z.number().int().min(1).max(5),
      price_score: z.number().int().min(1).max(5),
      notes: z.string().optional(),
    })),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const body = c.req.valid('json');
      const evaluation = await sql<any>`
        INSERT INTO zv_ro_supplier_evaluations (supplier_id, period, quality_score, delivery_score, price_score, notes, evaluated_by)
        VALUES (${c.req.param('id')}::uuid, ${body.period}, ${body.quality_score}, ${body.delivery_score}, ${body.price_score}, ${body.notes ?? null}, ${user.id})
        ON CONFLICT (supplier_id, period)
        DO UPDATE SET quality_score = EXCLUDED.quality_score, delivery_score = EXCLUDED.delivery_score,
                      price_score = EXCLUDED.price_score, notes = EXCLUDED.notes
        RETURNING *
      `.execute(reqDb(c));

      return c.json({ evaluation: evaluation.rows[0] }, 201);
    },
  );

  // ─── Purchase orders ───────────────────────────────────────────

  app.get('/orders', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { status, priority } = c.req.query();
    let query = reqDb(c)
      .selectFrom('zv_ro_purchase_orders')
      .select(['id', 'number', 'date', 'supplier_name', 'description', 'total', 'currency', 'status', 'priority', 'budget_line', 'created_at'])
      .orderBy('date', 'desc');

    if (status) query = query.where('status', '=', status);
    if (priority) query = query.where('priority', '=', priority);
    const orders = await query.execute();
    return c.json({ orders });
  });

  app.get('/orders/:id', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const order = await reqDb(c)
      .selectFrom('zv_ro_purchase_orders')
      .selectAll()
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!order) return c.json({ error: 'Order not found' }, 404);

    // Attach reception notes
    const nirs = await sql<any>`
      SELECT id, number, date, status, total_value FROM zv_ro_reception_notes
      WHERE order_id = ${c.req.param('id')}::uuid ORDER BY date DESC
    `.execute(reqDb(c)).catch(() => ({ rows: [] }));

    return c.json({ order, reception_notes: nirs.rows });
  });

  app.post(
    '/orders',
    zValidator(
      'json',
      z.object({
        number: z.string().min(1),
        date: z.string(),
        supplier_id: z.string().uuid().optional(),
        supplier_name: z.string().min(1),
        supplier_cui: z.string().min(1),
        description: z.string().min(1),
        category: z.string().optional(),
        items: z.array(poItemSchema).default([]),
        subtotal: z.number(),
        vat_total: z.number(),
        total: z.number(),
        currency: z.string().default('RON'),
        budget_line: z.string().optional(),
        contract_id: z.string().uuid().optional(),
        priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
        notes: z.string().optional(),
      }),
    ),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const body = c.req.valid('json');
      const order = await reqDb(c)
        .insertInto('zv_ro_purchase_orders')
        .values({ ...body, items: JSON.stringify(body.items), created_by: user.id })
        .returningAll()
        .executeTakeFirst();

      return c.json({ order }, 201);
    },
  );

  app.post('/orders/:id/approve', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const order = await reqDb(c)
      .updateTable('zv_ro_purchase_orders')
      .set({ status: 'approved', approved_by: user.id, approved_at: new Date(), updated_at: new Date() })
      .where('id', '=', c.req.param('id'))
      .where('status', '=', 'draft')
      .returningAll()
      .executeTakeFirst();

    if (!order) return c.json({ error: 'Order not found or not approvable' }, 404);
    return c.json({ order });
  });

  app.post('/orders/:id/receive', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const order = await reqDb(c)
      .updateTable('zv_ro_purchase_orders')
      .set({ status: 'received', received_at: new Date(), updated_at: new Date() })
      .where('id', '=', c.req.param('id'))
      .where('status', '=', 'approved')
      .returningAll()
      .executeTakeFirst();

    if (!order) return c.json({ error: 'Order not found or not receivable' }, 404);
    return c.json({ order });
  });

  app.post(
    '/orders/:id/cancel',
    zValidator('json', z.object({ reason: z.string().min(1) })),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const { reason } = c.req.valid('json');
      const order = await reqDb(c)
        .updateTable('zv_ro_purchase_orders')
        .set({ status: 'cancelled', cancellation_reason: reason, cancelled_at: new Date(), updated_at: new Date() })
        .where('id', '=', c.req.param('id'))
        .where('status', 'in', ['draft', 'approved'])
        .returningAll()
        .executeTakeFirst();

      if (!order) return c.json({ error: 'Order not found or not cancellable' }, 404);
      return c.json({ order });
    },
  );

  app.delete('/orders/:id', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    await reqDb(c).deleteFrom('zv_ro_purchase_orders').where('id', '=', c.req.param('id')).where('status', '=', 'draft').execute();
    return c.json({ success: true });
  });

  // ─── Reception Notes (NIR) ─────────────────────────────────────

  app.get('/reception-notes', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { status } = c.req.query();
    let query = reqDb(c).selectFrom('zv_ro_reception_notes')
      .select(['id', 'number', 'date', 'supplier_name', 'total_value', 'currency', 'status', 'created_at'])
      .orderBy('date', 'desc');
    if (status) query = query.where('status', '=', status);
    return c.json({ reception_notes: await query.execute() });
  });

  app.post(
    '/reception-notes',
    zValidator('json', z.object({
      number: z.string().min(1),
      order_id: z.string().uuid().optional(),
      supplier_id: z.string().uuid().optional(),
      supplier_name: z.string().min(1),
      date: z.string(),
      items: z.array(z.object({
        description: z.string(),
        ordered_qty: z.number(),
        received_qty: z.number(),
        unit: z.string().default('BUC'),
        unit_price: z.number(),
        total: z.number(),
      })).default([]),
      total_value: z.number(),
      currency: z.string().default('RON'),
      discrepancies: z.string().optional(),
    })),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const body = c.req.valid('json');
      const nir = await reqDb(c).insertInto('zv_ro_reception_notes')
        .values({ ...body, items: JSON.stringify(body.items), created_by: user.id })
        .returningAll()
        .executeTakeFirst();

      return c.json({ reception_note: nir }, 201);
    },
  );

  app.post('/reception-notes/:id/confirm', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const nir = await reqDb(c).updateTable('zv_ro_reception_notes')
      .set({ status: 'confirmed', confirmed_by: user.id, confirmed_at: new Date() })
      .where('id', '=', c.req.param('id'))
      .where('status', '=', 'draft')
      .returningAll()
      .executeTakeFirst();

    if (!nir) return c.json({ error: 'NIR not found or already confirmed' }, 404);
    return c.json({ reception_note: nir });
  });

  // ─── Contracts ─────────────────────────────────────────────────

  app.get('/contracts', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { status, type } = c.req.query();
    let query = reqDb(c).selectFrom('zv_ro_contracts')
      .select(['id', 'number', 'supplier_name', 'title', 'type', 'value', 'currency', 'status', 'start_date', 'end_date'])
      .orderBy('created_at', 'desc');
    if (status) query = query.where('status', '=', status);
    if (type) query = query.where('type', '=', type);
    return c.json({ contracts: await query.execute() });
  });

  app.post(
    '/contracts',
    zValidator('json', z.object({
      number: z.string().min(1),
      supplier_id: z.string().uuid().optional(),
      supplier_name: z.string().min(1),
      supplier_cui: z.string().min(1),
      title: z.string().min(1),
      type: z.enum(['services', 'goods', 'works', 'framework']).default('services'),
      value: z.number().optional(),
      currency: z.string().default('RON'),
      start_date: z.string().optional(),
      end_date: z.string().optional(),
      auto_renew: z.boolean().default(false),
      notes: z.string().optional(),
    })),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const body = c.req.valid('json');
      const contract = await reqDb(c).insertInto('zv_ro_contracts').values({ ...body, created_by: user.id }).returningAll().executeTakeFirst();
      return c.json({ contract }, 201);
    },
  );

  app.patch('/contracts/:id/activate', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const contract = await reqDb(c).updateTable('zv_ro_contracts').set({ status: 'active', updated_at: new Date() }).where('id', '=', c.req.param('id')).where('status', '=', 'draft').returningAll().executeTakeFirst();
    if (!contract) return c.json({ error: 'Contract not found or not activatable' }, 404);
    return c.json({ contract });
  });

  // ─── Budget lines ──────────────────────────────────────────────

  app.get('/budget', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { year } = c.req.query();
    let query = reqDb(c).selectFrom('zv_ro_budget_lines').selectAll().orderBy('code', 'asc');
    if (year) query = query.where('year', '=', parseInt(year, 10));

    const lines = await query.execute();

    const spent = await reqDb(c)
      .selectFrom('zv_ro_purchase_orders')
      .select(['budget_line', db.fn.sum('total').as('spent')])
      .where('status', 'in', ['approved', 'received'])
      .groupBy('budget_line')
      .execute();

    const spentMap: Record<string, number> = {};
    for (const s of spent) {
      if (s.budget_line) spentMap[s.budget_line] = Number(s.spent);
    }

    return c.json({
      budget_lines: lines.map((l: any) => ({
        ...l,
        spent: spentMap[l.code] || 0,
        remaining: Number(l.allocated) - (spentMap[l.code] || 0),
      })),
    });
  });

  app.post(
    '/budget',
    zValidator('json', z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      year: z.number().int(),
      allocated: z.number(),
      currency: z.string().default('RON'),
      notes: z.string().optional(),
    })),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const line = await reqDb(c).insertInto('zv_ro_budget_lines').values(c.req.valid('json')).returningAll().executeTakeFirst();
      return c.json({ budget_line: line }, 201);
    },
  );

  // ─── Spending report ───────────────────────────────────────────

  app.get('/reports/spending', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { year, supplier_id } = c.req.query();
    const currentYear = year ? parseInt(year, 10) : new Date().getFullYear();

    const [byCategory, byMonth, bySupplier] = await Promise.all([
      sql<any>`
        SELECT category, SUM(total) AS total, COUNT(*)::int AS count
        FROM zv_ro_purchase_orders
        WHERE EXTRACT(YEAR FROM date) = ${currentYear} AND status IN ('approved','received')
        GROUP BY category ORDER BY total DESC
      `.execute(reqDb(c)).catch(() => ({ rows: [] })),
      sql<any>`
        SELECT TO_CHAR(date, 'YYYY-MM') AS month, SUM(total) AS total, COUNT(*)::int AS count
        FROM zv_ro_purchase_orders
        WHERE EXTRACT(YEAR FROM date) = ${currentYear} AND status IN ('approved','received')
        GROUP BY month ORDER BY month
      `.execute(reqDb(c)).catch(() => ({ rows: [] })),
      sql<any>`
        SELECT supplier_name, supplier_cui, SUM(total) AS total, COUNT(*)::int AS count
        FROM zv_ro_purchase_orders
        WHERE EXTRACT(YEAR FROM date) = ${currentYear} AND status IN ('approved','received')
          ${supplier_id ? sql`AND supplier_id = ${supplier_id}::uuid` : sql``}
        GROUP BY supplier_name, supplier_cui ORDER BY total DESC LIMIT 20
      `.execute(reqDb(c)).catch(() => ({ rows: [] })),
    ]);

    return c.json({ year: currentYear, by_category: byCategory.rows, by_month: byMonth.rows, by_supplier: bySupplier.rows });
  });

  return app;
}
