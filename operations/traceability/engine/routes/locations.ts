import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';

const locationSchema = z.object({
  warehouse: z.string().min(1).max(100),
  row: z.string().max(20).optional(),
  shelf: z.string().max(20).optional(),
  description: z.string().optional(),
  temperature_zone: z.enum(['ambient', 'chilled', 'frozen']).optional(),
});

export function locationsRouter(ctx: ExtensionContext): Hono {
  const { db } = ctx;

  // Per-request DB handle (CRM PR #1 pattern). After
  // migration 002_tenant_rls.sql, this extension's tables have FORCE
  // RLS keyed on `zveltio.current_tenant`; routes must run through
  // this handle so the GUC is active inside the transaction.
  function reqDb(c: any): any {
    return ctx.reqDb ? ctx.reqDb(c) : (c.get('tenantTrx') ?? db);
  }

  const app = new Hono();

  app.get('/', async (c) => {
    const { warehouse, zone } = c.req.query();
    const rows = await sql`
      SELECT * FROM trace_locations
      WHERE (${warehouse ? sql`warehouse ILIKE ${'%' + warehouse + '%'}` : sql`TRUE`})
        AND (${zone ? sql`temperature_zone = ${zone}` : sql`TRUE`})
      ORDER BY warehouse, row, shelf
    `.execute(reqDb(c));
    return c.json({ data: rows.rows });
  });

  app.get('/:id', async (c) => {
    const row = await sql`SELECT * FROM trace_locations WHERE id = ${c.req.param('id')}`.execute(reqDb(c));
    if (!row.rows.length) return c.json({ error: 'Locație negăsită / Location not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.post('/', zValidator('json', locationSchema), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO trace_locations (warehouse, row, shelf, description, temperature_zone)
      VALUES (${d.warehouse}, ${d.row ?? null}, ${d.shelf ?? null}, ${d.description ?? null}, ${d.temperature_zone ?? null})
      RETURNING *
    `.execute(reqDb(c));
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/:id', zValidator('json', locationSchema.partial()), async (c) => {
    const d = c.req.valid('json');
    const id = c.req.param('id');
    const row = await sql`
      UPDATE trace_locations SET
        warehouse = COALESCE(${d.warehouse ?? null}, warehouse),
        row = COALESCE(${d.row ?? null}, row),
        shelf = COALESCE(${d.shelf ?? null}, shelf),
        description = COALESCE(${d.description ?? null}, description),
        temperature_zone = COALESCE(${d.temperature_zone ?? null}, temperature_zone)
      WHERE id = ${id}
      RETURNING *
    `.execute(reqDb(c));
    if (!row.rows.length) return c.json({ error: 'Locație negăsită / Location not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const inUse = await sql`SELECT id FROM trace_lots WHERE location_id = ${id} LIMIT 1`.execute(reqDb(c));
    if (inUse.rows.length) return c.json({ error: 'Locația are loturi asociate / Location has associated lots' }, 409);
    await sql`DELETE FROM trace_locations WHERE id = ${id}`.execute(reqDb(c));
    return c.json({ success: true });
  });

  return app;
}
