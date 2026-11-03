// The Stripe webhook against a REAL engine: the packed bundle loaded the way the
// engine loads it (manifest, declared collections, jobs), behind the engine's own
// `/ext/*` chain — session prefetch, tenant resolution from the request's
// subdomain, the auth gate that admits a public route. A signed event is claimed
// once and queued; the `applyEvent` job writes `billing_subscriptions`, which only
// this extension's actions and jobs may write (ADR 0013, ADR 0018). Each tenant
// verifies with its own secret.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// biome-ignore lint/suspicious/noExplicitAny: engine modules imported by path, and the packed bundle
type Any = any;

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;
const ENGINE = join(import.meta.dir, '../../../zveltio/packages/engine/src');
const EXT_DIR = join(import.meta.dir, '..');
const manifest = JSON.parse(readFileSync(join(EXT_DIR, 'manifest.json'), 'utf8'));
const NAME: string = manifest.name;
const COLLECTIONS: string[] = manifest.collections;

const STAMP = Date.now().toString(36);
const A = { id: crypto.randomUUID(), slug: `bill-a-${STAMP}`, secret: 'whsec_tenant_a' };
const B = { id: crypto.randomUUID(), slug: `bill-b-${STAMP}`, secret: 'whsec_tenant_b' };
/** No settings row: on a multi-tenant instance the environment's secret does not stand in. */
const C = { id: crypto.randomUUID(), slug: `bill-c-${STAMP}`, secret: '' };
/** A stored secret the instance's key cannot decrypt. */
const D = { id: crypto.randomUUID(), slug: `bill-d-${STAMP}`, secret: 'enc:v1:not-a-ciphertext' };
const GLOBAL = 'whsec_global_env';

