/**
 * A submission whose outcome is unknown must not be repeatable.
 *
 * `POST /:id/submit` used to leave the invoice on `xml_generated` when the call
 * to ANAF failed — including on a 60-second timeout, which does not mean "it did
 * not happen", it means "I do not know". `xml_generated` is exactly the state
 * the Send button is visible in, so the operator saw an error, pressed Send
 * again, and filed the same invoice a SECOND time. A duplicate at the tax
 * authority is undone by storno, which shows on the VAT return.
 *
 * Skipped without TEST_DATABASE_URL: the property is about persisted state.
 */
import { afterAll, describe, expect, it } from 'bun:test';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { mountForTest } from '../../../../testing/ext-harness';

const URL_ = process.env.TEST_DATABASE_URL;
const d = URL_ ? describe : describe.skip;

d('efactura — an unknown submission outcome is not repeatable', () => {
  const pool = new Pool({ connectionString: URL_ });
  const db = new Kysely<Record<string, never>>({ dialect: new PostgresDialect({ pool }) });
  const realFetch = globalThis.fetch;
  afterAll(async () => {
    globalThis.fetch = realFetch;
    await sql`DELETE FROM zv_efactura_invoices WHERE invoice_number LIKE 'IDEMP-%'`.execute(db);
    await db.destroy();
  });

  it('leaves the invoice claimed after a timeout, and refuses a second send', async () => {
    const { app } = await mountForTest(import.meta.dir);

    // Settings ANAF calls need, so the handler reaches the upload rather than
    // failing earlier on configuration.
    const existing = await sql<{ id: string }>`
      SELECT id FROM zv_efactura_settings LIMIT 1
    `.execute(db);
    if (existing.rows[0]) {
      await sql`
        UPDATE zv_efactura_settings
        SET environment = 'test', seller_cif = '12345678', client_id = 'cid',
            access_token = 'tok', token_expires_at = NULL
        WHERE id = ${existing.rows[0].id}
      `.execute(db);
    } else {
      await sql`
        INSERT INTO zv_efactura_settings (environment, seller_cif, client_id, access_token)
        VALUES ('test', '12345678', 'cid', 'tok')
      `.execute(db);
    }

    const number = `IDEMP-${Date.now()}`;
    const inv = await sql<{ id: string }>`
      INSERT INTO zv_efactura_invoices
        (invoice_number, invoice_date, seller_name, seller_cui, buyer_name, buyer_cui,
         lines, subtotal, vat_total, total, currency, status, xml_content)
      VALUES (${number}, CURRENT_DATE, 'S', '12345678', 'B', '87654321',
              '[]'::jsonb, 100, 19, 119, 'RON', 'xml_generated', '<Invoice/>')
      RETURNING id
    `.execute(db);
    const id = inv.rows[0].id;

    // ANAF unreachable — the shape a timeout takes.
    let uploadAttempts = 0;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/upload')) {
        uploadAttempts++;
        throw new Error('The operation timed out.');
      }
      return realFetch(input, init);
    }) as typeof fetch;

    const first = await app.request(`/${id}/submit`, { method: 'POST' });
    expect(first.status).toBe(502);
    expect(uploadAttempts).toBe(1);

    // The claim must survive: an outcome nobody knows is not a free retry.
    const after = await sql<{ status: string }>`
      SELECT status FROM zv_efactura_invoices WHERE id = ${id}
    `.execute(db);
    expect(after.rows[0].status).toBe('submitting');

    // And the second press must not reach ANAF at all.
    const second = await app.request(`/${id}/submit`, { method: 'POST' });
    expect(second.status).toBe(409);
    expect(uploadAttempts).toBe(1);
  });
});
