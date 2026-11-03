// The import against a REAL engine: the engine's own `/ext/*` chain (session,
// tenant transaction, extension gate) in front of the packed bundle, and
// `ctx.internals` as the engine builds it. What is proven is what only the real
// chain decides: that a refused import keeps none of its rows (the tenant
// middleware rolls back on the handler's throw and still sends its answer),
// and that every row is written as the caller, under the caller's grants.
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
const C = `imp_${Date.now()}`;

let db: Any;
let sql: Any;
let app: Any;
let dropCollection: (db: Any, name: string) => Promise<void>;
let member = { cookie: '', userId: '' };
let reader = { cookie: '', userId: '' };

const post = (path: string, body: unknown, cookie = member.cookie) =>
  app.request(`/ext/data/import${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify(body),
  });
const labels = async () =>
  (await sql`SELECT label FROM ${sql.table(`zvd_${C}`)} ORDER BY label`.execute(db)).rows.map((r: Any) => r.label);
const jobs = async () => (await sql`SELECT * FROM zvd_data_import_jobs WHERE target_collection = ${C}`.execute(db)).rows;

d('data/import — all or nothing, as the caller', () => {
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
    const jobGrant = { collection: 'data_import_jobs', actions: ['read', 'create', 'update'] };
    member = await harness.createMemberSession(engineApp, db, {
      grants: [
        { collection: C, actions: ['read', 'create', 'delete'] },
        jobGrant,
        { collection: 'data_import_profiles', actions: ['read'] },
      ],
    });
    reader = await harness.createMemberSession(engineApp, db, {
      grants: [{ collection: C, actions: ['read'] }, jobGrant],
    });

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
    app.route('/ext/data/import', sub);
  }, 60_000);

  afterAll(async () => {
    await seatHarnessGod();
    if (!db) return;
    await db.deleteFrom('zv_revisions').where('collection', '=', C).execute().catch(() => undefined);
    await dropCollection(db, C).catch(() => undefined);
    for (const c of manifest.collections as string[]) await dropCollection(db, c).catch(() => undefined);
  });

  it('a dry run checks every row and keeps none', async () => {
    const res = await post(`/${C}?dry_run=true`, { rows: [{ label: 'a' }, { label: 'b' }] });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ dry_run: true, valid_rows: 2 });
    expect(await labels()).toEqual([]);
    expect(await jobs()).toEqual([]);
  });

  it('an invalid row is reported with every other one, and nothing is kept', async () => {
    const res = await post(`/${C}`, { rows: [{ label: 'a' }, { label: 'b', qty: 'many' }, { qty: 3 }] });
    expect(res.status).toBe(422);
    expect((await res.json()).errors.map((e: Any) => e.row)).toEqual([2, 3]);
    expect(await labels()).toEqual([]);
    expect(await jobs()).toEqual([]);
  });

  it('a row the database refuses rolls back the rows before it', async () => {
    const res = await post(`/${C}`, { rows: [{ label: 'x' }, { label: 'x' }] });
    expect(res.status).toBe(409);
    expect(await labels()).toEqual([]);
  });

  it('a caller without create on the target imports nothing', async () => {
    const res = await post(`/${C}`, { rows: [{ label: 'r' }] }, reader.cookie);
    expect(res.status).toBe(403);
    expect(await labels()).toEqual([]);
  });

  it('refuses rows that are not objects, a malformed mapping and a foreign profile before writing', async () => {
    expect((await post(`/${C}`, { rows: [{ label: 'n1' }, null, 3] })).status).toBe(400);
    expect((await post(`/${C}`, { rows: [{ L: 'n2' }], mapping: { L: 'label', M: 'label' } })).status).toBe(400);
    const [{ id }] = (
      await sql`INSERT INTO zvd_data_import_profiles (name, target_collection, mappings)
                VALUES ('other', 'not_this_one', '{}'::jsonb) RETURNING id`.execute(db)
    ).rows;
    expect((await post(`/${C}`, { rows: [{ label: 'n3' }], profile_id: id })).status).toBe(400);
    expect(await labels()).toEqual([]);
  });

  it('a raw NDJSON body is parsed as NDJSON', async () => {
    const res = await app.request(`/ext/data/import/${C}?dry_run=true`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-ndjson', cookie: member.cookie },
      body: '{"label":"j1"}\n{"label":"j2","qty":2}\n',
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ dry_run: true, valid_rows: 2 });
  });

  it('imports a CSV through the mapping, records the job, and rolls it back once', async () => {
    const form = new FormData();
    form.set('file', new File(['Name;Qty\nalpha;1\nbeta;\n'], 'items.csv', { type: 'text/csv' }));
    form.set('delimiter', ';');
    form.set('mapping', JSON.stringify({ Name: 'label', Qty: 'qty' }));
    const res = await app.request(`/ext/data/import/${C}`, { method: 'POST', headers: { cookie: member.cookie }, body: form });
    expect(res.status).toBe(201);
    expect(await labels()).toEqual(['alpha', 'beta']);
    const [job] = await jobs();
    expect(job).toMatchObject({ format: 'csv', filename: 'items.csv', created_by: member.userId });
    expect(Number(job.imported_rows)).toBe(2);
    expect((await sql`SELECT qty FROM ${sql.table(`zvd_${C}`)} ORDER BY label`.execute(db)).rows.map((r: Any) => r.qty && Number(r.qty))).toEqual([1, null]);
    expect(job.record_ids).toHaveLength(2);

    const undo = await post(`/jobs/${job.id}/rollback`, {});
    expect(undo.status).toBe(200);
    expect(await undo.json()).toEqual({ success: true, deleted_records: 2 });
    expect(await labels()).toEqual([]);
    expect((await jobs())[0].rolled_back_at).not.toBeNull();
    expect((await post(`/jobs/${job.id}/rollback`, {})).status).toBe(409);
  });
});
