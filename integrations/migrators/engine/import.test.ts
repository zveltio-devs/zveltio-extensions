// The import against a REAL engine: the engine's own `/ext/*` chain (session,
// tenant transaction, extension gate) in front of the packed bundle, and
// `ctx.internals` as the engine builds it. Proven here: a refused import keeps
// none of its rows, and every row is written as the caller, under their grants.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { seatHarnessGod } from '../../../testing/ext-harness';

// biome-ignore lint/suspicious/noExplicitAny: engine modules imported by path, and the packed bundle
type Any = any;

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;
const ENGINE = join(import.meta.dir, '..', '..', '..', '..', 'zveltio', 'packages', 'engine', 'src');
const EXT_DIR = join(import.meta.dir, '..');
const manifest = JSON.parse(readFileSync(join(EXT_DIR, 'manifest.json'), 'utf8'));
const C = `mig_${Date.now()}`;

let db: Any;
let sql: Any;
let app: Any;
let dropCollection: (db: Any, name: string) => Promise<void>;
let member = { cookie: '', userId: '' };
let reader = { cookie: '', userId: '' };

const post = (path: string, body: unknown, cookie = member.cookie) =>
  app.request(`/ext/integrations/migrators${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify(body),
  });
const labels = async () =>
  (await sql`SELECT label FROM ${sql.table(`zvd_${C}`)} ORDER BY label`.execute(db)).rows.map((r: Any) => r.label);
const runs = async () => (await sql`SELECT * FROM zvd_migrator_runs WHERE target_collection = ${C}`.execute(db)).rows;
let conn = '';
async function fetched(rows: Any[], status = 'ready'): Promise<string> {
  const columns = [
    { source_field: 'Name', column: 'label', type: 'text' },
    { source_field: 'Qty', column: 'qty', type: 'decimal' },
    { source_field: 'Notes', column: 'notes', type: 'text' },
  ];
  const r = await sql`INSERT INTO zvd_migrator_fetches (connection_id, source, object, row_limit, status, columns, rows, total_rows)
    VALUES (${conn}, 'notion', 'db1', 10, ${status}, ${JSON.stringify(columns)}::jsonb, ${JSON.stringify(rows)}::jsonb, ${rows.length})
    RETURNING id`.execute(db);
  return r.rows[0].id;
}

d('migrators import — all or nothing, as the caller', () => {
  beforeAll(async () => {
    const harness = (await import(join(ENGINE, 'testing', 'app-harness.js'))) as Any;
    ({ sql } = (await import(join(ENGINE, '..', 'node_modules', 'kysely', 'dist', 'index.js'))) as Any);
    const data = (await import(join(ENGINE, 'lib', 'data', 'index.js'))) as Any;
    const tenancy = (await import(join(ENGINE, 'lib', 'tenancy', 'index.js'))) as Any;
    const { buildExtensionInternals } = (await import(join(ENGINE, 'lib', 'extensions', 'internals.js'))) as Any;
    const { gateInternals } = (await import(join(ENGINE, 'lib', 'extensions', 'capabilities.js'))) as Any;
    const { createRestrictedDb } = (await import(join(ENGINE, 'lib', 'extensions', 'extension-context.js'))) as Any;
    const { applyDeclaredCollections, readDeclaredCollections } = (await import(
      join(ENGINE, 'lib', 'extensions', 'declared-collections.js')
    )) as Any;
    const { getAuth } = (await import(join(ENGINE, 'lib', 'auth.js'))) as Any;
    const { sessionPrefetch } = (await import(join(ENGINE, 'middleware', 'session-prefetch.js'))) as Any;
    const { tenantMiddleware } = (await import(join(ENGINE, 'middleware', 'tenant.js'))) as Any;
    const gate = (await import(join(ENGINE, 'middleware', 'extension-auth-gate.js'))) as Any;
    dropCollection = harness.dropTestCollection;

    let engineApp: Any;
    ({ app: engineApp, db } = await harness.getTestApp());
    const files = await readDeclaredCollections(manifest.name, EXT_DIR, manifest.collections, manifest.integrity?.schemaSha256);
    await applyDeclaredCollections(db, manifest.name, files, true);
    await data.DDLManager.createCollection(db, {
      name: C,
      fields: [
        { name: 'label', type: 'text', required: true, unique: true, indexed: false },
        { name: 'qty', type: 'integer', required: false, unique: false, indexed: false },
      ],
    });
    for (let i = 0; i < 100; i++) {
      if ((await sql`SELECT to_regclass(${`zvd_${C}`}) AS t`.execute(db)).rows[0].t) break;
      await Bun.sleep(100);
    }
    const own = [
      { collection: 'migrator_fetches', actions: ['read'] },
      { collection: 'migrator_runs', actions: ['read', 'create'] },
    ];
    member = await harness.createMemberSession(engineApp, db, {
      grants: [{ collection: C, actions: ['read', 'create'] }, ...own],
    });
    reader = await harness.createMemberSession(engineApp, db, {
      grants: [{ collection: C, actions: ['read'] }, ...own],
    });
    // A secret column holds ciphertext only (ADR 0024): the token goes in sealed.
    const { encryptField } = (await import(join(ENGINE, 'lib', 'data', 'field-crypto.js'))) as Any;
    const token = await encryptField('x');
    conn = (
      await sql`INSERT INTO zvd_migrator_connections (source, name, token) VALUES ('notion', 'n', ${token}) RETURNING id`.execute(db)
    ).rows[0].id;

    const ctx: Any = {
      db: createRestrictedDb(() => tenancy.getCurrentTenantTrx() ?? db, manifest.name),
      config: {},
      auth: getAuth(),
      internals: gateInternals(manifest.name, buildExtensionInternals(), manifest.permissions ?? []),
    };
    const { Hono } = (await import(join(import.meta.dir, '..', '..', '..', 'node_modules', 'hono', 'dist', 'index.js'))) as Any;
    const mod = await import(join(import.meta.dir, 'index.js'));
    app = new Hono();
    app.use('/ext/*', sessionPrefetch(getAuth(), db));
    app.use('/ext/*', tenantMiddleware);
    app.use('/ext/*', gate.extensionAuthGate(getAuth(), db));
    gate.registerExtensionPublicRoutes(manifest.name, []);
    const sub = new Hono();
    await mod.default.register(sub, ctx);
    app.route('/ext/integrations/migrators', sub);
  }, 60_000);

  afterAll(async () => {
    await seatHarnessGod();
    if (!db) return;
    await db.deleteFrom('zv_revisions').where('collection', '=', C).execute().catch(() => undefined);
    await dropCollection(db, C).catch(() => undefined);
    // dropTestCollection leaves relation rows; a later apply would then skip the key columns.
    await sql`DELETE FROM zvd_relations WHERE source_collection IN (${sql.join(manifest.collections)})`.execute(db);
    for (const c of [...manifest.collections].reverse()) await dropCollection(db, c).catch(() => undefined);
  });

  it('imports through the mapping as the caller, and records the run', async () => {
    const id = await fetched([{ Name: 'alpha', Qty: 1 }, { Name: 'beta', Notes: null }]);
    const res = await post(`/fetches/${id}/import`, { target_collection: C, mapping: { Name: 'label', Qty: 'qty' } });
    expect(res.status).toBe(201);
    expect((await res.json()).skipped_fields).toEqual(['Notes']);
    expect(await labels()).toEqual(['alpha', 'beta']);
    const [run] = await runs();
    expect(run).toMatchObject({ source: 'notion', source_object: 'db1', fetch_id: id, created_by: member.userId });
    expect(Number(run.imported_rows)).toBe(2);
    expect(run.record_ids).toHaveLength(2);
    // Once per fetch.
    expect((await post(`/fetches/${id}/import`, { target_collection: C, mapping: { Name: 'label' } })).status).toBe(409);
    expect(await labels()).toEqual(['alpha', 'beta']);
    await sql`DELETE FROM ${sql.table(`zvd_${C}`)}`.execute(db);
    await sql`DELETE FROM zvd_migrator_runs`.execute(db);
  });

  it('a field the target lacks refuses the import, and nothing is kept', async () => {
    const id = await fetched([{ Name: 'gamma', Notes: 'n' }]);
    const res = await post(`/fetches/${id}/import`, { target_collection: `zvd_${C}` });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(await labels()).toEqual([]);
    expect(await runs()).toEqual([]);
  });

  it('an invalid row is reported with every other one, and nothing is kept', async () => {
    const id = await fetched([{ Name: 'a' }, { Name: 'b', Qty: 'many' }, { Qty: 3 }]);
    const res = await post(`/fetches/${id}/import`, { target_collection: C, mapping: { Name: 'label', Qty: 'qty' } });
    expect(res.status).toBe(422);
    expect((await res.json()).errors.map((e: Any) => e.row)).toEqual([2, 3]);
    expect(await labels()).toEqual([]);
    expect(await runs()).toEqual([]);
  });

  it('a caller without create on the target imports nothing', async () => {
    const id = await fetched([{ Name: 'r' }]);
    const res = await post(`/fetches/${id}/import`, { target_collection: C, mapping: { Name: 'label' } }, reader.cookie);
    expect(res.status).toBe(403);
    expect(await labels()).toEqual([]);
  });

  it('refuses a fetch that is not ready, a bad target and a mapping naming a field twice', async () => {
    const pending = await fetched([{ Name: 'p' }], 'pending');
    expect((await post(`/fetches/${pending}/import`, { target_collection: C })).status).toBe(409);
    const id = await fetched([{ Name: 'q', Qty: 1 }]);
    expect((await post(`/fetches/${id}/import`, { target_collection: 'Bad Name' })).status).toBe(400);
    expect((await post(`/fetches/${id}/import`, { target_collection: C, mapping: { Name: 'label', Qty: 'label' } })).status).toBe(400);
    expect((await post(`/fetches/${id}/import`, { target_collection: C, mapping: { Nmae: 'label' } })).status).toBe(400);
    expect(await labels()).toEqual([]);
  });
});
