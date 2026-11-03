// Publishing against a REAL engine: the engine's own `/ext/*` chain (session,
// tenant transaction, extension gate) in front of the packed bundle, and
// `ctx.internals` as the engine builds it. What only the real chain can show:
// the target record is written as the caller, under the caller's grants, and a
// refused batch keeps none of its writes.
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
const C = `pub_${Date.now()}`;

let db: Any;
let sql: Any;
let app: Any;
let dropCollection: (db: Any, name: string) => Promise<void>;
let member = { cookie: '', userId: '' };
let reader = { cookie: '', userId: '' };
const ids: Record<string, string> = {};

const post = (path: string, body: unknown, cookie = member.cookie) =>
  app.request(`/ext/content/drafts${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify(body),
  });
const labels = async () =>
  (await sql`SELECT label FROM ${sql.table(`zvd_${C}`)} ORDER BY label`.execute(db)).rows.map((r: Any) => r.label);
const draftRow = async (id: string) => (await sql`SELECT * FROM zvd_content_drafts WHERE id = ${id}`.execute(db)).rows[0];
async function seedDraft(label: string, data: Record<string, unknown>, extra: Record<string, unknown> = {}): Promise<string> {
  const rec = (await sql`INSERT INTO ${sql.table(`zvd_${C}`)} (label) VALUES (${label}) RETURNING id`.execute(db)).rows[0].id;
  const row = { target_collection: C, record_id: rec, draft_data: JSON.stringify(data), created_by: member.userId, ...extra };
  return (await db.insertInto('zvd_content_drafts').values(row).returning('id').executeTakeFirstOrThrow()).id;
}

d('content/drafts — publishing as the caller', () => {
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
    const draftGrant = { collection: 'content_drafts', actions: ['read', 'update'] };
    member = await harness.createMemberSession(engineApp, db, {
      grants: [{ collection: C, actions: ['read', 'update'] }, draftGrant],
    });
    reader = await harness.createMemberSession(engineApp, db, {
      grants: [{ collection: C, actions: ['read'] }, draftGrant],
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
    app.route('/ext/content/drafts', sub);
  }, 60_000);


  afterAll(async () => {
    await seatHarnessGod();
    if (!db) return;
    await db.deleteFrom('zv_revisions').where('collection', '=', C).execute().catch(() => undefined);
    await dropCollection(db, C).catch(() => undefined);
    const own = manifest.collections as string[];
    // As collections.test.ts: the relation rows outlive the tables, and a later
    // apply would recreate a foreign key before its column.
    await sql`DELETE FROM zvd_relations WHERE source_collection IN (${sql.join(own)})`.execute(db);
    for (const c of [...own].reverse()) await dropCollection(db, c).catch(() => undefined);
  });

  it('publishes the draft into its record as the caller, and marks it', async () => {
    const id = await seedDraft('one', { label: 'one-v2', qty: 5, tenant_id: '00000000-0000-0000-0000-00000000dead' });
    const res = await post(`/${id}/publish`, {});
    expect(res.status).toBe(200);
    expect(await labels()).toEqual(['one-v2']);
    expect((await draftRow(id)).published_at).not.toBeNull();
    expect((await post(`/${id}/publish`, {})).status).toBe(409);
  });

  it('a caller without update on the target publishes nothing', async () => {
    const id = await seedDraft('two', { label: 'two-v2' });
    expect((await post(`/${id}/publish`, {}, reader.cookie)).status).toBe(403);
    expect(await labels()).toContain('two');
    expect((await draftRow(id)).published_at).toBeNull();
  });

  it('a batch publishes every draft or none', async () => {
    const good = await seedDraft('three', { label: 'three-v2' });
    const bad = await seedDraft('four', { qty: 'many' });
    const res = await post('/bulk-publish', { draft_ids: [good, bad] });
    expect(res.status).toBe(422);
    expect((await res.json()).draft_id).toBe(bad);
    expect(await labels()).toContain('three');
    expect((await draftRow(good)).published_at).toBeNull();
  });

  it('the schedule publishes only approved drafts, and only what was approved', async () => {
    const past = new Date(Date.now() - 60_000);
    const approvedFor = await seedDraft('five', {});
    const target = (await draftRow(approvedFor)).record_id;
    // Approved for record `five`, then pointed at record `eight` and edited.
    const eight = await seedDraft('eight', {});
    const due = await seedDraft('decoy', { label: 'five-edited-after' }, {
      record_id: (await draftRow(eight)).record_id,
      scheduled_at: past,
      review_status: 'approved',
      approved_data: JSON.stringify({ target_collection: C, record_id: target, data: { label: 'five-approved' } }),
    });
    const unreviewed = await seedDraft('six', { label: 'six-v2' }, { scheduled_at: past });
    const later = await seedDraft('seven', { label: 'seven-v2' }, {
      scheduled_at: new Date(Date.now() + 3_600_000),
      review_status: 'approved',
      approved_data: JSON.stringify({ data: { label: 'seven-v2' } }),
    });
    // Due first, approved for a record deleted since: skipped, not a stall.
    const gone = await seedDraft('gone', {}, {
      scheduled_at: new Date(Date.now() - 120_000),
      review_status: 'approved',
      approved_data: JSON.stringify({ target_collection: C, record_id: crypto.randomUUID(), data: { label: 'x' } }),
    });
    const res = await post('/schedule/process', {});
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.published.map((p: Any) => p.draft_id)).toEqual([due]);
    expect(body.skipped).toMatchObject([{ draft_id: gone, status: 404 }]);
    expect((await draftRow(gone)).published_at).toBeNull();
    expect(await labels()).toEqual(expect.arrayContaining(['five-approved', 'six', 'seven', 'eight', 'decoy', 'gone']));
    expect((await draftRow(unreviewed)).published_at).toBeNull();
    expect((await draftRow(later)).published_at).toBeNull();
  });
});
