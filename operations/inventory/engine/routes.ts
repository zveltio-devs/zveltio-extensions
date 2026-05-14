import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';

let poCounter = 0;
async function nextPONumber(db: any): Promise<string> {
  const row = await sql`SELECT COUNT(*) as cnt FROM zvd_purchase_orders`.execute(db);
  return `PO-${String(parseInt((row.rows[0] as any).cnt) + 1 + poCounter++).padStart(5, '0')}`;
}

// Update weighted-average cost after a stock-in movement
async function updateAvgCost(db: any, productId: string, addedQty: number, addedCost: number) {
  const current = await sql`
    SELECT COALESCE(SUM(sl.quantity), 0) as qty, p.avg_cost
    FROM zvd_products p LEFT JOIN zvd_stock_levels sl ON sl.product_id = p.id
    WHERE p.id = ${productId} GROUP BY p.avg_cost
  `.execute(db);
  if (!current.rows.length) return;
  const { qty, avg_cost } = current.rows[0] as any;
  const totalQtyBefore = Math.max(0, +qty - addedQty);
  const newAvgCost = (totalQtyBefore * +avg_cost + addedQty * addedCost) / Math.max(+qty, 1);
  const totalValue = +qty * newAvgCost;
  await sql`UPDATE zvd_products SET avg_cost = ${newAvgCost}, total_value = ${totalValue}, updated_at = NOW() WHERE id = ${productId}`.execute(db);
}

