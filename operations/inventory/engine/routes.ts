import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';

export function inventoryRoutes(db: any, auth: any): Hono {
  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  // ── Warehouses ────────────────────────────────────────────────
  app.get('/warehouses', async (c) => {
    const rows = await sql`SELECT * FROM zvd_warehouses ORDER BY name`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/warehouses', zValidator('json', z.object({
    name: z.string().min(1),
    address: z.string().optional(),
    notes: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_warehouses (name, address, notes, created_by)
      VALUES (${d.name}, ${d.address ?? null}, ${d.notes ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Products ──────────────────────────────────────────────────
  app.get('/products', async (c) => {
    const { limit = '50', page = '1', q, category } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT p.*,
        COALESCE(json_agg(json_build_object(
          'warehouse_id', sl.warehouse_id, 'warehouse_name', w.name, 'quantity', sl.quantity
        )) FILTER (WHERE sl.id IS NOT NULL), '[]') as stock_levels
      FROM zvd_products p
      LEFT JOIN zvd_stock_levels sl ON sl.product_id = p.id
      LEFT JOIN zvd_warehouses w ON w.id = sl.warehouse_id
      WHERE (${q ? sql`p.name ILIKE ${'%' + q + '%'} OR p.sku ILIKE ${'%' + q + '%'}` : sql`TRUE`})
        AND (${category ? sql`p.category = ${category}` : sql`TRUE`})
        AND p.is_active = true
      GROUP BY p.id
      ORDER BY p.name
      LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/products/:id', async (c) => {
    const row = await sql`
      SELECT p.*,
        COALESCE(json_agg(json_build_object(
          'warehouse_id', sl.warehouse_id, 'warehouse_name', w.name,
          'quantity', sl.quantity, 'reserved', sl.reserved_quantity
        )) FILTER (WHERE sl.id IS NOT NULL), '[]') as stock_levels
      FROM zvd_products p
      LEFT JOIN zvd_stock_levels sl ON sl.product_id = p.id
      LEFT JOIN zvd_warehouses w ON w.id = sl.warehouse_id
      WHERE p.id = ${c.req.param('id')}
      GROUP BY p.id
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.post('/products', zValidator('json', z.object({
    name: z.string().min(1),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    unit: z.string().default('buc'),
    unit_cost: z.number().min(0).default(0),
    unit_price: z.number().min(0).default(0),
    tax_rate: z.number().default(19),
    reorder_point: z.number().int().min(0).default(0),
    reorder_quantity: z.number().int().min(0).default(0),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_products (name, sku, barcode, category, description, unit, unit_cost, unit_price, tax_rate, reorder_point, reorder_quantity, created_by)
      VALUES (${d.name}, ${d.sku ?? null}, ${d.barcode ?? null}, ${d.category ?? null},
        ${d.description ?? null}, ${d.unit}, ${d.unit_cost}, ${d.unit_price}, ${d.tax_rate},
        ${d.reorder_point}, ${d.reorder_quantity}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/products/:id', zValidator('json', z.object({
    name: z.string().optional(),
    category: z.string().optional(),
    unit_cost: z.number().optional(),
    unit_price: z.number().optional(),
    reorder_point: z.number().optional(),
    reorder_quantity: z.number().optional(),
    is_active: z.boolean().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_products SET
        name = COALESCE(${d.name ?? null}, name),
        category = COALESCE(${d.category ?? null}, category),
        unit_cost = COALESCE(${d.unit_cost ?? null}, unit_cost),
        unit_price = COALESCE(${d.unit_price ?? null}, unit_price),
        reorder_point = COALESCE(${d.reorder_point ?? null}, reorder_point),
        reorder_quantity = COALESCE(${d.reorder_quantity ?? null}, reorder_quantity),
        is_active = COALESCE(${d.is_active ?? null}, is_active),
        updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // ── Stock Movements ───────────────────────────────────────────
  app.post('/movements', zValidator('json', z.object({
    product_id: z.string().uuid(),
    warehouse_id: z.string().uuid(),
    type: z.enum(['in','out','transfer','adjustment']),
    quantity: z.number().positive(),
    destination_warehouse_id: z.string().uuid().optional(),
    reference: z.string().optional(),
    notes: z.string().optional(),
    unit_cost: z.number().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    if (d.type === 'transfer' && !d.destination_warehouse_id) {
      return c.json({ error: 'destination_warehouse_id required for transfer' }, 400);
    }
    // Ensure stock_levels row exists
    await sql`
      INSERT INTO zvd_stock_levels (product_id, warehouse_id, quantity) VALUES (${d.product_id}, ${d.warehouse_id}, 0)
      ON CONFLICT (product_id, warehouse_id) DO NOTHING
    `.execute(db);
    const delta = (d.type === 'in' || d.type === 'adjustment') ? d.quantity : -d.quantity;
    if (d.type !== 'adjustment') {
      const current = await sql`SELECT quantity FROM zvd_stock_levels WHERE product_id = ${d.product_id} AND warehouse_id = ${d.warehouse_id}`.execute(db);
      const qty = (current.rows[0] as any)?.quantity ?? 0;
      if (d.type === 'out' || d.type === 'transfer') {
        if (qty < d.quantity) return c.json({ error: 'Insufficient stock' }, 400);
      }
    }
    await sql`
      UPDATE zvd_stock_levels SET quantity = quantity + ${delta}, updated_at = NOW()
      WHERE product_id = ${d.product_id} AND warehouse_id = ${d.warehouse_id}
    `.execute(db);
    if (d.type === 'transfer' && d.destination_warehouse_id) {
      await sql`
        INSERT INTO zvd_stock_levels (product_id, warehouse_id, quantity) VALUES (${d.product_id}, ${d.destination_warehouse_id}, 0)
        ON CONFLICT (product_id, warehouse_id) DO NOTHING
      `.execute(db);
      await sql`
        UPDATE zvd_stock_levels SET quantity = quantity + ${d.quantity}, updated_at = NOW()
        WHERE product_id = ${d.product_id} AND warehouse_id = ${d.destination_warehouse_id}
      `.execute(db);
    }
    const movement = await sql`
      INSERT INTO zvd_stock_movements (product_id, warehouse_id, destination_warehouse_id, type, quantity, unit_cost, reference, notes, created_by)
      VALUES (${d.product_id}, ${d.warehouse_id}, ${d.destination_warehouse_id ?? null}, ${d.type},
        ${d.quantity}, ${d.unit_cost ?? null}, ${d.reference ?? null}, ${d.notes ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: movement.rows[0] }, 201);
  });

  app.get('/movements', async (c) => {
    const { limit = '50', page = '1', product_id, warehouse_id } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT m.*, p.name as product_name, p.sku, w.name as warehouse_name
      FROM zvd_stock_movements m
      JOIN zvd_products p ON p.id = m.product_id
      JOIN zvd_warehouses w ON w.id = m.warehouse_id
      WHERE (${product_id ? sql`m.product_id = ${product_id}` : sql`TRUE`})
        AND (${warehouse_id ? sql`m.warehouse_id = ${warehouse_id}` : sql`TRUE`})
      ORDER BY m.created_at DESC
      LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  // ── Low stock alerts ──────────────────────────────────────────
  app.get('/low-stock', async (c) => {
    const rows = await sql`
      SELECT p.*, COALESCE(SUM(sl.quantity), 0) as total_stock
      FROM zvd_products p
      LEFT JOIN zvd_stock_levels sl ON sl.product_id = p.id
      WHERE p.is_active = true AND p.reorder_point > 0
      GROUP BY p.id
      HAVING COALESCE(SUM(sl.quantity), 0) <= p.reorder_point
      ORDER BY (COALESCE(SUM(sl.quantity), 0) - p.reorder_point) ASC
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  return app;
}
