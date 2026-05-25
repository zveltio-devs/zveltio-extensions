import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { StockService } from '../services/StockService.js';

const UNITS = ['kg', 'g', 'l', 'ml', 'buc', 'cutie', 'sac', 'palet'] as const;

function generateLotNumber(type: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = type === 'inbound' ? 'IN' : type === 'outbound' ? 'OUT' : 'INT';
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${date}-${rand}`;
}

const receptionSchema = z.object({
  item_id: z.string().uuid(),
  lot_type: z.enum(['inbound', 'internal', 'outbound']).default('inbound'),
  quantity_initial: z.number().positive(),
  unit: z.enum(UNITS),
  supplier_id: z.string().uuid().optional(),
  supplier_lot_ref: z.string().optional(),
  best_before_date: z.string().optional(),
  production_date: z.string().optional(),
  reception_date: z.string().optional(),
  invoice_ref: z.string().optional(),
  location_id: z.string().uuid().optional(),
  location_notes: z.string().optional(),
  sscc: z.string().max(18).optional(),
  gtin_scanned: z.string().max(14).optional(),
  notes: z.string().optional(),
});

export function lotsRouter(ctx: ExtensionContext): Hono {
  const { db } = ctx;

  // Per-request DB handle (CRM PR #1 pattern). After
  // migration 002_tenant_rls.sql, this extension's tables have FORCE
  // RLS keyed on `zveltio.current_tenant`; routes must run through
  // this handle so the GUC is active inside the transaction.
  function reqDb(c: any): any {
    return c.get('tenantTrx') ?? db;
  }

  const stockService = new StockService(db);
  const app = new Hono();

  // GET /lots — list with filters
  app.get('/', async (c) => {
    const { limit = '50', page = '1', status, item_id, supplier_id, expiry_from, expiry_to } = c.req.query();
    const lim = Math.min(Math.max(1, parseInt(limit)), 200);
    const offset = (Math.max(1, parseInt(page)) - 1) * lim;

    const rows = await sql`
      SELECT l.id, l.lot_number, l.lot_type, l.status,
             l.quantity_initial, l.quantity_remaining, l.unit,
             l.best_before_date, l.reception_date, l.supplier_lot_ref, l.created_at,
             i.name as item_name, i.code as item_code, i.type as item_type,
             s.name as supplier_name,
             loc.warehouse, loc.row, loc.shelf
      FROM trace_lots l
      INNER JOIN trace_items i ON i.id = l.item_id
      LEFT JOIN trace_suppliers s ON s.id = l.supplier_id
      LEFT JOIN trace_locations loc ON loc.id = l.location_id
      WHERE (${status ? sql`l.status = ${status}` : sql`TRUE`})
        AND (${item_id ? sql`l.item_id = ${item_id}` : sql`TRUE`})
        AND (${supplier_id ? sql`l.supplier_id = ${supplier_id}` : sql`TRUE`})
        AND (${expiry_from ? sql`l.best_before_date >= ${expiry_from}` : sql`TRUE`})
        AND (${expiry_to ? sql`l.best_before_date <= ${expiry_to}` : sql`TRUE`})
      ORDER BY l.created_at DESC
      LIMIT ${lim} OFFSET ${offset}
    `.execute(reqDb(c));

    const total = await sql<{ count: string }>`
      SELECT COUNT(*) as count FROM trace_lots l
      WHERE (${status ? sql`l.status = ${status}` : sql`TRUE`})
        AND (${item_id ? sql`l.item_id = ${item_id}` : sql`TRUE`})
    `.execute(reqDb(c));

    return c.json({
      data: rows.rows,
      meta: { total: parseInt((total.rows[0] as any).count), page: Math.ceil(offset / lim) + 1, limit: lim },
    });
  });

  // GET /lots/expiring
  app.get('/expiring', async (c) => {
    const days = parseInt(c.req.query('days') ?? '7');
    const lots = await stockService.getExpiringLots(days);
    return c.json({ data: lots });
  });

  // GET /lots/low-stock
  app.get('/low-stock', async (c) => {
    const items = await stockService.getLowStockItems();
    return c.json({ data: items });
  });

  // GET /lots/:id — full lot detail
  app.get('/:id', async (c) => {
    const row = await sql`
      SELECT l.*,
             i.name as item_name, i.code as item_code, i.type as item_type,
             i.allergens, i.storage_conditions,
             s.name as supplier_name, s.cui as supplier_cui, s.phone as supplier_phone,
             loc.warehouse, loc.row, loc.shelf, loc.temperature_zone
      FROM trace_lots l
      INNER JOIN trace_items i ON i.id = l.item_id
      LEFT JOIN trace_suppliers s ON s.id = l.supplier_id
      LEFT JOIN trace_locations loc ON loc.id = l.location_id
      WHERE l.id = ${c.req.param('id')}
    `.execute(reqDb(c));
    if (!row.rows.length) return c.json({ error: 'Lot negăsit / Lot not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // POST /lots — receive new lot (inbound material)
  app.post('/', zValidator('json', receptionSchema), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const lotNumber = generateLotNumber(d.lot_type);

    const row = await sql`
      INSERT INTO trace_lots (
        item_id, lot_type, lot_number, status,
        quantity_initial, quantity_remaining, unit,
        supplier_id, supplier_lot_ref, best_before_date, production_date,
        reception_date, invoice_ref, location_id, location_notes,
        sscc, gtin_scanned, received_by, notes
      ) VALUES (
        ${d.item_id}, ${d.lot_type}, ${lotNumber}, 'quarantine',
        ${d.quantity_initial}, ${d.quantity_initial}, ${d.unit},
        ${d.supplier_id ?? null}, ${d.supplier_lot_ref ?? null},
        ${d.best_before_date ?? null}, ${d.production_date ?? null},
        ${d.reception_date ?? new Date().toISOString().slice(0, 10)},
        ${d.invoice_ref ?? null}, ${d.location_id ?? null}, ${d.location_notes ?? null},
        ${d.sscc ?? null}, ${d.gtin_scanned ?? null}, ${user.id}, ${d.notes ?? null}
      )
      RETURNING *
    `.execute(reqDb(c));

    const lot = row.rows[0] as any;

    // Record reception movement
    await sql`
      INSERT INTO trace_movements (lot_id, type, quantity, unit, reference_type, reference_number, to_location_id, performed_by, performed_at)
      VALUES (${lot.id}, 'reception', ${d.quantity_initial}, ${d.unit}, 'reception', ${lotNumber}, ${d.location_id ?? null}, ${user.id}, now())
    `.execute(reqDb(c));

    return c.json({ data: lot }, 201);
  });

  // PATCH /lots/:id/release — release from quarantine
  app.patch('/:id/release', async (c) => {
    const user = c.get('user') as any;
    const id = c.req.param('id');

    const row = await sql`
      UPDATE trace_lots
      SET status = 'available', released_by = ${user.id}, released_at = now()
      WHERE id = ${id} AND status = 'quarantine'
      RETURNING *
    `.execute(reqDb(c));

    if (!row.rows.length) return c.json({ error: 'Lot nu este în carantină / Lot not in quarantine' }, 400);
    return c.json({ data: row.rows[0] });
  });

  // PATCH /lots/:id/status — generic status change
  app.patch('/:id/status', zValidator('json', z.object({
    status: z.enum(['quarantine', 'available', 'exhausted', 'recalled', 'returned']),
    notes: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const id = c.req.param('id');
    const row = await sql`
      UPDATE trace_lots SET status = ${d.status}, notes = COALESCE(${d.notes ?? null}, notes) WHERE id = ${id} RETURNING *
    `.execute(reqDb(c));
    if (!row.rows.length) return c.json({ error: 'Lot negăsit / Lot not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  return app;
}
