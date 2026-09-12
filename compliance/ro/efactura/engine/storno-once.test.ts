/**
 * One invoice, one storno. Never two.
 *
 * The handler used to read the original OUTSIDE any transaction and insert
 * unconditionally, so two requests — sequential or concurrent — each produced
 * a credit note against the same filed invoice: two negative documents on the
 * VAT return cancelling one positive one. Measured before the fix:
 * first=201 second=201, two rows in zv_efactura_storno, two STORNO- invoices.
 *
 * The fix locks the original FOR UPDATE and checks for an existing storno
 * under that lock. The concurrency half of this test warms the harness pool
 * first: the pool is LAZY (max 4), and on a cold pool the first request pays
 * for opening a connection while the rest wait — it has committed before any
 * of them reads, so the requests never overlap and the test passes whatever
 * the handler does. Measured in finance/invoicing: a payments test stayed
 * green with its fix reverted until the pool was warmed.
 *
 * Skipped without TEST_DATABASE_URL: the property is about persisted state.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { mountForTest } from '../../../../testing/ext-harness';

const URL_ = process.env.TEST_DATABASE_URL;
const d = URL_ ? describe : describe.skip;

d('efactura — an invoice gets exactly one storno', () => {
  const pool = new Pool({ connectionString: URL_ });
  const db = new Kysely<Record<string, never>>({ dialect: new PostgresDialect({ pool }) });
  let app: any;

  beforeAll(async () => {
    ({ app } = await mountForTest(import.meta.dir));
    // Warm the lazy pool or the "concurrent" pair below never overlaps.
    await Promise.all([app.request('/'), app.request('/'), app.request('/'), app.request('/')]);
  });

  afterAll(async () => {
    await sql`DELETE FROM zv_efactura_storno WHERE reason LIKE 'ONCE-%'`.execute(db);
    await sql`DELETE FROM zv_efactura_invoices WHERE invoice_number LIKE 'ONCE-%' OR invoice_number LIKE 'STORNO-ONCE-%'`.execute(db);
    await db.destroy();
  });

  async function seedAccepted(number: string): Promise<string> {
    const r = await sql<{ id: string }>`
      INSERT INTO zv_efactura_invoices
        (invoice_number, invoice_date, seller_name, seller_cui, buyer_name, lines,
         subtotal, vat_total, total, currency, status)
      VALUES (${number}, CURRENT_DATE, 'S', '12345678', 'B', '[]'::jsonb, 100, 19, 119, 'RON', 'accepted')
      RETURNING id
    `.execute(db);
    return r.rows[0].id;
  }

  const body = { 'content-type': 'application/json' };

  it('refuses a second, sequential storno', async () => {
    const id = await seedAccepted(`ONCE-SEQ-${Date.now()}`);
    const first = await app.request(`/${id}/storno`, { method: 'POST', headers: body, body: JSON.stringify({ reason: 'ONCE-first' }) });
    const second = await app.request(`/${id}/storno`, { method: 'POST', headers: body, body: JSON.stringify({ reason: 'ONCE-second' }) });
    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
  });

  it('refuses a concurrent pair: exactly one credit note exists afterwards', async () => {
    const number = `ONCE-PAR-${Date.now()}`;
    const id = await seedAccepted(number);
    const [a, b] = await Promise.all([
      app.request(`/${id}/storno`, { method: 'POST', headers: body, body: JSON.stringify({ reason: 'ONCE-a' }) }),
      app.request(`/${id}/storno`, { method: 'POST', headers: body, body: JSON.stringify({ reason: 'ONCE-b' }) }),
    ]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);

    const stornos = await sql<{ n: number }>`
      SELECT count(*)::int n FROM zv_efactura_storno WHERE original_id = ${id}::uuid
    `.execute(db);
    const notes = await sql<{ n: number }>`
      SELECT count(*)::int n FROM zv_efactura_invoices WHERE invoice_number = ${`STORNO-${number}`}
    `.execute(db);
    expect(stornos.rows[0].n).toBe(1);
    expect(notes.rows[0].n).toBe(1);
  });
});
