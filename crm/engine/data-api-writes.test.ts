// CRM writes contacts and organizations through the data API's
// own handlers (`ctx.internals.createRecord` and friends), against a REAL engine:
// its `/ext/*` chain, its `ctx.internals`, its Casbin, its flow trigger.
//
// They used to be raw SQL through `ctx.db`. Measured before the fix
// (2026-10-17): an active `on_create` flow on `contacts` never ran for a contact
// created from the CRM page, no revision was written, and a caller the operator
// had refused on the `contacts` collection could still create one through
// `/ext/crm/contacts` — the extension route was a way around the collection's
// permission. Transactions stay on raw SQL (see the note in `routes.ts`); their
// jsonb shape is still pinned by `jsonb-shape.test.ts`.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import { seatHarnessGod } from '../../testing/ext-harness';

// biome-ignore lint/suspicious/noExplicitAny: engine modules imported by path, and the packed bundle
type Any = any;

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;
const ENGINE = join(import.meta.dir, '..', '..', '..', 'zveltio', 'packages', 'engine', 'src');
const STAMP = Date.now();

let engineApp: Any;
let db: Any;
let sql: Any;
let app: Any;
let godCookie = '';
let godId = '';
const flowIds: Record<string, string> = {};

const send = (method: string, path: string, body: unknown, cookie = godCookie) =>
  app.request(`/ext/crm${path}`, {
    method,
    headers: { 'content-type': 'application/json', cookie },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

async function runs(trigger: string): Promise<number> {
  const r = await sql`
    SELECT count(*)::int AS n FROM zv_flow_runs WHERE flow_id = ${flowIds[trigger]}::uuid AND status = 'success'
  `.execute(db);
  return r.rows[0].n;
}
async function revisions(collection: string, id: string): Promise<string[]> {
  const r = await sql`
    SELECT action FROM zv_revisions WHERE collection = ${collection} AND record_id = ${id} ORDER BY created_at
  `.execute(db);
  return r.rows.map((x: Any) => x.action);
}
async function jsonbType(table: string, col: string, id: string): Promise<string> {
  const r = await sql`SELECT jsonb_typeof(${sql.ref(col)}) AS t FROM ${sql.table(table)} WHERE id = ${id}`.execute(db);
  return r.rows[0].t;
}
// Flows fire after commit, fire-and-forget.
async function eventually(fn: () => Promise<boolean>): Promise<boolean> {
  for (let i = 0; i < 40; i++) {
    if (await fn()) return true;
    await Bun.sleep(100);
  }
  return false;
}

d('crm writes go through the data API', () => {
  beforeAll(async () => {
    const harness = (await import(join(ENGINE, 'testing', 'app-harness.js'))) as Any;
    ({ sql } = (await import(join(ENGINE, '..', 'node_modules', 'kysely', 'dist', 'index.js'))) as Any);
    const data = (await import(join(ENGINE, 'lib', 'data', 'index.js'))) as Any;
    const { engineHandle } = (await import(join(ENGINE, 'lib', 'engine-handle.js'))) as Any;
    const tenancy = (await import(join(ENGINE, 'lib', 'tenancy', 'index.js'))) as Any;
    const { buildExtensionInternals } = (await import(join(ENGINE, 'lib', 'extensions', 'internals.js'))) as Any;
    const { gateInternals } = (await import(join(ENGINE, 'lib', 'extensions', 'capabilities.js'))) as Any;
    const { createRestrictedDb } = (await import(join(ENGINE, 'lib', 'extensions', 'extension-context.js'))) as Any;
    const { getAuth } = (await import(join(ENGINE, 'lib', 'auth.js'))) as Any;
    const { sessionPrefetch } = (await import(join(ENGINE, 'middleware', 'session-prefetch.js'))) as Any;
    const { tenantMiddleware } = (await import(join(ENGINE, 'middleware', 'tenant.js'))) as Any;
    const gate = (await import(join(ENGINE, 'middleware', 'extension-auth-gate.js'))) as Any;

    ({ app: engineApp, db } = await harness.getTestApp());
    godCookie = await harness.createGodSession(engineApp, db);
    godId = (await sql`SELECT id FROM "user" WHERE role = 'god'`.execute(db)).rows[0].id;

    const mod = await import(join(import.meta.dir, 'index.js'));
    // The UP half of each migration, as the engine applies them.
    for (const f of mod.default.getMigrations() as string[]) {
      await sql.raw((await Bun.file(f).text()).split(/^-- DOWN$/m)[0]).execute(db);
    }

    for (const trigger of ['on_create', 'on_update', 'on_delete']) {
      const r = await sql`
        INSERT INTO zv_flows (name, trigger_type, trigger_config, is_active)
        VALUES (${`crm-${trigger}-${STAMP}`}, ${trigger}, ${JSON.stringify({ collection: 'contacts' })}::jsonb, true)
        RETURNING id::text AS id
      `.execute(db);
      flowIds[trigger] = r.rows[0].id;
    }

    // What production hands a first-party extension: the restricted `ctx.db`
    // over the request's transaction, and `ctx.internals` gated by the manifest.
    const manifest = JSON.parse(await Bun.file(join(import.meta.dir, '..', 'manifest.json')).text());
    const services = new Map<string, unknown>();
    const ctx: Any = {
      db: createRestrictedDb(() => tenancy.getCurrentTenantTrx() ?? db, 'crm'),
      config: {},
      auth: getAuth(),
      checkPermission: tenancy.checkPermission,
      getUserRoles: async () => [],
      events: { on() {}, off() {}, emit() {}, emitAsync: async () => undefined },
      services: {
        register: (n: string, s: unknown) => void services.set(n, s),
        get: (n: string) => services.get(n),
        has: (n: string) => services.has(n),
      },
      DDLManager: new Proxy(data.DDLManager, {
        get: (t: Any, p: string) =>
          typeof t[p] === 'function' ? (...a: Any[]) => t[p](...a.map(engineHandle)) : t[p],
      }),
      internals: gateInternals('crm', buildExtensionInternals(), manifest.permissions ?? []),
    };
    const { Hono } = (await import(join(import.meta.dir, '..', '..', 'node_modules', 'hono', 'dist', 'index.js'))) as Any;
    app = new Hono();
    app.use('/ext/*', sessionPrefetch(getAuth(), db));
    app.use('/ext/*', tenantMiddleware);
    app.use('/ext/*', gate.extensionAuthGate(getAuth(), db));
    gate.registerExtensionPublicRoutes('crm', []);
    const sub = new Hono();
    await mod.default.register(sub, ctx);
    app.route('/ext/crm', sub);
  }, 60_000);

  afterAll(async () => {
    // createGodSession took the god seat from the harness user; later suites
    // (auth/scim, auth/saml) need it back.
    await seatHarnessGod();
    if (!db) return;
    for (const id of Object.values(flowIds)) {
      await sql`DELETE FROM zv_flow_runs WHERE flow_id = ${id}::uuid`.execute(db).catch(() => undefined);
      await sql`DELETE FROM zv_flows WHERE id = ${id}::uuid`.execute(db).catch(() => undefined);
    }
  });

  it('a contact created, edited and deleted from the CRM runs its flows and leaves revisions', async () => {
    const created = await send('POST', '/contacts', { first_name: 'Flow', email: `flow-${STAMP}@example.test` });
    expect(created.status).toBe(201);
    const contact = (await created.json()).data;
    expect(contact.first_name).toBe('Flow');
    expect(await eventually(async () => (await runs('on_create')) > 0)).toBe(true);
    const row = (await sql`SELECT created_by FROM zvd_contacts WHERE id = ${contact.id}`.execute(db)).rows[0];
    expect(row.created_by).toBe(godId);

    const edited = await send('PATCH', `/contacts/${contact.id}`, { last_name: 'Edited' });
    expect(edited.status).toBe(200);
    expect((await edited.json()).data.last_name).toBe('Edited');
    expect(await eventually(async () => (await runs('on_update')) > 0)).toBe(true);

    const deleted = await send('DELETE', `/contacts/${contact.id}`, undefined);
    expect(deleted.status).toBe(200);
    expect(await deleted.json()).toEqual({ success: true });
    expect(await eventually(async () => (await runs('on_delete')) > 0)).toBe(true);
    expect(await revisions('contacts', contact.id)).toEqual(['create', 'update', 'delete']);
  });

  it('an organization created, edited and deleted leaves revisions, and keeps jsonb as jsonb', async () => {
    const org = await send('POST', '/organizations', { name: `Org ${STAMP}`, metadata: { a: 1 } });
    expect(org.status).toBe(201);
    const orgId = (await org.json()).data.id;
    expect(await jsonbType('zvd_organizations', 'metadata', orgId)).toBe('object');
    const edited = await send('PATCH', `/organizations/${orgId}`, { metadata: { b: 2 } });
    expect(edited.status).toBe(200);
    expect((await edited.json()).data.metadata).toEqual({ b: 2 });
    expect(await jsonbType('zvd_organizations', 'metadata', orgId)).toBe('object');
    expect((await send('DELETE', `/organizations/${orgId}`, undefined)).status).toBe(200);
    expect(await revisions('organizations', orgId)).toEqual(['create', 'update', 'delete']);
  });

  it('a contact keeps metadata as jsonb', async () => {
    const res = await send('POST', '/contacts', { first_name: 'J', metadata: { a: 1 } });
    expect(res.status).toBe(201);
    const id = (await res.json()).data.id;
    expect(await jsonbType('zvd_contacts', 'metadata', id)).toBe('object');
    expect((await send('PATCH', `/contacts/${id}`, { metadata: { b: 2 } })).status).toBe(200);
    expect(await jsonbType('zvd_contacts', 'metadata', id)).toBe('object');
  });

  it('a contact with an organization gets the link; an unknown organization leaves no contact behind', async () => {
    const org = (await (await send('POST', '/organizations', { name: `Link ${STAMP}` })).json()).data;
    const ok = await send('POST', '/contacts', { first_name: 'Linked', organization_id: org.id, organization_role: 'CFO' });
    expect(ok.status).toBe(201);
    const linked = (await (await send('GET', `/contacts/${(await ok.json()).data.id}`, undefined)).json()).data;
    expect(linked.organizations.map((o: Any) => o.id)).toEqual([org.id]);

    const email = `orphan-${STAMP}@example.test`;
    const bad = await send('POST', '/contacts', { first_name: 'Orphan', email, organization_id: crypto.randomUUID() });
    expect(bad.status).toBeGreaterThanOrEqual(400);
    const left = await sql`SELECT count(*)::int AS n FROM zvd_contacts WHERE email = ${email}`.execute(db);
    expect(left.rows[0].n).toBe(0);
  });

  // The decision this change makes: the `crm` resource opens the CRM; the
  // collection's own permission still decides who writes its rows.
  it('a caller allowed into the CRM but refused on `contacts` cannot create one through it', async () => {
    const harness = (await import(join(ENGINE, 'testing', 'app-harness.js'))) as Any;
    const crmOnly = await harness.createMemberSession(engineApp, db, {
      grants: [{ collection: 'crm', actions: ['read', 'create'] }],
    });
    const email = `crm-only-${STAMP}@example.test`;
    const refused = await send('POST', '/contacts', { first_name: 'No', email }, crmOnly.cookie);
    expect(refused.status).toBe(403);
    const left = await sql`SELECT count(*)::int AS n FROM zvd_contacts WHERE email = ${email}`.execute(db);
    expect(left.rows[0].n).toBe(0);

    const both = await harness.createMemberSession(engineApp, db, {
      grants: [
        { collection: 'crm', actions: ['read', 'create'] },
        { collection: 'contacts', actions: ['read', 'create'] },
      ],
    });
    const allowed = await send('POST', '/contacts', { first_name: 'Yes' }, both.cookie);
    expect(allowed.status).toBe(201);
    const id = (await allowed.json()).data.id;
    const row = (await sql`SELECT created_by FROM zvd_contacts WHERE id = ${id}`.execute(db)).rows[0];
    expect(row.created_by).toBe(both.userId);
  });
});
