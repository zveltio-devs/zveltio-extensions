import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';

const UNITS = ['kg', 'g', 'l', 'ml', 'buc', 'cutie', 'sac', 'palet'] as const;

export function dispatchesRouter(ctx: ExtensionContext): Hono {
  const { db } = ctx;

  // Per-request DB handle (CRM PR #1 pattern). After
  // migration 002_tenant_rls.sql, this extension's tables have FORCE
  // RLS keyed on `zveltio.current_tenant`; routes must run through
  // this handle so the GUC is active inside the transaction.
  function reqDb(c: any): any {
    return c.get('tenantTrx') ?? db;
  }

  const app = new Hono();

  // GET /dispatches — list with status / lot_id filter
  app.get('/', async (c) => {
    const { status, lot_id, limit = '50', page = '1' } = c.req.query();
    const lim = Math.min(Math.max(1, parseInt(limit)), 200);
    const offset = (Math.max(1, parseInt(page)) - 1) * lim;

    const rows = await sql`
      SELECT d.*,
             l.lot_number, l.quantity_remaining as lot_qty_remaining,
             i.name as item_name, i.code as item_code
      FROM trace_dispatches d
      LEFT JOIN trace_lots l ON l.id = d.lot_id
      LEFT JOIN trace_items i ON i.id = l.item_id
      WHERE (${status ? sql`d.status = ${status}` : sql`TRUE`})
        AND (${lot_id ? sql`d.lot_id = ${lot_id}` : sql`TRUE`})
      ORDER BY d.created_at DESC
      LIMIT ${lim} OFFSET ${offset}
    `.execute(reqDb(c));

    const total = await sql<{ count: string }>`
      SELECT COUNT(*) as count FROM trace_dispatches
      WHERE (${status ? sql`status = ${status}` : sql`TRUE`})
    `.execute(reqDb(c));

    return c.json({
      data: rows.rows,
      meta: { total: parseInt((total.rows[0] as any).count) },
    });
  });

  // GET /dispatches/:id
  app.get('/:id', async (c) => {
    const row = await sql`
      SELECT d.*,
             l.lot_number, l.quantity_remaining as lot_qty_remaining, l.status as lot_status,
             l.best_before_date,
             i.name as item_name, i.allergens, i.storage_conditions,
             s.name as supplier_name
      FROM trace_dispatches d
      LEFT JOIN trace_lots l ON l.id = d.lot_id
      LEFT JOIN trace_items i ON i.id = l.item_id
      LEFT JOIN trace_suppliers s ON s.id = l.supplier_id
      WHERE d.id = ${c.req.param('id')}
    `.execute(reqDb(c));
    if (!row.rows.length) return c.json({ error: 'Expediere negăsită / Dispatch not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // POST /dispatches/:id/confirm — operator confirms physical dispatch after scanning lot QR
  app.post('/:id/confirm', zValidator('json', z.object({
    quantity_dispatched: z.number().positive(),
    notes: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const id = c.req.param('id');

    const dispatchResult = await sql`
      SELECT * FROM trace_dispatches WHERE id = ${id} AND status = 'pending'
    `.execute(reqDb(c));
    if (!dispatchResult.rows.length) {
      return c.json({ error: 'Expediere negăsită sau deja confirmată / Dispatch not found or already confirmed' }, 400);
    }
    const dispatch = dispatchResult.rows[0] as any;

    if (!dispatch.lot_id) {
      return c.json({ error: 'Expedierea nu are lot asociat / Dispatch has no lot assigned' }, 400);
    }

    // Check lot availability and stock
    const lotResult = await sql`
      SELECT id, quantity_remaining, unit, status FROM trace_lots
      WHERE id = ${dispatch.lot_id} AND status = 'available'
    `.execute(reqDb(c));
    if (!lotResult.rows.length) {
      return c.json({ error: 'Lotul nu este disponibil / Lot not available' }, 400);
    }
    const lot = lotResult.rows[0] as any;

    if (parseFloat(lot.quantity_remaining) < d.quantity_dispatched) {
      return c.json({
        error: `Stoc insuficient. Disponibil: ${lot.quantity_remaining} ${lot.unit} / Insufficient stock. Available: ${lot.quantity_remaining} ${lot.unit}`,
      }, 400);
    }

    const newQty = parseFloat(lot.quantity_remaining) - d.quantity_dispatched;

    // Decrement lot stock
    await sql`
      UPDATE trace_lots
      SET quantity_remaining = ${newQty},
          status = ${newQty === 0 ? 'exhausted' : 'available'}
      WHERE id = ${dispatch.lot_id}
    `.execute(reqDb(c));

    // Record dispatch movement
    await sql`
      INSERT INTO trace_movements (
        lot_id, type, quantity, unit,
        reference_type, reference_id, reference_number,
        customer_id, notes, performed_by, performed_at
      ) VALUES (
        ${dispatch.lot_id}, 'dispatch', ${-d.quantity_dispatched}, ${lot.unit},
        'invoice', ${dispatch.invoice_id ?? null}, ${dispatch.invoice_number ?? null},
        ${dispatch.customer_id ?? null}, ${d.notes ?? null}, ${user.id}, now()
      )
    `.execute(reqDb(c));

    // Mark dispatch confirmed
    const updated = await sql`
      UPDATE trace_dispatches
      SET status = 'confirmed',
          quantity_dispatched = ${d.quantity_dispatched},
          confirmed_at = now(),
          confirmed_by = ${user.id},
          notes = COALESCE(${d.notes ?? null}, notes)
      WHERE id = ${id}
      RETURNING *
    `.execute(reqDb(c));

    return c.json({ data: updated.rows[0] });
  });

  // POST /dispatches/:id/assign-lot — assign a lot to a pending dispatch that had no lot_id
  // (when the manager didn't select a lot at invoice creation)
  app.post('/:id/assign-lot', zValidator('json', z.object({
    lot_id: z.string().uuid(),
  })), async (c) => {
    const { lot_id } = c.req.valid('json');
    const id = c.req.param('id');

    const lotCheck = await sql`SELECT id FROM trace_lots WHERE id = ${lot_id} AND status = 'available'`.execute(reqDb(c));
    if (!lotCheck.rows.length) return c.json({ error: 'Lot indisponibil / Lot not available' }, 400);

    const row = await sql`
      UPDATE trace_dispatches SET lot_id = ${lot_id} WHERE id = ${id} AND status = 'pending' RETURNING *
    `.execute(reqDb(c));
    if (!row.rows.length) return c.json({ error: 'Expediere negăsită / Dispatch not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // POST /dispatches/:id/cancel
  app.post('/:id/cancel', zValidator('json', z.object({
    notes: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE trace_dispatches
      SET status = 'cancelled', notes = COALESCE(${d.notes ?? null}, notes)
      WHERE id = ${c.req.param('id')} AND status = 'pending'
      RETURNING *
    `.execute(reqDb(c));
    if (!row.rows.length) return c.json({ error: 'Expediere negăsită sau nu poate fi anulată' }, 400);
    return c.json({ data: row.rows[0] });
  });

  // POST /dispatches/direct — manual dispatch without invoice (operator scans lot, enters details)
  app.post('/direct', zValidator('json', z.object({
    lot_id: z.string().uuid(),
    quantity_dispatched: z.number().positive(),
    unit: z.enum(UNITS),
    customer_name: z.string().min(1),
    customer_id: z.string().uuid().optional(),
    invoice_number: z.string().optional(),
    notes: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');

    const lotResult = await sql`
      SELECT id, quantity_remaining, unit, status FROM trace_lots
      WHERE id = ${d.lot_id} AND status = 'available'
    `.execute(reqDb(c));
    if (!lotResult.rows.length) return c.json({ error: 'Lot indisponibil / Lot not available' }, 400);
    const lot = lotResult.rows[0] as any;

    if (parseFloat(lot.quantity_remaining) < d.quantity_dispatched) {
      return c.json({
        error: `Stoc insuficient. Disponibil: ${lot.quantity_remaining} ${lot.unit}`,
      }, 400);
    }

    const newQty = parseFloat(lot.quantity_remaining) - d.quantity_dispatched;

    await sql`
      UPDATE trace_lots
      SET quantity_remaining = ${newQty}, status = ${newQty === 0 ? 'exhausted' : 'available'}
      WHERE id = ${d.lot_id}
    `.execute(reqDb(c));

    await sql`
      INSERT INTO trace_movements (
        lot_id, type, quantity, unit,
        reference_type, reference_number,
        customer_id, notes, performed_by, performed_at
      ) VALUES (
        ${d.lot_id}, 'dispatch', ${-d.quantity_dispatched}, ${lot.unit},
        'manual', ${d.invoice_number ?? null},
        ${d.customer_id ?? null}, ${d.notes ?? null}, ${user.id}, now()
      )
    `.execute(reqDb(c));

    const dispatch = await sql`
      INSERT INTO trace_dispatches (
        invoice_number, customer_id, customer_name,
        lot_id, quantity_invoiced, quantity_dispatched, unit,
        status, confirmed_at, confirmed_by, notes
      ) VALUES (
        ${d.invoice_number ?? null}, ${d.customer_id ?? null}, ${d.customer_name},
        ${d.lot_id}, ${d.quantity_dispatched}, ${d.quantity_dispatched}, ${lot.unit},
        'confirmed', now(), ${user.id}, ${d.notes ?? null}
      )
      RETURNING *
    `.execute(reqDb(c));

    return c.json({ data: dispatch.rows[0] }, 201);
  });

  return app;
}
