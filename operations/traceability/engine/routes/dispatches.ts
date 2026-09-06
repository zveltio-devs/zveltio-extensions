import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
// One implementation of "take this much off a lot", shared with the scanner.
// See the note on claimLotQuantity for what the three separate copies did.
import { claimLotQuantity, LotUnavailableError } from '../services/StockService.js';

const UNITS = ['kg', 'g', 'l', 'ml', 'buc', 'cutie', 'sac', 'palet'] as const;

export function dispatchesRouter(ctx: ExtensionContext): Hono {
  const { db } = ctx;

  // `db` is `ctx.db`: a proxy the engine hands over that resolves the CURRENT
  // tenant transaction per query via AsyncLocalStorage (H-12). A plain `db` in
  // a handler is therefore already RLS-scoped — there is one spelling, so there
  // is none to forget.

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
    `.execute(db);

    const total = await sql<{ count: string }>`
      SELECT COUNT(*) as count FROM trace_dispatches
      WHERE (${status ? sql`status = ${status}` : sql`TRUE`})
    `.execute(db);

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
    `.execute(db);
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
    `.execute(db);
    if (!dispatchResult.rows.length) {
      return c.json({ error: 'Expediere negăsită sau deja confirmată / Dispatch not found or already confirmed' }, 400);
    }
    const dispatch = dispatchResult.rows[0] as any;

    if (!dispatch.lot_id) {
      return c.json({ error: 'Expedierea nu are lot asociat / Dispatch has no lot assigned' }, 400);
    }

    // A dispatch is the stock leaving, the movement that records it leaving, and
    // the dispatch row saying it was confirmed. This is a traceability register:
    // the point of it is that every unit can be followed from lot to customer.
    //
    // Split, the chain breaks in a way no later query can mend. Stock decremented
    // with no movement row means quantity left the lot and nothing says where it
    // went — on a recall, that lot cannot be traced to the customers who received
    // it. A movement without the decrement double-counts the same units as still
    // available. And a dispatch left unconfirmed after the stock moved can be
    // confirmed again, dispatching the quantity twice.
    //
    // The stock check is `claimLotQuantity` now, not a SELECT and an `if`. The
    // transaction gave these three writes atomicity and never gave the check
    // isolation: the UPDATE matched on `id` alone, so a concurrent writer blocked
    // on the row lock re-evaluated a condition that was still true and wrote a
    // remainder computed before the other write landed. Two dispatches of 6 from
    // a lot holding 10 both succeeded, and the lot reported 4. See the note on
    // `claimLotQuantity`.
    let updated: { rows: unknown[] };
    try {
      updated = await db.transaction().execute(async (trx) => {
        const lot = await claimLotQuantity(trx, dispatch.lot_id, d.quantity_dispatched);

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
        `.execute(trx);

        // Mark dispatch confirmed
        return await sql`
          UPDATE trace_dispatches
          SET status = 'confirmed',
              quantity_dispatched = ${d.quantity_dispatched},
              confirmed_at = now(),
              confirmed_by = ${user.id},
              notes = COALESCE(${d.notes ?? null}, notes)
          WHERE id = ${id}
          RETURNING *
        `.execute(trx);
      });
    } catch (err) {
      // "Not enough stock" and "that lot is recalled" are answers to the
      // operator, not server faults. Folding the check into `claimLotQuantity`
      // would otherwise have turned both of the 400s this route used to return
      // into 500s.
      if (err instanceof LotUnavailableError) return c.json({ error: err.message }, 400);
      throw err;
    }
    return c.json({ data: updated.rows[0] });
  });

  // POST /dispatches/:id/assign-lot — assign a lot to a pending dispatch that had no lot_id
  // (when the manager didn't select a lot at invoice creation)
  app.post('/:id/assign-lot', zValidator('json', z.object({
    lot_id: z.string().uuid(),
  })), async (c) => {
    const { lot_id } = c.req.valid('json');
    const id = c.req.param('id');

    const lotCheck = await sql`SELECT id FROM trace_lots WHERE id = ${lot_id} AND status = 'available'`.execute(db);
    if (!lotCheck.rows.length) return c.json({ error: 'Lot indisponibil / Lot not available' }, 400);

    const row = await sql`
      UPDATE trace_dispatches SET lot_id = ${lot_id} WHERE id = ${id} AND status = 'pending' RETURNING *
    `.execute(db);
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
    `.execute(db);
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

    // Same three writes as the confirm route, same reason: on a recall, a lot
    // whose stock moved without a movement row cannot be traced to anybody. And
    // the same stock check — this route carried the third copy of the
    // read-then-write, so a direct dispatch could over-draw a lot or send a
    // recalled one to a customer and mark it available again.
    let dispatch: { rows: unknown[] };
    try {
      dispatch = await db.transaction().execute(async (trx) => {
        const lot = await claimLotQuantity(trx, d.lot_id, d.quantity_dispatched);

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
        `.execute(trx);

        return await sql`
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
        `.execute(trx);
      });
    } catch (err) {
      if (err instanceof LotUnavailableError) return c.json({ error: err.message }, 400);
      throw err;
    }
    return c.json({ data: dispatch.rows[0] }, 201);
  });

  return app;
}
