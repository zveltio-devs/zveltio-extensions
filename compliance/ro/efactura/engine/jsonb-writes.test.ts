/**
 * jsonb writes must store ARRAYS, on the driver production actually runs.
 *
 * The extension test suite reaches Postgres through `pg`; the engine runs
 * Bun.SQL. A string parameter under `pg` is sent untyped and Postgres parses
 * it, so the defect is INVISIBLE to the pg-based harness; under Bun.SQL the
 * parameter is typed as JSON, a single `::jsonb` cast is a no-op, and the
 * value lands as a jsonb STRING SCALAR. Measured before the fix, both through
 * this dialect:
 *
 *   PATCH /:id { lines: [...] }   jsonb_typeof(lines) = 'string'   (Kysely .set with JSON.stringify)
 *   invoice.created auto-draft    jsonb_typeof(lines) = 'string'   (${JSON.stringify(…)}::jsonb)
 *
 * Both readers tolerated the string (`typeof lines === 'string' ? JSON.parse`)
 * which is why nothing ever looked broken. This mounts the packed engine with
 * a Bun.SQL-backed ctx.db — the same dialect the engine uses — and asks
 * Postgres what shape the column holds.
 *
 * Skipped without TEST_DATABASE_URL: the property is about persisted shape.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { dirname, join } from 'path';
import { Pool } from 'pg';
import { applyOwnMigrations } from './test-utils';

const URL_ = process.env.TEST_DATABASE_URL;
const d = URL_ ? describe : describe.skip;

const REPO = dirname(dirname(dirname(dirname(import.meta.dir)))); // engine/ -> repo root
const ENGINE = join(REPO, '..', 'zveltio');

d('efactura — jsonb columns hold arrays under Bun.SQL (the production driver)', () => {
  const pool = new Pool({ connectionString: URL_ });
  let bunDb: any;
  let app: any;
  let invoiceCreatedListener: any;

  beforeAll(async () => {
    await applyOwnMigrations((q) => pool.query(q));
    const { Kysely } = await import(join(REPO, 'node_modules/kysely/dist/index.js')) as any;
    const { BunSqlDialect } = await import(join(ENGINE, 'packages/engine/src/db/bun-sql-dialect.js')) as any;
    const { Hono } = await import(join(REPO, 'node_modules/hono/dist/index.js')) as any;
    bunDb = new Kysely({ dialect: new BunSqlDialect({ connectionString: URL_ }) });

    const mod = await import(join(import.meta.dir, 'index.js'));
    app = new Hono();
    await mod.default.register(app, {
      db: bunDb,
      auth: {
        api: {
          getSession: async () => ({
            user: { id: 'jsonb-user', role: 'user', email: 'jsonb@test.local', name: 'Jsonb' },
          }),
        },
      },
      checkPermission: async () => true,
      events: {
        on: (name: string, fn: unknown) => {
          if (name === 'invoice.created') invoiceCreatedListener = fn;
        },
        off() {},
        emit: async () => {},
        emitAsync: async () => {},
      },
      services: { register() {}, get: () => null, has: () => false },
      internals: {},
      config: { vars: {}, env: 'test', isProduction: false, encryptionConfigured: false },
      env: {},
      log: console,
    });
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM zv_efactura_invoices WHERE invoice_number LIKE 'JB-%'`);
    if (bunDb) await bunDb.destroy();
    await pool.end();
  });

  const typeofLines = async (id: string): Promise<string> => {
    const r = await pool.query(`SELECT jsonb_typeof(lines) AS t FROM zv_efactura_invoices WHERE id = $1`, [id]);
    return r.rows[0]?.t;
  };

  const validInvoice = (number: string) => ({
    invoice_number: number,
    invoice_date: '2026-09-08',
    seller_name: 'S',
    seller_cui: '1',
    buyer_name: 'B',
    lines: [{ description: 'd', quantity: 1, unit_price: 10, vat_rate: 19, vat_amount: 1.9, line_total: 11.9 }],
    subtotal: 10,
    vat_total: 1.9,
    total: 11.9,
  });

  it('POST / stores lines as an array (control)', async () => {
    const res = await app.request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validInvoice(`JB-POST-${Date.now()}`)),
    });
    expect(res.status).toBe(201);
    const { invoice } = (await res.json()) as any;
    expect(await typeofLines(invoice.id)).toBe('array');
  });

  it('PATCH /:id stores lines as an array — the twin of the POST repair', async () => {
    const create = await app.request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validInvoice(`JB-PATCH-${Date.now()}`)),
    });
    const { invoice } = (await create.json()) as any;
    const patch = await app.request(`/${invoice.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        lines: [{ description: 'patched', quantity: 2, unit_price: 5, vat_rate: 19, vat_amount: 1.9, line_total: 11.9 }],
      }),
    });
    expect(patch.status).toBe(200);
    expect(await typeofLines(invoice.id)).toBe('array');
  });

  it('the invoice.created auto-draft stores lines as an array', async () => {
    expect(typeof invoiceCreatedListener).toBe('function');
    const sourceId = crypto.randomUUID();
    await invoiceCreatedListener({
      id: sourceId,
      invoice: {
        number: `JB-DRAFT-${Date.now()}`,
        issue_date: new Date('2026-09-08'),
        seller_name: 'S',
        seller_tax_id: '1',
        client_name: 'B',
        subtotal: 10,
        tax_amount: 1.9,
        total: 11.9,
      },
      lines: [{ description: 'd', quantity: 1, unit_price: 10, tax_rate: 19, total: 11.9 }],
    });
    const r = await pool.query(
      `SELECT id FROM zv_efactura_invoices WHERE source_invoice_id = $1`,
      [sourceId],
    );
    expect(r.rows.length).toBe(1);
    expect(await typeofLines(r.rows[0].id)).toBe('array');
  });
});
