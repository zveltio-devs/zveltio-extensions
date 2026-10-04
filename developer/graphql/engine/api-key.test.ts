// An API key on the GraphQL endpoint, through the engine's REAL `/ext/*` chain
// (key prefetch, tenant, gate) and the `ctx.checkPermission` production hands
// an extension (`keyAwareCheckPermission`), on the packed bundle.
//
// Measured on master (2026-10-01): every key got 403 EXT_SESSION_REQUIRED — the
// manifest declared no `apiKeyRoutes`. Declaring them alone was worse: the
// handlers' `getSession` answered 401, and past that the resolvers asked
// `ctx.checkPermission`, which answers a key from `$ext:developer/graphql` for
// EVERY collection — a key granted that scope and `read` on A listed B.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import { applyOwnMigrations } from './test-utils';

// biome-ignore lint/suspicious/noExplicitAny: engine modules imported by path, and the packed bundle
type Any = any;

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;
const ENGINE = join(import.meta.dir, '..', '..', '..', '..', 'zveltio', 'packages', 'engine', 'src');
const NAME = 'developer/graphql';
const STAMP = `gqlkey_${Date.now()}`;
const A = `${STAMP}_a`;
const B = `${STAMP}_b`;
const JUNCTION = `zvd_${A}_links`;
const GQL = (actions: string[]) => ({ collection: `$ext:${NAME}`, actions });

let engineApp: Any;
let db: Any;
let app: Any;
let sql: Any;
let cookie = '';
let issuer = '';
let dropCollection: (db: Any, name: string) => Promise<void>;
let makeKey: (scopes: unknown[]) => Promise<string>;
const ids: Record<string, string> = {};

