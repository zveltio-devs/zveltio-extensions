// The ANAF callback against a REAL engine: the packed bundle loaded the way the
// engine loads it (manifest, declared collections, the six Deno jobs over the
// verified `engine/jobs.js`), behind the engine's own `/ext/*` chain — session
// prefetch, tenant resolution from the request's subdomain, the auth gate that
// admits only the manifest's `publicRoutes`. A state stored for one tenant is
// spent once, in that tenant, and queues `connect`; nothing else gets in.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// biome-ignore lint/suspicious/noExplicitAny: engine modules imported by path, and the packed bundle
type Any = any;

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;
const ENGINE = join(import.meta.dir, '../../../../../zveltio/packages/engine/src');
const EXT_DIR = join(import.meta.dir, '..');
const manifest = JSON.parse(readFileSync(join(EXT_DIR, 'manifest.json'), 'utf8'));
const NAME: string = manifest.name;
const COLLECTIONS: string[] = manifest.collections;

const STAMP = Date.now().toString(36);
const A = { id: crypto.randomUUID(), slug: `efac-a-${STAMP}`, state: 'a'.repeat(48) };
const B = { id: crypto.randomUUID(), slug: `efac-b-${STAMP}`, state: 'b'.repeat(48) };

d(`${NAME}: the ANAF callback on a real engine`, () => {
  let db: Any;
  let sql: Any;
  let h: Any;
  let jobs: Any;
  let app: Any;

  const callback = (tenant: { slug: string }, query: string) =>
    app.request(`/ext/${NAME}/oauth/callback?${query}`, {
      headers: {
        host: `${tenant.slug}.efactura.test`,
        cookie: `zv_efactura_oauth=${new URLSearchParams(query).get('state')}`,
      },
    });
  const queued = async () =>
    (
      await sql`SELECT data->'input' AS input FROM pgboss.job
                WHERE name = ${jobs.jobQueueName(NAME, 'connect')} ORDER BY created_on`.execute(db)
    ).rows.map((r: Any) => r.input);
  const settings = (t: { id: string }) =>
    h.asTenant(db, t.id, async (trx: Any) =>
      (await sql`SELECT * FROM zvd_efactura_settings WHERE tenant_id = ${t.id}::uuid`.execute(trx)).rows[0],
    );

  beforeAll(async () => {
    const mod = (p: string) => import(join(ENGINE, p));
    ({ sql } = await import(join(ENGINE, '../node_modules/kysely/dist/index.js')));
    const { Hono } = await import(join(ENGINE, '../node_modules/hono/dist/index.js'));
    h = await mod('testing/app-harness.js');
    jobs = await mod('lib/extensions/jobs.js');
    const { finalizeExtensionLoad } = await mod('lib/extensions/register.js');
    const { buildExtensionInternals } = await mod('lib/extensions/internals.js');
    const { ManifestSchema } = await mod('lib/extensions/manifest-schema.js');
    const { invalidateActivationCache } = await mod('lib/extensions/activation.js');
    const { applyDeclaredCollections, readDeclaredCollections } = await mod('lib/extensions/declared-collections.js');
    const { getAuth } = await mod('lib/auth.js');
    const { sessionPrefetch } = await mod('middleware/session-prefetch.js');
    const { tenantMiddleware } = await mod('middleware/tenant.js');
    const { extensionAuthGate } = await mod('middleware/extension-auth-gate.js');
    const { toJsonb } = await mod('lib/jsonb.js');
    const { maybeEncrypt } = await mod('lib/data/field-crypto.js');

    ({ db } = await h.getTestApp());
    const files = await readDeclaredCollections(NAME, EXT_DIR, COLLECTIONS, manifest.integrity?.schemaSha256);
    await applyDeclaredCollections(db, NAME, files, true);

    for (const t of [A, B]) {
      await sql`INSERT INTO zv_tenants (id, slug, name, status) VALUES (${t.id}::uuid, ${t.slug}, ${t.slug}, 'active')`.execute(db);
      const state = await maybeEncrypt(t.state, true);
      const until = new Date(Date.now() + 600_000).toISOString();
      await h.asTenant(db, t.id, (trx: Any) =>
        sql`INSERT INTO zvd_efactura_settings (tenant_id, scope, environment, client_id, callback_url, oauth_state, oauth_state_expires_at)
            VALUES (${t.id}::uuid, 'tenant', 'test', 'cid', 'https://x.test/cb', ${state}, ${until}::timestamptz)`.execute(trx),
      );
    }

    app = new Hono();
    app.use('/ext/*', sessionPrefetch(getAuth(), db));
    app.use('/ext/*', tenantMiddleware);
    app.use('/ext/*', extensionAuthGate(getAuth(), db));

    const parsed = ManifestSchema.parse(manifest);
    await sql`DELETE FROM zv_extension_registry WHERE name = ${NAME}`.execute(db);
    await sql`INSERT INTO zv_extension_registry (name, display_name, tenant_id, is_installed, is_enabled, manifest)
              VALUES (${NAME}, ${NAME}, NULL, true, true, ${toJsonb(parsed)})`.execute(db);
    const ctx = { db, internals: buildExtensionInternals() };
    const loader = {
      loaded: new Map(),
      modules: new Map(),
      lastLoadError: new Map(),
      extDirs: new Map(),
      forgetExtensionMessages: () => {},
      ctx,
    };
    const ext = (await import(join(import.meta.dir, 'index.js'))).default;
    await finalizeExtensionLoad(loader, ext, NAME, EXT_DIR, app, ctx, parsed, new Set());
    invalidateActivationCache();
  }, 120_000);

  afterAll(async () => {
    if (!db) return;
    await jobs.unregisterJobs(NAME);
    await sql`DELETE FROM zv_extension_registry WHERE name = ${NAME}`.execute(db);
    for (const j of manifest.jobs) {
      await sql`DELETE FROM pgboss.job WHERE name = ${jobs.jobQueueName(NAME, j.name)}`.execute(db).catch(() => {});
    }
    await h.asEveryTenant(db, (trx: Any) =>
      sql`DELETE FROM zv_audit_log WHERE tenant_id IN (${A.id}::uuid, ${B.id}::uuid)`.execute(trx),
    );
    await sql`DELETE FROM zvd_relations WHERE source_collection IN (${sql.join(COLLECTIONS)})`.execute(db);
    await sql`DELETE FROM zv_validation_rules WHERE collection IN (${sql.join(COLLECTIONS)})`.execute(db);
    for (const c of [...COLLECTIONS].reverse()) await h.dropTestCollection(db, c);
    await sql`DELETE FROM zv_tenants WHERE id IN (${A.id}::uuid, ${B.id}::uuid)`.execute(db);
  });

  it("refuses another tenant's state, and a forged one; queues nothing", async () => {
    expect((await callback(A, `code=x&state=${B.state}`)).status).toBe(400);
    expect((await callback(A, `code=x&state=${'c'.repeat(48)}`)).status).toBe(400);
    expect(await queued()).toEqual([]);
    expect((await settings(A)).oauth_state).toStartWith('enc:v1:');
  });

  it("spends the tenant's own state once and queues connect with the code", async () => {
    const res = await callback(A, `code=the-code&state=${A.state}`);
    expect(res.status).toBe(200);
    const s = await settings(A);
    expect(s.oauth_state).toBeNull();
    expect(await queued()).toEqual([{ settings_id: s.id, code: 'the-code' }]);
    expect((await callback(A, `code=again&state=${A.state}`)).status).toBe(400);
    expect(await queued()).toHaveLength(1);
    // B's state is untouched.
    expect((await settings(B)).oauth_state).toStartWith('enc:v1:');
  });

  it('every other route wants a session', async () => {
    const res = await app.request(`/ext/${NAME}/oauth/start`, { headers: { host: `${A.slug}.efactura.test` } });
    expect(res.status).toBe(401);
  });
});
