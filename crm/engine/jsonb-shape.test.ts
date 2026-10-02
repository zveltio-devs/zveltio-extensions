// Regression: every CRM write of `metadata` / `line_items` bound
// `JSON.stringify(x)` into a jsonb column. Under Bun.SQL — the engine's driver —
// that stored a JSON *string scalar*, so `metadata->>'k'` read NULL. Under `pg`
// it stored an object, which is why the suite never saw it.
//
// Only meaningful on the production driver: run with EXT_HARNESS_DRIVER=bun.
// On `pg` it passes with or without the fix.
import { describe, expect, it } from 'bun:test';
import { sql } from 'kysely';
import { mountForTest } from '../../testing/ext-harness';

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;

const send = (app: any, method: string, path: string, body: unknown) =>
  app.request(path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

async function shape(db: any, table: string, col: string, id: string): Promise<string> {
  const r = await sql<{ t: string }>`
    SELECT jsonb_typeof(${sql.ref(col)}) AS t FROM ${sql.table(table)} WHERE id = ${id}
  `.execute(db);
  return r.rows[0]!.t;
}

d('crm stores metadata and line_items as JSON, not as strings', () => {
  it('contacts: create and update', async () => {
    const { app, ctx } = await mountForTest(import.meta.dir);
    const res = await send(app, 'POST', '/contacts', { first_name: 'J', metadata: { a: 1 } });
    expect(res.status).toBe(201);
    const id = (await res.json()).data.id;
    expect(await shape(ctx.db, 'zvd_contacts', 'metadata', id)).toBe('object');
    expect((await send(app, 'PATCH', `/contacts/${id}`, { metadata: { b: 2 } })).status).toBe(200);
    expect(await shape(ctx.db, 'zvd_contacts', 'metadata', id)).toBe('object');
  });

  it('organizations: create and update', async () => {
    const { app, ctx } = await mountForTest(import.meta.dir);
    const res = await send(app, 'POST', '/organizations', { name: 'O', metadata: { a: 1 } });
    expect(res.status).toBe(201);
    const id = (await res.json()).data.id;
    expect(await shape(ctx.db, 'zvd_organizations', 'metadata', id)).toBe('object');
    expect((await send(app, 'PATCH', `/organizations/${id}`, { metadata: { b: 2 } })).status).toBe(200);
    expect(await shape(ctx.db, 'zvd_organizations', 'metadata', id)).toBe('object');
  });

  it('transactions: create and update', async () => {
    const { app, ctx } = await mountForTest(import.meta.dir);
    const res = await send(app, 'POST', '/transactions', {
      type: 'invoice',
      line_items: [{ sku: 'x' }],
      metadata: { a: 1 },
    });
    expect(res.status).toBe(201);
    const id = (await res.json()).data.id;
    expect(await shape(ctx.db, 'zvd_transactions', 'line_items', id)).toBe('array');
    expect(await shape(ctx.db, 'zvd_transactions', 'metadata', id)).toBe('object');
    const upd = await send(app, 'PATCH', `/transactions/${id}`, {
      line_items: [{ sku: 'y' }],
      metadata: { b: 2 },
    });
    expect(upd.status).toBe(200);
    expect(await shape(ctx.db, 'zvd_transactions', 'line_items', id)).toBe('array');
    expect(await shape(ctx.db, 'zvd_transactions', 'metadata', id)).toBe('object');
  });
});