async function post(path: string, body: unknown, headers: Record<string, string>) {
  const res = await app.request(`/ext/${NAME}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}
const gql = async (key: string, query: string) => (await post('', { query }, { 'X-API-Key': key })).body;
const labels = (rows: Any[]) => rows.map((r) => r.label).sort();
const messages = (r: Any) => (r.errors ?? []).map((e: Any) => e.message);

d('developer/graphql — API keys get the data API key semantics', () => {
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
    const { generateApiKey, hashApiKey } = (await import(join(ENGINE, 'lib', 'security', 'api-key-hash.js'))) as Any;
    const gate = (await import(join(ENGINE, 'middleware', 'extension-auth-gate.js'))) as Any;
    dropCollection = harness.dropTestCollection;

    ({ app: engineApp, db } = await harness.getTestApp());
    cookie = await harness.createGodSession(engineApp, db);
    issuer = (await harness.createMemberSession(engineApp, db, { grants: [] })).userId;
    makeKey = async (scopes) => {
      const raw = generateApiKey();
      await sql`INSERT INTO zv_api_keys (name, key_hash, key_prefix, scopes, is_active, created_by)
                VALUES (${STAMP}, ${await hashApiKey(raw)}, 'zvk_', ${JSON.stringify(scopes)}::jsonb, true, ${issuer})`.execute(db);
      return raw;
    };

    const text = (name: string) => ({ name, type: 'text', required: false, unique: false, indexed: false });
    await data.DDLManager.createCollection(db, { name: A, fields: [text('label'), text('pick')] });
    await data.DDLManager.createCollection(db, { name: B, fields: [text('label'), text('owner')] });
    for (const name of [A, B]) {
      for (let i = 0; i < 100; i++) {
        if ((await sql`SELECT to_regclass(${`zvd_${name}`}) AS t`.execute(db)).rows[0].t) break;
        await Bun.sleep(100);
      }
    }
    await applyOwnMigrations((q) => sql.raw(q).execute(db));

    const insert = async (table: string, row: Record<string, string>) =>
      (await db.insertInto(table).values(row).returning('id').executeTakeFirstOrThrow()).id as string;
    ids.b = await insert(`zvd_${B}`, { label: 'b-secret' });
    ids.a = await insert(`zvd_${A}`, { label: 'a-row', pick: ids.b });
    await db.updateTable(`zvd_${B}`).set({ owner: ids.a }).where('id', '=', ids.b).execute();
    await sql.raw(`CREATE TABLE "${JUNCTION}" ("${A}_id" uuid, "${B}_id" uuid)`).execute(db);
    await sql`INSERT INTO ${sql.table(JUNCTION)} VALUES (${ids.a}::uuid, ${ids.b}::uuid)`.execute(db);
    await sql`INSERT INTO zvd_relations (name, type, source_collection, source_field, target_collection, target_field, junction_table)
              VALUES (${`${A}_pick`}, 'm2o', ${A}, 'pick', ${B}, NULL, NULL),
                     (${`${A}_items`}, 'o2m', ${A}, 'items', ${B}, 'owner', NULL),
                     (${`${A}_links`}, 'm2m', ${A}, 'links', ${B}, NULL, ${JUNCTION})`.execute(db);

    const manifest = JSON.parse(await Bun.file(join(import.meta.dir, '..', 'manifest.json')).text());
    const ctx: Any = {
      db: createRestrictedDb(() => tenancy.getCurrentTenantTrx() ?? db, NAME),
      config: {},
      auth: getAuth(),
      // What `register.ts` hands every extension: a key answered from `$ext:<name>`.
      checkPermission: gate.keyAwareCheckPermission(NAME, tenancy.checkPermission),
      getUserRoles: tenancy.getUserRoles,
      // As `register.ts` hands it over: the helper's own SQL on the engine's view
      // of whatever handle the extension passes (`engineSqlHelper`).
      DDLManager: new Proxy(data.DDLManager, {
        get: (t: Any, p: string) =>
          typeof t[p] === 'function' ? (...a: Any[]) => t[p](...a.map(engineHandle)) : t[p],
      }),
      internals: gateInternals(NAME, buildExtensionInternals(), manifest.permissions ?? []),
    };
    const { Hono } = (await import(join(import.meta.dir, '..', '..', '..', 'node_modules', 'hono', 'dist', 'index.js'))) as Any;
    const mod = await import(join(import.meta.dir, 'index.js'));
    app = new Hono();
    app.use('/ext/*', sessionPrefetch(getAuth(), db));
    app.use('/ext/*', tenantMiddleware);
    app.use('/ext/*', gate.extensionAuthGate(getAuth(), db));
    gate.registerExtensionPublicRoutes(NAME, manifest.publicRoutes ?? [], manifest.apiKeyRoutes ?? []);
    const sub = new Hono();
    await mod.default.register(sub, ctx);
    app.route(`/ext/${NAME}`, sub);
    // The schema is cached per tenant across test files; this one adds collections.
    expect((await post('/refresh-schema', {}, { cookie })).status).toBe(200);
  }, 60_000);

  afterAll(async () => {
    if (!db) return;
    await sql`DELETE FROM zv_api_keys WHERE name = ${STAMP}`.execute(db).catch(() => undefined);
    await sql`DELETE FROM zvd_graphql_persisted_queries WHERE name LIKE ${`${STAMP}%`}`.execute(db).catch(() => undefined);
    await db.deleteFrom('zvd_relations').where('source_collection', '=', A).execute().catch(() => undefined);
    await sql.raw(`DROP TABLE IF EXISTS "${JUNCTION}"`).execute(db).catch(() => undefined);
    await db.deleteFrom('zv_revisions').where('collection', '=', A).execute().catch(() => undefined);
    for (const name of [A, B]) await dropCollection(db, name).catch(() => undefined);
  });

  it('a key scoped to A reads A', async () => {
    const key = await makeKey([GQL(['create']), { collection: A, actions: ['read'] }]);
    const res = await post('', { query: `{ list_${A} { label } }` }, { 'X-API-Key': key });
    expect([res.status, res.body.code]).toEqual([200, undefined]);
    expect(res.body.errors).toBeUndefined();
    expect(labels(res.body.data[`list_${A}`])).toEqual(['a-row']);
  });

  it('does not read B — directly, or through m2o, o2m or m2m from A', async () => {
    // `*` on the extension scope: it admits the endpoint, it grants no collection.
    for (const ext of [['*'], ['create']]) {
      const key = await makeKey([GQL(ext), { collection: A, actions: ['read'] }]);
      const direct = await gql(key, `{ list_${B} { label } }`);
      expect(direct.data?.[`list_${B}`] ?? null).toBeNull();
      expect(messages(direct)).toEqual([`Forbidden: no read permission on "${B}"`]);
      const r = await gql(key, `{ list_${A} { label pick { label } items { label } links { label } } }`);
      expect(JSON.stringify(r.data)).not.toContain('b-secret');
      expect(messages(r)).toHaveLength(3);
    }
  });

  it('the same relations do reach B for a key scoped to both (the control)', async () => {
    const key = await makeKey([GQL(['create']), { collection: A, actions: ['read'] }, { collection: B, actions: ['read'] }]);
    const r = await gql(key, `{ list_${A} { pick { label } items { label } links { label } } }`);
    expect(r.errors).toBeUndefined();
    expect(r.data[`list_${A}`]).toEqual([
      { pick: { label: 'b-secret' }, items: [{ label: 'b-secret' }], links: [{ label: 'b-secret' }] },
    ]);
  });

  it('a read-only key cannot write A', async () => {
    const key = await makeKey([GQL(['*']), { collection: A, actions: ['read'] }]);
    const r = await gql(key, `mutation { create_${A}(label: "nope") { label } }`);
    expect(r.data?.[`create_${A}`] ?? null).toBeNull();
    expect(messages(r)).toHaveLength(1);
    expect(await db.selectFrom(`zvd_${A}`).select('id').where('label', '=', 'nope').executeTakeFirst()).toBeUndefined();
  });

  it('a key with write scope creates in A, authored by the issuer', async () => {
    const key = await makeKey([GQL(['create']), { collection: A, actions: ['read', 'create'] }]);
    const r = await gql(key, `mutation { create_${A}(label: "by-key") { label } }`);
    expect(r.errors).toBeUndefined();
    expect(r.data[`create_${A}`]).toEqual({ label: 'by-key' });
    const row = await db.selectFrom(`zvd_${A}`).select(['created_by', 'updated_by']).where('label', '=', 'by-key').executeTakeFirst();
    expect(row).toEqual({ created_by: issuer, updated_by: issuer });
  });

  it('introspection stays refused for a key, even a `*` one', async () => {
    const key = await makeKey([GQL(['*']), { collection: '*', actions: ['*'] }]);
    const r = await gql(key, '{ __schema { types { name } } }');
    expect(r.data).toBeUndefined();
    expect(messages(r)[0]).toContain('introspection');
  });

  it('the gate refuses a key without the extension scope', async () => {
    const key = await makeKey([{ collection: '*', actions: ['*'] }, GQL(['read'])]);
    expect((await post('', { query: `{ list_${A} { label } }` }, { 'X-API-Key': key })).status).toBe(403);
  });

  it('keeps the management routes session-only', async () => {
    const key = await makeKey([GQL(['*']), { collection: '*', actions: ['*'] }]);
    for (const [method, path] of [
      ['GET', '/persisted'],
      ['POST', '/persisted'],
      ['POST', '/refresh-schema'],
      ['GET', '/logs'],
      ['GET', '/field-policies'],
      ['GET', '/'],
    ]) {
      const res = await app.request(`/ext/${NAME}${path}`, { method, headers: { 'X-API-Key': key } });
      expect([method, path, res.status]).toEqual([method, path, 403]);
      expect((await res.json()).code).toBe('EXT_SESSION_REQUIRED');
    }
  });

  it('executes a public persisted query with its own scopes, and no private one', async () => {
    for (const [suffix, isPublic] of [['pub', true], ['priv', false]] as const) {
      const res = await post(
        '/persisted',
        { name: `${STAMP}_${suffix}`, query: `{ list_${A} { label } list_${B} { label } }`, is_public: isPublic, allowed_roles: ['finance'] },
        { cookie },
      );
      expect(res.status).toBe(201);
    }
    // `*` on the extension scope is what `checkPermission(id, 'admin', '*')` read as admin.
    const key = await makeKey([GQL(['*']), { collection: A, actions: ['read'] }]);
    const pub = (await post(`/persisted/${STAMP}_pub/execute`, {}, { 'X-API-Key': key })).body;
    expect(labels(pub.data[`list_${A}`])).toContain('a-row');
    expect(pub.data[`list_${B}`]).toBeNull();
    expect(messages(pub)).toEqual([`Forbidden: no read permission on "${B}"`]);
    expect((await post(`/persisted/${STAMP}_priv/execute`, {}, { 'X-API-Key': key })).status).toBe(403);
  });
});