export function inventoryRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;
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
    const row = await sql`INSERT INTO zvd_warehouses (name, address, notes, created_by) VALUES (${d.name}, ${d.address ?? null}, ${d.notes ?? null}, ${user.id}) RETURNING *`.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Suppliers ─────────────────────────────────────────────────
  app.get('/suppliers', async (c) => {
    const rows = await sql`SELECT * FROM zvd_suppliers WHERE is_active = true ORDER BY name`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/suppliers', zValidator('json', z.object({
    name: z.string().min(1),
    contact_name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    tax_id: z.string().optional(),
    payment_terms: z.number().int().default(30),
    currency: z.string().default('RON'),
    notes: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_suppliers (name, contact_name, email, phone, address, tax_id, payment_terms, currency, notes, created_by)
      VALUES (${d.name}, ${d.contact_name ?? null}, ${d.email ?? null}, ${d.phone ?? null},
        ${d.address ?? null}, ${d.tax_id ?? null}, ${d.payment_terms}, ${d.currency}, ${d.notes ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/suppliers/:id', zValidator('json', z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    payment_terms: z.number().optional(),
    is_active: z.boolean().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_suppliers SET name = COALESCE(${d.name ?? null}, name), email = COALESCE(${d.email ?? null}, email),
        payment_terms = COALESCE(${d.payment_terms ?? null}, payment_terms), is_active = COALESCE(${d.is_active ?? null}, is_active), updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // ── Products ──────────────────────────────────────────────────
  app.get('/products', async (c) => {
    const { limit = '50', page = '1', q, category } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT p.*,
        COALESCE(SUM(sl.quantity), 0) as total_stock,
        COALESCE(json_agg(json_build_object(
          'warehouse_id', sl.warehouse_id, 'warehouse_name', w.name, 'quantity', sl.quantity, 'reserved', sl.reserved_qty
        )) FILTER (WHERE sl.id IS NOT NULL), '[]') as stock_levels
      FROM zvd_products p
      LEFT JOIN zvd_stock_levels sl ON sl.product_id = p.id
      LEFT JOIN zvd_warehouses w ON w.id = sl.warehouse_id
      WHERE (${q ? sql`p.name ILIKE ${'%' + q + '%'} OR p.sku ILIKE ${'%' + q + '%'}` : sql`TRUE`})
        AND (${category ? sql`p.category = ${category}` : sql`TRUE`})
        AND p.is_active = true
      GROUP BY p.id ORDER BY p.name
      LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/products/:id', async (c) => {
    const row = await sql`
      SELECT p.*,
        COALESCE(json_agg(json_build_object('warehouse_id', sl.warehouse_id, 'quantity', sl.quantity, 'reserved', sl.reserved_qty)) FILTER (WHERE sl.id IS NOT NULL), '[]') as stock_levels,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', v.id, 'name', v.name, 'sku', v.sku, 'attributes', v.attributes)) FILTER (WHERE v.id IS NOT NULL), '[]') as variants
      FROM zvd_products p
      LEFT JOIN zvd_stock_levels sl ON sl.product_id = p.id
      LEFT JOIN zvd_product_variants v ON v.product_id = p.id AND v.is_active = true
      WHERE p.id = ${c.req.param('id')} GROUP BY p.id
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
    variants: z.array(z.object({
      name: z.string().min(1),
      sku: z.string().optional(),
      attributes: z.record(z.string()).default({}),
      unit_price: z.number().optional(),
    })).default([]),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_products (name, sku, barcode, category, description, unit, unit_cost, unit_price, tax_rate, reorder_point, reorder_quantity, avg_cost, created_by)
      VALUES (${d.name}, ${d.sku ?? null}, ${d.barcode ?? null}, ${d.category ?? null}, ${d.description ?? null},
        ${d.unit}, ${d.unit_cost}, ${d.unit_price}, ${d.tax_rate}, ${d.reorder_point}, ${d.reorder_quantity}, ${d.unit_cost}, ${user.id})
      RETURNING *
    `.execute(db);
    const productId = (row.rows[0] as any).id;
    for (const v of d.variants) {
      await sql`INSERT INTO zvd_product_variants (product_id, name, sku, attributes, unit_price) VALUES (${productId}, ${v.name}, ${v.sku ?? null}, ${JSON.stringify(v.attributes)}, ${v.unit_price ?? null})`.execute(db);
    }
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
        name = COALESCE(${d.name ?? null}, name), category = COALESCE(${d.category ?? null}, category),
        unit_cost = COALESCE(${d.unit_cost ?? null}, unit_cost), unit_price = COALESCE(${d.unit_price ?? null}, unit_price),
        reorder_point = COALESCE(${d.reorder_point ?? null}, reorder_point), reorder_quantity = COALESCE(${d.reorder_quantity ?? null}, reorder_quantity),
        is_active = COALESCE(${d.is_active ?? null}, is_active), updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // ── Product Variants ──────────────────────────────────────────
  app.post('/products/:id/variants', zValidator('json', z.object({
    name: z.string().min(1),
    sku: z.string().optional(),
    attributes: z.record(z.string()).default({}),
    unit_price: z.number().optional(),
    unit_cost: z.number().optional(),
    barcode: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_product_variants (product_id, name, sku, attributes, unit_price, unit_cost, barcode)
      VALUES (${c.req.param('id')}, ${d.name}, ${d.sku ?? null}, ${JSON.stringify(d.attributes)}, ${d.unit_price ?? null}, ${d.unit_cost ?? null}, ${d.barcode ?? null})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Purchase Orders ───────────────────────────────────────────
  app.get('/purchase-orders', async (c) => {
    const { limit = '50', page = '1', status, supplier_id } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT po.*, s.name as supplier_name
      FROM zvd_purchase_orders po JOIN zvd_suppliers s ON s.id = po.supplier_id
      WHERE (${status ? sql`po.status = ${status}` : sql`TRUE`})
        AND (${supplier_id ? sql`po.supplier_id = ${supplier_id}` : sql`TRUE`})
      ORDER BY po.created_at DESC LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/purchase-orders/:id', async (c) => {
    const row = await sql`
      SELECT po.*, s.name as supplier_name,
        COALESCE(json_agg(json_build_object('id', l.id, 'product_id', l.product_id, 'product_name', p.name,
          'quantity_ordered', l.quantity_ordered, 'quantity_received', l.quantity_received,
          'unit_cost', l.unit_cost, 'total', l.total) ORDER BY l.sort_order) FILTER (WHERE l.id IS NOT NULL), '[]') as lines
      FROM zvd_purchase_orders po JOIN zvd_suppliers s ON s.id = po.supplier_id
      LEFT JOIN zvd_purchase_order_lines l ON l.po_id = po.id
      LEFT JOIN zvd_products p ON p.id = l.product_id
      WHERE po.id = ${c.req.param('id')} GROUP BY po.id, s.name
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.post('/purchase-orders', zValidator('json', z.object({
    supplier_id: z.string().uuid(),
    warehouse_id: z.string().uuid().optional(),
    expected_date: z.string().optional(),
    currency: z.string().default('RON'),
    notes: z.string().optional(),
    lines: z.array(z.object({
      product_id: z.string().uuid(),
      quantity_ordered: z.number().positive(),
      unit_cost: z.number().min(0),
      tax_rate: z.number().default(0),
    })).min(1),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const number = await nextPONumber(db);
    const subtotal = d.lines.reduce((s, l) => s + l.quantity_ordered * l.unit_cost, 0);
    const tax_amount = d.lines.reduce((s, l) => s + l.quantity_ordered * l.unit_cost * l.tax_rate / 100, 0);
    const total = subtotal + tax_amount;
    const po = await sql`
      INSERT INTO zvd_purchase_orders (number, supplier_id, warehouse_id, expected_date, currency, subtotal, tax_amount, total, notes, created_by)
      VALUES (${number}, ${d.supplier_id}, ${d.warehouse_id ?? null}, ${d.expected_date ?? null}, ${d.currency}, ${subtotal}, ${tax_amount}, ${total}, ${d.notes ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    const poId = (po.rows[0] as any).id;
    let sort = 0;
    for (const line of d.lines) {
      const lineTotal = line.quantity_ordered * line.unit_cost * (1 + line.tax_rate / 100);
      await sql`INSERT INTO zvd_purchase_order_lines (po_id, product_id, quantity_ordered, unit_cost, tax_rate, total, sort_order) VALUES (${poId}, ${line.product_id}, ${line.quantity_ordered}, ${line.unit_cost}, ${line.tax_rate}, ${lineTotal}, ${sort++})`.execute(db);
    }
    return c.json({ data: po.rows[0] }, 201);
  });

  app.post('/purchase-orders/:id/receive', zValidator('json', z.object({
    received_date: z.string().optional(),
    lines: z.array(z.object({
      line_id: z.string().uuid(),
      quantity_received: z.number().positive(),
      batch_number: z.string().optional(),
      expiry_date: z.string().optional(),
    })).min(1),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const po = await sql`SELECT * FROM zvd_purchase_orders WHERE id = ${c.req.param('id')} AND status NOT IN ('cancelled','received')`.execute(db);
    if (!po.rows.length) return c.json({ error: 'PO not found or already received' }, 400);
    const poData = po.rows[0] as any;
    const receivedDate = d.received_date ?? new Date().toISOString().slice(0, 10);
    for (const recv of d.lines) {
      const line = await sql`SELECT * FROM zvd_purchase_order_lines WHERE id = ${recv.line_id} AND po_id = ${poData.id}`.execute(db);
      if (!line.rows.length) continue;
      const l = line.rows[0] as any;
      await sql`UPDATE zvd_purchase_order_lines SET quantity_received = quantity_received + ${recv.quantity_received} WHERE id = ${l.id}`.execute(db);
      // Create batch if batch_number provided
      let batchId = null;
      if (recv.batch_number) {
        await sql`
          INSERT INTO zvd_product_batches (product_id, warehouse_id, batch_number, quantity, expiry_date, unit_cost)
          VALUES (${l.product_id}, ${poData.warehouse_id}, ${recv.batch_number}, ${recv.quantity_received}, ${recv.expiry_date ?? null}, ${l.unit_cost})
          ON CONFLICT (product_id, warehouse_id, batch_number) DO UPDATE SET quantity = zvd_product_batches.quantity + ${recv.quantity_received}
        `.execute(db);
        const bRow = await sql`SELECT id FROM zvd_product_batches WHERE product_id = ${l.product_id} AND batch_number = ${recv.batch_number}`.execute(db);
        batchId = (bRow.rows[0] as any)?.id;
      }
      // Update stock
      await sql`INSERT INTO zvd_stock_levels (product_id, warehouse_id, quantity) VALUES (${l.product_id}, ${poData.warehouse_id}, 0) ON CONFLICT (product_id, warehouse_id) DO NOTHING`.execute(db);
      await sql`UPDATE zvd_stock_levels SET quantity = quantity + ${recv.quantity_received}, updated_at = NOW() WHERE product_id = ${l.product_id} AND warehouse_id = ${poData.warehouse_id}`.execute(db);
      await sql`INSERT INTO zvd_stock_movements (product_id, warehouse_id, type, quantity, unit_cost, reference, batch_id, po_line_id, created_by) VALUES (${l.product_id}, ${poData.warehouse_id}, 'in', ${recv.quantity_received}, ${l.unit_cost}, ${poData.number}, ${batchId}, ${l.id}, ${user.id})`.execute(db);
      await updateAvgCost(db, l.product_id, recv.quantity_received, l.unit_cost);
    }
    // Determine new status
    const allLines = await sql`SELECT quantity_ordered, quantity_received FROM zvd_purchase_order_lines WHERE po_id = ${poData.id}`.execute(db);
    const allReceived = (allLines.rows as any[]).every(l => l.quantity_received >= l.quantity_ordered);
    const anyReceived = (allLines.rows as any[]).some(l => l.quantity_received > 0);
    const newStatus = allReceived ? 'received' : anyReceived ? 'partial' : 'sent';
    await sql`UPDATE zvd_purchase_orders SET status = ${newStatus}, received_date = ${receivedDate}, updated_at = NOW() WHERE id = ${poData.id}`.execute(db);
    return c.json({ data: { status: newStatus } });
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
    batch_number: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    if (d.type === 'transfer' && !d.destination_warehouse_id) return c.json({ error: 'destination_warehouse_id required for transfer' }, 400);
    await sql`INSERT INTO zvd_stock_levels (product_id, warehouse_id, quantity) VALUES (${d.product_id}, ${d.warehouse_id}, 0) ON CONFLICT (product_id, warehouse_id) DO NOTHING`.execute(db);
    const delta = (d.type === 'in' || d.type === 'adjustment') ? d.quantity : -d.quantity;
    if (d.type === 'out' || d.type === 'transfer') {
      const current = await sql`SELECT quantity FROM zvd_stock_levels WHERE product_id = ${d.product_id} AND warehouse_id = ${d.warehouse_id}`.execute(db);
      if ((current.rows[0] as any)?.quantity < d.quantity) return c.json({ error: 'Insufficient stock' }, 400);
    }
    await sql`UPDATE zvd_stock_levels SET quantity = quantity + ${delta}, updated_at = NOW() WHERE product_id = ${d.product_id} AND warehouse_id = ${d.warehouse_id}`.execute(db);
    if (d.type === 'transfer' && d.destination_warehouse_id) {
      await sql`INSERT INTO zvd_stock_levels (product_id, warehouse_id, quantity) VALUES (${d.product_id}, ${d.destination_warehouse_id}, 0) ON CONFLICT (product_id, warehouse_id) DO NOTHING`.execute(db);
      await sql`UPDATE zvd_stock_levels SET quantity = quantity + ${d.quantity}, updated_at = NOW() WHERE product_id = ${d.product_id} AND warehouse_id = ${d.destination_warehouse_id}`.execute(db);
    }
    if (d.type === 'in' && d.unit_cost) {
      await updateAvgCost(db, d.product_id, d.quantity, d.unit_cost);
    }
    const movement = await sql`
      INSERT INTO zvd_stock_movements (product_id, warehouse_id, destination_warehouse_id, type, quantity, unit_cost, reference, notes, created_by)
      VALUES (${d.product_id}, ${d.warehouse_id}, ${d.destination_warehouse_id ?? null}, ${d.type}, ${d.quantity}, ${d.unit_cost ?? null}, ${d.reference ?? null}, ${d.notes ?? null}, ${user.id})
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
      FROM zvd_stock_movements m JOIN zvd_products p ON p.id = m.product_id JOIN zvd_warehouses w ON w.id = m.warehouse_id
      WHERE (${product_id ? sql`m.product_id = ${product_id}` : sql`TRUE`})
        AND (${warehouse_id ? sql`m.warehouse_id = ${warehouse_id}` : sql`TRUE`})
      ORDER BY m.created_at DESC LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  // ── Batches ───────────────────────────────────────────────────
  app.get('/products/:id/batches', async (c) => {
    const rows = await sql`
      SELECT b.*, w.name as warehouse_name FROM zvd_product_batches b JOIN zvd_warehouses w ON w.id = b.warehouse_id
      WHERE b.product_id = ${c.req.param('id')} ORDER BY b.expiry_date NULLS LAST, b.created_at
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/batches/expiring', async (c) => {
    const { days = '30' } = c.req.query();
    const rows = await sql`
      SELECT b.*, p.name as product_name, p.sku, w.name as warehouse_name
      FROM zvd_product_batches b JOIN zvd_products p ON p.id = b.product_id JOIN zvd_warehouses w ON w.id = b.warehouse_id
      WHERE b.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + ${parseInt(days)}
        AND b.quantity > 0
      ORDER BY b.expiry_date
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/low-stock', async (c) => {
    const rows = await sql`
      SELECT p.*, COALESCE(SUM(sl.quantity), 0) as total_stock
      FROM zvd_products p LEFT JOIN zvd_stock_levels sl ON sl.product_id = p.id
      WHERE p.is_active = true AND p.reorder_point > 0
      GROUP BY p.id HAVING COALESCE(SUM(sl.quantity), 0) <= p.reorder_point
      ORDER BY (COALESCE(SUM(sl.quantity), 0) - p.reorder_point) ASC
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/valuation', async (c) => {
    const rows = await sql`
      SELECT p.id, p.name, p.sku, p.avg_cost, COALESCE(SUM(sl.quantity), 0) as total_qty,
        COALESCE(SUM(sl.quantity), 0) * p.avg_cost as inventory_value
      FROM zvd_products p LEFT JOIN zvd_stock_levels sl ON sl.product_id = p.id
      WHERE p.is_active = true GROUP BY p.id ORDER BY inventory_value DESC
    `.execute(db);
    const total = (rows.rows as any[]).reduce((s, r) => s + +r.inventory_value, 0);
    return c.json({ data: rows.rows, meta: { total_value: total } });
  });

  return app;
}
