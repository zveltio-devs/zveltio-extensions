import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';

export function ecommerceRoutes(db: any, auth: any): Hono {
  const app = new Hono();

  // Public routes (no auth) — storefront
  app.get('/public/categories', async (c) => {
    const rows = await sql`SELECT id, name, slug, description, image_url FROM zvd_ec_categories WHERE is_active = true ORDER BY sort_order, name`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/public/products', async (c) => {
    const { limit = '20', page = '1', q, category_id, sort = 'newest' } = c.req.query();
    const lim = Math.min(+limit, 100);
    const offset = (Math.max(1, +page) - 1) * lim;
    const orderClause = sort === 'price_asc' ? sql`p.price ASC` : sort === 'price_desc' ? sql`p.price DESC` : sql`p.created_at DESC`;
    const rows = await sql`
      SELECT p.id, p.name, p.slug, p.description, p.price, p.compare_at_price, p.currency,
        p.images, p.tags, p.stock_quantity, cat.name as category_name
      FROM zvd_ec_products p
      LEFT JOIN zvd_ec_categories cat ON cat.id = p.category_id
      WHERE p.status = 'active' AND p.stock_quantity > 0
        AND (${q ? sql`(p.name ILIKE ${'%' + q + '%'} OR p.description ILIKE ${'%' + q + '%'})` : sql`TRUE`})
        AND (${category_id ? sql`p.category_id = ${category_id}` : sql`TRUE`})
      ORDER BY ${orderClause}
      LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/public/products/:slug', async (c) => {
    const row = await sql`
      SELECT p.*, cat.name as category_name
      FROM zvd_ec_products p LEFT JOIN zvd_ec_categories cat ON cat.id = p.category_id
      WHERE p.slug = ${c.req.param('slug')} AND p.status = 'active'
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // Auth middleware for admin routes
  app.use('/admin/*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  // ── Admin: Categories ─────────────────────────────────────────
  app.get('/admin/categories', async (c) => {
    const rows = await sql`SELECT * FROM zvd_ec_categories ORDER BY sort_order, name`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/admin/categories', zValidator('json', z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional(),
    image_url: z.string().url().optional(),
    sort_order: z.number().int().default(0),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_ec_categories (name, slug, description, image_url, sort_order, created_by)
      VALUES (${d.name}, ${d.slug}, ${d.description ?? null}, ${d.image_url ?? null}, ${d.sort_order}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Admin: Products ───────────────────────────────────────────
  app.get('/admin/products', async (c) => {
    const { limit = '50', page = '1', status } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT p.*, cat.name as category_name
      FROM zvd_ec_products p LEFT JOIN zvd_ec_categories cat ON cat.id = p.category_id
      WHERE (${status ? sql`p.status = ${status}` : sql`TRUE`})
      ORDER BY p.created_at DESC LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/admin/products', zValidator('json', z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional(),
    category_id: z.string().uuid().optional(),
    price: z.number().min(0),
    compare_at_price: z.number().optional(),
    cost_price: z.number().optional(),
    currency: z.string().default('RON'),
    sku: z.string().optional(),
    stock_quantity: z.number().int().min(0).default(0),
    images: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    weight_grams: z.number().optional(),
    requires_shipping: z.boolean().default(true),
    tax_rate: z.number().default(19),
    metadata: z.record(z.any()).default({}),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_ec_products (name, slug, description, category_id, price, compare_at_price, cost_price,
        currency, sku, stock_quantity, images, tags, weight_grams, requires_shipping, tax_rate, metadata, created_by)
      VALUES (${d.name}, ${d.slug}, ${d.description ?? null}, ${d.category_id ?? null},
        ${d.price}, ${d.compare_at_price ?? null}, ${d.cost_price ?? null}, ${d.currency},
        ${d.sku ?? null}, ${d.stock_quantity}, ${JSON.stringify(d.images)}, ${JSON.stringify(d.tags)},
        ${d.weight_grams ?? null}, ${d.requires_shipping}, ${d.tax_rate}, ${JSON.stringify(d.metadata)}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/admin/products/:id', zValidator('json', z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.number().optional(),
    stock_quantity: z.number().int().optional(),
    status: z.enum(['active','draft','archived']).optional(),
    images: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_ec_products SET
        name = COALESCE(${d.name ?? null}, name),
        description = COALESCE(${d.description ?? null}, description),
        price = COALESCE(${d.price ?? null}, price),
        stock_quantity = COALESCE(${d.stock_quantity ?? null}, stock_quantity),
        status = COALESCE(${d.status ?? null}, status),
        images = COALESCE(${d.images ? JSON.stringify(d.images) : null}, images),
        tags = COALESCE(${d.tags ? JSON.stringify(d.tags) : null}, tags),
        updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.delete('/admin/products/:id', async (c) => {
    await sql`UPDATE zvd_ec_products SET status = 'archived', updated_at = NOW() WHERE id = ${c.req.param('id')}`.execute(db);
    return c.json({ success: true });
  });

  // ── Orders (public checkout + admin management) ────────────────
  app.post('/orders', zValidator('json', z.object({
    customer_email: z.string().email(),
    customer_name: z.string().min(1),
    customer_phone: z.string().optional(),
    shipping_address: z.string().optional(),
    currency: z.string().default('RON'),
    coupon_code: z.string().optional(),
    notes: z.string().optional(),
    lines: z.array(z.object({
      product_id: z.string().uuid(),
      quantity: z.number().int().positive(),
    })).min(1),
  })), async (c) => {
    const d = c.req.valid('json');
    // Validate products & compute totals
    let subtotal = 0;
    const lineData: any[] = [];
    for (const line of d.lines) {
      const prod = await sql`SELECT * FROM zvd_ec_products WHERE id = ${line.product_id} AND status = 'active'`.execute(db);
      if (!prod.rows.length) return c.json({ error: `Product ${line.product_id} not found` }, 400);
      const p = prod.rows[0] as any;
      if (p.stock_quantity < line.quantity) return c.json({ error: `Insufficient stock for ${p.name}` }, 400);
      const lineTotal = p.price * line.quantity;
      subtotal += lineTotal;
      lineData.push({ product_id: p.id, product_name: p.name, sku: p.sku, quantity: line.quantity, unit_price: p.price, tax_rate: p.tax_rate, total: lineTotal });
    }
    // Apply coupon
    let discount_amount = 0;
    let coupon_id = null;
    if (d.coupon_code) {
      const coupon = await sql`
        SELECT * FROM zvd_ec_coupons WHERE code = ${d.coupon_code} AND is_active = true
          AND (expires_at IS NULL OR expires_at > NOW())
          AND (usage_limit IS NULL OR usage_count < usage_limit)
      `.execute(db);
      if (coupon.rows.length) {
        const cp = coupon.rows[0] as any;
        coupon_id = cp.id;
        if (cp.discount_type === 'percent') discount_amount = subtotal * cp.discount_value / 100;
        else discount_amount = Math.min(cp.discount_value, subtotal);
        await sql`UPDATE zvd_ec_coupons SET usage_count = usage_count + 1 WHERE id = ${cp.id}`.execute(db);
      }
    }
    const tax_amount = lineData.reduce((s, l) => s + l.total * l.tax_rate / 100, 0);
    const total = subtotal - discount_amount + tax_amount;
    // Generate order number
    const cnt = await sql`SELECT COUNT(*) as cnt FROM zvd_ec_orders`.execute(db);
    const number = `ORD-${String(+(cnt.rows[0] as any).cnt + 1).padStart(6, '0')}`;
    const order = await sql`
      INSERT INTO zvd_ec_orders (number, customer_email, customer_name, customer_phone, shipping_address,
        currency, subtotal, discount_amount, tax_amount, total, coupon_id, notes)
      VALUES (${number}, ${d.customer_email}, ${d.customer_name}, ${d.customer_phone ?? null},
        ${d.shipping_address ?? null}, ${d.currency}, ${subtotal}, ${discount_amount}, ${tax_amount},
        ${total}, ${coupon_id}, ${d.notes ?? null})
      RETURNING *
    `.execute(db);
    const orderId = (order.rows[0] as any).id;
    for (const line of lineData) {
      await sql`
        INSERT INTO zvd_ec_order_items (order_id, product_id, product_name, sku, quantity, unit_price, tax_rate, total)
        VALUES (${orderId}, ${line.product_id}, ${line.product_name}, ${line.sku ?? null}, ${line.quantity}, ${line.unit_price}, ${line.tax_rate}, ${line.total})
      `.execute(db);
      await sql`UPDATE zvd_ec_products SET stock_quantity = stock_quantity - ${line.quantity}, updated_at = NOW() WHERE id = ${line.product_id}`.execute(db);
    }
    return c.json({ data: order.rows[0] }, 201);
  });

  app.get('/admin/orders', async (c) => {
    const { limit = '50', page = '1', status } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT o.*,
        COALESCE(json_agg(json_build_object('product_name', i.product_name, 'quantity', i.quantity, 'total', i.total) ORDER BY i.id) FILTER (WHERE i.id IS NOT NULL), '[]') as items
      FROM zvd_ec_orders o LEFT JOIN zvd_ec_order_items i ON i.order_id = o.id
      WHERE (${status ? sql`o.status = ${status}` : sql`TRUE`})
      GROUP BY o.id ORDER BY o.created_at DESC LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.patch('/admin/orders/:id', zValidator('json', z.object({
    status: z.enum(['pending','confirmed','processing','shipped','delivered','cancelled','refunded']).optional(),
    tracking_number: z.string().optional(),
    notes: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_ec_orders SET
        status = COALESCE(${d.status ?? null}, status),
        tracking_number = COALESCE(${d.tracking_number ?? null}, tracking_number),
        notes = COALESCE(${d.notes ?? null}, notes),
        updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // ── Coupons ───────────────────────────────────────────────────
  app.get('/admin/coupons', async (c) => {
    const rows = await sql`SELECT * FROM zvd_ec_coupons ORDER BY created_at DESC`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/admin/coupons', zValidator('json', z.object({
    code: z.string().min(3).max(30).toUpperCase(),
    discount_type: z.enum(['percent','fixed']),
    discount_value: z.number().positive(),
    usage_limit: z.number().int().optional(),
    expires_at: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_ec_coupons (code, discount_type, discount_value, usage_limit, expires_at, created_by)
      VALUES (${d.code}, ${d.discount_type}, ${d.discount_value}, ${d.usage_limit ?? null}, ${d.expires_at ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Stats ─────────────────────────────────────────────────────
  app.get('/admin/stats', async (c) => {
    const row = await sql`
      SELECT
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelled','refunded')), 0) as total_revenue,
        COUNT(DISTINCT customer_email) as unique_customers
      FROM zvd_ec_orders
    `.execute(db);
    const topProducts = await sql`
      SELECT i.product_name, SUM(i.quantity) as units_sold, SUM(i.total) as revenue
      FROM zvd_ec_order_items i
      JOIN zvd_ec_orders o ON o.id = i.order_id
      WHERE o.status NOT IN ('cancelled','refunded')
      GROUP BY i.product_name ORDER BY units_sold DESC LIMIT 5
    `.execute(db);
    return c.json({ data: { ...(row.rows[0] as any), top_products: topProducts.rows } });
  });

  return app;
}
