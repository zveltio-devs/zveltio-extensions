// Regression: vat_breakdown was written as `${JSON.stringify(x)}::jsonb` on
// create and as the bare JS array on generate-next. Under Bun.SQL — the
// engine's driver — both store a jsonb STRING. Meaningful only with
// EXT_HARNESS_DRIVER=bun (CI runs *jsonb-shape* that way); passes on `pg`
// either way.
import { beforeAll, describe, expect, it } from 'bun:test';
import { sql } from 'kysely';
import { mountForTest } from '../../../testing/ext-harness';

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;

const post = (app: any, path: string, body: unknown) =>
  app.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

const shape = async (db: any, id: string) =>
  (
    await sql<{ t: string }>`SELECT jsonb_typeof(vat_breakdown) AS t FROM zvd_invoices WHERE id = ${id}`.execute(db)
  ).rows[0]!.t;

d('invoicing stores vat_breakdown as a JSON array', () => {
  let app: any;
  let ctx: any;

  beforeAll(async () => {
    ({ app, ctx } = await mountForTest(new URL('.', import.meta.url).pathname));
    await post(app, '/series', { doc_type: 'invoice', series: 'TJ', is_default: true });
  });

  it('on create and on generate-next', async () => {
    const created = await post(app, '/invoices', {
      client_name: 'Test Client',
      due_date: '2026-12-31',
      recurring_interval: 'monthly',
      lines: [{ description: 'Widget', quantity: 1, unit_price: 100, tax_rate: 19 }],
    });
    expect(created.status).toBe(201);
    const id = (await created.json()).data.id;
    expect(await shape(ctx.db, id)).toBe('array');

    const next = await app.request(`/invoices/${id}/generate-next`, { method: 'POST' });
    expect(next.status).toBeLessThan(300);
    const nextId = (await next.json()).data.id;
    expect(await shape(ctx.db, nextId)).toBe('array');
  });
});
