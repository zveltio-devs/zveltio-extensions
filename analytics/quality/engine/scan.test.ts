// The scan against a REAL engine: the engine's own `/ext/*` chain (session,
// tenant transaction, extension gate) in front of the packed bundle, and
// `ctx.internals` as the engine builds it. What only the real chain can show:
// a scan reads the rows and columns `GET /api/data` gives this caller, and its
// scan and issue rows are written as the caller, all or nothing.
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
const C = `qual_${Date.now()}`;

let db: Any;
let sql: Any;
let app: Any;
let dropCollection: (db: Any, name: string) => Promise<void>;
let member = { cookie: '', userId: '' };
let reader = { cookie: '', userId: '' };
let outsider = { cookie: '', userId: '' };

const post = (path: string, body: unknown, cookie = member.cookie) =>
  app.request(`/ext/analytics/quality${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify(body),
  });
const scans = async () => (await sql`SELECT * FROM zvd_quality_scans WHERE target_collection = ${C}`.execute(db)).rows;
const issues = async () =>
  (await sql`SELECT * FROM zvd_quality_issues WHERE target_collection = ${C} ORDER BY issue_type, field_name`.execute(db)).rows;

d('analytics/quality — a scan sees what the caller sees', () => {
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
        { name: 'label', type: 'text', required: false, unique: false, indexed: false },
        { name: 'qty', type: 'integer', required: false, unique: false, indexed: false },
        { name: 'secret', type: 'text', required: false, unique: false, indexed: false },
      ],
    });
    for (let i = 0; i < 100; i++) {
      if ((await sql`SELECT to_regclass(${`zvd_${C}`}) AS t`.execute(db)).rows[0].t) break;
      await Bun.sleep(100);
    }
    // 40 distinct labels plus one repeat; qty 10 everywhere but one 9999; secret empty on most rows.
    await sql`INSERT INTO ${sql.table(`zvd_${C}`)} (label, qty, secret)
              SELECT 'Name ' || n, CASE WHEN n = 40 THEN 9999 ELSE 10 + (n % 2) END, CASE WHEN n = 1 THEN 's' END
                FROM generate_series(1, 40) n`.execute(db);
    await sql`INSERT INTO ${sql.table(`zvd_${C}`)} (label, qty) VALUES ('  name 1 ', 10)`.execute(db);
    await sql`INSERT INTO zvd_column_permissions (collection_name, column_name, role, can_read, can_write)
              VALUES (${C}, 'secret', 'member', false, false)`.execute(db);
    const own = (actions: string[]) => [
      { collection: 'quality_scans', actions },
      { collection: 'quality_issues', actions },
      { collection: 'quality_targets', actions: ['read'] },
    ];
    member = await harness.createMemberSession(engineApp, db, {
      grants: [{ collection: C, actions: ['read'] }, ...own(['read', 'create', 'update'])],
    });
    // May read the target and scan, but not dismiss.
    reader = await harness.createMemberSession(engineApp, db, {
      grants: [{ collection: C, actions: ['read'] }, ...own(['read', 'create'])],
    });
    outsider = await harness.createMemberSession(engineApp, db, { grants: own(['read', 'create']) });
    await sql`INSERT INTO zvd_quality_targets (target_collection, max_error_issues, max_warning_issues)
              VALUES (${C}, 0, 1)`.execute(db);

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
    app.route('/ext/analytics/quality', sub);
  }, 60_000);

  afterAll(async () => {
    await seatHarnessGod();
    if (!db) return;
    await db.deleteFrom('zvd_column_permissions').where('collection_name', '=', C).execute().catch(() => undefined);
    await sql`DELETE FROM zvd_relations WHERE source_collection IN (${sql.join(manifest.collections)})`.execute(db);
    await dropCollection(db, C).catch(() => undefined);
    for (const c of [...(manifest.collections as string[])].reverse()) await dropCollection(db, c).catch(() => undefined);
  });

  it('a caller who may not read the target gets the data API refusal, and nothing is recorded', async () => {
    const res = await post('/scan', { collection: C }, outsider.cookie);
    expect(res.status).toBe(403);
    expect(await scans()).toHaveLength(0);
  });

  it('finds the duplicate and the outlier, and never the column the caller may not read', async () => {
    const res = await post('/scan', { collection: C });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.scan).toMatchObject({ target_collection: C, records_scanned: 41, truncated: false });
    const found = await issues();
    expect(found.map((i: Any) => `${i.issue_type}:${i.field_name}`)).toEqual(['duplicate:label', 'outlier:qty']);
    expect(body.issues_found).toBe(2);
    expect(found.every((i: Any) => i.created_by === member.userId)).toBe(true);
  });

  it('checks the open issues against the SLA target', async () => {
    const [scan] = await scans();
    const res = await app.request(`/ext/analytics/quality/scan/${scan.id}/sla`, { headers: { cookie: member.cookie } });
    expect(await res.json()).toMatchObject({ compliant: true, error_count: 0, warning_count: 1 });
  });

  it('dismiss-all is all or nothing for a caller who may not update issues', async () => {
    const [scan] = await scans();
    expect((await post(`/scan/${scan.id}/dismiss-all`, {}, reader.cookie)).status).toBe(403);
    expect((await issues()).some((i: Any) => i.dismissed)).toBe(false);
    const res = await post(`/scan/${scan.id}/dismiss-all`, {});
    expect(await res.json()).toEqual({ success: true, dismissed: 2 });
    expect((await issues()).every((i: Any) => i.dismissed && i.dismissed_at)).toBe(true);
  });
});
