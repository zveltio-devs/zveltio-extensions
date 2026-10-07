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
let member: { cookie: string; userId: string } = { cookie: '', userId: '' };
let dropCollection: (db: Any, name: string) => Promise<void>;
let registries: Any;
let offHook: () => void = () => undefined;
const hookUsers: string[] = [];
const ids: Record<string, string> = {};

async function gql(query: string, as = cookie) {
  const res = await app.request('/ext/developer/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: as },
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
    const { engineHandle } = (await import(join(ENGINE, 'lib', 'engine-handle.js'))) as Any;
    const tenancy = (await import(join(ENGINE, 'lib', 'tenancy', 'index.js'))) as Any;
    const { engineEvents } = (await import(join(ENGINE, 'lib', 'runtime', 'index.js'))) as Any;
    const { buildExtensionInternals } = (await import(join(ENGINE, 'lib', 'extensions', 'internals.js'))) as Any;
    const { gateInternals } = (await import(join(ENGINE, 'lib', 'extensions', 'capabilities.js'))) as Any;
    const { createRestrictedDb } = (await import(join(ENGINE, 'lib', 'extensions', 'extension-context.js'))) as Any;
    const { getAuth } = (await import(join(ENGINE, 'lib', 'auth.js'))) as Any;
    const { sessionPrefetch } = (await import(join(ENGINE, 'middleware', 'session-prefetch.js'))) as Any;
    const { tenantMiddleware } = (await import(join(ENGINE, 'middleware', 'tenant.js'))) as Any;
    const gate = (await import(join(ENGINE, 'middleware', 'extension-auth-gate.js'))) as Any;
    registries = { alter: data.queryAlterRegistry, entity: tenancy.entityAccessRegistry };
    dropCollection = harness.dropTestCollection;

    ({ app: engineApp, db } = await harness.getTestApp());
    cookie = await harness.createGodSession(engineApp, db);

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
    member = await harness.createMemberSession(engineApp, db, {
      grants: [{ collection: C, actions: ['read', 'create', 'update', 'delete'] }],
    });
    // `owner` is read-only for the member's role; the data API refuses a write to it.
    await sql`INSERT INTO zvd_column_permissions (collection_name, column_name, role, can_read, can_write)
              VALUES (${C}, 'owner', 'member', true, false)`.execute(db);

    const insert = async (table: string, row: Record<string, string>) =>
      (await db.insertInto(table).values(row).returning('id').executeTakeFirstOrThrow()).id as string;
    ids.parent = await insert(`zvd_${P}`, { label: 'parent' });
    for (const label of ['visible', 'altered-away', 'denied', 'locked']) {
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
      (op === 'view' && row.label === 'denied') || (op !== 'view' && row.label === 'locked') ? 'deny' : 'allow');
    offHook = engineEvents.onBefore('record.beforeInsert', (p: Any) => {
      if (p.collection === C) hookUsers.push(p.userId);
    });

    // What production hands the extension: the restricted `ctx.db` over the
    // request's transaction, and `ctx.internals` gated by the manifest.
    const manifest = JSON.parse(await Bun.file(join(import.meta.dir, '..', 'manifest.json')).text());
    const ctx: Any = {
      db: createRestrictedDb(() => tenancy.getCurrentTenantTrx() ?? db, 'developer/graphql'),
      config: {},
      auth: getAuth(),
      checkPermission: tenancy.checkPermission,
      getUserRoles: async () => [],
      // As `register.ts` hands it over: the helper's own SQL on the engine's view
      // of whatever handle the extension passes (`engineSqlHelper`).
      DDLManager: new Proxy(data.DDLManager, {
        get: (t: Any, p: string) =>
          typeof t[p] === 'function' ? (...a: Any[]) => t[p](...a.map(engineHandle)) : t[p],
      }),
      internals: gateInternals('developer/graphql', buildExtensionInternals(), manifest.permissions ?? []),
    };
    const { Hono } = (await import(join(import.meta.dir, '..', '..', '..', 'node_modules', 'hono', 'dist', 'index.js'))) as Any;
    const mod = await import(join(import.meta.dir, 'index.js'));
    // The engine's own `/ext/*` chain in front of the sub-app, as `index.ts` mounts it.
    app = new Hono();
    app.use('/ext/*', sessionPrefetch(getAuth(), db));
    app.use('/ext/*', tenantMiddleware);
    app.use('/ext/*', gate.extensionAuthGate(getAuth(), db));
    gate.registerExtensionPublicRoutes('developer/graphql', []);
    const sub = new Hono();
    await mod.default.register(sub, ctx);
    app.route('/ext/developer/graphql', sub);
    // The bundle's schema cache is per tenant and shared by every file in this
    // process; one built before C and P existed does not name them.
    const refreshed = await app.request('/ext/developer/graphql/refresh-schema', { method: 'POST', headers: { cookie } });
    expect(refreshed.status).toBe(200);
  }, 60_000);

  afterAll(async () => {
    offHook();
    registries?.alter.unregisterAll(OWNER);
    registries?.entity.unregisterAll(OWNER);
    if (!db) return;
    await db.deleteFrom('zvd_relations').where('source_collection', '=', P).execute().catch(() => undefined);
    await db.deleteFrom('zvd_column_permissions').where('collection_name', '=', C).execute().catch(() => undefined);
    await db.deleteFrom('zv_revisions').where('collection', '=', C).execute().catch(() => undefined);
    for (const name of [C, P]) await dropCollection(db, name).catch(() => undefined);
  });

  it('the data API hides both rows (the oracle this suite compares against)', async () => {
    const res = await engineApp.request(`/api/data/${C}`, { headers: { cookie } });
    expect(res.status).toBe(200);
    expect(labels((await res.json()).records)).toEqual(['locked', 'visible']);
  });

  it('list_ drops the row an alter hides and the row entity access denies', async () => {
    const r = await gql(`{ list_${C} { label } }`);
    expect(r.errors).toBeUndefined();
    expect(labels(r.data[`list_${C}`])).toEqual(['locked', 'visible']);
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
    expect(labels(r.data[`list_${P}`][0].items)).toEqual(['locked', 'visible']);
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
  // ── Mutations take the data API's write path ──
  //
  // They used to write with Kysely through `ctx.db`. Measured before the fix
  // (2026-09-30): update_/delete_ reached the row an alter hides and the row
  // entity access refuses to update or delete, where the data API answers 404
  // and 403; `created_by` stayed NULL, no revision was written, and a
  // before-insert hook saw `system:developer/graphql` instead of the caller.
  const rowOf = (id: string) =>
    db.selectFrom(`zvd_${C}`).select(['label', 'created_by', 'updated_by']).where('id', '=', id).executeTakeFirst();
  // `create_` hands back nothing on this collection: an alter restricts it, and
  // a RETURNING row an alter restricts is refused (see `readBack`).
  const idOf = async (label: string) =>
    (await db.selectFrom(`zvd_${C}`).select('id').where('label', '=', label).executeTakeFirstOrThrow()).id as string;
  const revisionsOf = (id: string) =>
    db.selectFrom('zv_revisions').select(['action', 'user_id']).where('collection', '=', C)
      // One transaction stamps one `created_at`, so order by action, not time.
      .where('record_id', '=', id).orderBy('action').execute();

  it('update_ and delete_ do not reach a row an alter hides', async () => {
    const r = await gql(`mutation { u: update_${C}(id: "${ids['altered-away']}", label: "pwned") { label }
                                    d: delete_${C}(id: "${ids['altered-away']}") }`);
    expect(r.errors).toBeUndefined();
    expect(r.data).toEqual({ u: null, d: false });
    expect((await rowOf(ids['altered-away']))?.label).toBe('altered-away');
  });

  it('update_ and delete_ are refused on a row entity access locks for writing', async () => {
    const u = await gql(`mutation { update_${C}(id: "${ids.locked}", label: "pwned") { label } }`);
    const del = await gql(`mutation { delete_${C}(id: "${ids.locked}") }`);
    for (const r of [u, del]) expect(r.errors?.[0]?.message).toBe('Forbidden');
    expect((await rowOf(ids.locked))?.label).toBe('locked');
  });

  it('create_ records the caller as author and writes a revision; hooks see the caller', async () => {
    hookUsers.length = 0;
    const r = await gql(`mutation { create_${C}(label: "by-member") { label } }`, member.cookie);
    expect(r.errors).toBeUndefined();
    const id = await idOf('by-member');
    expect(await rowOf(id)).toEqual({ label: 'by-member', created_by: member.userId, updated_by: member.userId });
    expect(await revisionsOf(id)).toEqual([{ action: 'create', user_id: member.userId }]);
    expect(hookUsers).toEqual([member.userId]);
  });

  it('update_ and delete_ write their revisions as the caller', async () => {
    await gql(`mutation { create_${C}(label: "rev") { label } }`, member.cookie);
    const id = await idOf('rev');
    const r = await gql(`mutation { u: update_${C}(id: "${id}", label: "rev2") { label } d: delete_${C}(id: "${id}") }`, member.cookie);
    expect(r.errors).toBeUndefined();
    expect(r.data).toEqual({ u: null, d: true });
    expect(await revisionsOf(id)).toEqual(
      ['create', 'delete', 'update'].map((action) => ({ action, user_id: member.userId })),
    );
  });

  it('a column the role may not write is refused, as the data API refuses it', async () => {
    const r = await gql(`mutation { c: create_${C}(label: "forged", owner: "x") { label }
                                    u: update_${C}(id: "${ids.visible}", owner: "x") { label } }`, member.cookie);
    expect(r.errors?.map((e: Any) => e.message)).toHaveLength(2);
    for (const e of r.errors) expect(e.message).toContain('read-only for your role: owner');
    expect(await db.selectFrom(`zvd_${C}`).select('id').where('label', '=', 'forged').executeTakeFirst()).toBeUndefined();
  });
});
