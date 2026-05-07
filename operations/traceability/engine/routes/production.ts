import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { StockService } from '../services/StockService.js';

const UNITS = ['kg', 'g', 'l', 'ml', 'buc', 'cutie', 'sac', 'palet'] as const;

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `PO-${date}-${rand}`;
}

function generateLotNumber(type: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${type === 'inbound' ? 'IN' : 'INT'}-${date}-${rand}`;
}

export function productionRouter(ctx: ExtensionContext): Hono {
  const { db } = ctx;
  const stockService = new StockService(db);
  const app = new Hono();

  // GET /production — list production orders
  app.get('/', async (c) => {
    const { limit = '50', page = '1', status } = c.req.query();
    const lim = Math.min(Math.max(1, parseInt(limit)), 200);
    const offset = (Math.max(1, parseInt(page)) - 1) * lim;

    const rows = await sql`
      SELECT po.id, po.order_number, po.status, po.planned_quantity, po.actual_quantity, po.unit,
             po.started_at, po.completed_at, po.created_at,
             r.name as recipe_name,
             l.lot_number as output_lot_number,
             i.name as output_item_name
      FROM trace_production_orders po
      LEFT JOIN trace_recipes r ON r.id = po.recipe_id
      LEFT JOIN trace_lots l ON l.id = po.output_lot_id
      LEFT JOIN trace_items i ON i.id = l.item_id
      WHERE (${status ? sql`po.status = ${status}` : sql`TRUE`})
      ORDER BY po.created_at DESC
      LIMIT ${lim} OFFSET ${offset}
    `.execute(db);

    return c.json({ data: rows.rows });
  });

  // GET /production/recipes — list available recipes (must be before /:id to avoid route conflict)
  app.get('/recipes', async (c) => {
    const { item_id } = c.req.query();
    const rows = await sql`
      SELECT r.id, r.name, r.version, r.output_quantity, r.output_unit, r.is_active,
             i.name as output_item_name,
             COALESCE(json_agg(json_build_object(
               'item_id', ri.item_id, 'item_name', it.name, 'quantity_per_unit', ri.quantity_per_unit, 'unit', ri.unit, 'is_critical_allergen', ri.is_critical_allergen
             )) FILTER (WHERE ri.id IS NOT NULL), '[]') as ingredients
      FROM trace_recipes r
      INNER JOIN trace_items i ON i.id = r.output_item_id
      LEFT JOIN trace_recipe_items ri ON ri.recipe_id = r.id
      LEFT JOIN trace_items it ON it.id = ri.item_id
      WHERE r.is_active = true
        AND (${item_id ? sql`r.output_item_id = ${item_id}` : sql`TRUE`})
      GROUP BY r.id, i.name
      ORDER BY r.name
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  // GET /production/:id — full order detail with consumptions and HACCP
  app.get('/:id', async (c) => {
    const id = c.req.param('id');

    const orderResult = await sql`
      SELECT po.*,
             r.name as recipe_name, r.output_quantity as recipe_output_qty, r.output_unit as recipe_output_unit,
             l.lot_number as output_lot_number
      FROM trace_production_orders po
      LEFT JOIN trace_recipes r ON r.id = po.recipe_id
      LEFT JOIN trace_lots l ON l.id = po.output_lot_id
      WHERE po.id = ${id}
    `.execute(db);

    if (!orderResult.rows.length) return c.json({ error: 'Ordin negăsit / Order not found' }, 404);

    const consumptions = await sql`
      SELECT c.id, c.quantity_used, c.unit, c.scanned_at,
             l.lot_number, l.status, l.best_before_date,
             i.name as item_name
      FROM trace_lot_consumptions c
      INNER JOIN trace_lots l ON l.id = c.lot_id
      INNER JOIN trace_items i ON i.id = l.item_id
      WHERE c.production_order_id = ${id}
      ORDER BY c.scanned_at
    `.execute(db);

    return c.json({
      data: { ...(orderResult.rows[0] as any), consumptions: consumptions.rows },
    });
  });

  // POST /production — create new production order
  app.post('/', zValidator('json', z.object({
    recipe_id: z.string().uuid().optional(),
    planned_quantity: z.number().positive(),
    unit: z.enum(UNITS),
    output_item_id: z.string().uuid(),
    notes: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const orderNumber = generateOrderNumber();

    // Create the output lot (internal)
    const lotNumber = generateLotNumber('internal');
    const lotResult = await sql`
      INSERT INTO trace_lots (item_id, lot_type, lot_number, status, quantity_initial, quantity_remaining, unit, received_by)
      VALUES (${d.output_item_id}, 'internal', ${lotNumber}, 'quarantine', ${d.planned_quantity}, ${d.planned_quantity}, ${d.unit}, ${user.id})
      RETURNING id
    `.execute(db);
    const outputLotId = (lotResult.rows[0] as any).id;

    const row = await sql`
      INSERT INTO trace_production_orders (order_number, recipe_id, output_lot_id, status, planned_quantity, unit, operator_id, notes)
      VALUES (${orderNumber}, ${d.recipe_id ?? null}, ${outputLotId}, 'draft', ${d.planned_quantity}, ${d.unit}, ${user.id}, ${d.notes ?? null})
      RETURNING *
    `.execute(db);

    return c.json({ data: row.rows[0] }, 201);
  });

  // PATCH /production/:id/start
  app.patch('/:id/start', async (c) => {
    const id = c.req.param('id');
    const row = await sql`
      UPDATE trace_production_orders
      SET status = 'in_progress', started_at = now()
      WHERE id = ${id} AND status = 'draft'
      RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Ordinul nu poate fi pornit / Order cannot be started' }, 400);
    return c.json({ data: row.rows[0] });
  });

  // PATCH /production/:id/complete
  app.patch('/:id/complete', zValidator('json', z.object({
    actual_quantity: z.number().positive(),
    haccp_checks: z.array(z.object({
      ccp: z.string(),
      value: z.number(),
      unit: z.string(),
      limit_min: z.number().optional(),
      limit_max: z.number().optional(),
      ok: z.boolean(),
      checked_at: z.string(),
      checked_by: z.string().optional(),
    })).default([]),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const id = c.req.param('id');

    const orderResult = await sql`SELECT * FROM trace_production_orders WHERE id = ${id} AND status = 'in_progress'`.execute(db);
    if (!orderResult.rows.length) return c.json({ error: 'Ordinul nu este în execuție / Order not in progress' }, 400);

    const order = orderResult.rows[0] as any;

    // Update output lot quantity to actual produced
    await sql`
      UPDATE trace_lots
      SET quantity_initial = ${d.actual_quantity}, quantity_remaining = ${d.actual_quantity}, status = 'available'
      WHERE id = ${order.output_lot_id}
    `.execute(db);

    // Record production movement
    await sql`
      INSERT INTO trace_movements (lot_id, type, quantity, unit, reference_type, reference_id, performed_by, performed_at)
      VALUES (${order.output_lot_id}, 'reception', ${d.actual_quantity}, ${order.unit}, 'production_order', ${id}, ${user.id}, now())
    `.execute(db);

    const row = await sql`
      UPDATE trace_production_orders
      SET status = 'completed', actual_quantity = ${d.actual_quantity},
          completed_at = now(), haccp_checks = ${JSON.stringify(d.haccp_checks)}::jsonb
      WHERE id = ${id}
      RETURNING *
    `.execute(db);

    return c.json({ data: row.rows[0] });
  });

  // POST /production/:id/consume — scan and record ingredient consumption
  app.post('/:id/consume', zValidator('json', z.object({
    lot_id: z.string().uuid(),
    quantity_used: z.number().positive(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const id = c.req.param('id');

    const orderResult = await sql`SELECT status FROM trace_production_orders WHERE id = ${id}`.execute(db);
    if (!orderResult.rows.length) return c.json({ error: 'Ordin negăsit / Order not found' }, 404);
    if ((orderResult.rows[0] as any).status !== 'in_progress') {
      return c.json({ error: 'Ordinul trebuie să fie în execuție / Order must be in progress' }, 400);
    }

    await stockService.consumeFromLot({
      lotId: d.lot_id,
      quantityUsed: d.quantity_used,
      productionOrderId: id,
      scannedBy: user.id,
    });

    return c.json({ success: true });
  });

  // PATCH /production/:id/haccp — add HACCP check inline
  app.patch('/:id/haccp', zValidator('json', z.object({
    check: z.object({
      ccp: z.string(),
      value: z.number(),
      unit: z.string(),
      limit_min: z.number().optional(),
      limit_max: z.number().optional(),
      ok: z.boolean(),
      checked_at: z.string(),
    }),
  })), async (c) => {
    const user = c.get('user') as any;
    const { check } = c.req.valid('json');
    const id = c.req.param('id');

    const row = await sql`
      UPDATE trace_production_orders
      SET haccp_checks = haccp_checks || ${JSON.stringify({ ...check, checked_by: user.id })}::jsonb
      WHERE id = ${id}
      RETURNING haccp_checks
    `.execute(db);

    if (!row.rows.length) return c.json({ error: 'Ordin negăsit / Order not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  return app;
}
