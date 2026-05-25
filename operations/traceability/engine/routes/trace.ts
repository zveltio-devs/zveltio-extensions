import { Hono } from 'hono';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { TraceTreeService } from '../services/TraceTreeService.js';

export function traceRouter(ctx: ExtensionContext): Hono {
  const { db } = ctx;

  // Per-request DB handle (CRM PR #1 pattern). After
  // migration 002_tenant_rls.sql, this extension's tables have FORCE
  // RLS keyed on `zveltio.current_tenant`; routes must run through
  // this handle so the GUC is active inside the transaction.
  function reqDb(c: any): any {
    return c.get('tenantTrx') ?? db;
  }

  const traceTree = new TraceTreeService(db);
  const app = new Hono();

  // GET /tree/:lot_id/upstream — reconstruct all raw material inputs
  app.get('/:lot_id/upstream', async (c) => {
    const lotId = c.req.param('lot_id');

    // Verify lot exists
    const exists = await sql`SELECT id FROM trace_lots WHERE id = ${lotId}`.execute(reqDb(c));
    if (!exists.rows.length) return c.json({ error: 'Lot negăsit / Lot not found' }, 404);

    const tree = await traceTree.traceUpstream(lotId);
    return c.json({ data: tree });
  });

  // GET /tree/:lot_id/downstream — find all finished products and affected customers
  app.get('/:lot_id/downstream', async (c) => {
    const lotId = c.req.param('lot_id');

    const exists = await sql`SELECT id FROM trace_lots WHERE id = ${lotId}`.execute(reqDb(c));
    if (!exists.rows.length) return c.json({ error: 'Lot negăsit / Lot not found' }, 404);

    const result = await traceTree.traceDownstream(lotId);
    return c.json({ data: result });
  });

  // GET /tree/:lot_id/timeline — full chronological history of a lot
  app.get('/:lot_id/timeline', async (c) => {
    const lotId = c.req.param('lot_id');

    const exists = await sql`SELECT id FROM trace_lots WHERE id = ${lotId}`.execute(reqDb(c));
    if (!exists.rows.length) return c.json({ error: 'Lot negăsit / Lot not found' }, 404);

    const timeline = await traceTree.getLotTimeline(lotId);
    return c.json({ data: timeline });
  });

  return app;
}
