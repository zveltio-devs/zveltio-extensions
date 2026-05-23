import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { permissionGate } from '@zveltio/sdk/extension';

export function ecommerceRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;
  const app = new Hono();

  // ── Storefront (public, no auth) ───────────────────────────────
  app.get('/public/categories', async (c) => {
    const rows = await sql`SELECT id, name, slug, description, image_url, parent_id FROM zvd_ec_categories WHERE is_active = true ORDER BY sort_order, name`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/public/products', async (c) => {
    const { limit = '20', page = '1', q, category_id, sort = 'newest', min_price, max_price } = c.req.query();
    const lim = Math.min(+limit, 100);
    const offset = (Math.max(1, +page) - 1) * lim;
    const orderClause = sort === 'price_asc' ? sql`p.price ASC` : sort === 'price_desc' ? sql`p.price DESC` : sort === 'rating' ? sql`p.avg_rating DESC NULLS LAST` : sql`p.created_at DESC`;
    const rows = await sql`
      SELECT p.id, p.name, p.slug, p.short_description, p.price, p.compare_price, p.currency,
        p.images, p.stock_qty, p.avg_rating, p.review_count, p.tags, cat.name as category_name
      FROM zvd_ec_products p
      LEFT JOIN zvd_ec_categories cat ON cat.id = p.category_id
      WHERE p.status = 'active'
        AND (${q ? sql`(p.name ILIKE ${'%' + q + '%'} OR p.description ILIKE ${'%' + q + '%'})` : sql`TRUE`})
        AND (${category_id ? sql`p.category_id = ${category_id}` : sql`TRUE`})
        AND (${min_price ? sql`p.price >= ${min_price}` : sql`TRUE`})
        AND (${max_price ? sql`p.price <= ${max_price}` : sql`TRUE`})
      ORDER BY ${orderClause}
      LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/public/products/:slug', async (c) => {
    const row = await sql`
      SELECT p.*, cat.name as category_name,
        COALESCE(json_agg(v ORDER BY v.sort_order) FILTER (WHERE v.id IS NOT NULL AND v.is_active), '[]'::json) as variants
      FROM zvd_ec_products p
      LEFT JOIN zvd_ec_categories cat ON cat.id = p.category_id
      LEFT JOIN zvd_ec_product_variants v ON v.product_id = p.id
      WHERE p.slug = ${c.req.param('slug')} AND p.status = 'active'
      GROUP BY p.id, cat.name
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    // Approved reviews
    const reviews = await sql`
      SELECT id, customer_name, rating, title, body, is_verified_purchase, created_at
      FROM zvd_ec_product_reviews WHERE product_id = ${(row.rows[0] as any).id} AND status = 'approved'
      ORDER BY created_at DESC LIMIT 10
    `.execute(db);
    return c.json({ data: { ...(row.rows[0] as any), reviews: reviews.rows } });
  });

  // Shipping rates for a country
  app.get('/public/shipping-rates', async (c) => {
    const { country = 'RO', order_total } = c.req.query();
    const rows = await sql`
      SELECT r.*, z.name as zone_name
      FROM zvd_ec_shipping_rates r
      JOIN zvd_ec_shipping_zones z ON z.id = r.zone_id
      WHERE z.is_active = true AND r.is_active = true
        AND (${country} = ANY(z.countries) OR array_length(z.countries, 1) = 0 OR z.countries = '{}')
      ORDER BY r.price
    `.execute(db);
    // Filter free-above-amount
    const filtered = (rows.rows as any[]).filter(r =>
      r.type !== 'free_above' || !order_total || +order_total >= +r.free_above_amount
    );
    return c.json({ data: filtered });
  });

  // Submit product review (public)
  app.post('/public/products/:id/reviews', zValidator('json', z.object({
    customer_name: z.string().min(1),
    customer_email: z.string().email(),
    rating: z.number().int().min(1).max(5),
    title: z.string().optional(),
    body: z.string().optional(),
    order_id: z.string().uuid().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    // Check if verified purchase
    let isVerified = false;
    if (d.order_id) {
      const ord = await sql`
        SELECT o.id FROM zvd_ec_orders o JOIN zvd_ec_order_items i ON i.order_id = o.id
        WHERE o.id = ${d.order_id} AND o.customer_email = ${d.customer_email}
          AND i.product_id = ${c.req.param('id')} AND o.status NOT IN ('cancelled','refunded')
      `.execute(db);
      isVerified = ord.rows.length > 0;
    }
    const row = await sql`
      INSERT INTO zvd_ec_product_reviews (product_id, customer_name, customer_email, rating, title, body, order_id, is_verified_purchase)
      VALUES (${c.req.param('id')}, ${d.customer_name}, ${d.customer_email}, ${d.rating}, ${d.title ?? null}, ${d.body ?? null}, ${d.order_id ?? null}, ${isVerified})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // Abandoned cart save (public)
  app.post('/public/carts', zValidator('json', z.object({
    session_id: z.string().min(1),
    customer_email: z.string().email().optional(),
    customer_name: z.string().optional(),
    items: z.array(z.any()).min(1),
    subtotal: z.number().min(0),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_ec_abandoned_carts (session_id, customer_email, customer_name, items, subtotal)
      VALUES (${d.session_id}, ${d.customer_email ?? null}, ${d.customer_name ?? null}, ${JSON.stringify(d.items)}, ${d.subtotal})
      ON CONFLICT (session_id) DO UPDATE SET items = EXCLUDED.items, subtotal = EXCLUDED.subtotal,
        customer_email = COALESCE(EXCLUDED.customer_email, zvd_ec_abandoned_carts.customer_email),
        updated_at = NOW()
      RETURNING id, recovery_token
    `.execute(db);
    return c.json({ data: row.rows[0] });
  });

  // Auth middleware for admin routes
  app.use('/admin/*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });
  app.use('/admin/*', permissionGate(ctx, 'store'));

  // ── Admin: Categories ──────────────────────────────────────────
  app.get('/admin/categories', async (c) => {
    const rows = await sql`SELECT * FROM zvd_ec_categories ORDER BY sort_order, name`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/admin/categories', zValidator('json', z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional(),
    image_url: z.string().optional(),
    parent_id: z.string().uuid().optional(),
    sort_order: z.number().int().default(0),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_ec_categories (name, slug, description, image_url, parent_id, sort_order, created_by)
      VALUES (${d.name}, ${d.slug}, ${d.description ?? null}, ${d.image_url ?? null}, ${d.parent_id ?? null}, ${d.sort_order}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/admin/categories/:id', zValidator('json', z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    is_active: z.boolean().optional(),
    sort_order: z.number().int().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_ec_categories SET
        name = COALESCE(${d.name ?? null}, name),
        description = COALESCE(${d.description ?? null}, description),
        is_active = COALESCE(${d.is_active ?? null}, is_active),
        sort_order = COALESCE(${d.sort_order ?? null}, sort_order)
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // ── Admin: Products ────────────────────────────────────────────
  app.get('/admin/products', async (c) => {
    const { limit = '50', page = '1', status, q } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT p.*, cat.name as category_name, COUNT(v.id) as variant_count
      FROM zvd_ec_products p
      LEFT JOIN zvd_ec_categories cat ON cat.id = p.category_id
      LEFT JOIN zvd_ec_product_variants v ON v.product_id = p.id
      WHERE (${status ? sql`p.status = ${status}` : sql`TRUE`})
        AND (${q ? sql`(p.name ILIKE ${'%' + q + '%'} OR p.sku ILIKE ${'%' + q + '%'})` : sql`TRUE`})
      GROUP BY p.id, cat.name ORDER BY p.created_at DESC LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/admin/products', zValidator('json', z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    sku: z.string().min(1),
    description: z.string().optional(),
    short_description: z.string().optional(),
    category_id: z.string().uuid().optional(),
    price: z.number().min(0),
    compare_price: z.number().optional(),
    cost: z.number().optional(),
    currency: z.string().default('RON'),
    tax_rate: z.number().default(19),
    stock_qty: z.number().int().min(0).default(0),
    track_stock: z.boolean().default(true),
    allow_backorder: z.boolean().default(false),
    weight: z.number().optional(),
    images: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    status: z.enum(['draft','active','archived']).default('draft'),
    is_featured: z.boolean().default(false),
    digital_file_url: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');

    // If inventory extension is active, find/create the canonical product by SKU
    // so storefront and inventory share one product identity. The ec_products row
    // becomes a storefront overlay (slug, SEO, images) on top of the canonical row.
    let canonicalProductId: string | null = null;
    const findBySku = ctx.services.get<(sku: string) => Promise<any | null>>('inventory.products.findBySku');
    if (findBySku) {
      try {
        const existing = await findBySku(d.sku);
        if (existing) {
          canonicalProductId = existing.id;
        } else {
          // Create canonical product directly via the extension's writable db
          const create = await sql<any>`
            INSERT INTO zvd_products (sku, name, description, price, currency, tax_rate, is_active)
            VALUES (${d.sku}, ${d.name}, ${d.description ?? null}, ${d.price}, ${d.currency}, ${d.tax_rate}, ${d.status === 'active'})
            ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
          `.execute(db).catch(() => null);
          canonicalProductId = create?.rows[0]?.id ?? null;
        }
      } catch { /* inventory may be unavailable; storefront-only product is fine */ }
    }

    const row = await sql`
      INSERT INTO zvd_ec_products (name, slug, sku, canonical_product_id, description, short_description, category_id, price, compare_price, cost, currency,
        tax_rate, stock_qty, track_stock, allow_backorder, weight, images, tags, attributes, status, is_featured, digital_file_url, created_by)
      VALUES (${d.name}, ${d.slug}, ${d.sku}, ${canonicalProductId}, ${d.description ?? null}, ${d.short_description ?? null}, ${d.category_id ?? null},
        ${d.price}, ${d.compare_price ?? null}, ${d.cost ?? null}, ${d.currency}, ${d.tax_rate},
        ${d.stock_qty}, ${d.track_stock}, ${d.allow_backorder}, ${d.weight ?? null},
        ${JSON.stringify(d.images)}, ${JSON.stringify(d.tags)}, '{}', ${d.status}, ${d.is_featured},
        ${d.digital_file_url ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/admin/products/:id', zValidator('json', z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.number().optional(),
    compare_price: z.number().optional(),
    stock_qty: z.number().int().optional(),
    status: z.enum(['draft','active','archived']).optional(),
    is_featured: z.boolean().optional(),
    images: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    category_id: z.string().uuid().optional(),
    tax_rate: z.number().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_ec_products SET
        name = COALESCE(${d.name ?? null}, name),
        description = COALESCE(${d.description ?? null}, description),
        price = COALESCE(${d.price ?? null}, price),
        compare_price = COALESCE(${d.compare_price ?? null}, compare_price),
        stock_qty = COALESCE(${d.stock_qty ?? null}, stock_qty),
        status = COALESCE(${d.status ?? null}, status),
        is_featured = COALESCE(${d.is_featured ?? null}, is_featured),
        images = COALESCE(${d.images ? JSON.stringify(d.images) : null}::jsonb, images),
        tags = COALESCE(${d.tags ? JSON.stringify(d.tags) : null}::text[], tags),
        category_id = COALESCE(${d.category_id ?? null}, category_id),
        tax_rate = COALESCE(${d.tax_rate ?? null}, tax_rate),
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

  // ── Product Variants ───────────────────────────────────────────
  app.get('/admin/products/:id/variants', async (c) => {
    const rows = await sql`SELECT * FROM zvd_ec_product_variants WHERE product_id = ${c.req.param('id')} ORDER BY sort_order`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/admin/products/:id/variants', zValidator('json', z.object({
    sku: z.string().min(1),
    name: z.string().min(1),
    attributes: z.record(z.string()).default({}),
    price: z.number().optional(),
    compare_price: z.number().optional(),
    cost: z.number().optional(),
    stock_qty: z.number().int().min(0).default(0),
    weight: z.number().optional(),
    image_url: z.string().optional(),
    sort_order: z.number().int().default(0),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_ec_product_variants (product_id, sku, name, attributes, price, compare_price, cost, stock_qty, weight, image_url, sort_order)
      VALUES (${c.req.param('id')}, ${d.sku}, ${d.name}, ${JSON.stringify(d.attributes)},
        ${d.price ?? null}, ${d.compare_price ?? null}, ${d.cost ?? null}, ${d.stock_qty},
        ${d.weight ?? null}, ${d.image_url ?? null}, ${d.sort_order})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/admin/variants/:id', zValidator('json', z.object({
    name: z.string().optional(),
    price: z.number().optional(),
    stock_qty: z.number().int().optional(),
    is_active: z.boolean().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_ec_product_variants SET
        name = COALESCE(${d.name ?? null}, name),
        price = COALESCE(${d.price ?? null}, price),
        stock_qty = COALESCE(${d.stock_qty ?? null}, stock_qty),
        is_active = COALESCE(${d.is_active ?? null}, is_active)
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.delete('/admin/variants/:id', async (c) => {
    await sql`UPDATE zvd_ec_product_variants SET is_active = false WHERE id = ${c.req.param('id')}`.execute(db);
    return c.json({ success: true });
  });

  // ── Shipping Zones & Rates ─────────────────────────────────────
  app.get('/admin/shipping-zones', async (c) => {
    const rows = await sql`
      SELECT z.*, COUNT(r.id) as rate_count FROM zvd_ec_shipping_zones z
      LEFT JOIN zvd_ec_shipping_rates r ON r.zone_id = z.id AND r.is_active = true
      GROUP BY z.id ORDER BY z.sort_order
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/admin/shipping-zones', zValidator('json', z.object({
    name: z.string().min(1),
    countries: z.array(z.string()).default([]),
    regions: z.array(z.string()).default([]),
    sort_order: z.number().int().default(0),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_ec_shipping_zones (name, countries, regions, sort_order, created_by)
      VALUES (${d.name}, ${JSON.stringify(d.countries)}, ${JSON.stringify(d.regions)}, ${d.sort_order}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.post('/admin/shipping-zones/:id/rates', zValidator('json', z.object({
    name: z.string().min(1),
    type: z.enum(['flat','weight','free_above']).default('flat'),
    price: z.number().min(0).default(0),
    free_above_amount: z.number().optional(),
    estimated_days_min: z.number().int().optional(),
    estimated_days_max: z.number().int().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_ec_shipping_rates (zone_id, name, type, price, free_above_amount, estimated_days_min, estimated_days_max)
      VALUES (${c.req.param('id')}, ${d.name}, ${d.type}, ${d.price}, ${d.free_above_amount ?? null},
        ${d.estimated_days_min ?? null}, ${d.estimated_days_max ?? null})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Tax Rules ──────────────────────────────────────────────────
  app.get('/admin/tax-rules', async (c) => {
    const rows = await sql`SELECT * FROM zvd_ec_tax_rules WHERE is_active = true ORDER BY country, region`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/admin/tax-rules', zValidator('json', z.object({
    name: z.string().min(1),
    country: z.string().length(2).default('RO'),
    region: z.string().optional(),
    rate: z.number().min(0).max(100),
    applies_to: z.enum(['all','physical','digital']).default('all'),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_ec_tax_rules (name, country, region, rate, applies_to)
      VALUES (${d.name}, ${d.country}, ${d.region ?? null}, ${d.rate}, ${d.applies_to})
      ON CONFLICT (country, region, applies_to) DO UPDATE SET rate = ${d.rate}, name = ${d.name}
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Checkout ───────────────────────────────────────────────────
  app.post('/orders', zValidator('json', z.object({
    customer_email: z.string().email(),
    customer_name: z.string().min(1),
    billing_address: z.record(z.string(), z.any()).default({}),
    shipping_address: z.record(z.string(), z.any()).default({}),
    payment_method: z.string().optional(),
    currency: z.string().default('RON'),
    coupon_code: z.string().optional(),
    shipping_rate_id: z.string().uuid().optional(),
    notes: z.string().optional(),
    session_id: z.string().optional(),
    lines: z.array(z.object({
      product_id: z.string().uuid(),
      variant_id: z.string().uuid().optional(),
      quantity: z.number().int().positive(),
    })).min(1),
  })), async (c) => {
    const d = c.req.valid('json');
    let subtotal = 0;
    const lineData: any[] = [];
    for (const line of d.lines) {
      const prod = await sql`SELECT * FROM zvd_ec_products WHERE id = ${line.product_id} AND status = 'active'`.execute(db);
      if (!prod.rows.length) return c.json({ error: `Product ${line.product_id} not found` }, 400);
      const p = prod.rows[0] as any;
      let price = +p.price;
      let sku = p.sku;
      let variantId = line.variant_id ?? null;
      if (line.variant_id) {
        const v = await sql`SELECT * FROM zvd_ec_product_variants WHERE id = ${line.variant_id} AND product_id = ${line.product_id} AND is_active = true`.execute(db);
        if (!v.rows.length) return c.json({ error: 'Variant not found' }, 400);
        const variant = v.rows[0] as any;
        if (variant.price !== null) price = +variant.price;
        sku = variant.sku;
        if (p.track_stock && variant.stock_qty < line.quantity && !p.allow_backorder)
          return c.json({ error: `Insufficient stock for ${p.name} (${variant.name})` }, 400);
      } else {
        if (p.track_stock && p.stock_qty < line.quantity && !p.allow_backorder)
          return c.json({ error: `Insufficient stock for ${p.name}` }, 400);
      }
      const lineTotal = price * line.quantity;
      subtotal += lineTotal;
      lineData.push({ product_id: p.id, variant_id: variantId, product_name: p.name, sku, quantity: line.quantity, unit_price: price, tax_rate: +p.tax_rate, total: lineTotal });
    }
    // Apply coupon
    let discount = 0;
    let couponCode = d.coupon_code ?? null;
    if (d.coupon_code) {
      const coupon = await sql`
        SELECT * FROM zvd_ec_coupons WHERE code = ${d.coupon_code} AND is_active = true
          AND (valid_until IS NULL OR valid_until > NOW())
          AND (max_uses IS NULL OR used_count < max_uses)
          AND (min_order_amount IS NULL OR ${subtotal} >= min_order_amount)
      `.execute(db);
      if (coupon.rows.length) {
        const cp = coupon.rows[0] as any;
        discount = cp.type === 'percent' ? subtotal * +cp.value / 100 : Math.min(+cp.value, subtotal);
        await sql`UPDATE zvd_ec_coupons SET used_count = used_count + 1 WHERE id = ${cp.id}`.execute(db);
      }
    }
    // Shipping cost
    let shippingCost = 0;
    let shippingZoneId = null;
    if (d.shipping_rate_id) {
      const rate = await sql`SELECT r.*, z.id as zone_id FROM zvd_ec_shipping_rates r JOIN zvd_ec_shipping_zones z ON z.id = r.zone_id WHERE r.id = ${d.shipping_rate_id} AND r.is_active = true`.execute(db);
      if (rate.rows.length) {
        shippingCost = +(rate.rows[0] as any).price;
        shippingZoneId = (rate.rows[0] as any).zone_id;
      }
    }
    const taxAmount = lineData.reduce((s, l) => s + l.total * l.tax_rate / 100, 0);
    const total = Math.max(0, subtotal - discount + taxAmount + shippingCost);
    const cnt = await sql`SELECT COUNT(*) as cnt FROM zvd_ec_orders`.execute(db);
    const orderNumber = `ORD-${String(+(cnt.rows[0] as any).cnt + 1).padStart(6, '0')}`;

    // If CRM is active, find or create a canonical contact for this order's email.
    // The shopper becomes a CRM contact; future invoices, support tickets, marketing
    // see the same identity.
    let canonicalContactId: string | null = null;
    if (d.customer_email) {
      const lookup = ctx.services.get<(email: string) => Promise<any | null>>('crm.contacts.findByEmail');
      const create = ctx.services.get<(input: any) => Promise<any>>('crm.contacts.create');
      if (lookup && create) {
        try {
          let contact = await lookup(d.customer_email);
          if (!contact) {
            const [first_name, ...rest] = (d.customer_name || d.customer_email).split(' ');
            contact = await create({
              first_name: first_name || d.customer_email,
              last_name: rest.join(' ') || null,
              email: d.customer_email,
              created_by: 'system',
            });
          }
          canonicalContactId = contact?.id ?? null;
        } catch { /* CRM may be temporarily unavailable */ }
      }
    }

    const order = await sql`
      INSERT INTO zvd_ec_orders (order_number, customer_email, customer_name, canonical_contact_id, billing_address, shipping_address,
        payment_method, currency, subtotal, shipping_cost, discount, tax_amount, total,
        coupon_code, shipping_zone_id, notes, created_by)
      VALUES (${orderNumber}, ${d.customer_email}, ${d.customer_name}, ${canonicalContactId}, ${JSON.stringify(d.billing_address)},
        ${JSON.stringify(d.shipping_address)}, ${d.payment_method ?? null}, ${d.currency},
        ${subtotal}, ${shippingCost}, ${discount}, ${taxAmount}, ${total},
        ${couponCode}, ${shippingZoneId}, ${d.notes ?? null}, 'guest')
      RETURNING *
    `.execute(db);
    const orderId = (order.rows[0] as any).id;
    for (const line of lineData) {
      await sql`
        INSERT INTO zvd_ec_order_items (order_id, product_id, variant_id, product_name, sku, quantity, unit_price, tax_rate, total)
        VALUES (${orderId}, ${line.product_id}, ${line.variant_id}, ${line.product_name}, ${line.sku ?? null},
          ${line.quantity}, ${line.unit_price}, ${line.tax_rate}, ${line.total})
      `.execute(db);
      if (line.variant_id) {
        await sql`UPDATE zvd_ec_product_variants SET stock_qty = stock_qty - ${line.quantity} WHERE id = ${line.variant_id}`.execute(db);
      } else {
        await sql`UPDATE zvd_ec_products SET stock_qty = stock_qty - ${line.quantity}, updated_at = NOW() WHERE id = ${line.product_id}`.execute(db);
      }
    }
    // Mark cart as recovered
    if (d.session_id) {
      await sql`UPDATE zvd_ec_abandoned_carts SET recovered_at = NOW() WHERE session_id = ${d.session_id}`.execute(db);
    }
    return c.json({ data: order.rows[0] }, 201);
  });

  // ── Admin: Orders ──────────────────────────────────────────────
  app.get('/admin/orders', async (c) => {
    const { limit = '50', page = '1', status, payment_status } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT o.*,
        COALESCE(json_agg(json_build_object('product_name', i.product_name, 'quantity', i.quantity, 'total', i.total) ORDER BY i.id) FILTER (WHERE i.id IS NOT NULL), '[]') as items
      FROM zvd_ec_orders o LEFT JOIN zvd_ec_order_items i ON i.order_id = o.id
      WHERE (${status ? sql`o.status = ${status}` : sql`TRUE`})
        AND (${payment_status ? sql`o.payment_status = ${payment_status}` : sql`TRUE`})
      GROUP BY o.id ORDER BY o.created_at DESC LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/admin/orders/:id', async (c) => {
    const row = await sql`SELECT * FROM zvd_ec_orders WHERE id = ${c.req.param('id')}`.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    const items = await sql`SELECT * FROM zvd_ec_order_items WHERE order_id = ${c.req.param('id')}`.execute(db);
    return c.json({ data: { ...(row.rows[0] as any), items: items.rows } });
  });

  app.patch('/admin/orders/:id', zValidator('json', z.object({
    status: z.enum(['pending','processing','shipped','delivered','cancelled','refunded']).optional(),
    payment_status: z.enum(['unpaid','paid','refunded','partial']).optional(),
    tracking_number: z.string().optional(),
    notes: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_ec_orders SET
        status = COALESCE(${d.status ?? null}, status),
        payment_status = COALESCE(${d.payment_status ?? null}, payment_status),
        tracking_number = COALESCE(${d.tracking_number ?? null}, tracking_number),
        notes = COALESCE(${d.notes ?? null}, notes),
        shipping_tracking = COALESCE(${d.tracking_number ?? null}, shipping_tracking),
        updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // ── Admin: Coupons ─────────────────────────────────────────────
  app.get('/admin/coupons', async (c) => {
    const rows = await sql`SELECT * FROM zvd_ec_coupons ORDER BY created_at DESC`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/admin/coupons', zValidator('json', z.object({
    code: z.string().min(3).max(30).toUpperCase(),
    type: z.enum(['percent','fixed']).default('percent'),
    value: z.number().positive(),
    min_order_amount: z.number().optional(),
    max_uses: z.number().int().optional(),
    valid_until: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_ec_coupons (code, type, value, min_order_amount, max_uses, valid_until, created_by)
      VALUES (${d.code}, ${d.type}, ${d.value}, ${d.min_order_amount ?? null}, ${d.max_uses ?? null}, ${d.valid_until ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/admin/coupons/:id', zValidator('json', z.object({
    is_active: z.boolean().optional(),
    max_uses: z.number().int().optional(),
    valid_until: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_ec_coupons SET
        is_active = COALESCE(${d.is_active ?? null}, is_active),
        max_uses = COALESCE(${d.max_uses ?? null}, max_uses),
        valid_until = COALESCE(${d.valid_until ?? null}, valid_until)
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // ── Admin: Reviews ─────────────────────────────────────────────
  app.get('/admin/reviews', async (c) => {
    const { status = 'pending' } = c.req.query();
    const rows = await sql`
      SELECT r.*, p.name as product_name
      FROM zvd_ec_product_reviews r JOIN zvd_ec_products p ON p.id = r.product_id
      WHERE r.status = ${status} ORDER BY r.created_at DESC
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.patch('/admin/reviews/:id', zValidator('json', z.object({
    status: z.enum(['approved','rejected']),
  })), async (c) => {
    const { status } = c.req.valid('json');
    const row = await sql`UPDATE zvd_ec_product_reviews SET status = ${status} WHERE id = ${c.req.param('id')} RETURNING *`.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    // Update product avg_rating
    const productId = (row.rows[0] as any).product_id;
    await sql`
      UPDATE zvd_ec_products SET
        avg_rating = (SELECT ROUND(AVG(rating), 2) FROM zvd_ec_product_reviews WHERE product_id = ${productId} AND status = 'approved'),
        review_count = (SELECT COUNT(*) FROM zvd_ec_product_reviews WHERE product_id = ${productId} AND status = 'approved')
      WHERE id = ${productId}
    `.execute(db);
    return c.json({ data: row.rows[0] });
  });

  // ── Admin: Abandoned Carts ─────────────────────────────────────
  app.get('/admin/abandoned-carts', async (c) => {
    const { limit = '50' } = c.req.query();
    const rows = await sql`
      SELECT * FROM zvd_ec_abandoned_carts WHERE recovered_at IS NULL ORDER BY updated_at DESC LIMIT ${Math.min(+limit, 200)}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  // ── Admin: Stats ───────────────────────────────────────────────
  app.get('/admin/stats', async (c) => {
    const { from, to } = c.req.query();
    const fromDate = from ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const toDate = to ?? new Date().toISOString().slice(0, 10);
    const row = await sql`
      SELECT
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'processing') as processing,
        COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelled','refunded') AND payment_status = 'paid'), 0) as revenue,
        COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelled','refunded')), 0) as gmv,
        COALESCE(AVG(total) FILTER (WHERE status NOT IN ('cancelled','refunded')), 0) as avg_order_value,
        COUNT(DISTINCT customer_email) as unique_customers
      FROM zvd_ec_orders WHERE created_at::date BETWEEN ${fromDate} AND ${toDate}
    `.execute(db);
    const topProducts = await sql`
      SELECT i.product_name, SUM(i.quantity) as units_sold, SUM(i.total) as revenue
      FROM zvd_ec_order_items i
      JOIN zvd_ec_orders o ON o.id = i.order_id
      WHERE o.status NOT IN ('cancelled','refunded') AND o.created_at::date BETWEEN ${fromDate} AND ${toDate}
      GROUP BY i.product_name ORDER BY units_sold DESC LIMIT 10
    `.execute(db);
    const abandoned = await sql`SELECT COUNT(*) as count, COALESCE(SUM(subtotal), 0) as value FROM zvd_ec_abandoned_carts WHERE recovered_at IS NULL AND created_at::date BETWEEN ${fromDate} AND ${toDate}`.execute(db);
    return c.json({ data: {
      ...(row.rows[0] as any),
      top_products: topProducts.rows,
      abandoned_carts: abandoned.rows[0],
    }});
  });

  return app;
}
