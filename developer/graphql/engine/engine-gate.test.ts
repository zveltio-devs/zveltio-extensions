// The resolvers against a REAL engine: `ctx.internals` is the one the engine
// builds (`buildExtensionInternals`), `ctx.db` the restricted proxy it hands
// every extension, and the alters and entity-access checks are registered on the
// engine's own registries — the way another extension registers them through
// `ctx.queryAlter` / `ctx.entityAccess`.
//
// `read-gate.test.ts` answers the three policy lookups itself; that cannot see
// the other half of the engine's read gate. Measured before the fix (2026-09-30):
// `list_*` returned the row an alter hides and the row an entity-access check
// denies, while `GET /api/data` for the same user returned neither.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import { applyOwnMigrations } from './test-utils';

// biome-ignore lint/suspicious/noExplicitAny: engine modules imported by path, and the packed bundle
type Any = any;

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;
const ENGINE = join(import.meta.dir, '..', '..', '..', '..', 'zveltio', 'packages', 'engine', 'src');
const C = `gqlgate_${Date.now()}`;
const P = `${C}_p`;
const OWNER = 'graphql-engine-gate-test';

let engineApp: Any;
let db: Any;
let app: Any;
let cookie = '';
let dropCollection: (db: Any, name: string) => Promise<void>;
let registries: Any;
const ids: Record<string, string> = {};

