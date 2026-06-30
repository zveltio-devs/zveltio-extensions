import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';

const UNITS = ['kg', 'g', 'l', 'ml', 'buc', 'cutie', 'sac', 'palet'] as const;

const itemSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1),
  type: z.enum(['raw', 'semi', 'finished']),
  category: z.string().optional(),
  default_unit: z.enum(UNITS),
  allergens: z.array(z.string()).default([]),
  shelf_life_days: z.number().int().positive().optional(),
  storage_conditions: z.string().optional(),
  gtin: z.string().max(14).optional(),
  min_stock_alert: z.number().positive().optional(),
  is_active: z.boolean().optional(),
});

export function itemsRouter(ctx: ExtensionContext): Hono {
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
    const { q, type, category } = c.req.query();
    const rows = await sql`
      SELECT * FROM trace_items
      WHERE (${q ? sql`name ILIKE ${'%' + q + '%'} OR code ILIKE ${'%' + q + '%'}` : sql`TRUE`})
        AND (${type ? sql`type = ${type}` : sql`TRUE`})
        AND (${category ? sql`category = ${category}` : sql`TRUE`})
        AND is_active = true
      ORDER BY name
    `.execute(reqDb(c));
    return c.json({ data: rows.rows });
  });

  app.get('/:id', async (c) => {
    const row = await sql`SELECT * FROM trace_items WHERE id = ${c.req.param('id')}`.execute(reqDb(c));
    if (!row.rows.length) return c.json({ error: 'Articol negăsit / Item not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.post('/', zValidator('json', itemSchema), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO trace_items (code, name, type, category, default_unit, allergens, shelf_life_days, storage_conditions, gtin, min_stock_alert)
      VALUES (
        ${d.code}, ${d.name}, ${d.type}, ${d.category ?? null}, ${d.default_unit},
        ${JSON.stringify(d.allergens)}::jsonb,
        ${d.shelf_life_days ?? null}, ${d.storage_conditions ?? null},
        ${d.gtin ?? null}, ${d.min_stock_alert ?? null}
      )
      RETURNING *
    `.execute(reqDb(c));
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/:id', zValidator('json', itemSchema.partial()), async (c) => {
    const d = c.req.valid('json');
    const id = c.req.param('id');
    const allergensUpdate = d.allergens !== undefined
      ? sql`${JSON.stringify(d.allergens)}::jsonb`
      : sql`allergens`;
    const row = await sql`
      UPDATE trace_items SET
        code = COALESCE(${d.code ?? null}, code),
        name = COALESCE(${d.name ?? null}, name),
        type = COALESCE(${d.type ?? null}, type),
        category = COALESCE(${d.category ?? null}, category),
        default_unit = COALESCE(${d.default_unit ?? null}, default_unit),
        allergens = ${allergensUpdate},
        shelf_life_days = COALESCE(${d.shelf_life_days ?? null}, shelf_life_days),
        storage_conditions = COALESCE(${d.storage_conditions ?? null}, storage_conditions),
        gtin = COALESCE(${d.gtin ?? null}, gtin),
        min_stock_alert = COALESCE(${d.min_stock_alert ?? null}, min_stock_alert),
        is_active = COALESCE(${d.is_active ?? null}, is_active)
      WHERE id = ${id}
      RETURNING *
    `.execute(reqDb(c));
    if (!row.rows.length) return c.json({ error: 'Articol negăsit / Item not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  return app;
}
