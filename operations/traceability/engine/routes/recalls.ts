import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { RecallService } from '../services/RecallService.js';

export function recallsRouter(ctx: ExtensionContext): Hono {
  const { db } = ctx;

  // Per-request DB handle (CRM PR #1 pattern). After
  // migration 002_tenant_rls.sql, this extension's tables have FORCE
  // RLS keyed on `zveltio.current_tenant`; routes must run through
  // this handle so the GUC is active inside the transaction.
  function reqDb(c: any): any {
    return c.get('tenantTrx') ?? db;
  }

  const recallService = new RecallService(db);
  const app = new Hono();

  // POST /recalls/simulate/:lot_id — simulate without DB changes
  app.post('/simulate/:lot_id', async (c) => {
    const lotId = c.req.param('lot_id');

    const exists = await sql`SELECT id FROM trace_lots WHERE id = ${lotId}`.execute(reqDb(c));
    if (!exists.rows.length) return c.json({ error: 'Lot negăsit / Lot not found' }, 404);

    const simulation = await recallService.simulateRecall(lotId);
    return c.json({ data: simulation });
  });

  // POST /recalls/initiate — trigger real recall
  app.post('/initiate', zValidator('json', z.object({
    lot_id: z.string().uuid(),
    reason: z.string().min(10),
    scope: z.enum(['internal', 'market_withdrawal', 'consumer_recall']),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');

    const exists = await sql`SELECT id FROM trace_lots WHERE id = ${d.lot_id}`.execute(reqDb(c));
    if (!exists.rows.length) return c.json({ error: 'Lot negăsit / Lot not found' }, 404);

    const recall = await recallService.initiateRecall({
      lotId: d.lot_id,
      reason: d.reason,
      scope: d.scope,
      initiatedBy: user.id,
    });

    return c.json({ data: recall }, 201);
  });

  // GET /recalls — list recalls
  app.get('/', async (c) => {
    const { status } = c.req.query();
    const rows = await sql`
      SELECT r.id, r.scope, r.reason, r.status, r.initiated_at, r.resolved_at,
             r.affected_downstream_lots,
             l.lot_number, i.name as item_name
      FROM trace_recalls r
      INNER JOIN trace_lots l ON l.id = r.lot_id
      INNER JOIN trace_items i ON i.id = l.item_id
      WHERE (${status ? sql`r.status = ${status}` : sql`TRUE`})
      ORDER BY r.initiated_at DESC
    `.execute(reqDb(c));
    return c.json({ data: rows.rows });
  });

  // GET /recalls/:id
  app.get('/:id', async (c) => {
    const row = await sql`
      SELECT r.*,
             l.lot_number, l.quantity_initial, l.unit,
             i.name as item_name, i.allergens
      FROM trace_recalls r
      INNER JOIN trace_lots l ON l.id = r.lot_id
      INNER JOIN trace_items i ON i.id = l.item_id
      WHERE r.id = ${c.req.param('id')}
    `.execute(reqDb(c));
    if (!row.rows.length) return c.json({ error: 'Recall negăsit / Recall not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // PATCH /recalls/:id/resolve — close recall
  app.patch('/:id/resolve', zValidator('json', z.object({
    resolution_notes: z.string().min(5),
  })), async (c) => {
    const user = c.get('user') as any;
    const { resolution_notes } = c.req.valid('json');
    const id = c.req.param('id');

    const recall = await recallService.resolveRecall(id, user.id, resolution_notes);
    return c.json({ data: recall });
  });

  return app;
}
