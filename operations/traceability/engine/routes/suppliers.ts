import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';

const supplierSchema = z.object({
  name: z.string().min(1),
  cui: z.string().optional(),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  is_active: z.boolean().optional(),
});

export function suppliersRouter(ctx: ExtensionContext): Hono {
  const { db } = ctx;

  // Per-request DB handle (CRM PR #1 pattern). After
  // migration 002_tenant_rls.sql, this extension's tables have FORCE
  // RLS keyed on `zveltio.current_tenant`; routes must run through
  // this handle so the GUC is active inside the transaction.
  function reqDb(c: any): any {
    return c.get('tenantTrx') ?? db;
  }

  const app = new Hono();

  app.get('/', async (c) => {
    const { q, active } = c.req.query();
    const rows = await sql`
      SELECT * FROM trace_suppliers
      WHERE (${q ? sql`name ILIKE ${'%' + q + '%'} OR cui ILIKE ${'%' + q + '%'}` : sql`TRUE`})
        AND (${active !== undefined ? sql`is_active = ${active === 'true'}` : sql`TRUE`})
      ORDER BY name
    `.execute(reqDb(c));
    return c.json({ data: rows.rows });
  });

  app.get('/:id', async (c) => {
    const row = await sql`SELECT * FROM trace_suppliers WHERE id = ${c.req.param('id')}`.execute(reqDb(c));
    if (!row.rows.length) return c.json({ error: 'Furnizor negăsit / Supplier not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.post('/', zValidator('json', supplierSchema), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO trace_suppliers (name, cui, contact_person, phone, email, address)
      VALUES (${d.name}, ${d.cui ?? null}, ${d.contact_person ?? null}, ${d.phone ?? null}, ${d.email ?? null}, ${d.address ?? null})
      RETURNING *
    `.execute(reqDb(c));
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/:id', zValidator('json', supplierSchema.partial()), async (c) => {
    const d = c.req.valid('json');
    const id = c.req.param('id');
    const row = await sql`
      UPDATE trace_suppliers SET
        name = COALESCE(${d.name ?? null}, name),
        cui = COALESCE(${d.cui ?? null}, cui),
        contact_person = COALESCE(${d.contact_person ?? null}, contact_person),
        phone = COALESCE(${d.phone ?? null}, phone),
        email = COALESCE(${d.email ?? null}, email),
        address = COALESCE(${d.address ?? null}, address),
        is_active = COALESCE(${d.is_active ?? null}, is_active)
      WHERE id = ${id}
      RETURNING *
    `.execute(reqDb(c));
    if (!row.rows.length) return c.json({ error: 'Furnizor negăsit / Supplier not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  return app;
}