async function sign(body: string, secret: string): Promise<string> {
  const t = Math.floor(Date.now() / 1000);
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${body}`));
  return `t=${t},v1=${Buffer.from(mac).toString('hex')}`;
}

d(`${NAME}: Stripe webhook -> applyEvent job`, () => {
  let db: Any;
  let sql: Any;
  let app: Any;
  let h: Any;
  let jobs: Any;

  /** POST a Stripe event to `tenant`'s endpoint (`<slug>.billing.test`), signed with `secret`. */
  async function deliver(tenant: { slug: string }, event: object, secret: string) {
    const body = JSON.stringify(event);
    return app.request('/ext/billing/webhook/stripe', {
      method: 'POST',
      headers: {
        host: `${tenant.slug}.billing.test`,
        'content-type': 'application/json',
        'stripe-signature': await sign(body, secret),
      },
      body,
    });
  }
  const queued = async (eventId: string) =>
    Number(
      (
        await sql`SELECT count(*) AS n FROM pgboss.job
                  WHERE name = ${jobs.jobQueueName(NAME, 'applyEvent')} AND data->'input'->>'id' = ${eventId}`.execute(db)
      ).rows[0].n,
    );
  const rows = (table: string, where: Any) =>
    h.asEveryTenant(db, async (trx: Any) => (await sql`SELECT * FROM ${sql.table(table)} WHERE ${where}`.execute(trx)).rows);
  async function until<T>(probe: () => Promise<T>, done: (v: T) => boolean): Promise<T> {
    for (let i = 0; i < 150; i++) {
      const v = await probe();
      if (done(v)) return v;
      await Bun.sleep(100);
    }
    return probe();
  }

  beforeAll(async () => {
    process.env.ZVELTIO_EXT_BILLING_STRIPE_WEBHOOK_SECRET = GLOBAL;
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

    for (const t of [A, B, C, D]) {
      await sql`INSERT INTO zv_tenants (id, slug, name, status) VALUES (${t.id}::uuid, ${t.slug}, ${t.slug}, 'active')`.execute(db);
      if (!t.secret) continue;
      const stored = t === D ? t.secret : await maybeEncrypt(t.secret, true);
      await h.asTenant(db, t.id, (trx: Any) =>
        sql`INSERT INTO zvd_billing_settings (tenant_id, scope, stripe_webhook_secret) VALUES (${t.id}::uuid, 'tenant', ${stored})`.execute(trx),
      );
    }
    await h.asTenant(db, A.id, (trx: Any) =>
      sql`INSERT INTO zvd_billing_plans (tenant_id, name, stripe_price_id, price_cents) VALUES (${A.id}::uuid, 'Pro', 'price_pro', 4900)`.execute(trx),
    );

    app = new Hono();
    app.use('/ext/*', sessionPrefetch(getAuth(), db));
    app.use('/ext/*', tenantMiddleware);
    app.use('/ext/*', extensionAuthGate(getAuth(), db));

    const parsed = ManifestSchema.parse(manifest);
    await sql`DELETE FROM zv_extension_registry WHERE name = ${NAME}`.execute(db);
    await sql`INSERT INTO zv_extension_registry (name, display_name, tenant_id, is_installed, is_enabled, manifest)
              VALUES (${NAME}, ${NAME}, NULL, true, true, ${toJsonb(parsed)})`.execute(db);
    const ctx = { db, internals: buildExtensionInternals() };
    const loader = { loaded: new Map(), modules: new Map(), lastLoadError: new Map(), extDirs: new Map(), forgetExtensionMessages: () => {}, ctx };
    const ext = (await import(join(import.meta.dir, 'index.js'))).default;
    await finalizeExtensionLoad(loader, ext, NAME, EXT_DIR, app, ctx, parsed, new Set());
    invalidateActivationCache();
  }, 120_000);

  afterAll(async () => {
    delete process.env.ZVELTIO_EXT_BILLING_STRIPE_WEBHOOK_SECRET;
    if (!db) return;
    await jobs.unregisterJobs(NAME);
    await sql`DELETE FROM zv_extension_registry WHERE name = ${NAME}`.execute(db);
    await sql`DELETE FROM pgboss.job WHERE name = ${jobs.jobQueueName(NAME, 'applyEvent')}`.execute(db).catch(() => {});
    await h.asEveryTenant(db, (trx: Any) =>
      sql`DELETE FROM zv_audit_log WHERE tenant_id IN (${A.id}::uuid, ${B.id}::uuid, ${C.id}::uuid, ${D.id}::uuid)`.execute(trx),
    );
    await sql`DELETE FROM zvd_relations WHERE source_collection IN (${sql.join(COLLECTIONS)})`.execute(db);
    for (const c of [...COLLECTIONS].reverse()) await h.dropTestCollection(db, c);
    await sql`DELETE FROM zv_tenants WHERE id IN (${A.id}::uuid, ${B.id}::uuid, ${C.id}::uuid, ${D.id}::uuid)`.execute(db);
  });

  const created = (id: string) => ({
    id: `evt_${crypto.randomUUID()}`,
    type: 'customer.subscription.created',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id,
        status: 'active',
        items: { data: [{ price: { id: 'price_pro' }, current_period_end: 1_900_000_000 }] },
      },
    },
  });

  it("queues a tenant's signed event once; the job writes the subscription in that tenant", async () => {
    const event = created('sub_a1');
    const res = await deliver(A, event, A.secret);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });

    const subs = await until(
      () => rows('zvd_billing_subscriptions', sql`stripe_subscription_id = 'sub_a1'`),
      (r: Any[]) => r.length > 0,
    );
    const plan = (await rows('zvd_billing_plans', sql`stripe_price_id = 'price_pro'`))[0];
    expect(subs).toHaveLength(1);
    expect(subs[0]).toMatchObject({ tenant_id: A.id, status: 'active', plan_id: plan.id, created_by: null });
    // Written by the job alone: the collection admits only this extension's actions and jobs.
    const flag = await sql`SELECT written_by FROM zvd_collections WHERE name = 'billing_subscriptions'`.execute(db);
    expect(flag.rows[0].written_by).toBe('actions');

    // The raw event is kept, as the object Stripe sent.
    const stored = await rows('zvd_billing_webhook_events', sql`event_id = ${event.id}`);
    expect(stored).toHaveLength(1);
    expect(stored[0].tenant_id).toBe(A.id);
    expect(stored[0].payload.data.object.id).toBe('sub_a1');

    // Stripe's retry, or a replay of the same request: claimed, so nothing queued.
    const again = await deliver(A, event, A.secret);
    expect(again.status).toBe(200);
    expect(await again.json()).toEqual({ received: true, duplicate: true });
    expect(await queued(event.id)).toBe(1);

    // A later event on the same row: the job's update expects the `last_event_at`
    // it listed, which must compare equal to the stored timestamptz.
    const later = { ...created('sub_a1'), type: 'customer.subscription.updated', created: event.created + 60 };
    later.data.object.status = 'past_due';
    expect((await deliver(A, later, A.secret)).status).toBe(200);
    const moved = await until(
      () => rows('zvd_billing_subscriptions', sql`stripe_subscription_id = 'sub_a1'`),
      (r: Any[]) => r[0]?.status === 'past_due',
    );
    expect(moved[0].status).toBe('past_due');
    expect(new Date(moved[0].last_event_at).getTime()).toBe(later.created * 1000);
  }, 30_000);

  it('refuses a bad signature, and queues and claims nothing', async () => {
    const event = created('sub_bad');
    const res = await deliver(A, event, 'whsec_forged');
    expect(res.status).toBe(400);
    expect(await queued(event.id)).toBe(0);
    expect(await rows('zvd_billing_webhook_events', sql`event_id = ${event.id}`)).toEqual([]);
  });

  it("refuses tenant A's secret on tenant B's endpoint", async () => {
    const event = created('sub_cross');
    const res = await deliver(B, event, A.secret);
    expect(res.status).toBe(400);
    expect(await queued(event.id)).toBe(0);
    // B's own secret is accepted there, and the row is B's.
    const ok = await deliver(B, event, B.secret);
    expect(ok.status).toBe(200);
    const stored = await rows('zvd_billing_webhook_events', sql`event_id = ${event.id}`);
    expect(stored.map((r: Any) => r.tenant_id)).toEqual([B.id]);
  });

  it('answers 503 for a stored secret it cannot decrypt, not a bad signature', async () => {
    const event = created('sub_enc');
    const res = await deliver(D, event, D.secret);
    expect(res.status).toBe(503);
    expect(await queued(event.id)).toBe(0);
  });

  it("does not verify with the environment's secret on a multi-tenant instance", async () => {
    const event = created('sub_env');
    const res = await deliver(C, event, GLOBAL);
    expect(res.status).toBe(503);
    expect(await queued(event.id)).toBe(0);
  });
});
