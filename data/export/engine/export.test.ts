// The export against a REAL engine: the engine's own `/ext/*` chain (session,
// tenant transaction, extension gate) in front of the packed bundle, and
// `ctx.internals` as the engine builds it. What only the real chain can show:
// rows and columns are the ones `GET /api/data` gives this caller, the export
// pages past the data API's 500-row ceiling, and each export is audited.
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
const C = `exp_${Date.now()}`;
const ROWS = 620;

let db: Any;
let sql: Any;
let app: Any;
let dropCollection: (db: Any, name: string) => Promise<void>;
let member = { cookie: '', userId: '' };
let outsider = { cookie: '', userId: '' };

const get = (query: string, cookie = member.cookie) =>
  app.request(`/ext/data/export/${C}?${query}`, { headers: { cookie } });

d('data/export — what the data API gives the caller, and no more', () => {
  beforeAll(async () => {
    const harness = (await import(join(ENGINE, 'testing', 'app-harness.js'))) as Any;
    ({ sql } = (await import(join(ENGINE, '..', 'node_modules', 'kysely', 'dist', 'index.js'))) as Any);
    const data = (await import(join(ENGINE, 'lib', 'data', 'index.js'))) as Any;
    const tenancy = (await import(join(ENGINE, 'lib', 'tenancy', 'index.js'))) as Any;
    const { buildExtensionInternals } = (await import(join(ENGINE, 'lib', 'extensions', 'internals.js'))) as Any;
    const { gateInternals } = (await import(join(ENGINE, 'lib', 'extensions', 'capabilities.js'))) as Any;
    const { createRestrictedDb } = (await import(join(ENGINE, 'lib', 'extensions', 'extension-context.js'))) as Any;
    const { getAuth } = (await import(join(ENGINE, 'lib', 'auth.js'))) as Any;
    const { sessionPrefetch } = (await import(join(ENGINE, 'middleware', 'session-prefetch.js'))) as Any;
    const { tenantMiddleware } = (await import(join(ENGINE, 'middleware', 'tenant.js'))) as Any;
    const gate = (await import(join(ENGINE, 'middleware', 'extension-auth-gate.js'))) as Any;
    dropCollection = harness.dropTestCollection;

    let engineApp: Any;
    ({ app: engineApp, db } = await harness.getTestApp());
    const text = (name: string) => ({ name, type: 'text', required: false, unique: false, indexed: false });
    await data.DDLManager.createCollection(db, { name: C, fields: [text('label'), text('secret')] });
    for (let i = 0; i < 100; i++) {
      if ((await sql`SELECT to_regclass(${`zvd_${C}`}) AS t`.execute(db)).rows[0].t) break;
      await Bun.sleep(100);
    }
    await sql`INSERT INTO ${sql.table(`zvd_${C}`)} (label, secret)
              SELECT 'row-' || lpad(n::text, 4, '0'), 's' FROM generate_series(1, ${ROWS}) n`.execute(db);
    member = await harness.createMemberSession(engineApp, db, { grants: [{ collection: C, actions: ['read'] }] });
    outsider = await harness.createMemberSession(engineApp, db, { grants: [] });
    await sql`INSERT INTO zvd_column_permissions (collection_name, column_name, role, can_read, can_write)
              VALUES (${C}, 'secret', 'member', false, false)`.execute(db);

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
    app.route('/ext/data/export', sub);
  }, 60_000);

  afterAll(async () => {
    await seatHarnessGod();
    if (!db) return;
    await db.deleteFrom('zvd_column_permissions').where('collection_name', '=', C).execute().catch(() => undefined);
    await db.deleteFrom('zv_audit_log').where('resource_type', '=', C).execute().catch(() => undefined);
    await dropCollection(db, C).catch(() => undefined);
  });

  it('pages past the data API ceiling, without the column the caller may not read', async () => {
    const res = await get('format=json&limit=600&sort=label&order=asc');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(600);
    expect(new Set(body.records.map((r: Any) => r.label)).size).toBe(600);
    expect(body.records[599].label).toBe('row-0600');
    expect(body.records.some((r: Any) => r.secret !== undefined && r.secret !== null)).toBe(false);
  });

  it('says when the export stops at its limit, and a full export repeats and drops nothing', async () => {
    const cut = await get('format=json&limit=600');
    expect(cut.headers.get('x-export-truncated')).toBe('true');
    expect((await cut.json()).truncated).toBe(true);
    // Sorted on a column that is null on some rows: a keyset cursor skipped them.
    await sql`UPDATE ${sql.table(`zvd_${C}`)} SET label = NULL WHERE label < 'row-0300'`.execute(db);
    const all = await (await get(`format=json&limit=${ROWS}&sort=label&order=desc`)).json();
    expect(all.truncated).toBe(false);
    expect(new Set(all.records.map((r: Any) => r.id)).size).toBe(ROWS);
  });

  it('CSV keeps the named fields, filtered by the data API', async () => {
    const res = await get(`format=csv&fields=label&filter=${encodeURIComponent(JSON.stringify({ label: { eq: 'row-0307' } }))}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
    expect((await res.text()).trim().split(/\r?\n/)).toEqual(['"label"', '"row-0307"']);
  });

  it('a caller without read gets the data API refusal, and nothing is audited for them', async () => {
    const res = await get('format=json', outsider.cookie);
    expect(res.status).toBe(403);
    const audited = await sql`SELECT user_id, metadata FROM zv_audit_log
                               WHERE event_type = 'data.export' AND resource_type = ${C}`.execute(db);
    expect(audited.rows.map((r: Any) => r.user_id)).not.toContain(outsider.userId);
    expect(audited.rows.filter((r: Any) => r.user_id === member.userId)).toHaveLength(4);
  });
});