async function gql(query: string) {
  const res = await app.request('/', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  return res.json();
}
const labels = (rows: Any[]) => rows.map((r) => r.label).sort();

d('developer/graphql — the engine read gate, not a copy of half of it', () => {
  beforeAll(async () => {
    const harness = (await import(join(ENGINE, 'testing', 'app-harness.js'))) as Any;
    const { sql } = (await import(join(ENGINE, '..', 'node_modules', 'kysely', 'dist', 'index.js'))) as Any;
    const data = (await import(join(ENGINE, 'lib', 'data', 'index.js'))) as Any;
    const tenancy = (await import(join(ENGINE, 'lib', 'tenancy', 'index.js'))) as Any;
    const { buildExtensionInternals } = (await import(join(ENGINE, 'lib', 'extensions', 'internals.js'))) as Any;
    const { createRestrictedDb } = (await import(join(ENGINE, 'lib', 'extensions', 'extension-context.js'))) as Any;
    registries = { alter: data.queryAlterRegistry, entity: tenancy.entityAccessRegistry };
    dropCollection = harness.dropTestCollection;

    ({ app: engineApp, db } = await harness.getTestApp());
    cookie = await harness.createGodSession(engineApp, db);
    const god = (await sql`SELECT id, email FROM "user" WHERE role = 'god'`.execute(db)).rows[0];

    const text = (name: string, extra = {}) => ({ name, type: 'text', required: false, unique: false, indexed: false, ...extra });
    await data.DDLManager.createCollection(db, { name: C, fields: [text('label'), text('owner'), text('secret', { encrypted: true })] });
    await data.DDLManager.createCollection(db, { name: P, fields: [text('label'), text('pick')] });
    for (const name of [C, P]) {
      for (let i = 0; i < 100; i++) {
        const seen = await sql`SELECT to_regclass(${`zvd_${name}`}) AS t`.execute(db);
        if (seen.rows[0].t) break;
        await Bun.sleep(100);
      }
    }
    await applyOwnMigrations((q) => sql.raw(q).execute(db));

    const insert = async (table: string, row: Record<string, string>) =>
      (await db.insertInto(table).values(row).returning('id').executeTakeFirstOrThrow()).id as string;
    ids.parent = await insert(`zvd_${P}`, { label: 'parent' });
    for (const label of ['visible', 'altered-away', 'denied']) {
      ids[label] = await insert(`zvd_${C}`, { label, owner: ids.parent });
    }
    await db.updateTable(`zvd_${P}`).set({ pick: ids.denied }).where('id', '=', ids.parent).execute();
    await sql`DELETE FROM zvd_relations WHERE source_collection = ${P}`.execute(db);
    await sql`INSERT INTO zvd_relations (name, type, source_collection, source_field, target_collection, target_field)
              VALUES (${`${P}_items`}, 'o2m', ${P}, 'items', ${C}, 'owner'),
                     (${`${P}_pick`}, 'm2o', ${P}, 'pick', ${C}, NULL)`.execute(db);

    const table = `zvd_${C}`;
    registries.alter.registerAs(OWNER, table, (qb: Any) => qb.where('label', '!=', 'altered-away'));
    registries.entity.registerAs(OWNER, table, (row: Any, _u: Any, op: string) =>
      op === 'view' && row.label === 'denied' ? 'deny' : 'allow');

    const ctx: Any = {
      db: createRestrictedDb(db, 'developer/graphql'),
      config: {},
      auth: { api: { getSession: async () => ({ user: god }) } },
      checkPermission: tenancy.checkPermission,
      getUserRoles: async () => ['god'],
      DDLManager: data.DDLManager,
      internals: buildExtensionInternals(),
    };
    const { Hono } = (await import(join(import.meta.dir, '..', '..', '..', 'node_modules', 'hono', 'dist', 'index.js'))) as Any;
    const mod = await import(join(import.meta.dir, 'index.js'));
    app = new Hono();
    app.use('*', async (c: Any, next: Any) => {
      c.set('tenant', { id: 'test-engine-gate' });
      await next();
    });
    await mod.default.register(app, ctx);
  }, 60_000);

  afterAll(async () => {
    registries?.alter.unregisterAll(OWNER);
    registries?.entity.unregisterAll(OWNER);
    if (!db) return;
    await db.deleteFrom('zvd_relations').where('source_collection', '=', P).execute().catch(() => undefined);
    for (const name of [C, P]) await dropCollection(db, name).catch(() => undefined);
  });

  it('the data API hides both rows (the oracle this suite compares against)', async () => {
    const res = await engineApp.request(`/api/data/${C}`, { headers: { cookie } });
    expect(res.status).toBe(200);
    expect(labels((await res.json()).records)).toEqual(['visible']);
  });

  it('list_ drops the row an alter hides and the row entity access denies', async () => {
    const r = await gql(`{ list_${C} { label } }`);
    expect(r.errors).toBeUndefined();
    expect(labels(r.data[`list_${C}`])).toEqual(['visible']);
  });

  it('get_ answers null for both, and the row for a visible one', async () => {
    const r = await gql(`{ a: get_${C}(id: "${ids['altered-away']}") { label }
                          d: get_${C}(id: "${ids.denied}") { label }
                          v: get_${C}(id: "${ids.visible}") { label } }`);
    expect(r.errors).toBeUndefined();
    expect(r.data).toEqual({ a: null, d: null, v: { label: 'visible' } });
  });

  it('o2m and m2o reach the target through its whole gate', async () => {
    const r = await gql(`{ list_${P} { items { label } pick { label } } }`);
    expect(r.errors).toBeUndefined();
    expect(labels(r.data[`list_${P}`][0].items)).toEqual(['visible']);
    expect(r.data[`list_${P}`][0].pick).toBeNull();
  });

  it('a mutation does not hand back a row the caller may not view', async () => {
    const r = await gql(`mutation { update_${C}(id: "${ids.denied}", owner: "${ids.parent}") { label } }`);
    expect(r.errors).toBeUndefined();
    expect(r.data[`update_${C}`]).toBeNull();
  });

  // Not a defect, pinned: `ctx.db` runs `processInput` on every zvd_* write, so
  // a GraphQL mutation stores what the data API stores.
  it('mutation input goes through the field pipeline (encrypted at rest)', async () => {
    const r = await gql(`mutation { create_${C}(label: "enc", secret: "plain-value") { label } }`);
    expect(r.errors).toBeUndefined();
    const row = await db.selectFrom(`zvd_${C}`).select('secret').where('label', '=', 'enc').executeTakeFirst();
    expect(String(row.secret)).toStartWith('enc:v1:');
  });
});
