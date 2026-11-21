// The ANAF sign-in against a REAL engine: the packed bundle loaded the way the
// engine loads it (manifest, declared collections, the six Deno jobs over the
// verified `engine/jobs.js`), behind the engine's own `/ext/*` chain — session
// prefetch, tenant resolution, the auth gate — with the engine's action route.
// `startSignIn` stores a single-use state bound to the person who started it and
// redirects to ANAF; `finishSignIn` spends it only for that person (what the 2.x
// browser cookie guaranteed: login CSRF and a hijacked ANAF answer connect nothing).
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
const GRANTED = ['data:write', 'data:system', 'egress:logincert.anaf.ro', 'egress:api.anaf.ro', 'egress:webservicesp.anaf.ro'];

d(`${NAME}: the ANAF sign-in on a real engine`, () => {
  let db: Any;
  let sql: Any;
  let h: Any;
  let jobs: Any;
  let app: Any;
  let full: Any;
  let settingsId: string;
  // Two people of one firm, each allowed to start a sign-in.
  let alice: { cookie: string; userId: string };
  let mallory: { cookie: string; userId: string };

  const act = async (who: { cookie: string }, action: string, input: unknown) => {
    const res = await app.request(`/ext/${NAME}/actions/${action}`, {
      method: 'POST',
      headers: { cookie: who.cookie, 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
    return { status: res.status, body: (await res.json()) as Any };
  };
  const start = async (who: { cookie: string }) => {
    const r = await act(who, 'startSignIn', { id: settingsId });
    expect(r.status).toBe(200);
    return new URL(r.body.result.redirect).searchParams.get('state') as string;
  };
  const queued = async () =>
    (
      await sql`SELECT data->'input' AS input FROM pgboss.job
                WHERE name = ${jobs.jobQueueName(NAME, 'connect')} ORDER BY created_on`.execute(db)
    ).rows.map((r: Any) => r.input);
  const settings = () =>
    h.asDefaultTenant(db, async (trx: Any) =>
      (await sql`SELECT * FROM zvd_efactura_settings WHERE id = ${settingsId}::uuid`.execute(trx)).rows[0],
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

    ({ app: full, db } = await h.getTestApp());
    const files = await readDeclaredCollections(NAME, EXT_DIR, COLLECTIONS, manifest.integrity?.schemaSha256);
    await applyDeclaredCollections(db, NAME, files, true);
    settingsId = (
      await h.asDefaultTenant(db, (trx: Any) =>
        sql`INSERT INTO zvd_efactura_settings (scope, environment, client_id, callback_url)
            VALUES ('tenant', 'test', 'cid', 'https://x.test/cb') RETURNING id`.execute(trx),
      )
    ).rows[0].id;

    const grants = [{ collection: 'efactura_settings', actions: ['read', 'update', 'execute'] }];
    alice = await h.createMemberSession(full, db, { grants });
    mallory = await h.createMemberSession(full, db, { grants });

    app = new Hono();
    app.use('/ext/*', sessionPrefetch(getAuth(), db));
    app.use('/ext/*', tenantMiddleware);
    app.use('/ext/*', extensionAuthGate(getAuth(), db));

    const parsed = ManifestSchema.parse(manifest);
    await sql`DELETE FROM zv_extension_registry WHERE name = ${NAME}`.execute(db);
    await sql`INSERT INTO zv_extension_registry (name, display_name, tenant_id, is_installed, is_enabled, manifest, granted_capabilities)
              VALUES (${NAME}, ${NAME}, NULL, true, true, ${toJsonb(parsed)}, ${toJsonb(GRANTED)})`.execute(db);
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
    await sql`DELETE FROM zvd_relations WHERE source_collection IN (${sql.join(COLLECTIONS)})`.execute(db);
    await sql`DELETE FROM zv_validation_rules WHERE collection IN (${sql.join(COLLECTIONS)})`.execute(db);
    for (const c of [...COLLECTIONS].reverse()) await h.dropTestCollection(db, c);
  });

  it('startSignIn redirects to ANAF with a state bound to whoever started', async () => {
    const r = await act(alice, 'startSignIn', { id: settingsId });
    expect(r.status).toBe(200);
    const url = new URL(r.body.result.redirect);
    expect(`${url.origin}${url.pathname}`).toBe('https://logincert.anaf.ro/anaf-oauth2/v1/authorize');
    expect(url.searchParams.get('redirect_uri')).toBe('https://x.test/cb');
    expect(url.searchParams.get('state')).toMatch(/^[0-9a-f]{48}$/);
    const s = await settings();
    expect(s.oauth_state).toMatch(/^enc:v[12]:/);
    expect(s.oauth_started_by).toBe(alice.userId);
  });

  it("nobody plants a state, or a starter, through the data API", async () => {
    for (const body of [{ oauth_started_by: mallory.userId }, { oauth_state: 'f'.repeat(48) }]) {
      const res = await full.request(`/api/data/efactura_settings/${settingsId}`, {
        method: 'PATCH',
        headers: { cookie: mallory.cookie, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      expect(res.status).toBe(409);
      expect(((await res.json()) as Any).code).toBe('written_by_actions');
    }
    expect((await settings()).oauth_started_by).toBe(alice.userId);
  });

  it("login CSRF: a sign-in someone else started finishes for nobody else, and queues nothing", async () => {
    const state = await start(alice);
    // Alice's ANAF answer (or Alice's callback link) opened in Mallory's session — and the reverse case,
    // Mallory's browser carrying someone else's ANAF code for Alice's sign-in, is the same request.
    const r = await act(mallory, 'finishSignIn', { id: settingsId, code: 'the-code', state });
    expect(r.status).toBe(409);
    expect(r.body.code ?? r.body.error).toContain('sign_in_not_yours');
    expect(await queued()).toEqual([]);
    // Refused, the request rolled back: Alice's sign-in is still hers to finish.
    const s = await settings();
    expect(s.oauth_started_by).toBe(alice.userId);
    expect(s.oauth_state).toMatch(/^enc:v[12]:/);
  });

  it('a forged or stale state is refused', async () => {
    await start(alice);
    const forged = await act(alice, 'finishSignIn', { id: settingsId, code: 'x', state: 'c'.repeat(48) });
    expect(forged.status).toBe(409);
    expect(await queued()).toEqual([]);
  });

  it('the starter finishes once: the state is spent and connect gets the code', async () => {
    const state = await start(alice);
    const r = await act(alice, 'finishSignIn', { id: settingsId, code: 'the-code', state });
    expect(r.status).toBe(200);
    expect(await queued()).toEqual([{ settings_id: settingsId, code: 'the-code' }]);
    const s = await settings();
    expect([s.oauth_state, s.oauth_state_expires_at, s.oauth_started_by]).toEqual([null, null, null]);
    expect((await act(alice, 'finishSignIn', { id: settingsId, code: 'again', state })).status).toBe(409);
    expect(await queued()).toHaveLength(1);
  });

  it('the public callback only forwards code and state to the finish page', async () => {
    const state = await start(alice);
    const res = await app.request(`/ext/${NAME}/oauth/callback?code=c1&state=${state}`);
    expect(res.status).toBe(302);
    const to = new URL(res.headers.get('location'));
    expect(to.pathname).toBe('/admin/compliance/ro/efactura/connection');
    expect([to.searchParams.get('code'), to.searchParams.get('state')]).toEqual(['c1', state]);
    expect(await queued()).toHaveLength(1);
    expect((await settings()).oauth_started_by).toBe(alice.userId);
  });
});
