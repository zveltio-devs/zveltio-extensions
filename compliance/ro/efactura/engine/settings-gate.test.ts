/**
 * Configuring the ANAF connection is a decision, not a module feature.
 *
 * The engine seed hands `efactura:create` to EVERY tenant_member
 * (001_initial.sql: `('p','tenant_member','*','efactura','create')`), and the
 * settings write, the OAuth exchange and the token refresh sat behind nothing
 * more. Measured before the fix: a principal holding efactura:read/create/
 * update/delete — and nothing else — PUT /settings and got 200, overwriting
 * the OAuth client id, the filing CIF and the certificate path of the
 * company's connection to the tax authority. Submit already refused that same
 * principal 403; the connection's credentials are not a smaller decision than
 * the submission they authenticate.
 *
 * The same shape for storno: a credit note against a FILED invoice moves the
 * VAT return the other way, and asked nothing beyond the module gate.
 *
 * The harness's all-or-nothing checkPermission cannot express "has
 * efactura:create but not efactura:settings", so this mounts the packed
 * engine with a granular one.
 *
 * Skipped without TEST_DATABASE_URL: the allow path writes to Postgres.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { dirname, join } from 'path';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { applyOwnMigrations } from './test-utils';

const URL_ = process.env.TEST_DATABASE_URL;
const d = URL_ ? describe : describe.skip;

const REPO = dirname(dirname(dirname(dirname(import.meta.dir)))); // engine/ -> repo root

const BASE_ACTIONS = new Set(['read', 'create', 'update', 'delete']);

function makeCtx(
  db: unknown,
  allow: (resource: string, action: string) => boolean,
  tenantAdmin = false,
) {
  return {
    db,
    auth: {
      api: {
        getSession: async () => ({
          user: { id: 'gate-user', role: 'user', email: 'gate@test.local', name: 'Gate' },
        }),
      },
    },
    checkPermission: async (_uid: string, resource: string, action: string) => allow(resource, action),
    events: { on() {}, off() {}, emit: async () => {}, emitAsync: async () => {} },
    services: { register() {}, get: () => null, has: () => false },
    // `mayConfigure` falls back to the tenant-scoped helper, so the stub has to
    // carry it or the deny path throws instead of refusing. Both values are
    // exercised below: false must 403 and true must 200, which is what keeps
    // this from passing with the guard removed.
    internals: { isTenantAdmin: async () => tenantAdmin },
    config: { vars: {}, env: 'test', isProduction: false, encryptionConfigured: false },
    env: {},
    log: console,
  };
}

d('efactura — connection settings and storno ask who is asking', () => {
  const pool = new Pool({ connectionString: URL_ });
  const db = new Kysely<Record<string, never>>({ dialect: new PostgresDialect({ pool }) });
  let mod: any;
  let Hono: any;

  beforeAll(async () => {
    await applyOwnMigrations((q) => pool.query(q));
    mod = await import(join(import.meta.dir, 'index.js'));
    // Path-based, NOT the bare specifier: this repo's tsconfig maps `hono` to
    // engine .d.ts files and bun honours tsconfig paths at runtime.
    Hono = (await import(join(REPO, 'node_modules/hono/dist/index.js'))).Hono;
  });

  afterAll(async () => {
    await sql`DELETE FROM zv_efactura_invoices WHERE invoice_number LIKE 'GATE-%'`.execute(db);
    await sql`DELETE FROM zv_efactura_settings WHERE seller_cif = 'GATE-CIF'`.execute(db);
    await db.destroy();
  });

  async function mount(allow: (resource: string, action: string) => boolean, tenantAdmin = false) {
    const app = new Hono();
    await mod.default.register(app, makeCtx(db, allow, tenantAdmin));
    return app;
  }

  const json = { 'content-type': 'application/json' };

  it('refuses the settings write to a holder of only efactura:read/create/update/delete', async () => {
    const app = await mount((r, a) => r === 'efactura' && BASE_ACTIONS.has(a));
    const res = await app.request('/settings', {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ environment: 'test', seller_cif: 'GATE-CIF' }),
    });
    expect(res.status).toBe(403);
  });

  it('refuses the OAuth exchange to the same principal', async () => {
    const app = await mount((r, a) => r === 'efactura' && BASE_ACTIONS.has(a));
    const res = await app.request('/oauth/exchange', {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ code: 'x', redirect_uri: 'https://example.com/cb' }),
    });
    expect(res.status).toBe(403);
  });

  it('refuses a storno to the same principal — it is a fiscal decision', async () => {
    const app = await mount((r, a) => r === 'efactura' && BASE_ACTIONS.has(a));
    const res = await app.request(`/${crypto.randomUUID()}/storno`, {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ reason: 'GATE' }),
    });
    expect(res.status).toBe(403);
  });

  it('allows the settings write with efactura:settings, and still allows invoice creation without it', async () => {
    const withSettings = await mount(
      (r, a) => r === 'efactura' && (BASE_ACTIONS.has(a) || a === 'settings'),
    );
    const res = await withSettings.request('/settings', {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ environment: 'test', seller_cif: 'GATE-CIF' }),
    });
    expect(res.status).toBe(200);

    // Control: the gate is specific — the base module actions are untouched.
    const baseOnly = await mount((r, a) => r === 'efactura' && BASE_ACTIONS.has(a));
    const create = await baseOnly.request('/', {
      method: 'POST',
      headers: json,
      body: JSON.stringify({
        invoice_number: `GATE-${Date.now()}`,
        invoice_date: '2026-09-08',
        seller_name: 'S',
        seller_cui: '1',
        buyer_name: 'B',
        lines: [{ description: 'd', quantity: 1, unit_price: 10, vat_rate: 19, vat_amount: 1.9, line_total: 11.9 }],
        subtotal: 10,
        vat_total: 1.9,
        total: 11.9,
      }),
    });
    expect(create.status).toBe(201);
  });

  it('allows the settings write to a tenant admin holding no efactura:settings', async () => {
    const app = await mount((r, a) => r === 'efactura' && BASE_ACTIONS.has(a), true);
    const res = await app.request('/settings', {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ environment: 'test', seller_cif: 'GATE-CIF' }),
    });
    expect(res.status).toBe(200);
  });
});
